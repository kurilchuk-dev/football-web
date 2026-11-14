import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import type { StandingRow } from '@/api/types';

export function useStandings() {
  return useQuery({
    queryKey: ['standings'],
    queryFn: () => apiGet<StandingRow[]>('/standings/'),
  });
}
