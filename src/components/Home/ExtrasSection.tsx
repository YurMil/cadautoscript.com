import Link from '@docusaurus/Link';
import {generalUtilities, GENERAL_UTILITIES_PATH} from '@site/src/data/utilities';
import {useI18n} from '@site/src/contexts/I18nContext';
import ThumbnailPicture from '@site/src/components/ThumbnailPicture';
import styles from '@site/src/pages/index.module.css';

/**
 * Secondary landing-page block: general utilities and mini games stay one
 * click away without competing with the engineering catalog above.
 */
export default function ExtrasSection() {
  const {t, tu} = useI18n();

  return (
    <section className={`${styles.utilitySection} ${styles.extrasSection}`}>
      <header className={styles.utilitySectionHeader}>
        <div>
          <p className={styles.eyebrow}>{t('home.extrasEyebrow')}</p>
          <h2>{t('home.extrasTitle')}</h2>
          <p className={styles.extrasLead}>{t('home.extrasLead')}</p>
        </div>
      </header>

      <div className={styles.iconGrid}>
        {generalUtilities.map((utility) => {
          const name = tu(utility.id).name || utility.name;
          return (
            <a
              key={utility.id}
              href={utility.href}
              data-nobrokenlinkcheck
              className={styles.iconTile}
            >
              {utility.thumbnail ? (
                <ThumbnailPicture
                  src={utility.thumbnail}
                  alt={name}
                  className={styles.iconTileImg}
                  width={60}
                  height={60}
                />
              ) : (
                <span className={styles.iconTilePlaceholder}>{name.charAt(0)}</span>
              )}
              <span className={styles.iconTileLabel}>{name}</span>
            </a>
          );
        })}
      </div>

      <div className={styles.heroActions}>
        <Link className="button button--secondary" to={GENERAL_UTILITIES_PATH}>
          {t('home.browseGeneralUtilities')}
        </Link>
        <Link className="button button--secondary" to="/mini-games/">
          {t('home.playMiniGames')}
        </Link>
      </div>
    </section>
  );
}
