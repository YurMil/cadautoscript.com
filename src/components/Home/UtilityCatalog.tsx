import {type RefObject, useEffect, useMemo, useState} from 'react';
import {
  engineeringUtilities,
  generalUtilities,
  getSectionCategories,
  type UtilityCategory,
  type UtilitySection,
} from '@site/src/data/utilities';
import {useOrderedUtilities} from '@site/src/hooks/useOrderedUtilities';
import {useUserSettings} from '@site/src/contexts/UserSettingsContext';
import ThumbnailPicture from '@site/src/components/ThumbnailPicture';
import UtilityCard from '@site/src/components/Home/UtilityCard';
import styles from '@site/src/pages/index.module.css';

type UtilityCatalogProps = {
  section: UtilitySection;
  eyebrow: string;
  title: string;
  sectionRef?: RefObject<HTMLElement | null>;
  paused?: boolean;
};

const utilitiesBySection: Record<UtilitySection, typeof engineeringUtilities> = {
  engineering: engineeringUtilities,
  general: generalUtilities,
};

/** Searchable, category-filterable grid of one catalog section. */
export default function UtilityCatalog({section, eyebrow, title, sectionRef, paused}: UtilityCatalogProps) {
  const {settings, updateSettings} = useUserSettings();
  const sectionUtilities = utilitiesBySection[section];
  const categories = useMemo(
    () =>
      getSectionCategories(section).filter((cat) =>
        sectionUtilities.some((u) => u.category === cat.id),
      ),
    [section, sectionUtilities],
  );
  const orderedUtilities = useOrderedUtilities(sectionUtilities);

  const [filterQuery, setFilterQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<UtilityCategory | 'all'>('all');

  // Allow deep-linking a category (footer links, docs): /?category=calculators
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('category');
    if (param && categories.some((cat) => cat.id === param)) {
      setCategoryFilter(param as UtilityCategory);
    }
  }, [categories]);

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

  const isCompactMode = settings.utility_display_mode === 'compact';

  const toggleCompact = () => {
    updateSettings({
      utility_display_mode: isCompactMode ? 'detailed' : 'compact',
    });
  };

  // SVG pattern ids are document-global; keep them unique per section.
  const id = (name: string) => `${section}-${name}`;

  return (
    <section
      ref={sectionRef}
      data-paused={paused ? 'true' : undefined}
      className={styles.utilitySection}
    >
      <svg className={styles.utilityBgSvg} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={id('ugm')} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0L0 0 0 20" fill="none" stroke="var(--sv-grid-minor)" strokeWidth="0.6"/>
          </pattern>
          <pattern id={id('ugM')} width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill={`url(#${id('ugm')})`}/>
            <path d="M100 0L0 0 0 100" fill="none" stroke="var(--sv-grid-major)" strokeWidth="1.1"/>
          </pattern>
          <radialGradient id={id('ucenter')} cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="transparent"/>
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.7"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id('ugM')})`}/>
        <rect width="100%" height="100%" fill={`url(#${id('ucenter')})`}/>
        <g opacity="0.3">
          <rect className={styles.scanline} x="0" y="0" width="100%" height="100" fill="rgba(0,200,220,0.05)" />
        </g>
      </svg>
      <header className={styles.utilitySectionHeader}>
        <div>
          <p className={styles.eyebrow}>
            {eyebrow}{filterQuery.trim() ? ` — ${filteredUtilities.length} of ${sectionUtilities.length}` : ''}
          </p>
          <h2>{title}</h2>
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

      {categories.length > 1 && (
        <div className={styles.categoryChips} role="group" aria-label="Filter by category">
          <button
            type="button"
            className={`${styles.categoryChip} ${categoryFilter === 'all' ? styles.categoryChipActive : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            All · {sectionUtilities.length}
          </button>
          {categories.map((cat) => {
            const count = sectionUtilities.filter((u) => u.category === cat.id).length;
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
      )}

      {filteredUtilities.length === 0 ? (
        <p className={styles.noResults}>No utilities match the current filters</p>
      ) : isCompactMode ? (
        <div className={styles.iconGrid}>
          {filteredUtilities.map((utility) => (
            <a
              key={utility.id}
              href={utility.href}
              data-nobrokenlinkcheck
              className={styles.iconTile}
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
            </a>
          ))}
        </div>
      ) : (
        <div className={styles.utilityGrid}>
          {filteredUtilities.map((utility) => (
            <UtilityCard key={utility.id} utility={utility} />
          ))}
        </div>
      )}
    </section>
  );
}
