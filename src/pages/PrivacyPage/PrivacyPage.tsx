import text from '@/components/PageText/PageText.module.css';
import { usePageMeta } from '@/hooks/usePageMeta';
import { STATIC_META } from '@/seo/pageMeta';

export function PrivacyPage() {
  usePageMeta(STATIC_META.privacy);

  return (
    <>
      <h1 className={text.title}>Конфіденційність</h1>
      <p className={text.text}>Реєстрації на сайті немає, особисті дані вводити не потрібно.</p>

      <p className={text.text}>
        Ваш браузер запам’ятовує тему, таблицю й матчі, щоб сайт відкривався швидше.
      </p>
      <p className={text.text}>Є питання? Напишіть нам в Instagram @ufam_cherkasy.</p>
    </>
  );
}
