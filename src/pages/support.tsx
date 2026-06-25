import React, {useState} from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {PAYPAL_LINK, STRIPE_CHECKOUT_API} from '@site/src/constants/support';
import {useI18n} from '@site/src/contexts/I18nContext';
import styles from './support.module.css';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          size: 'invisible';
          callback: (token: string) => void;
          'error-callback': () => void;
        },
      ) => string;
      execute: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function PayPalIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M19.5 6.5C19.5 9.5 17.5 12 14 12H11.5L10.5 17.5H7.5L9.5 6.5H14C17 6.5 19.5 6.5 19.5 6.5Z" fill="#003087"/>
      <path d="M20.5 4C20.5 7 18.5 9.5 15 9.5H12.5L11.5 15H8.5L10.5 4H15C18 4 20.5 4 20.5 4Z" fill="#009cde"/>
      <path d="M7.5 17.5L9.5 6.5H14C17 6.5 19.5 9.5 19.5 6.5C19.5 9.5 17.5 12 14 12H11.5L10.5 17.5H7.5Z" fill="#012169"/>
    </svg>
  );
}

function StripeIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#635BFF"/>
      <path
        d="M11.2 9.2C11.2 8.6 11.7 8.3 12.5 8.3C13.7 8.3 15.2 8.7 16.3 9.3V6.7C15.1 6.2 13.9 6 12.5 6C9.9 6 8.1 7.3 8.1 9.4C8.1 12.8 12.7 12.3 12.7 13.8C12.7 14.5 12.1 14.8 11.2 14.8C9.9 14.8 8.3 14.3 7.1 13.6V16.2C8.4 16.8 9.8 17 11.2 17C13.9 17 15.8 15.7 15.8 13.7C15.8 10 11.2 10.6 11.2 9.2Z"
        fill="white"
      />
    </svg>
  );
}

type PaymentMethod = 'paypal' | 'stripe';

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  sublabelKey: string;
  icon: React.JSX.Element;
  accentColor: string;
  borderColor: string;
  hoverBg: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'paypal',
    label: 'PayPal',
    sublabelKey: 'support.paypalSub',
    icon: <PayPalIcon />,
    accentColor: '#009cde',
    borderColor: 'rgba(0, 156, 222, 0.35)',
    hoverBg: 'rgba(0, 60, 140, 0.12)',
  },
  {
    id: 'stripe',
    label: 'Stripe',
    sublabelKey: 'support.stripeSub',
    icon: <StripeIcon />,
    accentColor: '#635BFF',
    borderColor: 'rgba(99, 91, 255, 0.35)',
    hoverBg: 'rgba(40, 30, 120, 0.12)',
  },
];

export default function SupportPage(): React.JSX.Element {
  const {t} = useI18n();
  const {siteConfig} = useDocusaurusContext();
  const {TURNSTILE_SITE_KEY} = siteConfig.customFields as {
    TURNSTILE_SITE_KEY?: string;
  };
  const [floatingBtnPos, setFloatingBtnPos] = useState<{x: number; y: number} | null>(null);
  const [hovered, setHovered] = useState<PaymentMethod | null>(null);
  const [stripeStatus, setStripeStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const handleHeartClick = (e: React.MouseEvent<SVGGElement>) => {
    setFloatingBtnPos({x: e.clientX, y: e.clientY});
  };

  const loadTurnstile = () => new Promise<void>((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), {once: true});
      existingScript.addEventListener('error', () => reject(new Error('Turnstile failed to load')), {once: true});
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(script);
  });

  const getTurnstileToken = async (): Promise<string> => {
    if (!TURNSTILE_SITE_KEY) {
      throw new Error('Turnstile site key is not configured');
    }

    await loadTurnstile();

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    return new Promise((resolve, reject) => {
      const widgetId = window.turnstile?.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        size: 'invisible',
        callback: (token) => {
          window.turnstile?.remove(widgetId);
          container.remove();
          resolve(token);
        },
        'error-callback': () => {
          window.turnstile?.remove(widgetId);
          container.remove();
          reject(new Error('Turnstile verification failed'));
        },
      });

      if (!widgetId) {
        container.remove();
        reject(new Error('Turnstile is not available'));
        return;
      }

      window.turnstile?.execute(widgetId);
    });
  };

  const startStripeCheckout = async () => {
    if (stripeStatus === 'loading') {
      return;
    }

    setStripeStatus('loading');

    try {
      const turnstileToken = await getTurnstileToken();
      const response = await fetch(STRIPE_CHECKOUT_API, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-cadautoscript-payment': 'support-page',
        },
        body: JSON.stringify({turnstileToken}),
      });

      if (response.status === 429) {
        throw new Error('Too many checkout attempts. Please wait a minute and try again.');
      }

      if (!response.ok) {
        throw new Error('Stripe checkout could not be started.');
      }

      const {url} = await response.json() as {url?: string};
      if (!url) {
        throw new Error('Stripe checkout URL is missing.');
      }

      window.location.assign(url);
    } catch (error) {
      console.error(error);
      setStripeStatus('error');
    }
  };

  return (
    <Layout title={t('support.buttonLabel')} description={t('support.description')}>
      <main className={styles.main}>
        <section className={styles.card} onMouseLeave={() => setFloatingBtnPos(null)}>
          <svg className={styles.bgSvg} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="sgm" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0L0 0 0 20" fill="none" stroke="var(--sv-grid-minor)" strokeWidth="0.6"/>
              </pattern>
              <pattern id="sgM" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#sgm)"/>
                <path d="M100 0L0 0 0 100" fill="none" stroke="var(--sv-grid-major)" strokeWidth="1.1"/>
              </pattern>
              <radialGradient id="scenter" cx="60%" cy="50%" r="65%">
                <stop offset="0%" stopColor="transparent"/>
                <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.85"/>
              </radialGradient>
            </defs>

            <rect width="100%" height="100%" fill="url(#sgM)"/>
            <rect width="100%" height="100%" fill="url(#scenter)"/>

            <svg x="70%" y="50%" overflow="visible">
              <path className={styles.march} d="M -400 -30 L -80 -30 L -30 0" fill="none" stroke="var(--sv-accent)" strokeWidth="1" strokeDasharray="4 4" opacity="0.4"/>
              <path className={styles.march} d="M -300 40 L -60 40 L -20 10 L -10 10" fill="none" stroke="var(--sv-support)" strokeWidth="1.2" strokeDasharray="6 6" opacity="0.5"/>
              <path className={styles.march} d="M 200 -20 L 50 -20 L 20 -5" fill="none" stroke="var(--sv-orange)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
              <path className={styles.march} d="M 150 30 L 40 30 L 10 10" fill="none" stroke="var(--sv-accent)" strokeWidth="1" strokeDasharray="5 5" opacity="0.3"/>

              <circle cx="0" cy="0" r="35" fill="none" stroke="var(--sv-border)" strokeWidth="1" strokeDasharray="4 2" opacity="0.5"/>
              <circle cx="0" cy="0" r="25" fill="none" stroke="var(--sv-border)" strokeWidth="0.5" opacity="0.3"/>

              <circle cx="0" cy="0" r="4" fill="none" stroke="var(--sv-support)" strokeWidth="1.5" className={styles.pulseRing} />
              <circle cx="0" cy="0" r="12" fill="none" stroke="var(--sv-support)" strokeWidth="1" className={styles.pulseRing2} />

              <g className={styles.heartBeat} opacity="0.9" onClick={handleHeartClick}>
                <path d="M 0 6 L -6 0 L 0 -6 L 6 0 Z" fill="var(--sv-support)" />
                <circle cx="-3" cy="-3" r="4" fill="var(--sv-support)" />
                <circle cx="3" cy="-3" r="4" fill="var(--sv-support)" />
              </g>

              <circle cx="-80" cy="-30" r="2" fill="var(--sv-accent)" opacity="0.6"/>
              <circle cx="-60" cy="40" r="2" fill="var(--sv-support)" opacity="0.6"/>
              <circle cx="50" cy="-20" r="2" fill="var(--sv-orange)" opacity="0.6"/>
            </svg>
          </svg>

          <p className={styles.eyebrow}>{t('support.eyebrow')}</p>
          <h1>{t('support.title')}</h1>
          <p className={styles.lead}>{t('support.description')}</p>

          <div className={styles.paymentOptions}>
            {PAYMENT_OPTIONS.map((opt) => {
              const cardStyle = {
                '--option-accent': opt.accentColor,
                '--option-border': opt.borderColor,
                '--option-hover-bg': opt.hoverBg,
              } as React.CSSProperties;

              const cardContent = (
                <>
                  <span className={styles.paymentIcon}>{opt.icon}</span>
                  <span className={styles.paymentLabels}>
                    <span className={styles.paymentName}>{opt.label}</span>
                    <span className={styles.paymentSub}>
                      {opt.id === 'stripe' && stripeStatus === 'loading'
                        ? 'Preparing secure checkout...'
                        : opt.id === 'stripe' && stripeStatus === 'error'
                          ? 'Checkout blocked or unavailable. Please try again.'
                          : t(opt.sublabelKey)}
                    </span>
                  </span>
                  <svg className={styles.paymentArrow} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              );

              if (opt.id === 'stripe') {
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={styles.paymentCard}
                    style={cardStyle}
                    disabled={stripeStatus === 'loading'}
                    onClick={startStripeCheckout}
                    onMouseEnter={() => setHovered(opt.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <a
                  key={opt.id}
                  href={PAYPAL_LINK}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={styles.paymentCard}
                  style={cardStyle}
                  onMouseEnter={() => setHovered(opt.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {cardContent}
                </a>
              );
            })}
          </div>

          {floatingBtnPos && (
            <div
              className={styles.floatingBtnWrap}
              style={{left: floatingBtnPos.x, top: floatingBtnPos.y + 15}}
              onMouseLeave={() => setFloatingBtnPos(null)}
            >
              <a
                href={PAYPAL_LINK}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.floatingBtn}
              >
                <PayPalIcon />
                <span>{t('support.floatingDonate')}</span>
              </a>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
}
