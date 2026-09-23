import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/endpoints';
import type { CompetitionResponse } from '@/api/types';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { syncServerTime } from './useServerClock';

export const competitionKey = (slug: string) => ['competition', slug] as const;

export function useCompetition(slug: string) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const details = useQuery({
    queryKey: [...competitionKey(slug), lang, user?.id ?? 'guest'],
    queryFn: async () => {
      const data = await api.competition(slug, lang);
      syncServerTime(data.serverTime);
      return data;
    },
  });

  // Poll the lightweight endpoint so the spots counter stays live while others register.
  useQuery({
    queryKey: ['availability', slug],
    enabled: details.isSuccess,
    refetchInterval: 15_000,
    queryFn: async () => {
      const availability = await api.availability(slug);
      syncServerTime(availability.serverTime);
      queryClient.setQueriesData<CompetitionResponse>({ queryKey: competitionKey(slug) }, (prev) =>
        prev && 'competition' in prev
          ? {
              ...prev,
              competition: {
                ...prev.competition,
                capacity: availability.capacity,
                bookedCount: availability.bookedCount,
                spotsLeft: availability.spotsLeft,
                lifecycle: availability.lifecycle,
              },
            }
          : prev,
      );
      return availability;
    },
  });

  return details;
}

export function useInvalidateCompetition(slug: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: competitionKey(slug) });
}
