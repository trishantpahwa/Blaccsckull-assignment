import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/api/endpoints';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatRupees } from '@/lib/format';
import { colors, radius } from '@/theme';

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const referrals = useQuery({ queryKey: ['referrals', user?.id], queryFn: api.referrals, enabled: Boolean(user) });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title={t.profile.title} showBack={false} />
      {!user ? (
        <View style={styles.guest}>
          <Ionicons name="person-circle-outline" size={64} color={colors.textSubtle} />
          <AppText color={colors.textMuted}>{t.profile.guest}</AppText>
          <Pressable style={styles.primary} onPress={() => router.push('/login')} accessibilityRole="button">
            <AppText weight="semibold" color={colors.white}>
              {t.auth.login}
            </AppText>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.userCard}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle" size={64} color={colors.primary} />
            )}
            <View style={styles.flex}>
              <AppText weight="semibold" size={18}>
                {user.name}
              </AppText>
              <AppText color={colors.textMuted}>{user.email}</AppText>
            </View>
          </Card>

          <Card style={styles.stats}>
            <AppText size={13} color={colors.textMuted}>
              {t.profile.referralCode}
            </AppText>
            <AppText weight="bold" size={22} color={colors.primary} selectable>
              {user.referralCode}
            </AppText>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <AppText weight="semibold" size={18}>
                  {referrals.data?.signups ?? '–'}
                </AppText>
                <AppText size={12} color={colors.textMuted}>
                  {t.profile.referrals}
                </AppText>
              </View>
              <View style={styles.stat}>
                <AppText weight="semibold" size={18}>
                  {referrals.data ? formatRupees(referrals.data.earnings) : '–'}
                </AppText>
                <AppText size={12} color={colors.textMuted}>
                  {t.profile.earnings}
                </AppText>
              </View>
            </View>
          </Card>

          <Pressable style={styles.logout} onPress={logout} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <AppText weight="semibold" color={colors.danger}>
              {t.auth.logout}
            </AppText>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  primary: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 28, paddingVertical: 12 },
  content: { padding: 16, gap: 12 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  stats: { gap: 4 },
  statRow: { flexDirection: 'row', marginTop: 12 },
  stat: { flex: 1, gap: 2 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
});
