import { queryOptions, useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { StandingRow } from '@/api/types';

export const standingsQuery = () =>
  queryOptions({
    queryKey: ['standings'],
    queryFn: () => apiGet<StandingRow[]>(ENDPOINTS.standings),
  });

export function useStandings() {
  return useQuery(standingsQuery());
}
