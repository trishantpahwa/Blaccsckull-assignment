import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Entry } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { useLanguage } from '@/context/LanguageContext';
import { format } from '@/i18n';
import { colors, radius } from '@/theme';
import { medalColor } from './EntryRow';
import { VoteButton } from './VoteButton';

interface Props {
  entries: Entry[];
  votingOpen: boolean;
  onPlay: (entry: Entry) => void;
  onVote: (entry: Entry) => void;
}

const PEDESTAL = { 1: 72, 2: 52, 3: 38 } as Record<number, number>;

// Top three laid out 2 · 1 · 3, like a real podium.
export function Podium({ entries, votingOpen, onPlay, onVote }: Props) {
  const { t } = useLanguage();
  const [first, second, third] = entries;
  const slots = [second, first, third];

  return (
    <View style={styles.row}>
      {slots.map((entry, i) => {
        if (!entry) return <View key={`empty-${i}`} style={styles.slot} />;
        const place = entry.rank ?? 0;
        const color = medalColor(place) ?? colors.border;
        const isFirst = entry === first;
        const name = entry.entrant.name;
        return (
          <View key={entry.id} style={styles.slot}>
            {isFirst && <Ionicons name="trophy" size={22} color={colors.gold} style={styles.crown} />}
            <Pressable onPress={() => onPlay(entry)} accessibilityRole="button" accessibilityLabel={format(t.entries.play, { name })}>
              <Avatar name={name} uri={entry.entrant.avatarUrl} size={isFirst ? 72 : 58} ringColor={color} />
              <View style={[styles.play, { backgroundColor: color }]}>
                <Ionicons name="play" size={12} color={colors.white} />
              </View>
            </Pressable>
            <AppText weight="semibold" size={13} numberOfLines={1} style={styles.name}>
              {entry.isMine ? `${name} (${t.entries.you})` : name}
            </AppText>
            {entry.isMine ? (
              <AppText size={12} color={colors.textMuted}>
                {entry.voteCount === 1 ? t.entries.oneVote : format(t.entries.votes, { n: entry.voteCount })}
              </AppText>
            ) : (
              <VoteButton
                count={entry.voteCount}
                active={entry.viewerHasVoted}
                disabled={!votingOpen}
                label={format(entry.viewerHasVoted ? t.entries.removeVote : t.entries.voteFor, { name })}
                onPress={() => onVote(entry)}
              />
            )}
            <View style={[styles.pedestal, { height: PEDESTAL[place] ?? 38, backgroundColor: color }]}>
              <AppText weight="bold" size={20} color={colors.white}>
                {place}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 8 },
  slot: { flex: 1, alignItems: 'center', gap: 6 },
  crown: { marginBottom: -2 },
  play: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 1,
  },
  name: { maxWidth: '100%' },
  pedestal: {
    alignSelf: 'stretch',
    marginTop: 4,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
});
