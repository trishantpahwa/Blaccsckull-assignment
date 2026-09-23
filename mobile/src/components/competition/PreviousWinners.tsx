import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { CompetitionDetail } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { format } from '@/i18n';
import { colors, radius } from '@/theme';

interface Props {
  winners: CompetitionDetail['previousWinners'];
  onPlay: (url: string) => void;
}

export function PreviousWinners({ winners, onPlay }: Props) {
  const { t } = useLanguage();
  if (!winners.length) return null;

  return (
    <Card style={styles.card}>
      <AppText weight="semibold" size={15} style={styles.heading}>
        {t.previousWinners}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {winners.map((w, i) => (
          <Pressable
            key={`${w.name}-${i}`}
            style={styles.item}
            disabled={!w.videoUrl}
            onPress={() => w.videoUrl && onPlay(w.videoUrl)}
            accessibilityRole="button"
            accessibilityLabel={`${w.name}, ${format(t.winner, { position: t.ordinal(w.position) })}`}
          >
            <View>
              {w.photoUrl ? (
                <Image source={{ uri: w.photoUrl }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.placeholder]} />
              )}
              {w.videoUrl && (
                <View style={styles.play}>
                  <Ionicons name="play" size={14} color={colors.white} />
                </View>
              )}
            </View>
            <View style={styles.info}>
              <AppText weight="medium" size={14} numberOfLines={1}>
                {w.name}
              </AppText>
              <AppText size={13} color={w.position === 1 ? colors.primary : colors.textMuted}>
                {format(t.winner, { position: t.ordinal(w.position) })}
              </AppText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 0 },
  heading: { marginBottom: 10, paddingHorizontal: 14 },
  list: { gap: 10, paddingHorizontal: 14 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingRight: 14,
    width: 180,
  },
  photo: { width: 80, height: 84, borderRadius: radius.md },
  placeholder: { backgroundColor: colors.border },
  play: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  info: { flex: 1, gap: 2 },
});
