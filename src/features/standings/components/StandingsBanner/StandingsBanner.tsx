import { LEAGUE_NAME } from '../../constants';
import type { StandingsSummary } from '../../utils';
import styles from './StandingsBanner.module.css';

interface StandingsBannerProps {
  summary: StandingsSummary;
}

export function StandingsBanner({ summary }: StandingsBannerProps) {
  const stats = [
    { label: 'команд', value: summary.teams },
    { label: 'матчів', value: summary.matches },
    { label: 'голів', value: summary.goals },
  ];

  return (
    <header className={styles.banner}>
      <div>
        <p className={styles.eyebrow}>{LEAGUE_NAME}</p>
        <h1 className={styles.title}>Турнірна таблиця</h1>
      </div>
      <dl className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <dt className={styles.statLabel}>{stat.label}</dt>
            <dd className={styles.statValue}>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
