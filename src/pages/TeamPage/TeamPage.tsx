import { Reveal } from '@/components/Reveal/Reveal';
import { useOurSquad } from '@/features/players/api';
import {
  PlayerGrid,
  PlayerGridSkeleton,
} from '@/features/players/components/PlayerGrid/PlayerGrid';
import { sortPlayers } from '@/features/players/utils';
import styles from './TeamPage.module.css';

export function TeamPage() {
  const { players, isPending, isError, noTeam } = useOurSquad();

  if (isError) return <p>Не вдалося завантажити команду.</p>;
  if (noTeam) return <p>Нашу команду ще не налаштовано.</p>;

  return (
    <>
      <h1 className={styles.title}>Склад</h1>
      {isPending ? (
        <PlayerGridSkeleton count={12} />
      ) : players.length === 0 ? (
        <p className={styles.empty}>Склад ще не заповнено</p>
      ) : (
        <Reveal>
          <PlayerGrid players={sortPlayers(players)} />
        </Reveal>
      )}
    </>
  );
}
