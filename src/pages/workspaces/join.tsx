import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import {useI18n} from '@site/src/contexts/I18nContext';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {acceptInvite, INVITE_PARAM} from '@site/src/shared/workspaces';
import {logger} from '@site/src/lib/logger';

type JoinState = 'ready' | 'joining' | 'joined' | 'invalid';

/**
 * Landing page for workspace invite links (issue #122). Joining is an explicit
 * click, never automatic on page load, so opening a link cannot add someone
 * to a workspace without their consent. Sign-in returns here with the code
 * intact (the login modal remembers the current URL).
 */
export default function JoinWorkspace(): React.JSX.Element {
  const {t} = useI18n();
  const {isAuthenticated, authChecked} = useAuthStatus();
  const {openLoginModal} = useAuthModal();
  const [code, setCode] = useState<string | null>(null);
  const [state, setState] = useState<JoinState>('ready');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    setCode(new URLSearchParams(window.location.search).get(INVITE_PARAM));
  }, []);

  const join = () => {
    if (!code) return;
    setState('joining');
    void acceptInvite(code)
      .then((id) => {
        setWorkspaceId(id);
        setState('joined');
      })
      .catch((err) => {
        setState('invalid');
        logger.warn('[Workspaces] Unable to accept invite', err instanceof Error ? err.message : String(err));
      });
  };

  const workspacesHref = workspaceId ? `/profile/?workspace=${workspaceId}#workspaces` : '/profile/#workspaces';

  let body: React.ReactNode;
  if (code === null) {
    body = <p>{t('workspaces.joinMissingCode')}</p>;
  } else if (!authChecked) {
    body = null;
  } else if (!isAuthenticated) {
    body = (
      <>
        <p>{t('workspaces.joinSignIn')}</p>
        <button type="button" className="button button--primary" onClick={openLoginModal}>
          {t('auth.signIn')}
        </button>
      </>
    );
  } else if (state === 'joined') {
    body = (
      <>
        <p>{t('workspaces.joinSuccess')}</p>
        <Link className="button button--primary" to={workspacesHref}>
          {t('workspaces.joinOpenWorkspaces')}
        </Link>
      </>
    );
  } else if (state === 'invalid') {
    body = <p role="alert">{t('workspaces.joinInvalid')}</p>;
  } else {
    body = (
      <button type="button" className="button button--primary" onClick={join} disabled={state === 'joining'}>
        {state === 'joining' ? t('workspaces.joining') : t('workspaces.joinAccept')}
      </button>
    );
  }

  return (
    <Layout title={t('workspaces.joinTitle')}>
      <Head>
        <meta name="robots" content="noindex" />
        {/* Keep the invite code out of Referer headers sent to other sites. */}
        <meta name="referrer" content="no-referrer" />
      </Head>
      <main className="container margin-vert--xl" style={{maxWidth: 640}}>
        <h1>{t('workspaces.joinTitle')}</h1>
        {body}
      </main>
    </Layout>
  );
}
