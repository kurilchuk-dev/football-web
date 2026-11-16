import { queryOptions, useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { Player } from '@/api/types';
import { useOurTeam } from '@/features/teams/api';

/** Active players of our team. The server finds the team itself, so no team id is needed first. */
export const ourPlayersQuery = () =>
  queryOptions({
    queryKey: ['players', 'our'],
    queryFn: () => apiGet<Player[]>(ENDPOINTS.ourPlayers),
  });

export function useOurPlayers() {
  return useQuery(ourPlayersQuery());
}

/** Our team and its squad, with one combined loading/error state. Both load in parallel. */
export function useOurSquad() {
  const team = useOurTeam();
  const players = useOurPlayers();
  return {
    team: team.data,
    players: players.data ?? [],
    isPending: team.isPending || players.isPending,
    isError: team.isError || players.isError,
    /** Teams loaded, but none is marked as ours. */
    noTeam: team.isSuccess && team.data === undefined,
  };
}
