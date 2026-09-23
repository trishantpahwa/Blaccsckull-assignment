import { Pressable, StyleSheet, View } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import type { Lang } from '@/i18n';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';

const OPTIONS: { lang: Lang; label: string }[] = [
  { lang: 'en', label: 'ENG' },
  { lang: 'hi', label: 'हिंदी' },
];

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {OPTIONS.map((o) => {
        const selected = o.lang === lang;
        return (
          <Pressable
            key={o.lang}
            onPress={() => setLang(o.lang)}
            style={[styles.option, selected && styles.selected]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <AppText weight="semibold" size={13} color={selected ? colors.white : colors.text}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: '#E6E8EE', borderRadius: radius.pill, padding: 2 },
  option: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  selected: { backgroundColor: colors.primary },
});
