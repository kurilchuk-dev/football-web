import type { StandingRow } from '@/api/types';
import { TeamLogo } from '@/components/TeamLogo/TeamLogo';
import styles from './TeamCell.module.css';

interface TeamCellProps {
  team: StandingRow['team'];
  /** The row is highlighted with the accent color. */
  ours?: boolean;
}

export function TeamCell({ team, ours = false }: TeamCellProps) {
  return (
    <span className={styles.team}>
      <TeamLogo name={team.name} logo={team.logo} ours={ours} />
      <span className={styles.name}>{team.name}</span>
    </span>
  );
}
