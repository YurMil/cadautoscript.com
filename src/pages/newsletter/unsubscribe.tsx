import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useI18n} from '@site/src/contexts/I18nContext';
import {unsubscribeFromNewsletter, type UnsubscribeResult} from '@site/src/shared/newsletter';

/**
 * One-click unsubscribe (issue #119).
 *
 * Runs on load with no confirmation step: an unsubscribe link must work from
 * an email client that carries no session, and asking the user to click twice
 * to stop receiving mail is the wrong side to err on.
 */
function UnsubscribeState(): React.JSX.Element {
  const {t} = useI18n();
  const [result, setResult] = useState<UnsubscribeResult | 'pending'>('pending');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setResult('invalid');
      return;
    }
    void unsubscribeFromNewsletter(token).then(setResult);
  }, []);

  const message: Record<UnsubscribeResult | 'pending', string> = {
    pending: t('newsletter.unsubscribing'),
    unsubscribed: t('newsletter.unsubscribeSuccess'),
    'already-unsubscribed': t('newsletter.alreadyUnsubscribed'),
    invalid: t('newsletter.unsubscribeInvalid'),
    failed: t('newsletter.unsubscribeFailed'),
  };

  return (
    <div style={{maxWidth: 640, margin: '4rem auto', padding: '0 1.5rem'}}>
      <h1>{t('newsletter.unsubscribeTitle')}</h1>
      <p role="status">{message[result]}</p>
      <Link className="button button--primary" to="/">
        {t('newsletter.backHome')}
      </Link>
    </div>
  );
}

export default function NewsletterUnsubscribePage(): React.JSX.Element {
  return (
    <Layout title="Unsubscribe" description="Unsubscribe from the CAD AutoScript newsletter.">
      <main>
        <BrowserOnly>{() => <UnsubscribeState />}</BrowserOnly>
      </main>
    </Layout>
  );
}
