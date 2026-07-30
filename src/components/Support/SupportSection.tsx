import React, {useEffect, useRef, useState} from 'react';
import {useI18n} from '@site/src/contexts/I18nContext';
import SupportButton from './SupportButton';
import styles from './SupportSection.module.css';

// Keep section actions pointing to /support page where user chooses PayPal or Stripe

export default function SupportSection(): React.JSX.Element {
  const {t} = useI18n();
  const [floatingBtnPos, setFloatingBtnPos] = useState<{x: number; y: number} | null>(null);
  const floatingBtnRef = useRef<HTMLDivElement>(null);

  const handleHeartClick = (e: React.MouseEvent<SVGGElement>) => {
    setFloatingBtnPos({ x: e.clientX, y: e.clientY });
  };

  // The button is dismissed by mouseleave on a desktop pointer, which never
  // fires after a tap — so on touch it would stay pinned to the viewport for
  // the rest of the visit. Scrolling or tapping elsewhere closes it too.
  useEffect(() => {
    if (!floatingBtnPos) {
      return;
    }

    const dismiss = () => setFloatingBtnPos(null);
    const onPointerDown = (event: PointerEvent) => {
      if (!floatingBtnRef.current?.contains(event.target as Node)) {
        dismiss();
      }
    };

    window.addEventListener('scroll', dismiss, {passive: true});
    window.addEventListener('pointerdown', onPointerDown);

    return () => {
      window.removeEventListener('scroll', dismiss);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [floatingBtnPos]);

  return (
    <section className={styles.section} onMouseLeave={() => setFloatingBtnPos(null)}>
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
          {/* Traces */}
          <path className={styles.march} d="M -400 -30 L -80 -30 L -30 0" fill="none" stroke="var(--sv-accent)" strokeWidth="1" strokeDasharray="4 4" opacity="0.4"/>
          <path className={styles.march} d="M -300 40 L -60 40 L -20 10 L -10 10" fill="none" stroke="var(--sv-support)" strokeWidth="1.2" strokeDasharray="6 6" opacity="0.5"/>
          <path className={styles.march} d="M 200 -20 L 50 -20 L 20 -5" fill="none" stroke="var(--sv-orange)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
          <path className={styles.march} d="M 150 30 L 40 30 L 10 10" fill="none" stroke="var(--sv-accent)" strokeWidth="1" strokeDasharray="5 5" opacity="0.3"/>

          {/* Hub rings */}
          <circle cx="0" cy="0" r="35" fill="none" stroke="var(--sv-border)" strokeWidth="1" strokeDasharray="4 2" opacity="0.5"/>
          <circle cx="0" cy="0" r="25" fill="none" stroke="var(--sv-border)" strokeWidth="0.5" opacity="0.3"/>

          {/* Pulse animations */}
          <circle cx="0" cy="0" r="4" fill="none" stroke="var(--sv-support)" strokeWidth="1.5" className={styles.pulseRing} />
          <circle cx="0" cy="0" r="12" fill="none" stroke="var(--sv-support)" strokeWidth="1" className={styles.pulseRing2} />

          {/* Beating Heart / Core */}
          <g className={styles.heartBeat} opacity="0.9" onClick={handleHeartClick}>
            <path d="M 0 6 L -6 0 L 0 -6 L 6 0 Z" fill="var(--sv-support)" />
            <circle cx="-3" cy="-3" r="4" fill="var(--sv-support)" />
            <circle cx="3" cy="-3" r="4" fill="var(--sv-support)" />
          </g>

          {/* Data nodes */}
          <circle cx="-80" cy="-30" r="2" fill="var(--sv-accent)" opacity="0.6"/>
          <circle cx="-60" cy="40" r="2" fill="var(--sv-support)" opacity="0.6"/>
          <circle cx="50" cy="-20" r="2" fill="var(--sv-orange)" opacity="0.6"/>
        </svg>
      </svg>
      <div className={styles.content}>
        <p className={styles.eyebrow}>{t('support.eyebrow')}</p>
        <h2>{t('support.title')}</h2>
        <p className={styles.description}>{t('support.description')}</p>
      </div>
      <div className={styles.actions}>
        <SupportButton />
      </div>

      {floatingBtnPos && (
        <div
          ref={floatingBtnRef}
          className={styles.floatingBtnWrap}
          style={{ left: floatingBtnPos.x, top: floatingBtnPos.y + 15 }}
          onMouseLeave={() => setFloatingBtnPos(null)}
        >
          <SupportButton compact />
        </div>
      )}
    </section>
  );
}
