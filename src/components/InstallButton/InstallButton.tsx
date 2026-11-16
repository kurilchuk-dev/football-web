import { useState } from 'react';
import { promptInstall, useInstallState } from '@/features/install/installPrompt';
import styles from './InstallButton.module.css';

/**
 * "Install app" button for the header. It appears only when installing is possible: a real
 * install dialog on Android and desktop Chrome/Edge, a short how-to on iPhone and iPad.
 */
export function InstallButton() {
  const state = useInstallState();
  const [help, setHelp] = useState(false);

  if (state === 'none') return null;

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.button}
        onClick={() => (state === 'prompt' ? void promptInstall() : setHelp((open) => !open))}
        aria-label="Встановити застосунок"
        aria-expanded={state === 'ios' ? help : undefined}
        title="Встановити застосунок"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v11m0 0-4-4m4 4 4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
        </svg>
        <span className={styles.label}>Встановити</span>
      </button>

      {state === 'ios' && help && (
        <div className={styles.help} role="dialog" aria-label="Як встановити застосунок">
          <p>
            Натисніть <strong>«Поділитись»</strong> внизу екрана Safari, потім{' '}
            <strong>«На екран “Додому”»</strong>.
          </p>
          <button type="button" className={styles.close} onClick={() => setHelp(false)}>
            Зрозуміло
          </button>
        </div>
      )}
    </div>
  );
}
