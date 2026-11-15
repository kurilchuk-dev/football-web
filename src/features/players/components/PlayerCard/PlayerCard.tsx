import type { Player } from '@/api/types';
import { POSITION_SHORT } from '../../constants';
import styles from './PlayerCard.module.css';

interface PlayerCardProps {
  player: Player;
}

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <article className={styles.card}>
      <span className={styles.number}>{player.number}</span>
      <span className={styles.position} title={player.position_display}>
        {POSITION_SHORT[player.position]}
      </span>
      <div className={styles.names}>
        <span className={styles.firstName}>{player.first_name}</span>
        <span className={styles.lastName}>{player.last_name}</span>
      </div>
    </article>
  );
}
