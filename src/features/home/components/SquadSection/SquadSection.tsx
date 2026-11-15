import { useState } from 'react';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import { PlayerCard } from '@/features/players/components/PlayerCard/PlayerCard';
import { usePlayers } from '@/features/players/api';
import { POSITION_LABELS, POSITION_ORDER, type Position } from '@/features/players/constants';
import { countByPosition, sortPlayers } from '@/features/players/utils';
import { useOurTeam } from '@/features/teams/api';
import { Section, SectionNote } from '../Section/Section';
import styles from './SquadSection.module.css';

type Filter = Position | 'all';

/** Our squad as player cards with a filter by position. */
export function SquadSection() {
  const team = useOurTeam();
  const players = usePlayers(team.data?.id);
  const [filter, setFilter] = useState<Filter>('all');

  return (
    <Section title="Склад команди">
      {team.isError || players.isError ? (
        <SectionNote>Не вдалося завантажити склад.</SectionNote>
      ) : team.isSuccess && !team.data ? (
        <SectionNote>Нашу команду ще не налаштовано.</SectionNote>
      ) : players.isPending ? (
        <div className={styles.grid} aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : players.data.length === 0 ? (
        <SectionNote>Склад ще не заповнено.</SectionNote>
      ) : (
        <Squad players={players.data} filter={filter} onFilter={setFilter} />
      )}
    </Section>
  );
}

interface SquadProps {
  players: NonNullable<ReturnType<typeof usePlayers>['data']>;
  filter: Filter;
  onFilter: (filter: Filter) => void;
}

function Squad({ players, filter, onFilter }: SquadProps) {
  const counts = countByPosition(players);
  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Усі', count: players.length },
    ...POSITION_ORDER.filter((position) => counts[position] > 0).map((position) => ({
      id: position,
      label: POSITION_LABELS[position],
      count: counts[position],
    })),
  ];
  // The filter may point at a position that no longer exists after a refetch.
  const active = tabs.some((tab) => tab.id === filter) ? filter : 'all';
  const visible = sortPlayers(players).filter(
    (player) => active === 'all' || player.position === active,
  );

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Позиція">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === active}
            className={tab.id === active ? `${styles.tab} ${styles.active}` : styles.tab}
            onClick={() => onFilter(tab.id)}
          >
            {tab.label}
            <span className={styles.count}>{tab.count}</span>
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {visible.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </>
  );
}
