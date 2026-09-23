import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '@/api/endpoints';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { syncServerTime } from './useServerClock';

export const competitionKey = (slug: string) => ['competition', slug] as const;

export function useCompetition(slug: string) {
  const { lang } = useLanguage();
  const { user } = useAuth();

  return useQuery({
    queryKey: [...competitionKey(slug), lang, user?.id ?? 'guest'],
    queryFn: async () => {
      const data = await api.competition(slug, lang);
      syncServerTime(data.serverTime);
      return data;
    },
  });
}

export function useInvalidateCompetition(slug: string) {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    // The list shows spots too, so mark it stale; it refetches the next time it is opened.
    queryClient.invalidateQueries({ queryKey: ['competitions'], refetchType: 'none' });
    await queryClient.invalidateQueries({ queryKey: competitionKey(slug) });
  }, [queryClient, slug]);
}
