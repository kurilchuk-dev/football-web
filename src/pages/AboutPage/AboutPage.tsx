import { Link } from 'react-router-dom';
import text from '@/components/PageText/PageText.module.css';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SEASON, SITE_NAME, STATIC_META } from '@/seo/pageMeta';

export function AboutPage() {
  usePageMeta(STATIC_META.about);

  return (
    <>
      <h1 className={text.title}>Про команду «{SITE_NAME}»</h1>
      <p className={text.text}>
        «{SITE_NAME}» — футзальна команда з Черкас. У сезоні {SEASON} вона грає в чемпіонаті
        Черкаського району з футзалу.
      </p>
      <p className={text.text}>
        На цьому сайті є <Link to="/matches">календар і результати матчів</Link>,{' '}
        <Link to="/standings">турнірна таблиця чемпіонату</Link> та{' '}
        <Link to="/team">склад команди</Link>.
      </p>

      <h2 className={text.subtitle}>Зв’язатися з нами</h2>
      <p className={text.text}>
        Новини команди та повідомлення —{' '}
        <a href="https://www.instagram.com/ufam_cherkasy/" target="_blank" rel="noopener">
          в Instagram @ufam_cherkasy
        </a>
        .
      </p>
    </>
  );
}
