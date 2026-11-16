import { queryOptions, useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { Team } from '@/api/types';

export const teamsQuery = () =>
  queryOptions({
    queryKey: ['teams'],
    queryFn: () => apiGet<Team[]>(ENDPOINTS.teams),
  });

export function useTeams() {
  return useQuery(teamsQuery());
}

export function useOurTeam() {
  const query = useTeams();
  return { ...query, data: query.data?.find((team) => team.is_our_team) };
}
