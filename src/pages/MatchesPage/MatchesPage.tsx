import { useResults, useUpcoming } from '@/features/matches/api';

// Stage 1 skeleton: proves the data flows. The real UI (cards, tabs, filter)
// is added in the next stages.
export function MatchesPage() {
  const results = useResults();
  const upcoming = useUpcoming();

  if (results.isLoading || upcoming.isLoading) return <p>Завантаження...</p>;
  if (results.isError || upcoming.isError || !results.data || !upcoming.data) {
    return <p>Не вдалося завантажити матчі.</p>;
  }

  return (
    <>
      <h1>Матчі</h1>
      <h2>Результати ({results.data.length})</h2>
      <ul>
        {results.data.map((match) => (
          <li key={match.id}>
            {match.home_team.name} {match.home_score}:{match.away_score} {match.away_team.name}
          </li>
        ))}
      </ul>
      <h2>Календар ({upcoming.data.length})</h2>
      <ul>
        {upcoming.data.map((match) => (
          <li key={match.id}>
            {match.home_team.name} — {match.away_team.name} ({match.played_at})
          </li>
        ))}
      </ul>
    </>
  );
}
