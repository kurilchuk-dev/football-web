import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { Match } from '@/api/types';

/** Optional filter: only matches of the team with this id. */
function teamQuery(teamId?: number) {
  return teamId === undefined ? '' : `?team=${teamId}`;
}

/** Played matches, newest first. */
export function useResults(teamId?: number) {
  return useQuery({
    queryKey: ['matches', 'results', teamId ?? 'all'],
    queryFn: () => apiGet<Match[]>(`${ENDPOINTS.results}${teamQuery(teamId)}`),
  });
}

/** Matches that are not played yet, soonest first. */
export function useUpcoming(teamId?: number) {
  return useQuery({
    queryKey: ['matches', 'upcoming', teamId ?? 'all'],
    queryFn: () => apiGet<Match[]>(`${ENDPOINTS.upcoming}${teamQuery(teamId)}`),
  });
}
