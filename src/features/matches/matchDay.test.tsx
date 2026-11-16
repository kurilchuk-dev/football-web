import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import type { Match } from '@/api/types';
import { hasMatchToday, MATCH_DAY_REFRESH_MS, useMatchDayInterval } from './matchDay';
import { upcomingQuery } from './queries';

const match = (date: string | null, played = false) =>
  ({ id: 1, date, home_score: played ? 2 : null, away_score: played ? 1 : null }) as Match;

// A local noon, so the day is the same in any time zone the tests run in.
const NOON = new Date(2026, 10, 16, 12, 0, 0);

describe('hasMatchToday', () => {
  it('is true for an unplayed match dated today', () => {
    expect(hasMatchToday([match('2026-11-16')], NOON)).toBe(true);
  });

  it('is false for other days, played matches, missing dates and missing data', () => {
    expect(hasMatchToday([match('2026-11-17'), match('2026-11-15')], NOON)).toBe(false);
    expect(hasMatchToday([match('2026-11-16', true)], NOON)).toBe(false);
    expect(hasMatchToday([match(null)], NOON)).toBe(false);
    expect(hasMatchToday([], NOON)).toBe(false);
    expect(hasMatchToday(undefined, NOON)).toBe(false);
  });
});

describe('useMatchDayInterval', () => {
  const run = (data: Match[] | undefined) => {
    const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    if (data) client.setQueryData(upcomingQuery().queryKey, data);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return renderHook(() => useMatchDayInterval(), { wrapper }).result.current;
  };

  const today = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  it('polls every minute while a match is on today', () => {
    expect(run([match(today())])).toBe(MATCH_DAY_REFRESH_MS);
  });

  it('does not poll without a match today', () => {
    expect(run([match('2000-01-01')])).toBe(false);
  });
});
