import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StandingRow } from '@/api/types';
import { StandingsImageActions } from './StandingsImageActions';

const renderStandingsImage = vi.fn();
vi.mock('../../image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../image')>()),
  renderStandingsImage: (...args: unknown[]) => renderStandingsImage(...args),
}));

const rows = [{ position: 1, team: { id: 1, name: 'A', is_our_team: true } }] as StandingRow[];
const importButton = () => screen.getByRole('button', { name: 'Імпортувати таблицю як картинку' });

/** jsdom has no matchMedia: a finger (coarse pointer) or a mouse is simulated by this stub. */
function usePointer(kind: 'touch' | 'mouse') {
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({ matches: kind === 'touch' && query.includes('coarse') }),
    configurable: true,
  });
}

function useShare(share?: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'canShare', {
    value: share ? () => true : undefined,
    configurable: true,
  });
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
}

beforeEach(() => {
  renderStandingsImage.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
  URL.createObjectURL = vi.fn(() => 'blob:table');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  renderStandingsImage.mockReset();
  Reflect.deleteProperty(window, 'matchMedia');
  useShare(undefined);
});

describe('StandingsImageActions', () => {
  it('is a single button named Import', () => {
    render(<StandingsImageActions rows={rows} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(importButton().textContent).toContain('Імпортувати');
  });

  it('downloads the picture as a file on a computer', async () => {
    usePointer('mouse');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<StandingsImageActions rows={rows} />);

    await userEvent.click(importButton());

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(renderStandingsImage).toHaveBeenCalledWith(rows, expect.any(Object));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the share sheet with the picture on a phone, so it can be saved to the gallery', async () => {
    usePointer('touch');
    const share = vi.fn().mockResolvedValue(undefined);
    useShare(share);
    render(<StandingsImageActions rows={rows} />);

    await userEvent.click(importButton());

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const [{ files }] = share.mock.calls[0];
    expect(files[0].type).toBe('image/png');
    expect(files[0].name).toMatch(/^turnirna-tablytsia-\d{4}-\d{2}-\d{2}\.png$/);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the picture with a press-and-hold hint when the phone cannot share files', async () => {
    usePointer('touch');
    useShare(undefined);
    render(<StandingsImageActions rows={rows} />);

    await userEvent.click(importButton());

    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('утримуйте');
    expect(screen.getByRole('img', { name: 'Турнірна таблиця' }).getAttribute('src')).toBe(
      'blob:table',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Закрити' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:table');
  });

  it('closes the picture with the Escape key', async () => {
    usePointer('touch');
    render(<StandingsImageActions rows={rows} />);
    await userEvent.click(importButton());
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('falls back to the picture when sharing is refused', async () => {
    usePointer('touch');
    useShare(vi.fn().mockRejectedValue(new DOMException('too late', 'NotAllowedError')));
    render(<StandingsImageActions rows={rows} />);

    await userEvent.click(importButton());

    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('does nothing more when the share sheet is closed', async () => {
    usePointer('touch');
    const share = vi.fn().mockRejectedValue(new DOMException('closed', 'AbortError'));
    useShare(share);
    render(<StandingsImageActions rows={rows} />);

    await userEvent.click(importButton());

    await waitFor(() => expect(share).toHaveBeenCalled());
    await waitFor(() => expect(importButton().hasAttribute('disabled')).toBe(false));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows an error when the picture cannot be made, and tries again on the next click', async () => {
    renderStandingsImage.mockRejectedValueOnce(new Error('canvas'));
    usePointer('mouse');
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<StandingsImageActions rows={rows} />);

    await userEvent.click(importButton());
    expect(await screen.findByRole('alert')).toBeTruthy();

    await userEvent.click(importButton());
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
