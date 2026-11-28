import text from '@/components/PageText/PageText.module.css';
import { Reveal } from '@/components/Reveal/Reveal';
import { FormCard } from '@/features/home/components/FormCard/FormCard';
import { MiniStandings } from '@/features/home/components/MiniStandings/MiniStandings';
import { NextMatchCard } from '@/features/home/components/NextMatchCard/NextMatchCard';
import { RecentResults } from '@/features/home/components/RecentResults/RecentResults';
import { SeasonCard } from '@/features/home/components/SeasonCard/SeasonCard';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SEASON, SITE_NAME, STATIC_META } from '@/seo/pageMeta';
import styles from './HomePage.module.css';

/**
 * Home: next match + season status + form on top, then our recent results,
 * and the top of the table. Every block loads and renders on its own.
 */
export function HomePage() {
  usePageMeta(STATIC_META.home);
  return (
    <div className={styles.page}>
      <h1 className={text.title}>{SITE_NAME}: футзал у Черкасах</h1>
      <p className={text.lead}>
        Команда «{SITE_NAME}» грає в чемпіонаті Черкаського району з футзалу {SEASON}. Тут
        найближчий матч, результати, турнірна таблиця та склад.
      </p>
      <div className={styles.hero}>
        <Reveal className={styles.cell}>
          <NextMatchCard />
        </Reveal>
        <Reveal className={styles.cell} delay={120}>
          <div className={styles.side}>
            <SeasonCard />
            <FormCard />
          </div>
        </Reveal>
      </div>

      <RecentResults />
      <MiniStandings />
    </div>
  );
}
