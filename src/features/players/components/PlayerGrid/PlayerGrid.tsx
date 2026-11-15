import type { Player } from '@/api/types';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import { PlayerCard } from '../PlayerCard/PlayerCard';
import styles from './PlayerGrid.module.css';

interface PlayerGridProps {
  players: Player[];
}

export function PlayerGrid({ players }: PlayerGridProps) {
  return (
    <div className={styles.grid}>
      {players.map((player) => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  );
}

/** Placeholder cards while the squad is loading. */
export function PlayerGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.grid} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
}
