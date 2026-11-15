import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import type { Player } from '@/api/types';

/** Active players of one team. Waits until the team id is known. */
export function usePlayers(teamId?: number) {
  return useQuery({
    queryKey: ['players', teamId],
    queryFn: () => apiGet<Player[]>(`/players/?team=${teamId}`),
    enabled: teamId !== undefined,
  });
}
