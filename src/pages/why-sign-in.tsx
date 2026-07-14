import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {useI18n} from '@site/src/contexts/I18nContext';
import styles from './why-sign-in.module.css';

export default function WhySignInPage(): React.JSX.Element {
  const {t} = useI18n();
  const {openLoginModal} = useAuthModal();
  const {isAuthenticated} = useAuthStatus();

  const benefits = [
    t('whySignIn.benefit1'),
    t('whySignIn.benefit2'),
    t('whySignIn.benefit3'),
    t('whySignIn.benefit4'),
  ];

  return (
    <Layout title={t('whySignIn.title')} description={t('whySignIn.intro')}>
      <main className={styles.main}>
        <h1>{t('whySignIn.title')}</h1>
        <p className={styles.intro}>{t('whySignIn.intro')}</p>

        <ul className={styles.benefits}>
          {benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>

        <h2>{t('whySignIn.freeTitle')}</h2>
        <p>{t('whySignIn.freeCopy')}</p>

        <h2>{t('whySignIn.dataTitle')}</h2>
        <p>{t('whySignIn.dataCopy')}</p>

        <div className={styles.actions}>
          {isAuthenticated ? (
            <Link className="button button--primary" to="/">
              {t('home.viewAll')}
            </Link>
          ) : (
            <button type="button" className="button button--primary" onClick={openLoginModal}>
              {t('whySignIn.cta')}
            </button>
          )}
        </div>
      </main>
    </Layout>
  );
}
