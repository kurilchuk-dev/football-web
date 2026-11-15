import { useOurSquad } from '@/features/players/api';
import {
  PlayerGrid,
  PlayerGridSkeleton,
} from '@/features/players/components/PlayerGrid/PlayerGrid';
import { sortPlayers } from '@/features/players/utils';
import { Section, SectionNote } from '../Section/Section';

/** How many players the home page previews before the "whole team" link. */
const PREVIEW_SIZE = 8;

export function SquadSection() {
  const { players, isPending, isError, noTeam } = useOurSquad();

  return (
    <Section title="Склад команди" to="/team" linkLabel="Уся команда">
      {isError ? (
        <SectionNote>Не вдалося завантажити склад.</SectionNote>
      ) : noTeam ? (
        <SectionNote>Нашу команду ще не налаштовано.</SectionNote>
      ) : isPending ? (
        <PlayerGridSkeleton count={PREVIEW_SIZE} />
      ) : players.length === 0 ? (
        <SectionNote>Склад ще не заповнено.</SectionNote>
      ) : (
        <PlayerGrid players={sortPlayers(players).slice(0, PREVIEW_SIZE)} />
      )}
    </Section>
  );
}
