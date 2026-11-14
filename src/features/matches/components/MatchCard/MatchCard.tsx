import type { Match } from '@/api/types';
import { TeamLogo } from '@/components/TeamLogo/TeamLogo';
import { formatMatchTime, isPlayed } from '../../utils';
import styles from './MatchCard.module.css';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const { home_team: home, away_team: away } = match;
  const ours = home.is_our_team || away.is_our_team;

  return (
    <article className={`${styles.card} ${ours ? styles.ours : ''}`}>
      <div className={`${styles.team} ${styles.home}`}>
        <TeamLogo name={home.name} logo={home.logo} />
        <span className={styles.name}>{home.name}</span>
      </div>

      <div className={styles.center}>
        {isPlayed(match) ? (
          <>
            <span className={styles.score}>
              {match.home_score}:{match.away_score}
            </span>
            <span className={styles.date}>{formatMatchTime(match.played_at)}</span>
          </>
        ) : (
          <span className={styles.time}>{formatMatchTime(match.played_at)}</span>
        )}
      </div>

      <div className={`${styles.team} ${styles.away}`}>
        <TeamLogo name={away.name} logo={away.logo} />
        <span className={styles.name}>{away.name}</span>
      </div>
    </article>
  );
}
