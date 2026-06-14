import React, {useMemo, useState} from 'react';
import {utilities} from '@site/src/data/utilities';
import styles from './UsageRanking.module.css';

export type UsageRankingItem = {
  utilityId: string;
  count: number;
  /** Optional secondary line, e.g. "Last opened 2 days ago". */
  meta?: string;
};

const utilityNameById = new Map(utilities.map((u) => [u.id, u.name]));
const utilityHrefById = new Map(utilities.map((u) => [u.id, u.href]));
const utilityThumbnailById = new Map(
  utilities.map((u) => [u.id, u.thumbnail]),
);

type UsageRankingProps = {
  items: UsageRankingItem[];
  emptyLabel?: string;
  /** How many rows to show before the "Show all" toggle. */
  initialCount?: number;
};

/**
 * Ranked list of utilities with a proportional usage bar and the utility's
 * real icon. Collapses to the top `initialCount` rows with an expand toggle.
 * Shared between the profile ("your usage") and the admin dashboard.
 */
export default function UsageRanking({
  items,
  emptyLabel = 'No usage recorded yet.',
  initialCount = 5,
}: UsageRankingProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const maxCount = useMemo(
    () => items.reduce((max, item) => Math.max(max, item.count), 0),
    [items],
  );

  if (items.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>;
  }

  const canCollapse = items.length > initialCount;
  const visibleItems = expanded || !canCollapse ? items : items.slice(0, initialCount);

  return (
    <div>
      <ol className={styles.list}>
        {visibleItems.map((item, index) => {
          const name = utilityNameById.get(item.utilityId) ?? item.utilityId;
          const href = utilityHrefById.get(item.utilityId);
          const thumbnail = utilityThumbnailById.get(item.utilityId);
          const pct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;

          return (
            <li key={item.utilityId} className={styles.row}>
              <span className={styles.rank}>{index + 1}</span>
              <span className={styles.icon}>
                {thumbnail ? (
                  <img src={thumbnail} alt="" loading="lazy" />
                ) : (
                  <span className={styles.iconFallback}>
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </span>
              <div className={styles.body}>
                <div className={styles.head}>
                  {href ? (
                    <a className={styles.name} href={href}>
                      {name}
                    </a>
                  ) : (
                    <span className={styles.name}>{name}</span>
                  )}
                  <span className={styles.count}>{item.count}</span>
                </div>
                <div className={styles.bar}>
                  <span className={styles.barFill} style={{width: `${pct}%`}} />
                </div>
                {item.meta ? <span className={styles.meta}>{item.meta}</span> : null}
              </div>
            </li>
          );
        })}
      </ol>

      {canCollapse ? (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Show less' : `Show all ${items.length}`}
        </button>
      ) : null}
    </div>
  );
}
