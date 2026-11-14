import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { MatchesPage } from '@/pages/MatchesPage/MatchesPage';
import { StandingsPage } from '@/pages/StandingsPage/StandingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/standings" element={<StandingsPage />} />
      </Route>
    </Routes>
  );
}
