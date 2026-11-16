import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { promptInstall, useInstallState } from './installPrompt';

// The module keeps its state for the whole page, so these tests run in a fixed order.

function fireInstallEvent(outcome: 'accepted' | 'dismissed' = 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: ReturnType<typeof vi.fn>;
    userChoice: Promise<{ outcome: string }>;
  };
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

afterEach(() => vi.restoreAllMocks());

describe('useInstallState', () => {
  it('offers nothing by default', () => {
    const { result } = renderHook(() => useInstallState());
    expect(result.current).toBe('none');
  });

  it('shows a how-to on iPhone, where there is no install API', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
    );
    const { result } = renderHook(() => useInstallState());
    expect(result.current).toBe('ios');
  });

  it('switches to prompt when the browser says the site can be installed', () => {
    const { result } = renderHook(() => useInstallState());
    const event = fireInstallEvent();
    expect(event.defaultPrevented).toBe(true);
    expect(result.current).toBe('prompt');
  });

  it('opens the install dialog and hides the button after it is dismissed', async () => {
    const { result } = renderHook(() => useInstallState());
    const event = fireInstallEvent('dismissed');
    expect(result.current).toBe('prompt');

    await act(async () => {
      await promptInstall();
    });

    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(result.current).toBe('none');

    fireInstallEvent();
    expect(result.current).toBe('prompt');
  });

  it('offers nothing when the site already runs as an installed app', () => {
    // jsdom has no matchMedia, so it is defined here and removed again below.
    Object.defineProperty(window, 'matchMedia', {
      value: () => ({ matches: true }),
      configurable: true,
    });
    const { result } = renderHook(() => useInstallState());
    expect(result.current).toBe('none');
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('does nothing without a pending install event', async () => {
    await expect(promptInstall()).resolves.toBeUndefined();
  });

  it('stays hidden for good once the app is installed', async () => {
    const { result } = renderHook(() => useInstallState());
    fireInstallEvent('accepted');
    await act(async () => {
      await promptInstall();
    });
    expect(result.current).toBe('none');

    fireInstallEvent();
    expect(result.current).toBe('none');
  });
});
