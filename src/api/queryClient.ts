import { QueryClient } from '@tanstack/react-query';
import { PERSIST_MAX_AGE_MS } from './persist';

/**
 * Table, results and squad change rarely, so treat data as fresh for 2 minutes instead of
 * refetching on every page change and window focus. A failed request is retried twice
 * (a sleeping server often answers on the second try).
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // gcTime must be at least the persist maxAge, or saved data is garbage-collected first.
      queries: { staleTime: 2 * 60_000, retry: 2, gcTime: PERSIST_MAX_AGE_MS },
    },
  });
}
