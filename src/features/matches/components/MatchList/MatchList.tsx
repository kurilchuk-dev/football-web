import type { Match } from '@/api/types';
import { groupMatches } from '../../utils';
import { MatchCard } from '../MatchCard/MatchCard';
import styles from './MatchList.module.css';

interface MatchListProps {
  matches: Match[];
  /** Shown when there are no matches. */
  emptyText: string;
}

/** Matches grouped by round (or by day when there is no round), each group under a heading. */
export function MatchList({ matches, emptyText }: MatchListProps) {
  if (matches.length === 0) return <p className={styles.empty}>{emptyText}</p>;

  return (
    <div className={styles.days}>
      {groupMatches(matches).map((group) => (
        <section key={group.key} className={styles.group}>
          <h3 className={styles.heading}>
            <span className={styles.label}>{group.label}</span>
            {group.subtitle && <span className={styles.subtitle}>{group.subtitle}</span>}
          </h3>
          <div className={styles.list}>
            {group.matches.map((match) => (
              <MatchCard key={match.id} match={match} showDate={group.showDate} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
