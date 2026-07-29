import React, {useCallback, useState} from 'react';
import {useI18n} from '@site/src/contexts/I18nContext';
import {isValidEmail, subscribeToNewsletter} from '@site/src/shared/newsletter';
import styles from './styles.module.css';

type Status = 'idle' | 'sending' | 'sent' | 'invalid' | 'failed';

/**
 * Double opt-in newsletter signup (issue #119).
 *
 * Consent is explicit and adjacent to the button, not buried in a policy page:
 * the visitor is told what they will receive, that a confirmation email is
 * required, and that the address is used for nothing else — before they submit.
 */
export default function SubscribeForm(): React.JSX.Element {
  const {t, locale} = useI18n();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (status === 'sending') return;

      if (!isValidEmail(email)) {
        setStatus('invalid');
        return;
      }

      setStatus('sending');
      void subscribeToNewsletter(email, locale).then((result) => {
        if (result === 'ok') {
          setStatus('sent');
          setEmail('');
        } else {
          setStatus(result === 'invalid-email' ? 'invalid' : 'failed');
        }
      });
    },
    [email, locale, status],
  );

  // Deliberately the same message for a new address and one already on the
  // list — the form must not answer "is this person subscribed?".
  if (status === 'sent') {
    return (
      <div className={styles.panel} role="status">
        <p className={styles.successTitle}>{t('newsletter.checkInbox')}</p>
        <p className={styles.note}>{t('newsletter.confirmHint')}</p>
      </div>
    );
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <p className={styles.eyebrow}>{t('newsletter.eyebrow')}</p>
      <h2 className={styles.title}>{t('newsletter.title')}</h2>
      <p className={styles.note}>{t('newsletter.description')}</p>

      <div className={styles.row}>
        <label className={styles.srOnly} htmlFor="newsletter-email">
          {t('newsletter.emailLabel')}
        </label>
        <input
          id="newsletter-email"
          type="email"
          className={styles.input}
          value={email}
          maxLength={254}
          autoComplete="email"
          placeholder={t('newsletter.placeholder')}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === 'invalid' || status === 'failed') setStatus('idle');
          }}
          aria-invalid={status === 'invalid'}
          required
        />
        <button type="submit" className="button primary" disabled={status === 'sending'}>
          {status === 'sending' ? t('newsletter.sending') : t('newsletter.subscribe')}
        </button>
      </div>

      {status === 'invalid' ? (
        <p className={styles.error} role="alert">
          {t('newsletter.invalidEmail')}
        </p>
      ) : null}
      {status === 'failed' ? (
        <p className={styles.error} role="alert">
          {t('newsletter.failed')}
        </p>
      ) : null}

      <p className={styles.consent}>{t('newsletter.consent')}</p>
    </form>
  );
}
