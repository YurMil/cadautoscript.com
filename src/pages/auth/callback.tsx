import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import {supabase} from '@site/src/lib/supabaseClient';
import {useI18n} from '@site/src/contexts/I18nContext';
import {consumeReturnTo} from '@site/src/utils/authRedirect';

type Status = 'working' | 'error';

export default function AuthCallbackPage() {
  const {t} = useI18n();
  const [status, setStatus] = useState<Status>('working');
  // Holds either one of our dictionary keys (resolved with t() at render
  // time so it follows the active locale) or a raw provider error string.
  const [message, setMessage] = useState('authCallback.completing');

  useEffect(() => {
    const finishSignIn = async () => {
      try {
        const url = new URL(window.location.href);
        const cleanedHash = url.hash.replace(/^#+/, '');
        const hashParams = new URLSearchParams(cleanedHash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const {error} = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            throw error;
          }
          url.hash = '';
        } else {
          const code = url.searchParams.get('code');
          if (code) {
            const {error} = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              throw error;
            }
          } else {
            const {data: sessionData} = await supabase.auth.getSession();
            if (!sessionData?.session) {
              setStatus('error');
              setMessage('authCallback.missingCode');
              return;
            }
          }
        }

        const returnTo = consumeReturnTo('/');
        window.location.replace(returnTo);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'authCallback.genericError';
        setStatus('error');
        setMessage(message);
      }
    };

    void finishSignIn();
  }, []);

  const displayMessage = message.startsWith('authCallback.') ? t(message) : message;

  return (
    <Layout title={t('authCallback.pageTitle')}>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="site-container margin-vert--lg">
        {status === 'working' ? (
          <>
            <p>{t('authCallback.completing')}</p>
            <p className="margin-top--sm">{t('authCallback.redirect')}</p>
          </>
        ) : (
          <>
            <p style={{color: 'var(--ifm-color-danger)'}}>{displayMessage}</p>
            <p className="margin-top--sm">
              <Link to="/">{t('authCallback.returnHome')}</Link> {t('authCallback.tryAgain')}
            </p>
          </>
        )}
      </main>
    </Layout>
  );
}
