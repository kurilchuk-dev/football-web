import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Player } from '@/api/types';
import { PlayerCard } from './PlayerCard';

const player = (extra: Partial<Player>) =>
  ({
    id: 1,
    first_name: 'Максим',
    last_name: 'Курильчук',
    number: null,
    photo: null,
    ...extra,
  }) as Player;

describe('PlayerCard', () => {
  it('shows the photo with the shirt number on it', () => {
    const { container } = render(
      <PlayerCard player={player({ number: 9, photo: 'http://x/media/a.png' })} />,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', 'http://x/media/a.png');
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Курильчук')).toBeInTheDocument();
  });

  it('shows the shirt number when there is no photo', () => {
    const { container } = render(<PlayerCard player={player({ number: 7 })} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows initials when there is neither photo nor number', () => {
    const { container } = render(<PlayerCard player={player({})} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('КМ')).toBeInTheDocument();
  });

  it('falls back to the number when the photo fails to load', () => {
    const { container } = render(
      <PlayerCard player={player({ number: 4, photo: 'http://x/media/missing.png' })} />,
    );
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('tries a new photo again after an earlier one failed', () => {
    const { container, rerender } = render(
      <PlayerCard player={player({ photo: 'http://x/media/old.png' })} />,
    );
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();

    rerender(<PlayerCard player={player({ photo: 'http://x/media/new.png' })} />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'http://x/media/new.png');
  });
});
