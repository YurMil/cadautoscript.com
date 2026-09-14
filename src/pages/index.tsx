import {type ReactNode, useState, useEffect} from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {getSectionCategories, GENERAL_UTILITIES_PATH} from '@site/src/data/utilities';
import SupportSection from '@site/src/components/Support/SupportSection';
import SubscribeForm from '@site/src/components/Newsletter/SubscribeForm';
import {usePauseWhenOffscreen} from '@site/src/hooks/usePauseWhenOffscreen';
import styles from './index.module.css';
import {useI18n} from '@site/src/contexts/I18nContext';
import HeroSection from '@site/src/components/Home/HeroSection';
import UtilityCatalog from '@site/src/components/Home/UtilityCatalog';
import ExtrasSection from '@site/src/components/Home/ExtrasSection';
import DocsSection from '@site/src/components/Home/DocsSection';

const generalCategoryIds = new Set<string>(getSectionCategories('general').map((cat) => cat.id));

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const {t} = useI18n();

  const [heroCollapsed, setHeroCollapsed] = useState(true);
  const [heroReady, setHeroReady] = useState(false);

  const hero = usePauseWhenOffscreen<HTMLElement>();
  const utilSection = usePauseWhenOffscreen<HTMLElement>();
  const docsSection = usePauseWhenOffscreen<HTMLElement>();

  // General-utility categories used to be filters on this page
  // (/?category=productivity); they now have their own page.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('category');
    if (param && generalCategoryIds.has(param)) {
      window.location.replace(GENERAL_UTILITIES_PATH);
    }
  }, []);

  useEffect(() => {
    try {
      const savedHero = localStorage.getItem('hero-collapsed');
      if (savedHero !== null) {
        setHeroCollapsed(savedHero === 'true');
      } else {
        setHeroCollapsed(false);
      }
    } catch {
      setHeroCollapsed(false);
    }
    setHeroReady(true);
  }, []);

  const toggleHero = () => {
    const next = !heroCollapsed;
    setHeroCollapsed(next);
    try {
      localStorage.setItem('hero-collapsed', String(next));
    } catch { /* ignore */ }
  };

  return (
    <Layout
      title={siteConfig.title}
      description={t('home.heroSubtitle')}>
      <main className={styles.main}>
        <HeroSection
          sectionRef={hero.ref}
          paused={hero.paused}
          heroReady={heroReady}
          heroCollapsed={heroCollapsed}
          onToggleHero={toggleHero}
        />

        <UtilityCatalog
          section="engineering"
          eyebrow={t('home.engineeringEyebrow')}
          title={t('home.engineeringTitle')}
          sectionRef={utilSection.ref}
          paused={utilSection.paused}
        />

        <ExtrasSection />

        <DocsSection sectionRef={docsSection.ref} paused={docsSection.paused} />

        <SubscribeForm />
        <SupportSection />
      </main>
    </Layout>
  );
}
