import { SafeAreaView } from 'react-native-safe-area-context';
import { CompetitionList } from '@/components/CompetitionList';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useLanguage } from '@/context/LanguageContext';
import { colors } from '@/theme';

export default function CompetitionsScreen() {
  const { t } = useLanguage();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScreenHeader title={t.list.title} showBack={false} />
      <CompetitionList />
    </SafeAreaView>
  );
}
