import { Reveal } from '@/components/Reveal/Reveal';
import { FormCard } from '@/features/home/components/FormCard/FormCard';
import { MiniStandings } from '@/features/home/components/MiniStandings/MiniStandings';
import { NextMatchCard } from '@/features/home/components/NextMatchCard/NextMatchCard';
import { RecentResults } from '@/features/home/components/RecentResults/RecentResults';
import { SeasonCard } from '@/features/home/components/SeasonCard/SeasonCard';
import { usePageMeta } from '@/hooks/usePageMeta';
import styles from './HomePage.module.css';

/**
 * Home: next match + season status + form on top, then our recent results,
 * and the top of the table. Every block loads and renders on its own.
 */
export function HomePage() {
  usePageMeta();
  return (
    <>
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
    </>
  );
}
