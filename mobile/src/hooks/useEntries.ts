import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { api } from '@/api/endpoints';
import type { CompetitionResponse, EntriesResponse, Entry, EntrySort } from '@/api/types';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { competitionKey } from './useCompetition';

export const entriesKey = (slug: string) => ['entries', slug] as const;

export function useEntries(slug: string, sort: EntrySort, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...entriesKey(slug), sort, user?.id ?? 'guest'],
    queryFn: () => api.entries(slug, sort),
    enabled,
  });
}

// Applies a change to one entry in every cached sort order, so both tabs stay in step.
function patchEntry(data: EntriesResponse | undefined, entryId: string, patch: (e: Entry) => Partial<Entry>) {
  if (!data) return data;
  return { ...data, entries: data.entries.map((e) => (e.id === entryId ? { ...e, ...patch(e) } : e)) };
}

export function useVote(slug: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const key = entriesKey(slug);

  return useMutation({
    // One queue per competition, so a quick vote/unvote reaches the server in the order it was tapped.
    scope: { id: `votes-${slug}` },
    mutationFn: ({ entryId, on }: { entryId: string; on: boolean }) => api.vote(entryId, on),
    onMutate: async ({ entryId, on }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const snapshots = queryClient.getQueriesData<EntriesResponse>({ queryKey: key });
      queryClient.setQueriesData<EntriesResponse>({ queryKey: key }, (data) =>
        patchEntry(data, entryId, (e) =>
          e.viewerHasVoted === on ? {} : { viewerHasVoted: on, voteCount: Math.max(0, e.voteCount + (on ? 1 : -1)) },
        ),
      );
      return { snapshots };
    },
    onError: (err, _vars, context) => {
      context?.snapshots.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      toast(err instanceof ApiError ? err.message : String(err), 'error');
      // Voting may have closed or the entry been hidden since the list loaded.
      if (err instanceof ApiError && (err.status === 404 || err.status === 409)) queryClient.invalidateQueries({ queryKey: key });
    },
    onSuccess: (state, { entryId }) => {
      queryClient.setQueriesData<EntriesResponse>({ queryKey: key }, (data) => patchEntry(data, entryId, () => state));
    },
  });
}

export function useEntryVisibility(slug: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: ({ registrationId, hidden }: { registrationId: string; hidden: boolean }) =>
      api.setSubmissionHidden(registrationId, hidden),
    onSuccess: (_data, { hidden }) => {
      toast(hidden ? t.entries.hiddenToast : t.entries.shownToast, 'success');
      queryClient.invalidateQueries({ queryKey: entriesKey(slug) });
      queryClient.invalidateQueries({ queryKey: competitionKey(slug) });
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : String(err), 'error'),
  });
}

export function useSaveCompetition(slug: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();
  const key = competitionKey(slug);

  const setSavedInCache = (saved: boolean) =>
    queryClient.setQueriesData<CompetitionResponse>({ queryKey: key }, (data) =>
      data?.viewer ? { ...data, viewer: { ...data.viewer, saved } } : data,
    );

  return useMutation({
    scope: { id: `save-${slug}` },
    mutationFn: (saved: boolean) => api.setSaved(slug, saved),
    onMutate: (saved) => setSavedInCache(saved),
    onSuccess: ({ saved }) => {
      toast(saved ? t.savedToast : t.unsavedToast, 'success');
      queryClient.invalidateQueries({ queryKey: ['me', 'saved'] });
    },
    onError: (err, saved) => {
      setSavedInCache(!saved);
      toast(err instanceof ApiError ? err.message : String(err), 'error');
    },
  });
}
