import { describe, expect, it } from 'vitest';
import type { StandingRow } from '@/api/types';
import { getStandingsSummary } from './utils';

const row = (played: number, goalsFor: number) => ({ played, goals_for: goalsFor }) as StandingRow;

describe('getStandingsSummary', () => {
  it('counts teams, matches (each match once) and goals', () => {
    expect(getStandingsSummary([row(2, 3), row(2, 1), row(0, 0)])).toEqual({
      teams: 3,
      matches: 2,
      goals: 4,
    });
  });

  it('returns zeros for an empty table', () => {
    expect(getStandingsSummary([])).toEqual({ teams: 0, matches: 0, goals: 0 });
  });
});
