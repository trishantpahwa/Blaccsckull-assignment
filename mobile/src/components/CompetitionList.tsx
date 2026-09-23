import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { api } from '@/api/endpoints';
import type { CompetitionSummary } from '@/api/types';
import { useLanguage } from '@/context/LanguageContext';
import { colors } from '@/theme';
import { CompetitionCard } from './CompetitionCard';
import { AppText } from './ui/AppText';
import { ErrorState } from './ui/ErrorState';
import { Skeleton } from './ui/Skeleton';

interface Props {
  filter?: (c: CompetitionSummary) => boolean;
  header?: ReactElement;
}

export function CompetitionList({ filter, header }: Props) {
  const { t, lang } = useLanguage();
  const query = useQuery({ queryKey: ['competitions', lang], queryFn: () => api.competitions(lang) });

  if (query.isPending) {
    return (
      <View style={styles.content}>
        {header}
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={110} style={styles.skeleton} />
        ))}
      </View>
    );
  }
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;

  const items = filter ? query.data.competitions.filter(filter) : query.data.competitions;

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => <CompetitionCard competition={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <AppText color={colors.textMuted} style={styles.empty}>
          {t.list.empty}
        </AppText>
      }
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  separator: { height: 12 },
  skeleton: { marginBottom: 12 },
  empty: { textAlign: 'center', marginTop: 40 },
});
