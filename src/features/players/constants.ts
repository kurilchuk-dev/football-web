import type { Player } from '@/api/types';

export type Position = Player['position'];

export const POSITION_ORDER: Position[] = ['GK', 'DF', 'MF', 'FW'];

export const POSITION_LABELS: Record<Position, string> = {
  GK: 'Воротарі',
  DF: 'Захисники',
  MF: 'Півзахисники',
  FW: 'Нападники',
};

/** Short chip on a player card. */
export const POSITION_SHORT: Record<Position, string> = {
  GK: 'ВР',
  DF: 'ЗХ',
  MF: 'ПЗ',
  FW: 'НП',
};
