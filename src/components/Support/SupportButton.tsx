import React, {useEffect, useState} from 'react';
import clsx from 'clsx';
import {getSupportDestination, SUPPORT_LINK, SUPPORT_TEXT} from '@site/src/constants/support';
import styles from './SupportButton.module.css';

type SupportButtonProps = {
  className?: string;
  compact?: boolean;
  href?: string;
  label?: string;
  newTab?: boolean;
};

function SupportIcon(): React.JSX.Element {
  return (
    <svg
      className={styles.supportIcon}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true">
      <defs>
        <linearGradient id="support-bgGlow" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0E1A1A" />
          <stop offset="1" stopColor="#091012" />
        </linearGradient>
        <linearGradient id="support-heartGrad" x1="18" y1="18" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF7A7A" />
          <stop offset="0.5" stopColor="#FF4D6D" />
          <stop offset="1" stopColor="#C1123F" />
        </linearGradient>
        <linearGradient id="support-gearGrad" x1="24" y1="24" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#C7FFF4" />
          <stop offset="1" stopColor="#7EF2DD" />
        </linearGradient>
        <filter id="support-softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="support-innerShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feOffset dx="0" dy="1" />
          <feGaussianBlur stdDeviation="1.5" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="#000000" floodOpacity="0.18" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>
      </defs>

      <g className={styles.iconWrap}>
        <rect
          x="6"
          y="6"
          width="52"
          height="52"
          rx="18"
          fill="url(#support-bgGlow)"
          stroke="#85F2DE"
          strokeOpacity="0.38"
          strokeWidth="1.8"
        />
        <rect x="10" y="10" width="44" height="44" rx="14" fill="#0A1113" fillOpacity="0.55" stroke="#85F2DE" strokeOpacity="0.08" />
        <path d="M18 24H24M21 21V27" stroke="#D9FFF8" strokeWidth="2.6" strokeLinecap="round" />
        <g className={styles.heartCore} filter="url(#support-innerShadow)">
          <path
            d="M32 46.5C31.4 46.5 30.9 46.3 30.4 45.9C23.7 40.7 19 36.6 16.8 32.7C13.9 27.7 14.8 21.9 19.1 18.9C22.5 16.5 27.1 16.9 30 19.8L32 21.8L34 19.8C36.9 16.9 41.5 16.5 44.9 18.9C49.2 21.9 50.1 27.7 47.2 32.7C45 36.6 40.3 40.7 33.6 45.9C33.1 46.3 32.6 46.5 32 46.5Z"
            fill="url(#support-heartGrad)"
            stroke="#FFC0C8"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
        </g>
        <g opacity="0.95">
          <circle cx="32" cy="31" r="4.2" fill="none" stroke="url(#support-gearGrad)" strokeWidth="2" />
          <circle cx="32" cy="31" r="1.35" fill="#AFFFF1" />
          <path
            d="M32 24.5V22.7M32 39.3V37.5M38.5 31H40.3M23.7 31H25.5M36.6 26.4L37.9 25.1M26.1 36.9L27.4 35.6M36.6 35.6L37.9 36.9M26.1 25.1L27.4 26.4"
            stroke="#9AF7E7"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M24.5 31H21.5C20.7 31 20 31.7 20 32.5V34"
            stroke="#BFFFF4"
            strokeOpacity="0.85"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M39.5 31H42.5C43.3 31 44 31.7 44 32.5V34"
            stroke="#BFFFF4"
            strokeOpacity="0.85"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M29.2 26.7L27.4 24.9C26.9 24.4 26.2 24.4 25.7 24.9L24.7 25.9"
            stroke="#BFFFF4"
            strokeOpacity="0.75"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M34.8 26.7L36.6 24.9C37.1 24.4 37.8 24.4 38.3 24.9L39.3 25.9"
            stroke="#BFFFF4"
            strokeOpacity="0.75"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="20" cy="34.8" r="1.6" fill="#89F4DF" />
          <circle cx="44" cy="34.8" r="1.6" fill="#89F4DF" />
          <circle cx="24.2" cy="26.4" r="1.4" fill="#89F4DF" />
          <circle cx="39.8" cy="26.4" r="1.4" fill="#89F4DF" />
        </g>
        <g filter="url(#support-softGlow)" opacity="0.22">
          <path
            d="M32 46.5C31.4 46.5 30.9 46.3 30.4 45.9C23.7 40.7 19 36.6 16.8 32.7C13.9 27.7 14.8 21.9 19.1 18.9C22.5 16.5 27.1 16.9 30 19.8L32 21.8L34 19.8C36.9 16.9 41.5 16.5 44.9 18.9C49.2 21.9 50.1 27.7 47.2 32.7C45 36.6 40.3 40.7 33.6 45.9C33.1 46.3 32.6 46.5 32 46.5Z"
            fill="url(#support-heartGrad)"
          />
        </g>
      </g>
    </svg>
  );
}

export default function SupportButton({
  className,
  compact = false,
  href,
  label = SUPPORT_TEXT.buttonLabel,
  newTab,
}: SupportButtonProps): React.JSX.Element {
  const [resolvedLink, setResolvedLink] = useState(() => getSupportDestination());

  useEffect(() => {
    if (href) {
      return;
    }
    setResolvedLink(getSupportDestination(window.location.hostname));
  }, [href]);

  const finalHref = href ?? resolvedLink.href ?? SUPPORT_LINK;
  const shouldOpenInNewTab = newTab ?? (!href && resolvedLink.openInNewTab);

  return (
    <a
      className={clsx(styles.button, compact && styles.compact, className)}
      href={finalHref}
      target={shouldOpenInNewTab ? '_blank' : undefined}
      rel={shouldOpenInNewTab ? 'noreferrer noopener' : undefined}
    >
      <SupportIcon />
      <span>{label}</span>
    </a>
  );
}
