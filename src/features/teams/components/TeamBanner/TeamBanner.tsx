import type { Team } from '@/api/types';
import { TeamLogo } from '@/components/TeamLogo/TeamLogo';
import styles from './TeamBanner.module.css';

interface TeamBannerProps {
  team: Team;
  playersCount: number;
}

/** Club header: big logo, name, city and the size of the squad. */
export function TeamBanner({ team, playersCount }: TeamBannerProps) {
  return (
    <header className={styles.banner}>
      <div className={styles.logo}>
        <TeamLogo name={team.name} logo={team.logo} ours />
      </div>
      <div className={styles.text}>
        <p className={styles.eyebrow}>Чемпіонат Черкаського району</p>
        <h1 className={styles.title}>{team.name}</h1>
        {team.city && <p className={styles.city}>{team.city}</p>}
      </div>
      <dl className={styles.stat}>
        <dd className={styles.value}>{playersCount}</dd>
        <dt className={styles.label}>гравців</dt>
      </dl>
    </header>
  );
}
