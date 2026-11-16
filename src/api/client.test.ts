import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiGet, REQUEST_TIMEOUT_MS } from './client';

afterEach(() => vi.unstubAllGlobals());

describe('apiGet', () => {
  it('returns the parsed JSON and passes a timeout signal to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ a: 1 }) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiGet('/teams/')).resolves.toEqual({ a: 1 });
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(REQUEST_TIMEOUT_MS).toBeGreaterThan(30_000);
  });

  it('throws on an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(apiGet('/teams/')).rejects.toThrow('API error 503');
  });
});
