import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/api/endpoints';
import { CompetitionCard } from '@/components/CompetitionCard';
import { MyCompetitionRow } from '@/components/profile/MyCompetitionRow';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { formatRupees } from '@/lib/format';
import { colors, radius } from '@/theme';

export default function ProfileScreen() {
  const { t, lang } = useLanguage();
  const { user, logout } = useAuth();
  const loggedIn = Boolean(user);
  const referrals = useQuery({ queryKey: ['referrals', user?.id], queryFn: api.referrals, enabled: loggedIn });
  const mine = useQuery({
    queryKey: ['me', 'registrations', lang, user?.id],
    queryFn: () => api.myRegistrations(lang),
    enabled: loggedIn,
  });
  const saved = useQuery({
    queryKey: ['me', 'saved', lang, user?.id],
    queryFn: () => api.savedCompetitions(lang),
    enabled: loggedIn,
  });

  const pull = usePullToRefresh(() => Promise.all([referrals.refetch(), mine.refetch(), saved.refetch()]));

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
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.primary} />}
        >
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

          <Section title={t.profile.myCompetitions} loading={mine.isPending}>
            {mine.data?.items.length ? (
              mine.data.items.map((item) => <MyCompetitionRow key={item.registration.id} item={item} />)
            ) : (
              <EmptyHint text={t.profile.noCompetitions} action={t.profile.browse} onAction={() => router.push('/competitions')} />
            )}
          </Section>

          <Section title={t.profile.saved} loading={saved.isPending}>
            {saved.data?.competitions.length ? (
              saved.data.competitions.map((c) => <CompetitionCard key={c.id} competition={c} />)
            ) : (
              <EmptyHint text={t.profile.noSaved} />
            )}
          </Section>

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

function Section({ title, loading, children }: { title: string; loading: boolean; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText weight="semibold" size={16}>
        {title}
      </AppText>
      {loading ? <Skeleton height={64} /> : children}
    </View>
  );
}

function EmptyHint({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.emptyHint}>
      <AppText size={13} color={colors.textMuted} style={styles.flex}>
        {text}
      </AppText>
      {action && (
        <Pressable onPress={onAction} accessibilityRole="button">
          <AppText weight="semibold" size={13} color={colors.primary}>
            {action}
          </AppText>
        </Pressable>
      )}
    </View>
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
  section: { gap: 10, marginTop: 8 },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 14,
  },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
});
