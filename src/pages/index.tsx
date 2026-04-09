import {type ReactNode, useState, useEffect, useMemo} from 'react';
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
  const {openLoginModal} = useAuthModal();

  const [heroCollapsed, setHeroCollapsed] = useState(true);
  const [heroReady, setHeroReady] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredUtilities = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return utilities;
    return utilities.filter((u) => {
      const haystack = [
        u.name,
        u.description,
        u.tech,
        u.standards,
        ...(u.features || []),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [filterQuery]);

  useEffect(() => {
    try {
      const savedHero = localStorage.getItem('hero-collapsed');
      if (savedHero !== null) {
        setHeroCollapsed(savedHero === 'true');
      } else {
        setHeroCollapsed(false);
      }
      const savedCompact = localStorage.getItem('utilities-compact');
      if (savedCompact !== null) {
        setCompactMode(savedCompact === 'true');
      }
    } catch {
      setHeroCollapsed(false);
    }
    setHeroReady(true);
  }, []);

  const toggleHero = () => {
    const next = !heroCollapsed;
    setHeroCollapsed(next);
    try {
      localStorage.setItem('hero-collapsed', String(next));
    } catch { /* ignore */ }
  };

  const toggleCompact = () => {
    const next = !compactMode;
    setCompactMode(next);
    try {
      localStorage.setItem('utilities-compact', String(next));
    } catch { /* ignore */ }
  };

  return (
    <Layout
      title={siteConfig.title}
      description="CAD AutoScript - SolidWorks macros, calculators, and QA tools">
      <main className={styles.main}>
        <section
          className={`${styles.hero} ${heroReady && heroCollapsed ? styles.heroCollapsed : ''}`}
        >
          <button
            type="button"
            className={styles.heroToggle}
            onClick={toggleHero}
            aria-label={heroCollapsed ? 'Expand hero' : 'Collapse hero'}
            title={heroCollapsed ? 'Show details' : 'Hide details'}
          >
            <span className={styles.heroToggleIcon}>{heroCollapsed ? '▼' : '▲'}</span>
          </button>

          {heroCollapsed ? (
            <div className={styles.heroCompact}>
              <h1 className={styles.heroCompactTitle}>CAD AutoScript</h1>
              <div className={styles.heroCompactStats}>
                <span>{utilities.length} utilities</span>
                <span>·</span>
                <span>WASM</span>
                <span>·</span>
                <span>DXF / SVG / CSV / PDF</span>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </section>

        <section className={styles.utilitySection}>
          <header className={styles.utilitySectionHeader}>
            <div>
              <p className={styles.eyebrow}>
                Utilities{filterQuery.trim() ? ` — ${filteredUtilities.length} of ${utilities.length}` : ''}
              </p>
              <h2>Just the essentials</h2>
            </div>
            <div className={styles.utilityControls}>
              <div className={styles.filterWrap}>
                <svg className={styles.filterIcon} viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10.5 10.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Filter utilities..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  aria-label="Filter utilities"
                />
                {filterQuery && (
                  <button
                    type="button"
                    className={styles.filterClear}
                    onClick={() => setFilterQuery('')}
                    aria-label="Clear filter"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="button"
                className={styles.viewToggle}
                onClick={toggleCompact}
                aria-label={compactMode ? 'Card view' : 'Compact view'}
                title={compactMode ? 'Switch to card view' : 'Switch to icon view'}
              >
                {compactMode ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="1" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="11" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="8" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="15" y="2" width="4" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="8" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="15" y="9" width="4" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                )}
              </button>
            </div>
          </header>

          {filteredUtilities.length === 0 ? (
            <p className={styles.noResults}>No utilities match «{filterQuery.trim()}»</p>
          ) : compactMode ? (
            <div className={styles.iconGrid}>
              {filteredUtilities.map((utility) => {
                const origIndex = utilities.indexOf(utility);
                const locked = !utilitiesPublicAccess && authChecked && !isAuthenticated && origIndex >= 3;
                return (
                  <a
                    key={utility.id}
                    href={utility.href}
                    data-nobrokenlinkcheck
                    className={`${styles.iconTile} ${locked ? styles.iconTileLocked : ''}`}
                    onClick={(e) => {
                      if (locked) {
                        e.preventDefault();
                        openLoginModal();
                      }
                    }}
                  >
                    {utility.thumbnail ? (
                      <img
                        src={utility.thumbnail}
                        alt={utility.name}
                        className={styles.iconTileImg}
                        loading="lazy"
                      />
                    ) : (
                      <span className={styles.iconTilePlaceholder}>
                        {utility.name.charAt(0)}
                      </span>
                    )}
                    <span className={styles.iconTileLabel}>{utility.name}</span>
                    {locked && <span className={styles.iconTileLock}>🔒</span>}
                  </a>
                );
              })}
            </div>
          ) : (
            <div className={styles.utilityGrid}>
              {filteredUtilities.map((utility) => {
                const origIndex = utilities.indexOf(utility);
                return (
                  <UtilityCard
                    key={utility.id}
                    utility={utility}
                    index={origIndex}
                    isAuthenticated={isAuthenticated}
                    authChecked={authChecked}
                    utilitiesPublicAccess={utilitiesPublicAccess}
                  />
                );
              })}
            </div>
          )}
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
