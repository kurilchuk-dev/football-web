import { useStandings } from '@/features/standings/api';
import { StandingsBanner } from '@/features/standings/components/StandingsBanner/StandingsBanner';
import { StandingsImageActions } from '@/features/standings/components/StandingsImageActions/StandingsImageActions';
import { StandingsTable } from '@/features/standings/components/StandingsTable/StandingsTable';
import { getStandingsSummary } from '@/features/standings/utils';
import { usePageMeta } from '@/hooks/usePageMeta';

export function StandingsPage() {
  usePageMeta({
    title: 'Турнірна таблиця',
    description: 'Турнірна таблиця: місця, очки, різниця м’ячів і форма команд.',
  });
  const { data, isLoading, isError } = useStandings();

  if (isLoading) return <p>Завантаження...</p>;
  if (isError || !data) return <p>Не вдалося завантажити таблицю.</p>;

  return (
    <>
      <StandingsBanner summary={getStandingsSummary(data)} />
      <StandingsImageActions rows={data} />
      <StandingsTable rows={data} />
    </>
  );
}
