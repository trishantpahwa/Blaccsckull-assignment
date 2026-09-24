import { useCallback, useState } from 'react';

/**
 * Drives a RefreshControl from the user's pull gesture only. Binding `refreshing` to a query's
 * `isRefetching` also turns it on for background refetches (after login, payment or cache
 * invalidation), often while the screen is hidden, and the native spinner then sticks as a
 * frozen image.
 */
export function usePullToRefresh(refresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return { refreshing, onRefresh };
}
