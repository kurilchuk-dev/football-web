import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentEntry, extractEntry, fetchLatestEntry } from './version';

afterEach(() => {
  document.head.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('extractEntry', () => {
  it('finds the entry script in an index.html', () => {
    const html = '<script type="module" crossorigin src="/assets/index-DN1ULo_u.js"></script>';
    expect(extractEntry(html)).toBe('/assets/index-DN1ULo_u.js');
  });

  it('returns null when there is none', () => {
    expect(extractEntry('<html><body>Not found</body></html>')).toBeNull();
  });
});

describe('currentEntry', () => {
  it('reads the script this page runs', () => {
    document.head.innerHTML = '<script type="module" src="/assets/index-AbC-123.js"></script>';
    expect(currentEntry()).toBe('/assets/index-AbC-123.js');
  });

  it('is null without a build (dev server)', () => {
    document.head.innerHTML = '<script type="module" src="/src/main.tsx"></script>';
    expect(currentEntry()).toBeNull();
  });
});

describe('fetchLatestEntry', () => {
  it('asks the server for a fresh index.html, not a cached one', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<script type="module" src="/assets/index-NEW.js"></script>',
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchLatestEntry()).resolves.toBe('/assets/index-NEW.js');
    expect(fetchMock).toHaveBeenCalledWith('/', { cache: 'no-store' });
  });

  it('is null on an error status or when offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(fetchLatestEntry()).resolves.toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(fetchLatestEntry()).resolves.toBeNull();
  });
});
