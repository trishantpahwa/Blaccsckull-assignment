import { Ionicons } from '@expo/vector-icons';
import { Image, Linking, Pressable, StyleSheet } from 'react-native';
import type { CompetitionDetail } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/context/LanguageContext';
import { colors, radius } from '@/theme';

export function AdSlot({ ad }: { ad: CompetitionDetail['ad'] }) {
  const { t } = useLanguage();

  if (ad) {
    return (
      <Pressable disabled={!ad.targetUrl} onPress={() => ad.targetUrl && Linking.openURL(ad.targetUrl)}>
        <Image source={{ uri: ad.imageUrl }} style={styles.image} resizeMode="cover" />
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.placeholder} disabled>
      <Ionicons name="megaphone-outline" size={18} color={colors.textMuted} />
      <AppText weight="medium" size={13} color={colors.textMuted}>
        {t.adHere}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textSubtle,
    borderRadius: radius.md,
    paddingVertical: 10,
  },
  image: { width: '100%', height: 80, borderRadius: radius.md },
});
