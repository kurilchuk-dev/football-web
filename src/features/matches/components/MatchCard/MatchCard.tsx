import type { Match } from '@/api/types';
import { TeamLogo } from '@/components/TeamLogo/TeamLogo';
import { formatMatchTime, getOurResult, getWinner, isPlayed } from '../../utils';
import type { MatchResult } from '../../utils';
import styles from './MatchCard.module.css';

const RESULT_LETTERS: Record<MatchResult, string> = { W: 'В', D: 'Н', L: 'П' };
const RESULT_LABELS: Record<MatchResult, string> = {
  W: 'Перемога',
  D: 'Нічия',
  L: 'Поразка',
};

interface MatchCardProps {
  match: Match;
}

/** One match as a dense scoreboard row (livescore style). */
export function MatchCard({ match }: MatchCardProps) {
  const { home_team: home, away_team: away } = match;
  const ours = home.is_our_team || away.is_our_team;
  const played = isPlayed(match);
  const result = getOurResult(match);
  const winner = getWinner(match);

  // Once the match is over the loser fades, the winner stays bright.
  const sideClass = (side: 'home' | 'away') =>
    winner === null ? '' : winner === side ? styles.winner : styles.loser;

  return (
    <article className={`${styles.row} ${ours ? styles.ours : ''}`}>
      <div className={styles.when}>
        <span className={played ? styles.time : `${styles.time} ${styles.upcoming}`}>
          {formatMatchTime(match.played_at)}
        </span>
        {result && (
          <span
            className={`${styles.chip} ${styles[result]}`}
            title={RESULT_LABELS[result]}
            role="img"
            aria-label={RESULT_LABELS[result]}
          >
            {RESULT_LETTERS[result]}
          </span>
        )}
      </div>

      <div className={`${styles.team} ${styles.home} ${sideClass('home')}`}>
        <TeamLogo name={home.name} logo={home.logo} ours={ours} />
        <span className={styles.name}>{home.name}</span>
      </div>
      <div className={`${styles.team} ${styles.away} ${sideClass('away')}`}>
        <TeamLogo name={away.name} logo={away.logo} ours={ours} />
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
