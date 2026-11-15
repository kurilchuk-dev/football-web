import { Reveal } from '@/components/Reveal/Reveal';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import { useOurSquad } from '@/features/players/api';
import {
  PlayerGrid,
  PlayerGridSkeleton,
} from '@/features/players/components/PlayerGrid/PlayerGrid';
import { sortPlayers } from '@/features/players/utils';
import { TeamBanner } from '@/features/teams/components/TeamBanner/TeamBanner';
import styles from './TeamPage.module.css';

export function TeamPage() {
  const { team, players, isPending, isError, noTeam } = useOurSquad();

  if (isError) return <p>Не вдалося завантажити команду.</p>;
  if (noTeam) return <p>Нашу команду ще не налаштовано.</p>;
  if (isPending || !team) {
    return (
      <>
        <Skeleton className={styles.bannerSkeleton} />
        <PlayerGridSkeleton count={12} />
      </>
    );
  }

  return (
    <>
      <TeamBanner team={team} playersCount={players.length} />
      <Reveal>
        <h2 className={styles.heading}>Склад</h2>
        {players.length === 0 ? (
          <p className={styles.empty}>Склад ще не заповнено</p>
        ) : (
          <PlayerGrid players={sortPlayers(players)} />
        )}
      </Reveal>
    </>
  );
}
