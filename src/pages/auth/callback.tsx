import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import {supabase} from '@site/src/lib/supabaseClient';
import {consumeReturnTo} from '@site/src/utils/authRedirect';

type Status = 'working' | 'error';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<Status>('working');
  const [message, setMessage] = useState('Finishing sign in…');

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
              setMessage('Missing auth code. Please retry sign in.');
              return;
            }
          }
        }

        const returnTo = consumeReturnTo('/');
        window.location.replace(returnTo);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to finish sign in. Please try again.';
        setStatus('error');
        setMessage(message);
      }
    };

    void finishSignIn();
  }, []);

  return (
    <Layout title="Completing sign in">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="site-container margin-vert--lg">
        {status === 'working' ? (
          <>
            <p>Completing sign in…</p>
            <p className="margin-top--sm">You will be redirected shortly.</p>
          </>
        ) : (
          <>
            <p style={{color: 'var(--ifm-color-danger)'}}>{message}</p>
            <p className="margin-top--sm">
              <Link to="/">Return home</Link> and try again.
            </p>
          </>
        )}
      </main>
    </Layout>
  );
}
