import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CompetitionDetail } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { useEntries } from '@/hooks/useEntries';
import { format } from '@/i18n';
import { formatShortDuration } from '@/lib/format';
import { colors } from '@/theme';
import { medalColor } from './EntryRow';

interface Props {
  competition: CompetitionDetail;
  now: number;
  onOpen: () => void;
}

// A teaser for the People's Choice leaderboard. Hidden until submissions can exist.
export function EntriesShowcase({ competition, now, onOpen }: Props) {
  const { t } = useLanguage();
  const started = now >= new Date(competition.schedule.submissionStartsAt).getTime();
  const query = useEntries(competition.slug, 'top', started && competition.lifecycle.phase !== 'cancelled');

  if (!started || competition.lifecycle.phase === 'cancelled') return null;
  if (query.isPending) return <Skeleton height={96} />;
  if (query.isError) return null;

  const { total, votingOpen, votingClosesAt, entries } = query.data;
  const leaders = entries.filter((e) => !e.hidden).slice(0, 3);
  const closesIn = new Date(votingClosesAt).getTime() - now;

  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${t.entries.peoplesChoice}, ${t.entries.seeAll}`}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="heart-circle" size={22} color="#E0245E" />
          <AppText weight="semibold" size={15} style={styles.flex}>
            {t.entries.peoplesChoice}
          </AppText>
          <AppText weight="medium" size={13} color={colors.primary}>
            {t.entries.seeAll}
          </AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>

        {total === 0 ? (
          <AppText size={13} color={colors.textMuted}>
            {t.entries.emptyShort}
          </AppText>
        ) : (
          <View style={styles.body}>
            <View style={styles.stack}>
              {leaders.map((e, i) => (
                <View key={e.id} style={[styles.stacked, { marginLeft: i ? -12 : 0, zIndex: 3 - i }]}>
                  <Avatar name={e.entrant.name} uri={e.entrant.avatarUrl} size={40} ringColor={medalColor(e.rank) ?? colors.white} />
                </View>
              ))}
            </View>
            <View style={styles.flex}>
              <AppText weight="medium" size={14}>
                {total === 1 ? t.entries.countOne : format(t.entries.count, { n: total })}
              </AppText>
              <AppText size={12} color={votingOpen ? colors.primary : colors.textMuted}>
                {votingOpen ? format(t.entries.votingOpen, { time: formatShortDuration(closesIn) }) : t.entries.votingClosed}
              </AppText>
            </View>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  body: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stack: { flexDirection: 'row' },
  stacked: { borderRadius: 24, backgroundColor: colors.white },
});
