import type { StandingRow } from '@/api/types';

export type FormResult = StandingRow['form'][number];

export const FORM_LABELS: Record<FormResult, string> = {
  W: 'Перемога',
  D: 'Нічия',
  L: 'Поразка',
};

export const FORM_LETTERS: Record<FormResult, string> = {
  W: 'В',
  D: 'Н',
  L: 'П',
};

/** Name of the competition, shown above the table title and on the shared image. */
export const LEAGUE_NAME = 'Чемпіонат Черкаського району';

/** Positions highlighted with a medal. */
export const PODIUM_PLACES = 3;
