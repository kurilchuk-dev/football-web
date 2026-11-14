import { useState } from 'react';
import type { StandingRow } from '@/api/types';
import styles from './TeamCell.module.css';

interface TeamCellProps {
  team: StandingRow['team'];
  /** The row is highlighted with the accent color. */
  ours?: boolean;
}

export function TeamCell({ team, ours = false }: TeamCellProps) {
  const logo = team.logo;
  // Remember which URL failed, so a changed logo is tried again.
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const showLogo = logo && logo !== failedLogo;

  return (
    <span className={styles.team}>
      {showLogo ? (
        <img
          className={styles.logo}
          src={logo}
          alt=""
          loading="lazy"
          onError={() => setFailedLogo(logo)}
        />
      ) : (
        <span
          className={`${styles.logo} ${styles.fallback} ${ours ? styles.ours : ''}`}
          aria-hidden="true"
        >
          {team.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className={styles.name}>{team.name}</span>
    </span>
  );
}
