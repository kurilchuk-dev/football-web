import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Match, StandingRow } from '@/api/types';
import { calculateStandings, type EngineTeam } from '@/features/standings/calculate';
import { StandingsPage } from './StandingsPage';

const teams: EngineTeam[] = [
  { id: 1, name: 'Наші', is_our_team: true, logo: null, photo: null },
  { id: 2, name: 'Барс', is_our_team: false, logo: null, photo: null },
  { id: 3, name: 'Темп', is_our_team: false, logo: null, photo: null },
];

const game = (id: number, home: number, away: number, scores: [number, number] | null): Match =>
  ({
    id,
    home_team: teams.find((t) => t.id === home),
    away_team: teams.find((t) => t.id === away),
    home_score: scores ? scores[0] : null,
    away_score: scores ? scores[1] : null,
    date: '2026-11-08',
    time: null,
    round: 2,
  }) as Match;

// Темп beat Барс 2:0. Planned: Наші - Темп and Барс - Наші.
const results = [game(1, 3, 2, [2, 0])];
const upcoming = [game(10, 1, 3, null), game(11, 2, 1, null)];
const realRows: StandingRow[] = calculateStandings(teams, [
  { id: 1, home_id: 3, away_id: 2, home_score: 2, away_score: 0, date: '2026-11-01', time: null },
]);

vi.mock('@/features/standings/api', () => ({
  useStandings: () => ({ data: realRows, isLoading: false, isError: false }),
}));
vi.mock('@/features/matches/api', () => ({
  useResults: () => ({ data: results, isError: false }),
  useUpcoming: () => ({ data: upcoming, isError: false }),
}));

const rowNames = () =>
  within(document.querySelector('tbody') as HTMLElement)
    .getAllByRole('row')
    .map((row) => row.querySelectorAll('td')[1].textContent?.trim().slice(1) ?? '');

const openSimulation = () => userEvent.click(screen.getByRole('button', { name: 'Симуляція' }));
/** The score field of one team in one of the two planned matches (named like its aria-label). */
const field = (team: string, match: string) =>
  screen.getByRole('textbox', { name: `Голи: ${team} (${match})` });
const OURS_TEMP = 'Наші — Темп';
const BARS_OURS = 'Барс — Наші';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('StandingsPage simulation', () => {
  it('starts with the real table and the Import button, without the simulation', () => {
    render(<StandingsPage />);

    expect(screen.getByRole('button', { name: 'Таблиця' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Імпортувати таблицю як картинку' })).toBeTruthy();
    expect(screen.queryByText('Заплановані матчі')).toBeNull();
    expect(rowNames()).toEqual(['Темп', 'Наші', 'Барс']);
  });

  it('shows the planned matches in the simulation, with the table at the top and no Import', async () => {
    render(<StandingsPage />);

    await openSimulation();

    expect(screen.getByText('Заплановані матчі')).toBeTruthy();
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: /Імпортувати/ })).toBeNull();
    // Nothing typed yet: the same table as the real one, with no changes shown.
    expect(rowNames()).toEqual(['Темп', 'Наші', 'Барс']);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('recalculates the table when both scores of one match are typed, leaving the other empty', async () => {
    render(<StandingsPage />);
    await openSimulation();

    // Наші beat Темп 4:0. The second planned match stays empty.
    await userEvent.type(field('Наші', OURS_TEMP), '4');
    // One field is not enough: the match is not counted yet.
    expect(rowNames()).toEqual(['Темп', 'Наші', 'Барс']);

    await userEvent.type(field('Темп', OURS_TEMP), '0');

    expect(rowNames()).toEqual(['Наші', 'Темп', 'Барс']);
    expect(screen.getByRole('status').textContent).toContain('Наші: 2 → 1 місце');
    expect(screen.getByLabelText('Вище на 1')).toBeTruthy();
    expect(screen.getByLabelText('Нижче на 1')).toBeTruthy();
  });

  it('accepts digits only and at most two', async () => {
    render(<StandingsPage />);
    await openSimulation();

    const input = field('Наші', OURS_TEMP) as HTMLInputElement;
    await userEvent.type(input, 'a1b2c3');

    expect(input.value).toBe('12');
  });

  it('keeps the typed scores when switching back and forth, and clears them on request', async () => {
    render(<StandingsPage />);
    await openSimulation();
    await userEvent.type(field('Наші', OURS_TEMP), '4');
    await userEvent.type(field('Темп', OURS_TEMP), '0');

    await userEvent.click(screen.getByRole('button', { name: 'Таблиця' }));
    expect(rowNames()).toEqual(['Темп', 'Наші', 'Барс']); // the real table again

    await openSimulation();
    expect((field('Наші', OURS_TEMP) as HTMLInputElement).value).toBe('4');
    expect(rowNames()).toEqual(['Наші', 'Темп', 'Барс']);

    await userEvent.click(screen.getByRole('button', { name: 'Очистити' }));
    expect((field('Наші', OURS_TEMP) as HTMLInputElement).value).toBe('');
    expect(rowNames()).toEqual(['Темп', 'Наші', 'Барс']);
  });

  it('counts a 0:0 draw as a result', async () => {
    render(<StandingsPage />);
    await openSimulation();

    await userEvent.type(field('Барс', BARS_OURS), '1');
    await userEvent.type(field('Наші', BARS_OURS), '1');

    // Барс - Наші 1:1: both get a point.
    expect(screen.getByRole('status').textContent).toContain('очки 0 → 1');
  });
});
