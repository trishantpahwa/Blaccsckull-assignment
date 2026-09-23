import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CompetitionDetail } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { formatDate, formatTime } from '@/lib/format';
import { colors, radius } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function ImportantDates({ schedule }: { schedule: CompetitionDetail['schedule'] }) {
  const { t } = useLanguage();
  const items: { icon: IconName; label: string; at: string }[] = [
    { icon: 'calendar-outline', label: t.registerBefore, at: schedule.registrationClosesAt },
    { icon: 'paper-plane-outline', label: t.submissionStarts, at: schedule.submissionStartsAt },
    { icon: 'cloud-upload-outline', label: t.submissionEnds, at: schedule.submissionEndsAt },
    { icon: 'trophy-outline', label: t.resultDate, at: schedule.resultAt },
  ];

  return (
    <Card>
      <AppText weight="semibold" size={15} style={styles.heading}>
        {t.importantDates}
      </AppText>
      <View style={styles.grid}>
        {items.map((item, i) => (
          <View
            key={item.label}
            style={[styles.cell, i % 2 === 0 && styles.cellLeft, i < 2 && styles.cellTop]}
          >
            <Ionicons name={item.icon} size={24} color={colors.primary} />
            <View style={styles.text}>
              <AppText size={12} color={colors.textMuted}>
                {item.label}
              </AppText>
              <AppText weight="semibold" size={14} color={colors.primary}>
                {formatDate(item.at, t)}
              </AppText>
              <AppText size={13}>{formatTime(item.at)}</AppText>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: 10 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  cell: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  cellLeft: { borderRightWidth: 1, borderRightColor: colors.border },
  cellTop: { borderBottomWidth: 1, borderBottomColor: colors.border },
  text: { flex: 1, gap: 1 },
});
