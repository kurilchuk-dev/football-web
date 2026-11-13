import { useStandings } from '../api/standings.ts';

export function StandingsPage() {
  const { data, isLoading, isError } = useStandings();

  if (isLoading) return <p>Завантаження...</p>;
  if (isError || !data) return <p>Не вдалося завантажити таблицю.</p>;

  return (
    <main>
      <h1>Турнірна таблиця</h1>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Команда</th>
            <th>І</th>
            <th>В</th>
            <th>Н</th>
            <th>П</th>
            <th>ЗМ</th>
            <th>ПМ</th>
            <th>РМ</th>
            <th>О</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.team.id} style={{ fontWeight: row.team.is_our_team ? 700 : 400 }}>
              <td>{row.position}</td>
              <td>{row.team.name}</td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>{row.goals_for}</td>
              <td>{row.goals_against}</td>
              <td>{row.goal_difference}</td>
              <td>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
