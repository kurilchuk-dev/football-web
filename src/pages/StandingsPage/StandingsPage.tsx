import { useStandings } from '@/features/standings/api';
import { StandingsBanner } from '@/features/standings/components/StandingsBanner/StandingsBanner';
import { StandingsTable } from '@/features/standings/components/StandingsTable/StandingsTable';
import { getStandingsSummary } from '@/features/standings/utils';

export function StandingsPage() {
  const { data, isLoading, isError } = useStandings();

  if (isLoading) return <p>Завантаження...</p>;
  if (isError || !data) return <p>Не вдалося завантажити таблицю.</p>;

  return (
    <>
      <StandingsBanner summary={getStandingsSummary(data)} />
      <StandingsTable rows={data} />
    </>
  );
}
