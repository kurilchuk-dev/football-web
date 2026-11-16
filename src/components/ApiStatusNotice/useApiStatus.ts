import { useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

export type ApiStatus = 'idle' | 'loading' | 'error';

/**
 * What the data requests are doing right now: `loading` while something is being fetched for
 * the first time, `error` once a request has failed for good, otherwise `idle`.
 */
export function useApiStatus(): ApiStatus {
  const cache = useQueryClient().getQueryCache();

  const getSnapshot = (): ApiStatus => {
    const queries = cache.getAll();
    if (queries.some((q) => q.state.status === 'error' && q.state.fetchStatus === 'idle')) {
      return 'error';
    }
    if (queries.some((q) => q.state.fetchStatus === 'fetching' && q.state.data === undefined)) {
      return 'loading';
    }
    return 'idle';
  };

  return useSyncExternalStore((onChange) => cache.subscribe(onChange), getSnapshot);
}
