import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { colors } from '@/theme';
import { AppText } from './AppText';
import { LanguageToggle } from './LanguageToggle';

interface Props {
  title?: string;
  showBack?: boolean;
  actions?: ReactNode;
}

export function ScreenHeader({ title, showBack = true, actions }: Props) {
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
      <View style={styles.actions}>
        {actions}
        <LanguageToggle />
      </View>
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
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
