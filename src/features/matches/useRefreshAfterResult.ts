import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { standingsQuery } from '@/features/standings/api';
import { resultsQuery, upcomingQuery } from './queries';

/**
 * When a match leaves the upcoming list (its score was entered), fetches the results and the
 * table again. Without this they can stay old: the match day polling stops as soon as the last
 * match of the day is gone from that list, possibly before they were polled one more time.
 *
 * It only watches the cache and never requests the upcoming list itself.
 */
export function useRefreshAfterResult() {
  const client = useQueryClient();
  const { data } = useQuery({ ...upcomingQuery(), enabled: false });
  const known = useRef<number[] | null>(null);

  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.map((match) => match.id));
    const left = known.current?.some((id) => !ids.has(id));
    known.current = [...ids];
    if (!left) return;
    void client.invalidateQueries({ queryKey: resultsQuery().queryKey });
    void client.invalidateQueries({ queryKey: standingsQuery().queryKey });
  }, [data, client]);
}
