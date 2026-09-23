import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useLanguage } from '@/context/LanguageContext';
import { colors } from '@/theme';

export function TestimonialsRow({ onPress }: { onPress: () => void }) {
  const { t } = useLanguage();
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card style={styles.row}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.text} />
        <View style={styles.text}>
          <AppText weight="semibold" size={14}>
            {t.hearFromUsers}
          </AppText>
          <AppText size={11} color={colors.textMuted}>
            {t.hearFromUsersSubtitle}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  text: { flex: 1 },
});
