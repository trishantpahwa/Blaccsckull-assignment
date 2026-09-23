import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { colors, radius } from '@/theme';

interface Props {
  videoUrl: string | null;
  onPlay: (url: string) => void;
}

export function PrizeInfoCard({ videoUrl, onPlay }: Props) {
  const { t } = useLanguage();
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <View style={styles.row}>
      <Card style={styles.half}>
        <Pressable
          style={styles.video}
          disabled={!videoUrl}
          onPress={() => videoUrl && onPlay(videoUrl)}
          accessibilityRole="button"
        >
          <View style={styles.playTile}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={16} color={colors.white} />
            </View>
          </View>
          <View style={styles.flex}>
            <AppText weight="semibold" size={13}>
              {t.howPrizeMoney}
            </AppText>
            <AppText size={11} color={colors.textMuted}>
              {t.watchVideo}
            </AppText>
          </View>
        </Pressable>
      </Card>

      <Card style={[styles.half, styles.trust]}>
        <Pressable style={styles.trustRow} onPress={() => setPolicyOpen(true)} accessibilityRole="button">
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.text} />
          <AppText size={12}>{t.refundPolicy}</AppText>
        </Pressable>
        <View style={styles.trustRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.text} />
          <AppText size={12} style={styles.flex}>
            {t.securePayments}{' '}
            <AppText weight="bold" size={13} color="#072654" style={styles.razorpay}>
              Razorpay
            </AppText>
          </AppText>
        </View>
      </Card>

      <Modal visible={policyOpen} transparent animationType="fade" onRequestClose={() => setPolicyOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPolicyOpen(false)}>
          <View style={styles.sheet}>
            <AppText weight="semibold" size={17}>
              {t.refundPolicy}
            </AppText>
            <AppText size={14} color={colors.textMuted} style={styles.policy}>
              {t.refundPolicyText}
            </AppText>
            <Pressable onPress={() => setPolicyOpen(false)} style={styles.closeBtn} accessibilityRole="button">
              <AppText weight="semibold" color={colors.white}>
                {t.close}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, padding: 10, justifyContent: 'center' },
  flex: { flex: 1 },
  video: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playTile: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: '#D5EEEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  trust: { gap: 10 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  razorpay: { fontStyle: 'italic' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, gap: 12 },
  policy: { lineHeight: 21 },
  closeBtn: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 18, paddingVertical: 8 },
});
