import { Link } from 'react-router-dom';
import type { Team } from '@/api/types';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import { TeamLogo } from '@/components/TeamLogo/TeamLogo';
import { useUpcoming } from '@/features/matches/api';
import { formatDayHeading, formatMatchTime } from '@/features/matches/utils';
import { getNextMatch } from '../../utils';
import { Countdown } from '../Countdown/Countdown';
import styles from './NextMatchCard.module.css';

function Side({ team }: { team: Team }) {
  return (
    <div className={`${styles.team} ${team.is_our_team ? styles.ours : ''}`}>
      <TeamLogo name={team.name} logo={team.logo} ours={team.is_our_team} />
      <span className={styles.name}>{team.name}</span>
    </div>
  );
}

/** Hero card: who we play next, when, and a live countdown. */
export function NextMatchCard() {
  const { data, isPending, isError } = useUpcoming();

  if (isPending) return <Skeleton className={styles.skeleton} />;
  if (isError) {
    return (
      <div className={styles.card}>
        <p className={styles.message}>Не вдалося завантажити найближчий матч.</p>
      </div>
    );
  }

  const match = getNextMatch(data);
  if (!match) {
    return (
      <div className={styles.card}>
        <p className={styles.eyebrow}>Наступний матч</p>
        <p className={styles.message}>Найближчих матчів поки немає</p>
      </div>
    );
  }

  const hasRound = match.round !== null && match.round !== undefined;

  return (
    <article className={styles.card}>
      {hasRound && (
        <span className={styles.bigRound} aria-hidden="true">
          {match.round}
        </span>
      )}

      <p className={styles.eyebrow}>Наступний матч{hasRound ? ` · Тур ${match.round}` : ''}</p>

      <div className={styles.teams}>
        <Side team={match.home_team} />
        <span className={styles.vs}>VS</span>
        <Side team={match.away_team} />
      </div>

      <p className={styles.when}>
        <span className={styles.day}>{formatDayHeading(match.played_at)}</span>
        <span className={styles.time}>{formatMatchTime(match.played_at)}</span>
      </p>

      <Countdown target={match.played_at} />

      <Link to="/matches?tab=calendar" className={styles.link}>
        Весь календар →
      </Link>
    </article>
  );
}
