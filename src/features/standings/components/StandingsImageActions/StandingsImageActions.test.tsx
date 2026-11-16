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

beforeEach(() => {
  renderStandingsImage.mockResolvedValue(new Blob(['x'], { type: 'image/png' }));
  URL.createObjectURL = vi.fn(() => 'blob:table');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  renderStandingsImage.mockReset();
  Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
});

describe('StandingsImageActions', () => {
  it('downloads the picture with a dated file name', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<StandingsImageActions rows={rows} />);

    await userEvent.click(screen.getByRole('button', { name: 'Завантажити картинку' }));

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(renderStandingsImage).toHaveBeenCalledWith(rows, expect.any(Object));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('shows the share button only when the browser can share files', () => {
    const { unmount } = render(<StandingsImageActions rows={rows} />);
    expect(screen.queryByRole('button', { name: 'Поділитись' })).toBeNull();
    unmount();

    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    render(<StandingsImageActions rows={rows} />);
    expect(screen.getByRole('button', { name: 'Поділитись' })).toBeTruthy();
  });

  it('shares the picture as a file', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    render(<StandingsImageActions rows={rows} />);

    await userEvent.click(screen.getByRole('button', { name: 'Поділитись' }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const [{ files }] = share.mock.calls[0];
    expect(files[0].type).toBe('image/png');
    expect(files[0].name).toMatch(/^turnirna-tablytsia-\d{4}-\d{2}-\d{2}\.png$/);
  });

  it('shows an error when the picture cannot be made, but not when sharing is cancelled', async () => {
    renderStandingsImage.mockRejectedValueOnce(new Error('canvas'));
    render(<StandingsImageActions rows={rows} />);
    await userEvent.click(screen.getByRole('button', { name: 'Завантажити картинку' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('stays quiet when the share sheet is closed', async () => {
    const abort = new DOMException('closed', 'AbortError');
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(abort),
      configurable: true,
    });
    render(<StandingsImageActions rows={rows} />);

    await userEvent.click(screen.getByRole('button', { name: 'Поділитись' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Поділитись' }).hasAttribute('disabled')).toBe(
        false,
      ),
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
