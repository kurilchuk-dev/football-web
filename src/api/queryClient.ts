import { QueryClient } from '@tanstack/react-query';

/**
 * Table, results and squad change rarely, so treat data as fresh for 2 minutes instead of
 * refetching on every page change and window focus. A failed request is retried twice
 * (a sleeping server often answers on the second try).
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 2 * 60_000, retry: 2 },
    },
  });
}
