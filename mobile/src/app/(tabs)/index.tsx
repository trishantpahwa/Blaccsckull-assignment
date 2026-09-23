import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompetitionList } from '@/components/CompetitionList';
import { AppText } from '@/components/ui/AppText';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { format } from '@/i18n';
import { colors } from '@/theme';

export default function HomeScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const header = (
    <View style={styles.header}>
      <View style={styles.greetingRow}>
        <AppText weight="semibold" size={22} style={styles.flex}>
          {user ? format(t.home.greeting, { name: user.name.split(' ')[0] }) : t.home.guest}
        </AppText>
        <LanguageToggle />
      </View>
      <AppText color={colors.textMuted}>{t.home.subtitle}</AppText>
      <AppText weight="semibold" size={16} style={styles.section}>
        {t.home.featured}
      </AppText>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <CompetitionList header={header} filter={(c) => c.lifecycle.registrationOpen || c.lifecycle.phase === 'upcoming'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { marginBottom: 12, gap: 4 },
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  section: { marginTop: 16 },
});
