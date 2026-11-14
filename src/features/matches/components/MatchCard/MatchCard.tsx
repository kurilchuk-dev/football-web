import type { Match } from '@/api/types';
import { TeamLogo } from '@/components/TeamLogo/TeamLogo';
import { formatMatchDate, formatMatchTime, getWinner, isPlayed } from '../../utils';
import styles from './MatchCard.module.css';

interface MatchCardProps {
  match: Match;
  /** Show the date next to the time (used inside rounds that span several days). */
  showDate?: boolean;
}

/** One match as a dense scoreboard row (livescore style). */
export function MatchCard({ match, showDate = false }: MatchCardProps) {
  const { home_team: home, away_team: away } = match;
  const ours = home.is_our_team || away.is_our_team;
  const played = isPlayed(match);
  const winner = getWinner(match);

  // Once the match is over the loser fades, the winner stays bright.
  const sideClass = (side: 'home' | 'away') =>
    winner === null ? '' : winner === side ? styles.winner : styles.loser;

  return (
    <article
      className={`${styles.row} ${ours ? styles.ours : ''} ${showDate ? styles.withDate : ''}`}
    >
      <div className={styles.when}>
        <div className={styles.whenText}>
          {showDate && <span className={styles.day}>{formatMatchDate(match.played_at)}</span>}
          <span className={played ? styles.time : `${styles.time} ${styles.upcoming}`}>
            {formatMatchTime(match.played_at)}
          </span>
        </div>
      </div>

      <div className={`${styles.team} ${styles.home} ${sideClass('home')}`}>
        <TeamLogo name={home.name} logo={home.logo} />
        <span className={styles.name}>{home.name}</span>
      </div>
      <div className={`${styles.team} ${styles.away} ${sideClass('away')}`}>
        <TeamLogo name={away.name} logo={away.logo} />
        <span className={styles.name}>{away.name}</span>
      </div>

      <div className={played ? styles.scores : `${styles.scores} ${styles.pending}`}>
        <span className={`${styles.score} ${styles.homeScore} ${sideClass('home')}`}>
          {played ? match.home_score : '–'}
        </span>
        <span className={styles.colon}>:</span>
        <span className={`${styles.score} ${styles.awayScore} ${sideClass('away')}`}>
          {played ? match.away_score : '–'}
        </span>
      </div>
    </article>
  );
}
