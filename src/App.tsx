import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { HomePage } from '@/pages/HomePage/HomePage';
import { MatchesPage } from '@/pages/MatchesPage/MatchesPage';
import { StandingsPage } from '@/pages/StandingsPage/StandingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/standings" element={<StandingsPage />} />
      </Route>
    </Routes>
  );
}
