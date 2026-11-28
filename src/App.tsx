import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { HomePage } from '@/pages/HomePage/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage';
import {
  aboutPage,
  matchesPage,
  matchPage,
  opponentPage,
  privacyPage,
  standingsPage,
  teamPage,
} from '@/routes';

// The home page is what most visitors land on, so it stays in the main bundle.
// The other pages are downloaded when they are opened.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/matches" element={<matchesPage.Page />} />
        <Route path="/standings" element={<standingsPage.Page />} />
        <Route path="/team" element={<teamPage.Page />} />
        <Route path="/matches/:slug" element={<matchPage.Page />} />
        <Route path="/teams/:slug" element={<opponentPage.Page />} />
        <Route path="/about" element={<aboutPage.Page />} />
        <Route path="/privacy" element={<privacyPage.Page />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
