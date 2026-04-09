import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {utilities} from '@site/src/data/utilities';
import SupportSection from '@site/src/components/Support/SupportSection';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {useUtilitiesAccess} from '@site/src/hooks/useUtilitiesAccess';
import styles from './index.module.css';

const heroStats = [
  {label: 'Live utilities', value: utilities.length.toString()},
  {label: 'Runtime', value: 'Chromium + WASM'},
  {label: 'Formats', value: 'DXF / SVG / CSV / PDF / JSON'},
];

type UtilityCardProps = {
  utility: (typeof utilities)[number];
  index: number;
  isAuthenticated: boolean;
  authChecked: boolean;
  utilitiesPublicAccess: boolean;
};

function UtilityCard({utility, index, isAuthenticated, authChecked, utilitiesPublicAccess}: UtilityCardProps) {
  const {openLoginModal} = useAuthModal();
  const isLocked = !utilitiesPublicAccess && authChecked && !isAuthenticated && index >= 3;

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
      </div>

      {/* ── Title — always visible, clickable ── */}
      <h3>
        <a
          href={utility.href}
          data-nobrokenlinkcheck
          onClick={handleLaunch}
          className={styles.titleLink}
        >
          {utility.name}
        </a>
      </h3>

      {/* ── Body content (covered by icon on hover) ── */}
      <p className={styles.utilityDesc}>{utility.description}</p>
      {isLocked ? (
        <p className={styles.lockHint}>
          <span aria-hidden="true" className={styles.lockIcon}>
            lock
          </span>
          Sign in to unlock this utility
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
          <img
            src={utility.thumbnail}
            alt={utility.name}
            className={styles.utilityIcon}
            loading="lazy"
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

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const {isAuthenticated, authChecked} = useAuthStatus();
  const {utilitiesPublicAccess} = useUtilitiesAccess();

  return (
    <Layout
      title={siteConfig.title}
      description="CAD AutoScript - SolidWorks macros, calculators, and QA tools">
      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>CAD AutoScript</p>
            <h1>CAD AutoScript is a streamlined hub for fabrication automation.</h1>
            <p>
              It handles essential design tasks - including pipe saddle visualization, DXF exports, PDF package
              processing, and instrumentation configurators. Every tool operates locally client-side (WASM),
              providing zero-latency performance and complete data security. Includes comprehensive documentation
              and a mini-games arcade.
            </p>
            <div className={styles.heroActions}>
              <Link className="button button--primary" href="/docs/utilities/overview">
                View all docs
              </Link>
              <Link className="button button--secondary" href="/blog">
                Release notes
              </Link>
            </div>
          </div>
          <div className={styles.heroStats}>
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.utilitySection}>
          <header>
            <p className={styles.eyebrow}>Utilities</p>
            <h2>Just the essentials</h2>
            <p>
              Each utility is a standalone static app hosted under <code>/utilities/*</code>. Launches open
              the same pages machinists already know.
            </p>
          </header>
          <div className={styles.utilityGrid}>
            {utilities.map((utility, index) => (
              <UtilityCard
                key={utility.id}
                utility={utility}
                index={index}
                isAuthenticated={isAuthenticated}
                authChecked={authChecked}
                utilitiesPublicAccess={utilitiesPublicAccess}
              />
            ))}
          </div>
        </section>

        <section className={styles.docsSection}>
          <div>
            <p className={styles.eyebrow}>Documentation</p>
            <h2>Embed and explain inside MDX</h2>
            <p>
              Drop calculators into MDX, capture screenshots, or write run-books. The docs and utilities ship
              together so the interface stays small and predictable.
            </p>
          </div>
          <div className={styles.docsLinks}>
            <Link className="button button--primary" href="/docs/utilities/embed-calculators">
              Embed utilities
            </Link>
            <Link className="button button--secondary" to="/doc-parser">
              Launch Doc Parser
            </Link>
          </div>
        </section>

        <SupportSection />
      </main>
    </Layout>
  );
}
