import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { StandingRow } from '@/api/types';
import { TeamCell } from './TeamCell';

const team = (logo: string | null) =>
  ({ id: 1, name: 'Динамо', is_our_team: false, logo }) as StandingRow['team'];

describe('TeamCell', () => {
  it('shows the logo image when the team has one', () => {
    const { container } = render(<TeamCell team={team('http://x/media/logo.png')} />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'http://x/media/logo.png');
    expect(screen.getByText('Динамо')).toBeInTheDocument();
  });

  it('shows the first letter when there is no logo', () => {
    const { container } = render(<TeamCell team={team(null)} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('Д')).toBeInTheDocument();
  });

  it('falls back to the first letter when the logo fails to load', () => {
    const { container } = render(<TeamCell team={team('http://x/media/missing.png')} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();

    fireEvent.error(img!);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('Д')).toBeInTheDocument();
  });

  it('tries a new logo again after an earlier one failed', () => {
    const { container, rerender } = render(<TeamCell team={team('http://x/media/old.png')} />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();

    rerender(<TeamCell team={team('http://x/media/new.png')} />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'http://x/media/new.png');
  });
});
