import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useLanguage } from '@/context/LanguageContext';
import { colors } from '@/theme';

export default function CreateScreen() {
  const { t } = useLanguage();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title={t.create.title} showBack={false} />
      <View style={styles.body}>
        <Ionicons name="add-circle-outline" size={48} color={colors.primary} />
        <AppText color={colors.textMuted} style={styles.text}>
          {t.create.body}
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  text: { textAlign: 'center', lineHeight: 21 },
});
