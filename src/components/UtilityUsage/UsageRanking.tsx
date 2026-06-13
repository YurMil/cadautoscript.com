import React, {useMemo} from 'react';
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

type UsageRankingProps = {
  items: UsageRankingItem[];
  emptyLabel?: string;
};

/**
 * Ranked list of utilities with a proportional usage bar. Shared between the
 * profile ("your usage") and the admin dashboard ("global ranking").
 */
export default function UsageRanking({
  items,
  emptyLabel = 'No usage recorded yet.',
}: UsageRankingProps): React.JSX.Element {
  const maxCount = useMemo(
    () => items.reduce((max, item) => Math.max(max, item.count), 0),
    [items],
  );

  if (items.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>;
  }

  return (
    <ol className={styles.list}>
      {items.map((item, index) => {
        const name = utilityNameById.get(item.utilityId) ?? item.utilityId;
        const href = utilityHrefById.get(item.utilityId);
        const pct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;

        return (
          <li key={item.utilityId} className={styles.row}>
            <span className={styles.rank}>{index + 1}</span>
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
  );
}
