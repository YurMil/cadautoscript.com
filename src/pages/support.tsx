import React, {useState} from 'react';
import Layout from '@theme/Layout';
import {PAYPAL_LINK, STRIPE_LINK, SUPPORT_TEXT} from '@site/src/constants/support';
import styles from './support.module.css';

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
  sublabel: string;
  href: string;
  icon: React.JSX.Element;
  accentColor: string;
  borderColor: string;
  hoverBg: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'paypal',
    label: 'PayPal',
    sublabel: 'Donate via PayPal',
    href: PAYPAL_LINK,
    icon: <PayPalIcon />,
    accentColor: '#009cde',
    borderColor: 'rgba(0, 156, 222, 0.35)',
    hoverBg: 'rgba(0, 60, 140, 0.12)',
  },
  {
    id: 'stripe',
    label: 'Stripe',
    sublabel: 'Pay with card via Stripe',
    href: STRIPE_LINK,
    icon: <StripeIcon />,
    accentColor: '#635BFF',
    borderColor: 'rgba(99, 91, 255, 0.35)',
    hoverBg: 'rgba(40, 30, 120, 0.12)',
  },
];

export default function SupportPage(): React.JSX.Element {
  const [floatingBtnPos, setFloatingBtnPos] = useState<{x: number; y: number} | null>(null);
  const [hovered, setHovered] = useState<PaymentMethod | null>(null);

  const handleHeartClick = (e: React.MouseEvent<SVGGElement>) => {
    setFloatingBtnPos({x: e.clientX, y: e.clientY});
  };

  return (
    <Layout title="Support" description="Support CAD AutoScript development.">
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

          <p className={styles.eyebrow}>Support</p>
          <h1>Support the Project</h1>
          <p className={styles.lead}>{SUPPORT_TEXT.description}</p>

          <div className={styles.paymentOptions}>
            {PAYMENT_OPTIONS.map((opt) => (
              <a
                key={opt.id}
                href={opt.href}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.paymentCard}
                style={{
                  '--option-accent': opt.accentColor,
                  '--option-border': opt.borderColor,
                  '--option-hover-bg': opt.hoverBg,
                } as React.CSSProperties}
                onMouseEnter={() => setHovered(opt.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className={styles.paymentIcon}>{opt.icon}</span>
                <span className={styles.paymentLabels}>
                  <span className={styles.paymentName}>{opt.label}</span>
                  <span className={styles.paymentSub}>{opt.sublabel}</span>
                </span>
                <svg className={styles.paymentArrow} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            ))}
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
                <span>Donate via PayPal</span>
              </a>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
}
