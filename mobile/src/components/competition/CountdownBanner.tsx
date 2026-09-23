import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type { Lifecycle } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { useLanguage } from '@/context/LanguageContext';
import { useNow } from '@/hooks/useServerClock';
import { formatCountdown } from '@/lib/format';
import { colors, radius } from '@/theme';

const HURRY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

interface Props {
  lifecycle: Lifecycle;
  spotsLeft: number;
}

export function CountdownBanner({ lifecycle, spotsLeft }: Props) {
  const { t } = useLanguage();
  const now = useNow();
  const deadline = lifecycle.nextDeadline;
  const remaining = deadline ? new Date(deadline.at).getTime() - now : 0;

  if (!deadline) {
    const message = lifecycle.phase === 'cancelled' ? t.competitionCancelled : t.resultsAnnounced;
    return (
      <View style={styles.banner}>
        <Ionicons name={lifecycle.phase === 'cancelled' ? 'close-circle-outline' : 'trophy-outline'} size={20} color={colors.primary} />
        <AppText weight="medium" size={14}>
          {message}
        </AppText>
      </View>
    );
  }

  const hurry = deadline.kind === 'registration_closes' && spotsLeft > 0 && remaining < HURRY_WINDOW_MS;

  return (
    <View style={styles.banner} accessibilityRole="timer">
      <Ionicons name="hourglass-outline" size={18} color={colors.primary} />
      <AppText weight="medium" size={12} style={styles.label} numberOfLines={2}>
        {t.deadline[deadline.kind]}
      </AppText>
      <AppText weight="semibold" size={14} color={colors.primary} style={styles.timer} numberOfLines={1}>
        {formatCountdown(remaining)}
      </AppText>
      {hurry && (
        <View style={styles.hurry}>
          <Ionicons name="timer-outline" size={16} color={colors.primary} />
          <AppText weight="semibold" size={12} color={colors.primary}>
            {t.hurryUp}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  label: { flexShrink: 1, maxWidth: 84 },
  timer: { flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] },
  hurry: { alignItems: 'center', gap: 2 },
});
