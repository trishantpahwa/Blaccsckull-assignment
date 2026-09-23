import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { colors } from '@/theme';
import { AppText } from './AppText';
import { LanguageToggle } from './LanguageToggle';

export function ScreenHeader({ title, showBack = true }: { title?: string; showBack?: boolean }) {
  const { t } = useLanguage();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/competitions'));

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable onPress={goBack} style={styles.back} hitSlop={8} accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <AppText weight="medium" size={17}>
            {title ?? t.goBack}
          </AppText>
        </Pressable>
      ) : (
        <AppText weight="semibold" size={20}>
          {title}
        </AppText>
      )}
      <LanguageToggle />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
