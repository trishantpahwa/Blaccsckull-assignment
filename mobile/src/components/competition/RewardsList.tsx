import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type { CompetitionDetail } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { format } from '@/i18n';
import { formatRupees } from '@/lib/format';
import { colors, radius } from '@/theme';

function PositionIcon({ position }: { position: number }) {
  if (position === 1) return <Ionicons name="trophy" size={20} color={colors.gold} />;
  if (position === 2) return <Ionicons name="medal" size={20} color={colors.silver} />;
  if (position === 3) return <Ionicons name="medal" size={20} color={colors.bronze} />;
  return <Ionicons name="star-outline" size={20} color={colors.primary} />;
}

export function RewardsList({ rewards }: { rewards: CompetitionDetail['rewards'] }) {
  const { t } = useLanguage();
  if (!rewards.length) return null;

  return (
    <Card>
      <View style={styles.heading}>
        <AppText weight="semibold" size={15}>
          {t.rewards}
        </AppText>
        <AppText size={13} color={colors.textMuted}>
          {t.allPositions}
        </AppText>
      </View>
      {rewards.map((r) => (
        <View key={r.position} style={styles.row}>
          <PositionIcon position={r.position} />
          <AppText weight="medium" size={14} style={styles.label}>
            {format(t.winner, { position: t.ordinal(r.position) })}
          </AppText>
          <AppText weight="semibold" size={16} color={colors.primary}>
            {formatRupees(r.amount)}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFC',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
  },
  label: { flex: 1 },
});
