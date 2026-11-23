import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROUTE_PRELOADS } from './endpoints';
import { prefetchRoute } from './prefetch';

afterEach(() => vi.unstubAllGlobals());

function setup() {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
  vi.stubGlobal('fetch', fetchMock);
  // The base URL differs per environment (unset in CI, a local server in .env), so drop it.
  const base = String(import.meta.env.VITE_API_URL);
  const requested = () => fetchMock.mock.calls.map(([url]) => String(url).replace(base, '')).sort();
  return { client: new QueryClient(), requested };
}

describe('prefetchRoute', () => {
  it.each(Object.keys(ROUTE_PRELOADS))(
    'requests the same data as the HTML preload for %s',
    async (route) => {
      const { client, requested } = setup();
      await prefetchRoute(client, route);
      expect(requested()).toEqual([...ROUTE_PRELOADS[route]].sort());
    },
  );

  it('does nothing for an unknown route', async () => {
    const { client, requested } = setup();
    await prefetchRoute(client, '/nope');
    expect(requested()).toEqual([]);
  });

  it('does not fetch data that is still fresh', async () => {
    const { client, requested } = setup();
    client.setDefaultOptions({ queries: { staleTime: 60_000 } });
    await prefetchRoute(client, '/standings');
    await prefetchRoute(client, '/standings');
    expect(requested()).toHaveLength(3);
  });

  it('swallows errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(prefetchRoute(new QueryClient(), '/team')).resolves.toBeTruthy();
  });
});
