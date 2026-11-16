import { useQuery } from '@tanstack/react-query';
import { useMatchDayInterval } from './matchDay';
import { resultsQuery, upcomingQuery } from './queries';

export { resultsQuery, upcomingQuery };

export function useResults(teamId?: number) {
  return useQuery({ ...resultsQuery(teamId), refetchInterval: useMatchDayInterval() });
}

export function useUpcoming(teamId?: number) {
  return useQuery({ ...upcomingQuery(teamId), refetchInterval: useMatchDayInterval() });
}
