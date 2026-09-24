import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { Entry } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { format } from '@/i18n';
import { formatDate } from '@/lib/format';
import { colors, radius } from '@/theme';
import { VoteButton } from './VoteButton';

export const medalColor = (rank: number | null) =>
  rank === 1 ? colors.gold : rank === 2 ? colors.silver : rank === 3 ? colors.bronze : undefined;

interface Props {
  entry: Entry;
  votingOpen: boolean;
  visibilityBusy: boolean;
  onPlay: (entry: Entry) => void;
  onVote: (entry: Entry) => void;
  onToggleHidden: (entry: Entry) => void;
}

export function EntryRow({ entry, votingOpen, visibilityBusy, onPlay, onVote, onToggleHidden }: Props) {
  const { t } = useLanguage();
  const name = entry.entrant.name;

  return (
    <Card style={[styles.card, entry.isMine && styles.mine]}>
      <View style={styles.rank}>
        {entry.rank ? (
          <AppText weight="bold" size={15} color={medalColor(entry.rank) ?? colors.textMuted}>
            #{entry.rank}
          </AppText>
        ) : (
          <AppText color={colors.textSubtle}>–</AppText>
        )}
      </View>

      <Pressable
        onPress={() => onPlay(entry)}
        accessibilityRole="button"
        accessibilityLabel={format(t.entries.play, { name })}
      >
        <Avatar name={name} uri={entry.entrant.avatarUrl} size={48} ringColor={medalColor(entry.rank)} />
        <View style={styles.play}>
          <Ionicons name="play" size={11} color={colors.white} />
        </View>
      </Pressable>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <AppText weight="semibold" size={15} numberOfLines={1} style={styles.name}>
            {name}
          </AppText>
          {entry.isMine && <Badge label={t.entries.you} tone="primary" />}
          {entry.hidden && <Badge label={t.entries.hiddenBadge} tone="muted" />}
        </View>
        <AppText size={12} color={colors.textMuted}>
          {format(t.entries.submitted, { date: formatDate(entry.submittedAt, t) })}
        </AppText>
      </View>

      {entry.isMine ? (
        <Pressable
          onPress={() => onToggleHidden(entry)}
          disabled={visibilityBusy}
          style={styles.eye}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={entry.hidden ? t.entries.show : t.entries.hide}
        >
          {visibilityBusy ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name={entry.hidden ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.primary} />
          )}
          <AppText weight="semibold" size={13}>
            {entry.voteCount}
          </AppText>
        </Pressable>
      ) : (
        <VoteButton
          count={entry.voteCount}
          active={entry.viewerHasVoted}
          disabled={!votingOpen}
          label={format(entry.viewerHasVoted ? t.entries.removeVote : t.entries.voteFor, { name })}
          onPress={() => onVote(entry)}
        />
      )}
    </Card>
  );
}

function Badge({ label, tone }: { label: string; tone: 'primary' | 'muted' }) {
  return (
    <View style={[styles.badge, tone === 'primary' ? styles.badgePrimary : styles.badgeMuted]}>
      <AppText size={11} weight="medium" color={tone === 'primary' ? colors.primary : colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  mine: { borderColor: colors.primaryBorder, backgroundColor: colors.primarySoft },
  rank: { width: 30, alignItems: 'center' },
  play: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 1,
  },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1 },
  badge: { borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  badgePrimary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primaryBorder },
  badgeMuted: { backgroundColor: colors.surfaceMuted },
  eye: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 58,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.white,
  },
});
