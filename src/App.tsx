import { Route, Routes } from 'react-router-dom';
import { StandingsPage } from './pages/StandingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/standings" element={<StandingsPage />} />
    </Routes>
  );
}
