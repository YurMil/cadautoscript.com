import React, {useState} from 'react';
import type {Provider} from '@supabase/supabase-js';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {useI18n} from '@site/src/contexts/I18nContext';
import {getAuthRedirectUrl, rememberReturnTo} from '@site/src/utils/authRedirect';
import styles from './LoginModal.module.css';
import {logger} from '../../lib/logger';

const providers: Array<{provider: Provider; labelKey: string; className: string; Icon: () => React.JSX.Element}> = [
  {
    provider: 'github',
    labelKey: 'authModal.github',
    className: styles.github,
    Icon: () => (
      <svg role="img" viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 .3A12 12 0 0 0 0 12.6c0 5.4 3.4 10 8.2 11.6.6.1.8-.3.8-.6v-2c-3.4.7-4.1-1.5-4.1-1.5-.6-1.5-1.4-1.9-1.4-1.9-1.2-.8 0-.8 0-.8 1.3.1 2 1.3 2 1.3 1.1 2 2.8 1.4 3.5 1.1.1-.8.4-1.4.7-1.7-2.7-.3-5.5-1.4-5.5-6a4.6 4.6 0 0 1 1.2-3.2 4.1 4.1 0 0 1 .1-3.1s1-.3 3.2 1.2a10.8 10.8 0 0 1 5.9 0c2.2-1.5 3.2-1.2 3.2-1.2a4.1 4.1 0 0 1 .1 3.1 4.6 4.6 0 0 1 1.2 3.2c0 4.7-2.8 5.7-5.5 6 .5.4.8 1.2.8 2.4v3.5c0 .3.2.7.8.6A12.3 12.3 0 0 0 24 12.6 12 12 0 0 0 12 .3"
        />
      </svg>
    ),
  },
  {
    provider: 'google',
    labelKey: 'authModal.google',
    className: styles.google,
    Icon: () => (
      <svg role="img" viewBox="0 0 533.5 544.3" className={styles.icon} aria-hidden="true">
        <path
          fill="#4285f4"
          d="M533.5 278.4a320.1 320.1 0 0 0-4.7-55.1H272v104.6h146.9a126 126 0 0 1-54.2 82.6v68h87.4c51.3-47.3 81.4-117 81.4-200.1z"
        />
        <path
          fill="#34a853"
          d="M272 544.3c73.6 0 135.4-24.3 180.6-66.1l-87.4-68c-24.3 16.3-55.2 26-93.2 26-71.7 0-132.4-48-154-112.7h-90v70.8a272.2 272.2 0 0 0 244 149.9z"
        />
        <path
          fill="#fbbc04"
          d="M118 323.5A163 163 0 0 1 108.8 272 163 163 0 0 1 118 220.5v-70.8h-90a272 272 0 0 0 0 193.6z"
        />
        <path
          fill="#ea4335"
          d="M272 107.7c40 0 75.8 13.5 104.1 40.1l77.9-77.9C407.4 24.2 345.6 0 272 0a272.2 272.2 0 0 0-244 149.7l90 70.8C139.6 155.7 200.3 107.7 272 107.7z"
        />
      </svg>
    ),
  },
];

export default function LoginModal(): React.JSX.Element | null {
  const {isOpen, closeLoginModal} = useAuthModal();
  const {t} = useI18n();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleSignIn = async (provider: Provider) => {
    setError(null);
    try {
      rememberReturnTo();
      const redirectTo = getAuthRedirectUrl();
      const {error: signInError} = await supabase.auth.signInWithOAuth({
        provider,
        options: {redirectTo},
      });
      if (signInError) {
        throw signInError;
      }
      closeLoginModal();
    } catch (error_) {
      const message =
        error_ instanceof Error ? error_.message : t('authModal.error');
      logger.error('[Supabase Auth] Unable to sign in', message);
      setError(message);
    }
  };

  const onBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeLoginModal();
    }
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onClick={onBackdropClick}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{t('authModal.title')}</h2>
        <p className={styles.description}>{t('authModal.description')}</p>
        <div className={styles.actions}>
          {providers.map(({provider, labelKey, className, Icon}) => (
            <button
              key={provider}
              type="button"
              className={`${styles.providerButton} ${className}`}
              onClick={() => handleSignIn(provider)}
            >
              <Icon />
              {t(labelKey)}
            </button>
          ))}
          <button type="button" className={styles.closeButton} onClick={closeLoginModal}>
            {t('authModal.cancel')}
          </button>
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
