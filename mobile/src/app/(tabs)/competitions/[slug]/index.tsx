import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdSlot } from '@/components/competition/AdSlot';
import { CompetitionHeader } from '@/components/competition/CompetitionHeader';
import { CountdownBanner } from '@/components/competition/CountdownBanner';
import { Disclaimer } from '@/components/competition/Disclaimer';
import { EntriesShowcase } from '@/components/competition/EntriesShowcase';
import { ImportantDates } from '@/components/competition/ImportantDates';
import { InfoTabs } from '@/components/competition/InfoTabs';
import { JudgeCard } from '@/components/competition/JudgeCard';
import { PaymentSheet } from '@/components/competition/PaymentSheet';
import { PreviousWinners } from '@/components/competition/PreviousWinners';
import { PrimaryCTA } from '@/components/competition/PrimaryCTA';
import { PrizeInfoCard } from '@/components/competition/PrizeInfoCard';
import { ReferralCard } from '@/components/competition/ReferralCard';
import { RewardsList } from '@/components/competition/RewardsList';
import { TestimonialsRow } from '@/components/competition/TestimonialsRow';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { VideoModal } from '@/components/ui/VideoModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCompetition, useInvalidateCompetition } from '@/hooks/useCompetition';
import { useSaveCompetition } from '@/hooks/useEntries';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRegistrationFlow } from '@/hooks/useRegistrationFlow';
import { useNow } from '@/hooks/useServerClock';
import { format } from '@/i18n';
import { getCtaState } from '@/lib/cta';
import { colors } from '@/theme';

export default function CompetitionDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const query = useCompetition(slug);
  const refresh = useInvalidateCompetition(slug);
  const pull = usePullToRefresh(refresh);
  const now = useNow();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const registration = query.data?.viewer?.registration ?? null;
  const flow = useRegistrationFlow(slug, registration?.id ?? null);
  const save = useSaveCompetition(slug);

  const prefill = useMemo(() => ({ name: user?.name, email: user?.email }), [user]);

  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ScreenHeader />
        <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
      </SafeAreaView>
    );
  }

  const { competition } = query.data;
  const cta = getCtaState({ competition, registration, loggedIn: Boolean(user), now, t });

  const saved = query.data.viewer?.saved ?? false;
  const toggleSave = () => (user ? save.mutate(!saved) : router.push('/login'));
  const share = () =>
    Share.share({ message: format(t.shareCompetition, { title: competition.title, link: competition.shareUrl }) }).catch(() => {});

  const headerActions = (
    <>
      <Pressable onPress={share} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.share}>
        <Ionicons name="share-social-outline" size={22} color={colors.text} />
      </Pressable>
      <Pressable
        onPress={toggleSave}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={saved ? t.unsaveCompetition : t.saveCompetition}
        accessibilityState={{ selected: saved }}
      >
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? colors.primary : colors.text} />
      </Pressable>
    </>
  );

  const onCtaPress = () => {
    if (cta.action === 'login') router.push('/login');
    else if (cta.action === 'register' || cta.action === 'pay') flow.register();
    else if (cta.action === 'upload') flow.upload();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader actions={headerActions} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={colors.primary} />}
      >
        <CompetitionHeader competition={competition} registration={registration} />
        <JudgeCard judge={competition.judge} onPlayIntro={setVideoUrl} />
        <CountdownBanner lifecycle={competition.lifecycle} spotsLeft={competition.spotsLeft} />
        <ImportantDates schedule={competition.schedule} />
        <EntriesShowcase competition={competition} now={now} onOpen={() => router.push(`/competitions/${slug}/entries`)} />
        <PreviousWinners winners={competition.previousWinners} onPlay={setVideoUrl} />
        <InfoTabs competition={competition} />
        <RewardsList rewards={competition.rewards} />
        <Disclaimer text={competition.disclaimer} />
        <PrizeInfoCard videoUrl={competition.prizeInfoVideoUrl} onPlay={setVideoUrl} />
        <ReferralCard
          link={user?.referralLink ?? null}
          rewardPerSignup={competition.referral.rewardPerSignup}
          competitionTitle={competition.title}
          onLoginRequired={() => router.push('/login')}
        />
        <TestimonialsRow onPress={() => router.push('/testimonials')} />
        <AdSlot ad={competition.ad} />
      </ScrollView>

      <PrimaryCTA state={cta} busyLabel={flow.busyLabel} onPress={onCtaPress} />

      <PaymentSheet order={flow.pendingOrder} prefill={prefill} description={competition.title} onResult={flow.handleCheckout} />
      <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />
    </SafeAreaView>
  );
}

function LoadingState() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader />
      <View style={styles.content}>
        <Skeleton height={170} />
        <Skeleton height={110} />
        <Skeleton height={50} />
        <Skeleton height={170} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
});
