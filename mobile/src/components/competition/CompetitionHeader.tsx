import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type { CompetitionDetail, Registration } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { format } from '@/i18n';
import { formatRupees } from '@/lib/format';
import { colors, radius } from '@/theme';

interface Props {
  competition: CompetitionDetail;
  registration: Registration | null;
}

export function CompetitionHeader({ competition: c, registration }: Props) {
  const { t } = useLanguage();
  const bookedRatio = c.capacity ? Math.min(c.bookedCount / c.capacity, 1) : 0;

  let spotsLabel: string;
  if (c.spotsLeft === 0) spotsLabel = t.allSpotsBooked;
  else if (c.spotsLeft === 1) spotsLabel = t.onlyOneSpotLeft;
  else spotsLabel = format(c.spotsLeft <= 20 ? t.onlySpotsLeft : t.spotsLeft, { n: c.spotsLeft });

  return (
    <Card>
      <View style={styles.titleRow}>
        <AppText weight="bold" size={21} style={styles.title}>
          {c.title}
        </AppText>
        {registration?.status === 'confirmed' && (
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <AppText weight="medium" size={13} color={colors.primary}>
              {t.registered}
            </AppText>
          </View>
        )}
        {registration?.status === 'pending_payment' && (
          <View style={[styles.badge, styles.badgePending]}>
            <Ionicons name="time-outline" size={16} color={colors.warning} />
            <AppText weight="medium" size={13} color={colors.warning}>
              {t.paymentPending}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.tags}>
        <Tag label={c.category} />
        {c.isMultiWin && <Tag label={t.multiWin} />}
        {c.givesCertificate && (
          <View style={styles.certificate}>
            <Ionicons name="trophy-outline" size={16} color={colors.primary} />
            <AppText size={13} color={colors.primary}>
              {t.winnersGetCertificate}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <AppText size={13} color={colors.textMuted}>
            {t.prizePool}
          </AppText>
          <AppText weight="semibold" size={28} color={colors.primary}>
            {formatRupees(c.prizePool)}
          </AppText>
        </View>
        <View style={styles.stat}>
          <AppText size={13} color={colors.textMuted}>
            {t.entryFee}
          </AppText>
          <AppText weight="semibold" size={24}>
            {c.entryFee ? formatRupees(c.entryFee) : t.free}
          </AppText>
        </View>
        <View style={styles.spots}>
          <View style={styles.spotsLabel}>
            <Ionicons name="people-outline" size={15} color={c.spotsLeft ? colors.primary : colors.danger} />
            <AppText weight="medium" size={13} color={c.spotsLeft ? colors.primary : colors.danger}>
              {spotsLabel}
            </AppText>
          </View>
          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: c.capacity, now: c.bookedCount }}
          >
            <View style={[styles.fill, { width: `${bookedRatio * 100}%` }]} />
          </View>
          <AppText size={12} color={colors.textMuted}>
            {format(t.booked, { booked: c.bookedCount, capacity: c.capacity })}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <AppText size={12} weight="medium">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgePending: { backgroundColor: colors.warningSoft, borderColor: '#F3D9A6' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  tag: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  certificate: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4 },
  stats: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 16, gap: 12 },
  stat: { gap: 2 },
  spots: { flex: 1, gap: 6, marginLeft: 8 },
  spotsLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  track: { height: 4, borderRadius: 2, backgroundColor: '#D7ECEE', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
});
