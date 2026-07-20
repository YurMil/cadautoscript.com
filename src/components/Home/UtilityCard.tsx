import {utilities} from '@site/src/data/utilities';
import {useI18n} from '@site/src/contexts/I18nContext';
import ThumbnailPicture from '@site/src/components/ThumbnailPicture';
import styles from '@site/src/pages/index.module.css';

type UtilityCardProps = {
  utility: (typeof utilities)[number];
  // Access-related props are kept for call-site compatibility but no longer
  // affect rendering: every utility is open to guests (issue #112) — sign-in
  // gates exports and personal features inside the utility shell instead.
  index?: number;
  isAuthenticated?: boolean;
  authChecked?: boolean;
  utilitiesPublicAccess?: boolean;
};

export default function UtilityCard({utility}: UtilityCardProps) {
  const {tu} = useI18n();
  const translated = tu(utility.id);
  const displayName = translated.name || utility.name;
  const displayDesc = translated.description || utility.description;

  return (
    <article className={styles.utilityCard}>
      {/* ── Header row ── */}
      <div className={styles.utilityHead}>
        <span className={styles.badge}>{utility.tech}</span>
        <span className={styles.subtle}>{utility.standards}</span>
      </div>

      {/* ── Title — always visible, clickable ── */}
      <h3>
        <a href={utility.href} data-nobrokenlinkcheck className={styles.titleLink}>
          {displayName}
        </a>
      </h3>

      {/* ── Body content (covered by icon on hover) ── */}
      <p className={styles.utilityDesc}>{displayDesc}</p>
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
          className={styles.iconLink}
          title={`Open ${utility.name}`}
        >
          <ThumbnailPicture
            src={utility.thumbnail}
            alt={utility.name}
            className={styles.utilityIcon}
            width={56}
            height={56}
          />
          <span className={styles.iconOverlay}>▶</span>
        </a>
      )}

      {/* ── Fallback button for cards without thumbnail ── */}
      {!utility.thumbnail && (
        <div className={styles.utilityFooter}>
          <a className="button button--primary" href={utility.href} data-nobrokenlinkcheck>
            Open utility
          </a>
        </div>
      )}
    </article>
  );
}
