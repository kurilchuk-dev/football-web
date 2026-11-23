import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getVisitorId, reportVisit } from './trackVisit';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function mockFetch(ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Lets the promise chain of reportVisit finish. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubEnv('PROD', true);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getVisitorId', () => {
  it('makes a UUID once and keeps it', () => {
    const id = getVisitorId();
    expect(id).toMatch(UUID);
    expect(getVisitorId()).toBe(id);
    expect(localStorage.getItem('visitor-id')).toBe(id);
  });

  it('makes a valid id also in browsers without randomUUID', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    expect(getVisitorId()).toMatch(UUID);
  });

  it('returns null when the storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getVisitorId()).toBeNull();
  });
});

describe('reportVisit', () => {
  it('sends the id once per session', async () => {
    const fetchMock = mockFetch();
    reportVisit();
    await settle();
    reportVisit();
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/visitors\/ping\/$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ visitor_id: localStorage.getItem('visitor-id') });
  });

  it('does not send anything in development', () => {
    vi.stubEnv('PROD', false);
    const fetchMock = mockFetch();
    reportVisit();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('respects Do Not Track', () => {
    // jsdom has no doNotTrack, so it is defined here and removed again.
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    const fetchMock = mockFetch();
    try {
      reportVisit();
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(navigator, 'doNotTrack');
    }
  });

  it('does not send when no id can be kept', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const fetchMock = mockFetch();
    reportVisit();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('tries again next time when the server refuses', async () => {
    const fetchMock = mockFetch(false);
    reportVisit();
    await settle();
    reportVisit();
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ignores a failed request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(() => reportVisit()).not.toThrow();
    await settle();
  });
});
