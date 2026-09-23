import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompetitionForm } from '@/components/create/CompetitionForm';
import { AppText } from '@/components/ui/AppText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { colors, radius } from '@/theme';

export default function CreateScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title={t.create.title} showBack={false} />
      {user ? (
        <CompetitionForm />
      ) : (
        <View style={styles.guest}>
          <Ionicons name="trophy-outline" size={48} color={colors.primary} />
          <AppText color={colors.textMuted} style={styles.text}>
            {t.create.loginPrompt}
          </AppText>
          <Pressable style={styles.login} onPress={() => router.push('/login')} accessibilityRole="button">
            <AppText weight="semibold" color={colors.white}>
              {t.auth.login}
            </AppText>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  text: { textAlign: 'center' },
  login: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 28, paddingVertical: 12 },
});
