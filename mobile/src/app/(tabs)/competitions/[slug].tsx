import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdSlot } from '@/components/competition/AdSlot';
import { CompetitionHeader } from '@/components/competition/CompetitionHeader';
import { CountdownBanner } from '@/components/competition/CountdownBanner';
import { Disclaimer } from '@/components/competition/Disclaimer';
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
import { useRegistrationFlow } from '@/hooks/useRegistrationFlow';
import { useNow } from '@/hooks/useServerClock';
import { getCtaState } from '@/lib/cta';
import { colors } from '@/theme';

export default function CompetitionDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const query = useCompetition(slug);
  const refresh = useInvalidateCompetition(slug);
  const now = useNow();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const registration = query.data?.viewer?.registration ?? null;
  const flow = useRegistrationFlow(slug, registration?.id ?? null);

  // Coming back to this screen (e.g. after logging in) should show fresh spots and state.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

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

  const onCtaPress = () => {
    if (cta.action === 'login') router.push('/login');
    else if (cta.action === 'register' || cta.action === 'pay') flow.register();
    else if (cta.action === 'upload') flow.upload();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <CompetitionHeader competition={competition} registration={registration} />
        <JudgeCard judge={competition.judge} onPlayIntro={setVideoUrl} />
        <CountdownBanner lifecycle={competition.lifecycle} spotsLeft={competition.spotsLeft} onDeadlinePassed={refresh} />
        <ImportantDates schedule={competition.schedule} />
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
