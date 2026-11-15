import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useOurTeam } from '@/features/teams/api';
import styles from './Header.module.css';
import { HomeIcon, MatchesIcon, StandingsIcon, TeamIcon } from './NavIcons';

const links = [
  { to: '/', label: 'Головна', Icon: HomeIcon },
  { to: '/matches', label: 'Матчі', Icon: MatchesIcon },
  { to: '/standings', label: 'Таблиця', Icon: StandingsIcon },
  { to: '/team', label: 'Команда', Icon: TeamIcon },
];

export function Header() {
  const { data: team } = useOurTeam();
  const name = team?.name ?? 'ФК';
  const logo = team?.logo;
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const showLogo = logo && logo !== failedLogo;
  const initials = name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand} aria-label={name}>
          {showLogo ? (
            <img
              className={styles.logoImage}
              src={logo}
              alt=""
              onError={() => setFailedLogo(logo)}
            />
          ) : (
            <span className={styles.badge}>{initials}</span>
          )}
        </NavLink>

        {/* Top pill menu on desktop, fixed bottom tab bar on phones. */}
        <nav className={styles.nav} aria-label="Основна навігація">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              <Icon className={styles.icon} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
