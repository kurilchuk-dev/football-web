import type { StandingRow } from '@/api/types';
import type { RowChange } from '../../simulation';
import { FormDots } from '../FormDots/FormDots';
import { PlaceBadge } from '../PlaceBadge/PlaceBadge';
import { RankChange } from '../RankChange/RankChange';
import { TeamCell } from '../TeamCell/TeamCell';
import styles from './StandingsTable.module.css';

interface StandingsRowProps {
  row: StandingRow;
  /** Simulation only: places and points gained against the real table. */
  change?: RowChange;
}

export function StandingsRow({ row, change }: StandingsRowProps) {
  const ours = row.team.is_our_team;

  return (
    <tr className={ours ? styles.ours : undefined}>
      <td>
        <PlaceBadge position={row.position} ours={ours} />
        {change && <RankChange value={change.position} ours={ours} />}
      </td>
      <td>
        <TeamCell team={row.team} ours={ours} />
      </td>
      <td>{row.played}</td>
      <td className={styles.full}>{row.won}</td>
      <td className={styles.full}>{row.drawn}</td>
      <td className={styles.full}>{row.lost}</td>
      <td className={styles.compact}>
        {row.goals_for}:{row.goals_against}
      </td>
      <td className={styles.full}>{row.goals_for}</td>
      <td className={styles.full}>{row.goals_against}</td>
      <td className={styles.full}>
        {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
      </td>
      <td className={`${styles.full} ${styles.form}`}>
        <FormDots form={row.form} ours={ours} />
      </td>
      <td className={styles.points}>
        {row.points}
        {change && change.points > 0 && (
          <span className={`${styles.pointsDelta} ${ours ? styles.deltaOurs : ''}`}>
            +{change.points}
          </span>
        )}
      </td>
    </tr>
  );
}
