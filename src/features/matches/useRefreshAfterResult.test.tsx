import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import type { Match } from '@/api/types';
import { standingsQuery } from '@/features/standings/api';
import { resultsQuery, upcomingQuery } from './queries';
import { useRefreshAfterResult } from './useRefreshAfterResult';

const matches = (...ids: number[]) => ids.map((id) => ({ id }) as Match);

function setup() {
  const client = new QueryClient();
  client.setQueryData(upcomingQuery().queryKey, matches(1, 2));
  client.setQueryData(resultsQuery().queryKey, []);
  client.setQueryData(standingsQuery().queryKey, []);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  renderHook(() => useRefreshAfterResult(), { wrapper });

  const update = async (data: Match[]) => {
    await act(async () => {
      client.setQueryData(upcomingQuery().queryKey, data);
      // The cache tells its observers on the next tick.
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };
  const outdated = () =>
    [resultsQuery().queryKey, standingsQuery().queryKey].map(
      (key) => client.getQueryState(key)?.isInvalidated,
    );
  return { update, outdated };
}

describe('useRefreshAfterResult', () => {
  it('marks the results and the table as outdated when a match leaves the upcoming list', async () => {
    const { update, outdated } = setup();
    await update(matches(2));
    expect(outdated()).toEqual([true, true]);
  });

  it('leaves them alone while no match has left the list', async () => {
    const { update, outdated } = setup();
    await update(matches(1, 2, 3));
    expect(outdated()).toEqual([false, false]);
  });
});
