import { useQuery } from '@tanstack/react-query';
import { apiGet } from './client';
import type { StandingRow } from './types';

export function useStandings() {
  return useQuery({
    queryKey: ['standings'],
    queryFn: () => apiGet<StandingRow[]>('/standings/'),
  });
}
