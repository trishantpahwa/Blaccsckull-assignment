import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CompetitionSummary } from '@/api/types';
import { useLanguage } from '@/context/LanguageContext';
import { format } from '@/i18n';
import { formatRupees } from '@/lib/format';
import { colors, radius } from '@/theme';
import { AppText } from './ui/AppText';
import { Card } from './ui/Card';

export function CompetitionCard({ competition: c }: { competition: CompetitionSummary }) {
  const { t } = useLanguage();
  const open = c.lifecycle.registrationOpen && !c.lifecycle.isFull;

  return (
    <Pressable onPress={() => router.push(`/competitions/${c.slug}`)} accessibilityRole="button">
      <Card style={styles.card}>
        <View style={styles.top}>
          <AppText weight="semibold" size={17} style={styles.title}>
            {c.title}
          </AppText>
          <View style={[styles.phase, open && styles.phaseOpen]}>
            <AppText size={11} weight="medium" color={open ? colors.primary : colors.textMuted}>
              {t.list.phase[c.lifecycle.phase]}
            </AppText>
          </View>
        </View>
        <AppText size={13} color={colors.textMuted}>
          {c.category} · {t.judge}: {c.judgeName}
        </AppText>
        <View style={styles.bottom}>
          <AppText weight="semibold" color={colors.primary}>
            {formatRupees(c.prizePool)}
          </AppText>
          <AppText size={13} color={colors.textMuted}>
            {t.entryFee}: {c.entryFee ? formatRupees(c.entryFee) : t.free}
          </AppText>
          <View style={styles.spots}>
            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
            <AppText size={13} color={colors.textMuted}>
              {format(t.spotsLeft, { n: c.spotsLeft })}
            </AppText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1 },
  phase: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  phaseOpen: { backgroundColor: colors.primarySoft },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  spots: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
});
