import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { HomePage } from '@/pages/HomePage/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage';

// The home page is what most visitors land on, so it stays in the main bundle.
// The other pages are downloaded when they are opened.
const MatchesPage = lazy(() =>
  import('@/pages/MatchesPage/MatchesPage').then((m) => ({ default: m.MatchesPage })),
);
const StandingsPage = lazy(() =>
  import('@/pages/StandingsPage/StandingsPage').then((m) => ({ default: m.StandingsPage })),
);
const TeamPage = lazy(() =>
  import('@/pages/TeamPage/TeamPage').then((m) => ({ default: m.TeamPage })),
);

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
