import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Entry, EntrySort } from '@/api/types';
import { EntryRow } from '@/components/competition/EntryRow';
import { Podium } from '@/components/competition/Podium';
import { AppText } from '@/components/ui/AppText';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { VideoModal } from '@/components/ui/VideoModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCompetition } from '@/hooks/useCompetition';
import { useEntries, useEntryVisibility, useVote } from '@/hooks/useEntries';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useNow } from '@/hooks/useServerClock';
import { format } from '@/i18n';
import { formatShortDuration } from '@/lib/format';
import { colors, radius } from '@/theme';

export default function EntriesScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const now = useNow();
  const [sort, setSort] = useState<EntrySort>('top');
  const [playing, setPlaying] = useState<string | null>(null);

  // Already cached from the details screen; only used for the title.
  const competition = useCompetition(slug).data?.competition;
  const query = useEntries(slug, sort);
  const pull = usePullToRefresh(query.refetch);
  const vote = useVote(slug);
  const visibility = useEntryVisibility(slug);

  const onVote = (entry: Entry) => {
    if (!user) return router.push('/login');
    vote.mutate({ entryId: entry.id, on: !entry.viewerHasVoted });
  };
  const onToggleHidden = (entry: Entry) => visibility.mutate({ registrationId: entry.id, hidden: !entry.hidden });
  const onPlay = (entry: Entry) => setPlaying(entry.videoUrl);

  const body = () => {
    if (query.isPending) {
      return (
        <View style={styles.content}>
          <Skeleton height={180} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={72} />
          ))}
        </View>
      );
    }
    if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;

    const { entries, votingOpen, votingClosesAt, total } = query.data;
    // The podium only makes sense for the vote-ranked view, and only for entries that actually have votes.
    const podium = sort === 'top' ? entries.filter((e) => !e.hidden && e.rank !== null && e.rank <= 3).slice(0, 3) : [];
    const podiumIds = new Set(podium.map((e) => e.id));
    const rest = entries.filter((e) => !podiumIds.has(e.id));

    const header = (
      <View style={styles.header}>
        <View style={styles.hero}>
          <AppText weight="bold" size={20}>
            {t.entries.peoplesChoice}
          </AppText>
          {competition && (
            <AppText color={colors.textMuted} numberOfLines={1}>
              {competition.title}
            </AppText>
          )}
          <View style={styles.metaRow}>
            <View style={[styles.pill, votingOpen ? styles.pillOpen : null]}>
              <Ionicons name={votingOpen ? 'time-outline' : 'lock-closed-outline'} size={13} color={votingOpen ? colors.primary : colors.textMuted} />
              <AppText size={12} weight="medium" color={votingOpen ? colors.primary : colors.textMuted}>
                {votingOpen
                  ? format(t.entries.votingOpen, { time: formatShortDuration(new Date(votingClosesAt).getTime() - now) })
                  : t.entries.votingClosed}
              </AppText>
            </View>
            <AppText size={12} color={colors.textMuted}>
              {total === 1 ? t.entries.countOne : format(t.entries.count, { n: total })}
            </AppText>
          </View>
          {votingOpen && total > 0 && (
            <AppText size={12} color={colors.textMuted}>
              {t.entries.voteHint}
            </AppText>
          )}
        </View>

        <View style={styles.segment} accessibilityRole="tablist">
          {(['top', 'new'] as const).map((key) => {
            const selected = key === sort;
            return (
              <Pressable
                key={key}
                onPress={() => setSort(key)}
                style={[styles.segmentItem, selected && styles.segmentActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
              >
                <AppText weight={selected ? 'semibold' : 'medium'} size={13} color={selected ? colors.primary : colors.textMuted}>
                  {key === 'top' ? t.entries.top : t.entries.newest}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {podium.length > 0 && <Podium entries={podium} votingOpen={votingOpen} onPlay={onPlay} onVote={onVote} />}
      </View>
    );

    return (
      <FlatList
        data={rest}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <EntryRow
            entry={item}
            votingOpen={votingOpen}
            visibilityBusy={visibility.isPending}
            onPlay={onPlay}
            onVote={onVote}
            onToggleHidden={onToggleHidden}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          podium.length ? null : (
            <View style={styles.empty}>
              <Ionicons name="videocam-outline" size={40} color={colors.textSubtle} />
              <AppText color={colors.textMuted} style={styles.emptyText}>
                {t.entries.empty}
              </AppText>
            </View>
          )
        }
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.primary} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title={t.entries.title} />
      {body()}
      <VideoModal url={playing} onClose={() => setPlaying(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  header: { gap: 16, marginBottom: 12 },
  hero: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillOpen: { backgroundColor: colors.primarySoft },
  segment: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 3 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  separator: { height: 10 },
  empty: { alignItems: 'center', gap: 10, marginTop: 32, paddingHorizontal: 24 },
  emptyText: { textAlign: 'center' },
});
