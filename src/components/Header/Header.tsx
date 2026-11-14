import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useOurTeam } from '@/features/teams/api';
import styles from './Header.module.css';

const links = [
  { to: '/', label: 'Головна' },
  { to: '/matches', label: 'Матчі' },
  { to: '/standings', label: 'Таблиця' },
  { to: '/team', label: 'Команда' },
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
      <NavLink to="/" className={styles.logo}>
        {showLogo ? (
          <img className={styles.logoImage} src={logo} alt="" onError={() => setFailedLogo(logo)} />
        ) : (
          <span className={styles.badge}>{initials}</span>
        )}
        {name}
      </NavLink>
      <nav className={styles.nav}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
