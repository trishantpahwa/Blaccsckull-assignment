import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/context/LanguageContext';
import { format } from '@/i18n';
import { formatRupees } from '@/lib/format';
import { colors, radius } from '@/theme';

interface Props {
  link: string | null;
  rewardPerSignup: number;
  competitionTitle: string;
  onLoginRequired: () => void;
}

export function ReferralCard({ link, rewardPerSignup, competitionTitle, onLoginRequired }: Props) {
  const { t } = useLanguage();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    if (!link) return onLoginRequired();
    await Clipboard.setStringAsync(link);
    setCopied(true);
    toast(t.copied, 'success');
  };

  const share = async () => {
    if (!link) return onLoginRequired();
    try {
      await Share.share({ message: format(t.shareMessage, { title: competitionTitle, link }) });
    } catch {
      await copy();
    }
  };

  return (
    <View style={styles.card}>
      <Ionicons name="megaphone-outline" size={34} color={colors.primary} style={styles.icon} />
      <View style={styles.main}>
        <AppText weight="semibold" size={15}>
          {t.referTitle}
        </AppText>
        <View style={styles.linkRow}>
          <Pressable style={styles.linkBox} onPress={link ? copy : onLoginRequired}>
            <AppText size={12} numberOfLines={1} color={link ? colors.text : colors.textMuted}>
              {link ?? t.referralLoginHint}
            </AppText>
          </Pressable>
          <Pressable style={styles.copy} onPress={copy} accessibilityRole="button">
            <AppText weight="medium" size={12} color={colors.primary}>
              {copied ? t.copied : t.copyLink}
            </AppText>
          </Pressable>
        </View>
      </View>
      <View style={styles.side}>
        <Pressable style={styles.referBtn} onPress={share} accessibilityRole="button">
          <AppText weight="semibold" size={13} color={colors.white}>
            {t.referNow}
          </AppText>
        </Pressable>
        <AppText size={11} color={colors.textMuted} style={styles.earn}>
          {t.youEarn}{' '}
          <AppText weight="semibold" size={12} color={colors.text}>
            {formatRupees(rewardPerSignup).replace(' ', '')}
          </AppText>{' '}
          {t.forEverySignup}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    padding: 12,
  },
  icon: { transform: [{ rotate: '-12deg' }] },
  main: { flex: 1, gap: 6 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  copy: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  side: { alignItems: 'center', gap: 4, width: 104 },
  referBtn: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 8 },
  earn: { textAlign: 'center' },
});
