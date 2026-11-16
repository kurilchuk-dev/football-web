import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPreloadErrorReload, reloadSafely } from './reload';

const reload = vi.fn();

beforeEach(() => {
  sessionStorage.clear();
  reload.mockReset();
  vi.stubGlobal('location', { ...window.location, reload });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('reloadSafely', () => {
  it('reloads the first time', () => {
    expect(reloadSafely()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('refuses to reload again right away, so a stale cache cannot cause a loop', () => {
    reloadSafely();
    expect(reloadSafely()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads again after a while', () => {
    vi.useFakeTimers();
    reloadSafely();
    vi.advanceTimersByTime(31_000);
    expect(reloadSafely()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});

describe('installPreloadErrorReload', () => {
  it('reloads when a lazy page chunk is gone after a release', () => {
    installPreloadErrorReload();
    const event = new Event('vite:preloadError', { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
