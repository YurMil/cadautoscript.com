import type React from 'react';
import Link from '@docusaurus/Link';
import {utilities} from '@site/src/data/utilities';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {useI18n} from '@site/src/contexts/I18nContext';
import ThumbnailPicture from '@site/src/components/ThumbnailPicture';
import styles from '@site/src/pages/index.module.css';

type UtilityCardProps = {
  utility: (typeof utilities)[number];
  index: number;
  isAuthenticated: boolean;
  authChecked: boolean;
  utilitiesPublicAccess: boolean;
};

export default function UtilityCard({utility, index, isAuthenticated, authChecked, utilitiesPublicAccess}: UtilityCardProps) {
  const {openLoginModal} = useAuthModal();
  const {t, tu} = useI18n();
  const isLocked = !utilitiesPublicAccess && authChecked && !isAuthenticated && index >= 3;
  // Access badge is shown to signed-out visitors only: 'Free' for the always
  // free tools, 'Account' for the rest — no paywall surprises (issue #65).
  const accessBadge =
    authChecked && !isAuthenticated && !utilitiesPublicAccess
      ? index < 3
        ? t('badges.free')
        : t('badges.account')
      : null;
  const translated = tu(utility.id);
  const displayName = translated.name || utility.name;
  const displayDesc = translated.description || utility.description;

  const handleLaunch = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isLocked) {
      return;
    }
    event.preventDefault();
    openLoginModal();
  };

  return (
    <article className={`${styles.utilityCard} ${isLocked ? styles.utilityCardLocked : ''}`}>
      {/* ── Header row ── */}
      <div className={styles.utilityHead}>
        <span className={styles.badge}>{utility.tech}</span>
        <span className={styles.subtle}>{utility.standards}</span>
        {accessBadge ? (
          <span className={index < 3 ? styles.accessFree : styles.accessAccount}>{accessBadge}</span>
        ) : null}
      </div>

      {/* ── Title — always visible, clickable ── */}
      <h3>
        <a
          href={utility.href}
          data-nobrokenlinkcheck
          onClick={handleLaunch}
          className={styles.titleLink}
        >
          {displayName}
        </a>
      </h3>

      {/* ── Body content (covered by icon on hover) ── */}
      <p className={styles.utilityDesc}>{displayDesc}</p>
      {isLocked ? (
        <p className={styles.lockHint}>
          <span aria-hidden="true" className={styles.lockIcon}>
            lock
          </span>
          {t('home.locked')}{' '}
          <Link to="/why-sign-in/" className={styles.whySignInLink}>
            {t('badges.whySignIn')}
          </Link>
        </p>
      ) : null}
      <ul className={styles.featureList}>
        {utility.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      {/* ── Clickable icon (absolute, expands on hover) ── */}
      {utility.thumbnail && (
        <a
          href={utility.href}
          data-nobrokenlinkcheck
          onClick={handleLaunch}
          className={styles.iconLink}
          title={isLocked ? 'Sign in to open' : `Open ${utility.name}`}
        >
          <ThumbnailPicture
            src={utility.thumbnail}
            alt={utility.name}
            className={styles.utilityIcon}
            width={56}
            height={56}
          />
          <span className={styles.iconOverlay}>
            {isLocked ? '🔒' : '▶'}
          </span>
        </a>
      )}

      {/* ── Fallback button for cards without thumbnail ── */}
      {!utility.thumbnail && (
        <div className={styles.utilityFooter}>
          <a
            className={`button button--primary ${isLocked ? styles.lockedAction : ''}`}
            href={utility.href}
            data-nobrokenlinkcheck
            onClick={handleLaunch}
          >
            {isLocked ? 'Sign in to open' : 'Open utility'}
          </a>
          {isLocked ? <span className={styles.lockBadge}>Requires account</span> : null}
        </div>
      )}
    </article>
  );
}
