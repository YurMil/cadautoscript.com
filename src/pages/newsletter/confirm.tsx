import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useI18n} from '@site/src/contexts/I18nContext';
import {confirmSubscription, type ConfirmResult} from '@site/src/shared/newsletter';

/**
 * Landing page for the confirmation link in the double opt-in email
 * (issue #119). The token in the URL is the authorisation — it only ever
 * reached the mailbox that was signed up.
 */
function ConfirmState(): React.JSX.Element {
  const {t} = useI18n();
  const [result, setResult] = useState<ConfirmResult | 'pending'>('pending');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setResult('invalid');
      return;
    }
    void confirmSubscription(token).then(setResult);
  }, []);

  const message: Record<ConfirmResult | 'pending', string> = {
    pending: t('newsletter.confirming'),
    confirmed: t('newsletter.confirmSuccess'),
    'already-confirmed': t('newsletter.alreadyConfirmed'),
    invalid: t('newsletter.confirmInvalid'),
    failed: t('newsletter.confirmFailed'),
  };

  return (
    <div style={{maxWidth: 640, margin: '4rem auto', padding: '0 1.5rem'}}>
      <h1>{t('newsletter.title')}</h1>
      <p role="status">{message[result]}</p>
      <Link className="button button--primary" to="/">
        {t('newsletter.backHome')}
      </Link>
    </div>
  );
}

export default function NewsletterConfirmPage(): React.JSX.Element {
  return (
    <Layout title="Confirm subscription" description="Confirm your CAD AutoScript newsletter subscription.">
      <main>
        <BrowserOnly>{() => <ConfirmState />}</BrowserOnly>
      </main>
    </Layout>
  );
}
