import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InstallButton } from './InstallButton';

afterEach(() => vi.restoreAllMocks());

describe('InstallButton', () => {
  it('renders nothing when the site cannot be installed', () => {
    const { container } = render(<InstallButton />);
    expect(container.firstChild).toBeNull();
  });

  it('shows how to install on iPhone', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
    );
    render(<InstallButton />);

    const button = screen.getByRole('button', { name: 'Встановити застосунок' });
    expect(screen.queryByRole('dialog')).toBeNull();

    await userEvent.click(button);
    expect(screen.getByRole('dialog').textContent).toContain('Поділитися');

    await userEvent.click(screen.getByRole('button', { name: 'Зрозуміло' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the browser install dialog when the browser allows it', async () => {
    vi.restoreAllMocks();
    render(<InstallButton />);

    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: ReturnType<typeof vi.fn>;
      userChoice: Promise<{ outcome: string }>;
    };
    event.prompt = vi.fn().mockResolvedValue(undefined);
    event.userChoice = Promise.resolve({ outcome: 'dismissed' });
    act(() => {
      window.dispatchEvent(event);
    });

    await userEvent.click(screen.getByRole('button', { name: 'Встановити застосунок' }));
    expect(event.prompt).toHaveBeenCalledTimes(1);
  });
});
