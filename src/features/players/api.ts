import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import type { Player } from '@/api/types';
import { useOurTeam } from '@/features/teams/api';

/** Active players of one team. Waits until the team id is known. */
export function usePlayers(teamId?: number) {
  return useQuery({
    queryKey: ['players', teamId],
    queryFn: () => apiGet<Player[]>(`/players/?team=${teamId}`),
    enabled: teamId !== undefined,
  });
}

/** Our team and its squad, with one combined loading/error state. */
export function useOurSquad() {
  const team = useOurTeam();
  const players = usePlayers(team.data?.id);
  return {
    team: team.data,
    players: players.data ?? [],
    isPending: team.isPending || (team.data !== undefined && players.isPending),
    isError: team.isError || players.isError,
    /** Teams loaded, but none is marked as ours. */
    noTeam: team.isSuccess && team.data === undefined,
  };
}
