import type { Match } from '@/api/types';
import { groupMatchesByDay } from '../../utils';
import { MatchCard } from '../MatchCard/MatchCard';
import styles from './MatchList.module.css';

interface MatchListProps {
  matches: Match[];
  /** Shown when there are no matches. */
  emptyText: string;
}

/** Matches grouped by day, each day under its own heading. */
export function MatchList({ matches, emptyText }: MatchListProps) {
  if (matches.length === 0) return <p className={styles.empty}>{emptyText}</p>;

  return (
    <div className={styles.days}>
      {groupMatchesByDay(matches).map((day) => (
        <section key={day.key} className={styles.day}>
          <h3 className={styles.dayHeading}>
            <span className={styles.dayLabel}>{day.label}</span>
          </h3>
          <div className={styles.list}>
            {day.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
