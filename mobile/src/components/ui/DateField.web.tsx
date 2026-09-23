import { StyleSheet, View } from 'react-native';
import { colors, fonts, radius } from '@/theme';
import { AppText } from './AppText';

interface Props {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

// datetime-local works in local time, so toISOString() can't be used here.
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateField({ label, value, onChange, error }: Props) {
  return (
    <View style={styles.wrap}>
      <AppText size={13} weight="medium" color={colors.textMuted}>
        {label}
      </AppText>
      <input
        type="datetime-local"
        aria-label={label}
        value={toLocalInput(value)}
        onChange={(e) => {
          const next = new Date(e.target.value);
          if (!Number.isNaN(next.getTime())) onChange(next);
        }}
        style={{
          fontFamily: fonts.regular,
          fontSize: 15,
          color: colors.text,
          padding: '10px 12px',
          borderRadius: radius.md,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          backgroundColor: colors.white,
        }}
      />
      {error ? (
        <AppText size={12} color={colors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
});
