import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { HomePage } from '@/pages/HomePage/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage';
import { loadMatchesPage, loadStandingsPage, loadTeamPage } from '@/routes';

// The home page is what most visitors land on, so it stays in the main bundle.
// The other pages are downloaded when they are opened.
const MatchesPage = lazy(loadMatchesPage);
const StandingsPage = lazy(loadStandingsPage);
const TeamPage = lazy(loadTeamPage);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/standings" element={<StandingsPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
