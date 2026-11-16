import { useState } from 'react';
import { LOGO_WIDTH, optimizeImage } from '@/api/image';
import styles from './TeamLogo.module.css';

interface TeamLogoProps {
  name: string;
  logo?: string | null;
  /** The surrounding row/card is highlighted with the accent color. */
  ours?: boolean;
}

/**
 * Round team logo. Falls back to the first letter of the name when the team has
 * no logo or the image fails to load. Size comes from the `--logo-size` CSS variable.
 */
export function TeamLogo({ name, logo, ours = false }: TeamLogoProps) {
  // Remember which URL failed, so a changed logo is tried again.
  const [failedLogo, setFailedLogo] = useState<string | null>(null);

  if (logo && logo !== failedLogo) {
    return (
      <img
        className={styles.logo}
        src={optimizeImage(logo, LOGO_WIDTH)}
        alt=""
        loading="lazy"
        onError={() => setFailedLogo(logo)}
      />
    );
  }

  return (
    <span
      className={`${styles.logo} ${styles.fallback} ${ours ? styles.ours : ''}`}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
