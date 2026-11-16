import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateNotice } from './UpdateNotice';

const reloadPage = vi.fn();
const reloadSafely = vi.fn(() => true);
vi.mock('@/features/update/reload', () => ({
  reloadPage: () => reloadPage(),
  reloadSafely: () => reloadSafely(),
}));

const RUNNING = '/assets/index-OLD.js';
const html = (entry: string) => `<script type="module" src="${entry}"></script>`;

function serverHas(entry: string) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => html(entry) }));
}

function setVisibility(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

/** The app goes to the background, `awayMs` pass, then it comes back. */
async function leaveAndReturn(awayMs: number) {
  setVisibility('hidden');
  vi.setSystemTime(Date.now() + awayMs);
  setVisibility('visible');
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  reloadPage.mockReset();
  reloadSafely.mockReset().mockReturnValue(true);
  document.head.innerHTML = `<script type="module" src="${RUNNING}"></script>`;
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.head.innerHTML = '';
});

describe('UpdateNotice', () => {
  it('shows nothing when the published version is the one that runs', async () => {
    serverHas(RUNNING);
    render(<UpdateNotice />);

    await leaveAndReturn(5 * 60_000);

    expect(screen.queryByRole('status')).toBeNull();
    expect(reloadSafely).not.toHaveBeenCalled();
  });

  it('reloads by itself when the app is reopened after a long absence', async () => {
    serverHas('/assets/index-NEW.js');
    render(<UpdateNotice />);

    await leaveAndReturn(5 * 60_000);

    expect(reloadSafely).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('only offers the update after a short absence, and reloads when pressed', async () => {
    serverHas('/assets/index-NEW.js');
    render(<UpdateNotice />);

    await leaveAndReturn(5_000);

    expect(reloadSafely).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toContain('нова версія');
    await userEvent
      .setup({ advanceTimers: vi.advanceTimersByTime })
      .click(screen.getByRole('button', { name: 'Оновити' }));
    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  it('offers the update instead when the automatic reload was just done (loop guard)', async () => {
    reloadSafely.mockReturnValue(false);
    serverHas('/assets/index-NEW.js');
    render(<UpdateNotice />);

    await leaveAndReturn(5 * 60_000);

    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('does not check on a dev server, where there is no build to compare with', async () => {
    document.head.innerHTML = '<script type="module" src="/src/main.tsx"></script>';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<UpdateNotice />);

    await leaveAndReturn(5 * 60_000);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stays quiet when the check cannot reach the server', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<UpdateNotice />);

    await leaveAndReturn(5 * 60_000);

    expect(screen.queryByRole('status')).toBeNull();
    expect(reloadSafely).not.toHaveBeenCalled();
  });
});
