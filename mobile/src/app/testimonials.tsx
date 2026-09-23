import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/api/endpoints';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/context/LanguageContext';
import { colors } from '@/theme';

export default function TestimonialsScreen() {
  const { t, lang } = useLanguage();
  const query = useQuery({ queryKey: ['testimonials', lang], queryFn: () => api.testimonials(lang) });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader />
      <AppText weight="semibold" size={20} style={styles.title}>
        {t.testimonials.title}
      </AppText>
      {query.isPending ? (
        <View style={styles.content}>
          <Skeleton height={110} />
        </View>
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={query.data.testimonials}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={<AppText color={colors.textMuted}>{t.testimonials.empty}</AppText>}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.stars} accessibilityLabel={`${item.rating} / 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Ionicons key={i} name={i < item.rating ? 'star' : 'star-outline'} size={14} color={colors.gold} />
                ))}
              </View>
              <AppText size={15} style={styles.quote}>
                “{item.text}”
              </AppText>
              <AppText weight="semibold">{item.name}</AppText>
              {item.role && (
                <AppText size={12} color={colors.textMuted}>
                  {item.role}
                </AppText>
              )}
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { paddingHorizontal: 16, marginBottom: 4 },
  content: { padding: 16 },
  card: { gap: 6 },
  stars: { flexDirection: 'row', gap: 2 },
  quote: { lineHeight: 22 },
});
