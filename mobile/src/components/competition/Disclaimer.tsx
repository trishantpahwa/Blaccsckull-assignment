import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/context/LanguageContext';
import { colors, radius } from '@/theme';

export function Disclaimer({ text }: { text: string | null }) {
  const { t } = useLanguage();
  if (!text) return null;
  return (
    <View style={styles.wrap}>
      <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
      <AppText size={12} style={styles.text}>
        <AppText weight="semibold" size={12} color={colors.primary}>
          {t.disclaimer}{' '}
        </AppText>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: { flex: 1 },
});
