import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { formatDate, formatTime } from '@/lib/format';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';

interface Props {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string | null;
}

export function DateField({ label, value, onChange, error }: Props) {
  const { t, lang } = useLanguage();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const open = () => {
    if (Platform.OS === 'android') {
      // Android has no combined picker, so pick the date first and then the time.
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        onValueChange: (_e, date) =>
          DateTimePickerAndroid.open({ value: date, mode: 'time', onValueChange: (_e2, time) => onChange(time) }),
      });
    } else {
      setDraft(value);
      setIosOpen(true);
    }
  };

  const iso = value.toISOString();

  return (
    <View style={styles.wrap}>
      <AppText size={13} weight="medium" color={colors.textMuted}>
        {label}
      </AppText>
      <Pressable onPress={open} style={[styles.input, error ? styles.inputError : null]} accessibilityRole="button" accessibilityLabel={label}>
        <AppText size={15}>
          {formatDate(iso, t)} · {formatTime(iso)}
        </AppText>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? (
        <AppText size={12} color={colors.danger}>
          {error}
        </AppText>
      ) : null}

      <Modal visible={iosOpen} transparent animationType="fade" onRequestClose={() => setIosOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIosOpen(false)} accessibilityLabel={t.close} />
          <View style={styles.sheet}>
            <AppText weight="semibold" size={16} style={styles.sheetTitle}>
              {label}
            </AppText>
            {/* The sheet is always light, so the wheel must not follow the phone's dark mode. */}
            <DateTimePicker
              value={draft}
              mode="datetime"
              display="spinner"
              themeVariant="light"
              textColor={colors.text}
              accentColor={colors.primary}
              locale={lang === 'hi' ? 'hi-IN' : 'en-IN'}
              onValueChange={(_e, date) => setDraft(date)}
            />
            <Pressable
              style={styles.done}
              onPress={() => {
                onChange(draft);
                setIosOpen(false);
              }}
              accessibilityRole="button"
            >
              <AppText weight="semibold" color={colors.white}>
                {t.create.done}
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.danger },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetTitle: { textAlign: 'center', marginBottom: 4 },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: 16, paddingBottom: 32 },
  done: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
});
