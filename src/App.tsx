import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { StandingsPage } from '@/pages/StandingsPage/StandingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/standings" element={<StandingsPage />} />
      </Route>
    </Routes>
  );
}
