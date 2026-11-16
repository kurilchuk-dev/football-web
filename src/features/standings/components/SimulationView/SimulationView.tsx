import { useMemo, type Dispatch, type SetStateAction } from 'react';
import type { StandingRow } from '@/api/types';
import { useResults, useUpcoming } from '@/features/matches/api';
import { ourSummary, simulate, type ScoreInputs } from '../../simulation';
import { SimulationMatches } from '../SimulationMatches/SimulationMatches';
import { StandingsTable } from '../StandingsTable/StandingsTable';
import styles from './SimulationView.module.css';

interface SimulationViewProps {
  /** The real table: the starting point and what changes are measured against. */
  realRows: StandingRow[];
  inputs: ScoreInputs;
  onInputsChange: Dispatch<SetStateAction<ScoreInputs>>;
}

/**
 * The table at the top recalculated for the scores typed below it. Nothing here is saved or sent:
 * it only shows "what if" for the visitor.
 */
export function SimulationView({ realRows, inputs, onInputsChange }: SimulationViewProps) {
  const upcoming = useUpcoming();
  const results = useResults();

  const simulation = useMemo(
    () =>
      upcoming.data && results.data
        ? simulate(realRows, results.data, upcoming.data, inputs)
        : null,
    [realRows, results.data, upcoming.data, inputs],
  );

  if (upcoming.isError || results.isError) {
    return <p>Не вдалося завантажити матчі для симуляції.</p>;
  }
  if (!simulation || !upcoming.data) return <p>Завантаження матчів…</p>;

  const summary = simulation.counted > 0 ? ourSummary(realRows, simulation) : null;

  return (
    <>
      <p className={styles.notice} role="note">
        <strong>Симуляція:</strong> таблиця за вигаданими результатами. На сайті нічого не
        змінюється.
      </p>
      {summary && (
        <p className={styles.summary} role="status">
          {summary.name}: <strong>{summary.fromPosition}</strong> →{' '}
          <strong>{summary.toPosition}</strong> місце · очки <strong>{summary.fromPoints}</strong> →{' '}
          <strong>{summary.toPoints}</strong>
        </p>
      )}

      <StandingsTable rows={simulation.rows} changes={simulation.changes} />

      <SimulationMatches
        matches={upcoming.data}
        inputs={inputs}
        onChange={(matchId, side, value) =>
          onInputsChange((current) => ({
            ...current,
            [matchId]: { ...(current[matchId] ?? { home: '', away: '' }), [side]: value },
          }))
        }
        onClear={() => onInputsChange({})}
      />
    </>
  );
}
