import { Skeleton } from '@/components/Skeleton/Skeleton';
import { useStandings } from '@/features/standings/api';
import { StandingsTable } from '@/features/standings/components/StandingsTable/StandingsTable';
import { getMiniStandings } from '../../utils';
import { Section, SectionNote } from '../Section/Section';
import styles from './MiniStandings.module.css';

/** Top five of the table; our row is appended if we are lower. */
export function MiniStandings() {
  const { data, isPending, isError } = useStandings();

  return (
    <Section title="Турнірна таблиця" to="/standings" linkLabel="Уся таблиця">
      {isPending ? (
        <Skeleton className={styles.skeleton} />
      ) : isError ? (
        <SectionNote>Не вдалося завантажити таблицю.</SectionNote>
      ) : (
        <StandingsTable rows={getMiniStandings(data)} />
      )}
    </Section>
  );
}
