import {type ReactNode, useState, useEffect, useMemo} from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {utilities, UTILITY_CATEGORIES, type UtilityCategory} from '@site/src/data/utilities';
import SupportSection from '@site/src/components/Support/SupportSection';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {useUtilitiesAccess} from '@site/src/hooks/useUtilitiesAccess';
import {usePauseWhenOffscreen} from '@site/src/hooks/usePauseWhenOffscreen';
import {
  listUtilityUsage,
  listGlobalUtilityPopularity,
  type UtilityUsageStat,
} from '@site/src/shared/utility-usage';
import styles from './index.module.css';
import ThumbnailPicture from '@site/src/components/ThumbnailPicture';
import {useUserSettings} from '@site/src/contexts/UserSettingsContext';
import {useI18n} from '@site/src/contexts/I18nContext';
import UtilityCard from '@site/src/components/Home/UtilityCard';
import HeroSection from '@site/src/components/Home/HeroSection';
import DocsSection from '@site/src/components/Home/DocsSection';

function getUsageTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

// Default curated order, precomputed once so sort comparators can resolve a
// utility's base position in O(1) instead of O(n) via Array.indexOf.
const utilityDefaultIndexById = new Map(utilities.map((u, index) => [u.id, index]));

function defaultOrderIndex(id: string): number {
  return utilityDefaultIndexById.get(id) ?? Number.MAX_SAFE_INTEGER;
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const {user, isAuthenticated, authChecked} = useAuthStatus();
  const {utilitiesPublicAccess} = useUtilitiesAccess();
  const {openLoginModal} = useAuthModal();
  const {settings, updateSettings} = useUserSettings();
  const {t} = useI18n();

  const [heroCollapsed, setHeroCollapsed] = useState(true);
  const [heroReady, setHeroReady] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<UtilityCategory | 'all'>('all');

  // Allow deep-linking a category (footer links, docs): /?category=calculators
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('category');
    if (param && UTILITY_CATEGORIES.some((cat) => cat.id === param)) {
      setCategoryFilter(param as UtilityCategory);
    }
  }, []);
  const [usageStats, setUsageStats] = useState<UtilityUsageStat[]>([]);
  const [globalOrder, setGlobalOrder] = useState<string[]>([]);

  const hero = usePauseWhenOffscreen<HTMLElement>();
  const utilSection = usePauseWhenOffscreen<HTMLElement>();
  const docsSection = usePauseWhenOffscreen<HTMLElement>();

  const usageByUtilityId = useMemo(() => {
    return new Map(usageStats.map((stat) => [stat.utilityId, stat]));
  }, [usageStats]);

  const globalRankByUtilityId = useMemo(() => {
    return new Map(globalOrder.map((id, index) => [id, index]));
  }, [globalOrder]);

  const orderedUtilities = useMemo(() => {
    // Logged-in users with smart sorting on: personal order by their own usage.
    if (isAuthenticated && settings.smart_sorting && usageStats.length > 0) {
      return [...utilities].sort((a, b) => {
        const aUsage = usageByUtilityId.get(a.id);
        const bUsage = usageByUtilityId.get(b.id);
        const countDiff = (bUsage?.launchCount ?? 0) - (aUsage?.launchCount ?? 0);

        if (countDiff !== 0) {
          return countDiff;
        }

        const timeDiff =
          getUsageTimestamp(bUsage?.lastOpenedAt) - getUsageTimestamp(aUsage?.lastOpenedAt);

        if (timeDiff !== 0) {
          return timeDiff;
        }

        return defaultOrderIndex(a.id) - defaultOrderIndex(b.id);
      });
    }

    // Anonymous visitors: fall back to the global popularity ranking when loaded.
    if (!isAuthenticated && globalOrder.length > 0) {
      return [...utilities].sort((a, b) => {
        const aRank = globalRankByUtilityId.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bRank = globalRankByUtilityId.get(b.id) ?? Number.MAX_SAFE_INTEGER;

        if (aRank !== bRank) {
          return aRank - bRank;
        }

        return defaultOrderIndex(a.id) - defaultOrderIndex(b.id);
      });
    }

    return utilities;
  }, [
    isAuthenticated,
    usageByUtilityId,
    usageStats.length,
    settings.smart_sorting,
    globalOrder,
    globalRankByUtilityId,
  ]);

  const filteredUtilities = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const byCategory =
      categoryFilter === 'all'
        ? orderedUtilities
        : orderedUtilities.filter((u) => u.category === categoryFilter);
    if (!q) return byCategory;
    return byCategory.filter((u) => {
      const haystack = [
        u.name,
        u.description,
        u.tech,
        u.standards,
        ...(u.features || []),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [filterQuery, categoryFilter, orderedUtilities]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated) {
      setUsageStats([]);
      return;
    }

    let isMounted = true;

    const loadUsage = async () => {
      try {
        const stats = await listUtilityUsage();
        if (isMounted) {
          setUsageStats(stats);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load utility usage.';
        console.warn('[UtilityUsage] Unable to load utility ranking', message);
        if (isMounted) {
          setUsageStats([]);
        }
      }
    };

    void loadUsage();

    return () => {
      isMounted = false;
    };
  }, [authChecked, isAuthenticated, user?.id]);

  useEffect(() => {
    // Global popularity is only used as the anonymous fallback order.
    if (!authChecked || isAuthenticated) {
      return;
    }

    let isMounted = true;

    const loadGlobalRanking = async () => {
      try {
        const order = await listGlobalUtilityPopularity();
        if (isMounted) {
          setGlobalOrder(order);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to load global utility ranking.';
        console.warn('[UtilityUsage] Unable to load global ranking', message);
      }
    };

    void loadGlobalRanking();

    return () => {
      isMounted = false;
    };
  }, [authChecked, isAuthenticated]);

  useEffect(() => {
    try {
      const savedHero = localStorage.getItem('hero-collapsed');
      if (savedHero !== null) {
        setHeroCollapsed(savedHero === 'true');
      } else {
        setHeroCollapsed(false);
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
    updateSettings({
      utility_display_mode: settings.utility_display_mode === 'compact' ? 'detailed' : 'compact'
    });
  };

  const isCompactMode = settings.utility_display_mode === 'compact';

  return (
    <Layout
      title={siteConfig.title}
      description={t('home.heroSubtitle')}>
      <main className={styles.main}>
        <HeroSection
          sectionRef={hero.ref}
          paused={hero.paused}
          heroReady={heroReady}
          heroCollapsed={heroCollapsed}
          onToggleHero={toggleHero}
        />

        <section
          ref={utilSection.ref}
          data-paused={utilSection.paused ? 'true' : undefined}
          className={styles.utilitySection}
        >
          <svg className={styles.utilityBgSvg} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ugm" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0L0 0 0 20" fill="none" stroke="var(--sv-grid-minor)" strokeWidth="0.6"/>
              </pattern>
              <pattern id="ugM" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#ugm)"/>
                <path d="M100 0L0 0 0 100" fill="none" stroke="var(--sv-grid-major)" strokeWidth="1.1"/>
              </pattern>
              <radialGradient id="ucenter" cx="50%" cy="50%" r="75%">
                <stop offset="0%" stopColor="transparent"/>
                <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.7"/>
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#ugM)"/>
            <rect width="100%" height="100%" fill="url(#ucenter)"/>
            <g opacity="0.3">
              <rect className={styles.scanline} x="0" y="0" width="100%" height="100" fill="rgba(0,200,220,0.05)" />
            </g>
          </svg>
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
                aria-label={isCompactMode ? 'Card view' : 'Compact view'}
                title={isCompactMode ? 'Switch to card view' : 'Switch to icon view'}
              >
                {isCompactMode ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="1" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="11" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="8" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="15" y="2" width="4" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="8" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="15" y="9" width="4" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                )}
              </button>
            </div>
          </header>

          <div className={styles.categoryChips} role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`${styles.categoryChip} ${categoryFilter === 'all' ? styles.categoryChipActive : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              All · {utilities.length}
            </button>
            {UTILITY_CATEGORIES.map((cat) => {
              const count = utilities.filter((u) => u.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.categoryChip} ${categoryFilter === cat.id ? styles.categoryChipActive : ''}`}
                  onClick={() => setCategoryFilter((prev) => (prev === cat.id ? 'all' : cat.id))}
                >
                  {cat.label} · {count}
                </button>
              );
            })}
          </div>

          {filteredUtilities.length === 0 ? (
            <p className={styles.noResults}>No utilities match the current filters</p>
          ) : isCompactMode ? (
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
                      <ThumbnailPicture
                        src={utility.thumbnail}
                        alt={utility.name}
                        className={styles.iconTileImg}
                        width={60}
                        height={60}
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

        <DocsSection sectionRef={docsSection.ref} paused={docsSection.paused} />

        <SupportSection />
      </main>
    </Layout>
  );
}
