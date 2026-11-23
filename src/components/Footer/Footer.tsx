import styles from './Footer.module.css';

const CONTACTS = [
  { handle: 'ufam_cherkasy', label: 'Сторінка команди' },
  { handle: '_kurilchuk_maks_', label: 'Автор сайту' },
] as const;

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer} aria-labelledby="footer-title">
      <div className={styles.intro}>
        <h2 id="footer-title" className={styles.title}>
          Є ідеї чи що додати?
        </h2>
        <p className={styles.text}>
          Помітили неточність або хочете доповнити інформацію про команду — напишіть нам в
          Instagram.
        </p>
      </div>
      <ul className={styles.list}>
        {CONTACTS.map(({ handle, label }) => (
          <li key={handle}>
            <a
              className={styles.link}
              href={`https://www.instagram.com/${handle}/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.icon}>
                <InstagramIcon />
              </span>
              <span className={styles.body}>
                <span className={styles.label}>{label}</span>
                <span className={styles.handle}>@{handle}</span>
              </span>
              <span className={styles.arrow}>
                <ArrowIcon />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
