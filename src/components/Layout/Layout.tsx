import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useOurTeam } from '@/features/teams/api';
import { useAccentFromLogo } from '@/features/theme/useAccentFromLogo';
import { Header } from '../Header/Header';
import styles from './Layout.module.css';

export function Layout() {
  // The whole site takes its accent color from our team's logo.
  const { data: team, isSuccess } = useOurTeam();
  useAccentFromLogo(isSuccess ? (team?.logo ?? null) : undefined);

  return (
    <>
      <Header />
      <main className={styles.main}>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}
