import type { Player } from '@/api/types';
import { POSITION_ORDER, type Position } from './constants';

/** Goalkeepers first, then defenders, midfielders, forwards; by shirt number inside a position. */
export function sortPlayers(players: Player[]): Player[] {
  return [...players].sort(
    (a, b) =>
      POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position) ||
      a.number - b.number,
  );
}

export function countByPosition(players: Player[]): Record<Position, number> {
  const counts: Record<Position, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };
  for (const player of players) counts[player.position]++;
  return counts;
}
