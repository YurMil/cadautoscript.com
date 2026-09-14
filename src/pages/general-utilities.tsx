import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {useI18n} from '@site/src/contexts/I18nContext';
import UtilityCatalog from '@site/src/components/Home/UtilityCatalog';
import styles from './index.module.css';

export default function GeneralUtilities(): ReactNode {
  const {t} = useI18n();

  return (
    <Layout title={t('generalUtilitiesPage.title')} description={t('generalUtilitiesPage.lead')}>
      <main className={styles.main}>
        <header>
          <p className={styles.eyebrow}>{t('generalUtilitiesPage.eyebrow')}</p>
          <h1>{t('generalUtilitiesPage.title')}</h1>
          <p className={styles.extrasLead}>{t('generalUtilitiesPage.lead')}</p>
          <div className={styles.heroActions}>
            <Link className="button button--secondary" to="/">
              {t('generalUtilitiesPage.backToEngineering')}
            </Link>
          </div>
        </header>

        <UtilityCatalog
          section="general"
          eyebrow={t('generalUtilitiesPage.sectionEyebrow')}
          title={t('generalUtilitiesPage.sectionTitle')}
        />
      </main>
    </Layout>
  );
}
