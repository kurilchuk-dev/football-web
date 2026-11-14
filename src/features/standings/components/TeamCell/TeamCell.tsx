import type { StandingRow } from '@/api/types';
import styles from './TeamCell.module.css';

interface TeamCellProps {
  team: StandingRow['team'];
  /** The row is highlighted with the accent color. */
  ours?: boolean;
}

export function TeamCell({ team, ours = false }: TeamCellProps) {
  return (
    <span className={styles.team}>
      {team.logo ? (
        <img className={styles.logo} src={team.logo} alt="" loading="lazy" />
      ) : (
        <span
          className={`${styles.logo} ${styles.fallback} ${ours ? styles.ours : ''}`}
          aria-hidden="true"
        >
          {team.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className={styles.name}>{team.name}</span>
    </span>
  );
}
