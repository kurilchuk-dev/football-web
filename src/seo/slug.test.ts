import { describe, expect, it } from 'vitest';
import { idFromSlug, matchPath, slugify, teamPath } from './slug';

describe('slugs', () => {
  it('writes Ukrainian names in Latin letters', () => {
    expect(slugify('Черкаські Козаки')).toBe('cherkaski-kozaky');
    expect(slugify('31 п НГУ')).toBe('31-p-nhu');
    expect(slugify('FC SV')).toBe('fc-sv');
  });

  it('puts the id first', () => {
    expect(teamPath({ id: 4, name: 'Темп' })).toBe('/teams/4-temp');
    expect(matchPath({ id: 12, home_team: { name: 'Темп' }, away_team: { name: 'Барс' } })).toBe(
      '/matches/12-temp-bars',
    );
  });

  it('reads only the id back', () => {
    expect(idFromSlug('12-temp-bars')).toBe(12);
    expect(idFromSlug('12')).toBe(12);
    expect(idFromSlug('temp')).toBeNull();
    expect(idFromSlug('12abc')).toBeNull();
    expect(idFromSlug(undefined)).toBeNull();
  });
});
