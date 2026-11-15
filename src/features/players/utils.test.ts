import { describe, expect, it } from 'vitest';
import type { Player } from '@/api/types';
import { getInitials, sortPlayers } from './utils';

const player = (id: number, last_name: string, first_name: string, number?: number | null) =>
  ({ id, last_name, first_name, number }) as Player;

describe('sortPlayers', () => {
  it('puts numbered players first by number, the rest by surname', () => {
    const sorted = sortPlayers([
      player(1, 'Яковенко', 'Іван'),
      player(2, 'Бондар', 'Олег', 10),
      player(3, 'Авраменко', 'Петро'),
      player(4, 'Мельник', 'Ігор', 7),
      player(5, 'Бондар', 'Андрій', null),
    ]);
    expect(sorted.map((p) => p.id)).toEqual([4, 2, 3, 5, 1]);
  });

  it('sorts Ukrainian surnames alphabetically', () => {
    const sorted = sortPlayers([
      player(1, 'Дяк', 'А'),
      player(2, 'Гнатюк', 'Б'),
      player(3, 'Бондар', 'В'),
    ]);
    expect(sorted.map((p) => p.last_name)).toEqual(['Бондар', 'Гнатюк', 'Дяк']);
  });

  it('does not change the input array', () => {
    const input = [player(1, 'Б', 'А'), player(2, 'А', 'Б')];
    sortPlayers(input);
    expect(input.map((p) => p.id)).toEqual([1, 2]);
  });
});

describe('getInitials', () => {
  it('takes the first letters of surname and name', () => {
    expect(getInitials({ last_name: 'Курильчук', first_name: 'Максим Миколайович' })).toBe('КМ');
  });
});
