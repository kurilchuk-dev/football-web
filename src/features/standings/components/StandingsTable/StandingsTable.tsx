import type { StandingRow } from '@/api/types';
import type { RowChange } from '../../simulation';
import { StandingsRow } from './StandingsRow';
import styles from './StandingsTable.module.css';

interface StandingsTableProps {
  rows: StandingRow[];
  /** Simulation only: how each team moved against the real table (by team id). */
  changes?: Map<number, RowChange>;
}

export function StandingsTable({ rows, changes }: StandingsTableProps) {
  return (
    <div className={styles.card}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Команда</th>
            <th>І</th>
            <th className={styles.full}>В</th>
            <th className={styles.full}>Н</th>
            <th className={styles.full}>П</th>
            <th className={styles.compact}>М</th>
            <th className={styles.full}>ЗМ</th>
            <th className={styles.full}>ПМ</th>
            <th className={styles.full}>РМ</th>
            <th className={`${styles.full} ${styles.form}`}>Форма</th>
            <th>О</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <StandingsRow key={row.team.id} row={row} change={changes?.get(row.team.id)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
