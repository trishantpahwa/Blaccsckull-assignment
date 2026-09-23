import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useLanguage();
  return (
    <View style={styles.wrap}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.textSubtle} />
      <AppText size={15} color={colors.textMuted} style={styles.message}>
        {message}
      </AppText>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.button} accessibilityRole="button">
          <AppText weight="semibold" color={colors.white}>
            {t.retry}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  message: { textAlign: 'center' },
  button: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.md },
});
