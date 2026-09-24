import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { MyRegistration, RegistrationStatus } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { colors, radius } from '@/theme';

const STATUS_TONE: Record<RegistrationStatus, { fg: string; bg: string }> = {
  confirmed: { fg: colors.primary, bg: colors.primarySoft },
  pending_payment: { fg: colors.warning, bg: colors.warningSoft },
  refund_due: { fg: colors.danger, bg: colors.dangerSoft },
  expired: { fg: colors.textMuted, bg: colors.surfaceMuted },
  cancelled: { fg: colors.textMuted, bg: colors.surfaceMuted },
};

export function MyCompetitionRow({ item: { registration: r, competition: c } }: { item: MyRegistration }) {
  const { t } = useLanguage();
  const tone = STATUS_TONE[r.status];
  const showVideo = r.status === 'confirmed';

  return (
    <Pressable onPress={() => router.push(`/competitions/${c.slug}`)} accessibilityRole="button">
      <Card style={styles.card}>
        <View style={styles.top}>
          <AppText weight="semibold" size={15} numberOfLines={1} style={styles.flex}>
            {c.title}
          </AppText>
          <View style={[styles.status, { backgroundColor: tone.bg }]}>
            <AppText size={11} weight="medium" color={tone.fg}>
              {t.profile.status[r.status]}
            </AppText>
          </View>
        </View>
        <View style={styles.bottom}>
          <AppText size={12} color={colors.textMuted} style={styles.flex}>
            {t.list.phase[c.lifecycle.phase]}
          </AppText>
          {showVideo && (
            <View style={styles.meta}>
              <Ionicons
                name={r.submission ? 'checkmark-circle' : 'videocam-outline'}
                size={14}
                color={r.submission ? colors.success : colors.textMuted}
              />
              <AppText size={12} color={r.submission ? colors.success : colors.textMuted}>
                {r.submission ? t.profile.videoUploaded : t.profile.noVideo}
              </AppText>
            </View>
          )}
          {r.submission && (
            <View style={styles.meta}>
              <Ionicons name="heart" size={13} color="#E0245E" />
              <AppText size={12} weight="medium">
                {r.voteCount}
              </AppText>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6, paddingVertical: 12 },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
