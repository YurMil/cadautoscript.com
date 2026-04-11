import React, {useEffect, useMemo, useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import {miniGames} from '@site/src/data/miniGames';
import styles from './miniGames.module.css';

export default function MiniGamesIndex() {
  const [compactMode, setCompactMode] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredGames = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) {
      return miniGames;
    }

    return miniGames.filter((game) =>
      [game.name, game.description, game.tech, ...game.tags].join(' ').toLowerCase().includes(q),
    );
  }, [filterQuery]);

  useEffect(() => {
    try {
      const savedCompact = localStorage.getItem('mini-games-compact');
      setCompactMode(savedCompact !== null ? savedCompact === 'true' : true);
    } catch {
      setCompactMode(true);
    }
  }, []);

  const toggleCompact = () => {
    const next = !compactMode;
    setCompactMode(next);

    try {
      localStorage.setItem('mini-games-compact', String(next));
    } catch {
      /* ignore */
    }
  };

  return (
    <Layout title="Mini Games" description="Quick engineering-themed mini games.">
      <main className={styles.container}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Mini Games</p>
            <h1 className={styles.title}>Engineering mini games</h1>
            <p className={styles.lead}>
              Quick, browser-friendly games inspired by CAD, QA, and shop-floor problem solving.
            </p>
          </div>
        </header>
        <section className={styles.catalogSection}>
          <header className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>
                Mini Games{filterQuery.trim() ? ` — ${filteredGames.length} of ${miniGames.length}` : ''}
              </p>
              <h2 className={styles.sectionTitle}>Playable prototypes</h2>
            </div>
            <div className={styles.controls}>
              <div className={styles.filterWrap}>
                <svg className={styles.filterIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10.5 10.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Filter mini games..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  aria-label="Filter mini games"
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
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect x="1" y="1" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="11" y="1" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="1" y="11" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="11" y="11" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect x="1" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="8" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="15" y="2" width="4" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="1" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="8" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="15" y="9" width="4" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
          </header>

          {filteredGames.length === 0 ? (
            <p className={styles.noResults}>No mini games match "{filterQuery.trim()}"</p>
          ) : compactMode ? (
            <div className={styles.iconGrid}>
              {filteredGames.map((game) => (
                <Link
                  key={game.id}
                  to={game.href}
                  className={styles.iconTile}
                  title={`Play ${game.name}`}
                >
                  {game.Component ? (
                    <game.Component className={styles.iconTileImg} />
                  ) : game.thumbnail ? (
                    <img
                      src={game.thumbnail}
                      alt={game.name}
                      className={styles.iconTileImg}
                      loading="lazy"
                    />
                  ) : (
                    <span className={styles.iconTilePlaceholder}>
                      {game.name.charAt(0)}
                    </span>
                  )}
                  <span className={styles.iconTileLabel}>{game.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredGames.map((game) => (
                <article key={game.id} className={styles.card}>
                  <div className={styles.cardBody}>
                    <p className={styles.cardEyebrow}>{game.tech}</p>
                    <h2 className={styles.cardTitle}>
                      <Link to={game.href} className={styles.titleLink}>
                        {game.name}
                      </Link>
                    </h2>
                    <p className={styles.cardDesc}>{game.description}</p>
                    <div className={styles.tagRow}>
                      {game.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={game.href}
                    className={styles.iconLink}
                    title={`Play ${game.name}`}
                  >
                    {game.Component ? (
                      <game.Component className={styles.utilityIcon} />
                    ) : game.thumbnail ? (
                      <img
                        src={game.thumbnail}
                        alt={game.name}
                        className={styles.utilityIcon}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.iconPlaceholder}>
                        {game.name.charAt(0)}
                      </div>
                    )}
                    <span className={styles.iconOverlay}>▶</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
}
