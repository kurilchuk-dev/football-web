import type { Player } from '@/api/types';
import { getInitials } from '../../utils';
import styles from './PlayerCard.module.css';

interface PlayerCardProps {
  player: Player;
}

/** Shirt number, or the player's initials while the number is not assigned. */
export function PlayerCard({ player }: PlayerCardProps) {
  const hasNumber = player.number !== null && player.number !== undefined;

  return (
    <article className={styles.card}>
      <span className={hasNumber ? styles.number : `${styles.number} ${styles.initials}`}>
        {hasNumber ? player.number : getInitials(player)}
      </span>
      <div className={styles.names}>
        <span className={styles.firstName}>{player.first_name}</span>
        <span className={styles.lastName}>{player.last_name}</span>
      </div>
    </article>
  );
}
