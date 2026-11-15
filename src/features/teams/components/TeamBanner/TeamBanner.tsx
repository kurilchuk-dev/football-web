import type { Team } from '@/api/types';
import { TeamLogo } from '@/components/TeamLogo/TeamLogo';
import styles from './TeamBanner.module.css';

interface TeamBannerProps {
  team: Team;
  playersCount: number;
}

/** Club header: logo, name, and chips with the city and the size of the squad. */
export function TeamBanner({ team, playersCount }: TeamBannerProps) {
  return (
    <header className={styles.banner}>
      <div className={styles.logo}>
        <TeamLogo name={team.name} logo={team.logo} ours />
      </div>
      <div className={styles.text}>
        <p className={styles.eyebrow}>Чемпіонат Черкаського району</p>
        <h1 className={styles.title}>{team.name}</h1>
        <ul className={styles.meta}>
          {team.city && <li className={styles.chip}>{team.city}</li>}
          <li className={`${styles.chip} ${styles.count}`}>
            <strong>{playersCount}</strong> гравців
          </li>
        </ul>
      </div>
    </header>
  );
}
