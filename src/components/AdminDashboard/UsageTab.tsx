import React, {useMemo} from 'react';
import UsageRanking from '@site/src/components/UtilityUsage/UsageRanking';
import type {AdminUtilityUsageRow, UtilityPopularity} from '@site/src/shared/utility-usage';
import {utilities} from '@site/src/data/utilities';
import styles from '@site/src/pages/admin/index.module.css';

const utilityNameById = new Map(utilities.map((u) => [u.id, u.name]));

type Props = {
  globalUsage: UtilityPopularity[];
  perUserUsage: AdminUtilityUsageRow[];
  usageLoading: boolean;
  usageLoaded: boolean;
  onRefresh: () => void;
};

export default function UsageTab({
  globalUsage,
  perUserUsage,
  usageLoading,
  usageLoaded,
  onRefresh,
}: Props): React.JSX.Element {
  const globalRankingItems = useMemo(
    () => globalUsage.map((row) => ({utilityId: row.utilityId, count: row.totalLaunches})),
    [globalUsage],
  );

  const totalLaunches = useMemo(
    () => globalUsage.reduce((sum, row) => sum + row.totalLaunches, 0),
    [globalUsage],
  );

  const perUserGroups = useMemo(() => {
    const byUser = new Map<
      string,
      {userId: string; label: string; email: string | null; total: number; items: AdminUtilityUsageRow[]}
    >();

    for (const row of perUserUsage) {
      const existing = byUser.get(row.userId);
      if (existing) {
        existing.total += row.launchCount;
        existing.items.push(row);
      } else {
        byUser.set(row.userId, {
          userId: row.userId,
          label: row.fullName || row.username || row.email || 'Unknown user',
          email: row.email,
          total: row.launchCount,
          items: [row],
        });
      }
    }

    return Array.from(byUser.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => b.launchCount - a.launchCount),
      }))
      .sort((a, b) => b.total - a.total);
  }, [perUserUsage]);

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {usageLoading
            ? 'Loading usage analytics...'
            : `${totalLaunches} launches · ${perUserGroups.length} active users`}
        </div>
        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={onRefresh}
            disabled={usageLoading}
          >
            {usageLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className={styles.usageGrid}>
        <div className={styles.usageCard}>
          <h2 className={styles.usageHeading}>Global ranking</h2>
          <p className={styles.muted}>Most popular utilities across all users.</p>
          {usageLoading && !usageLoaded ? (
            <p className={styles.muted}>Loading…</p>
          ) : (
            <UsageRanking items={globalRankingItems} emptyLabel="No launches recorded yet." />
          )}
        </div>

        <div className={styles.usageCard}>
          <h2 className={styles.usageHeading}>By user</h2>
          <p className={styles.muted}>Per-account breakdown of utility launches.</p>
          {usageLoading && !usageLoaded ? (
            <p className={styles.muted}>Loading…</p>
          ) : perUserGroups.length === 0 ? (
            <p className={styles.muted}>No user activity yet.</p>
          ) : (
            <div className={styles.userUsageList}>
              {perUserGroups.map((group) => (
                <details key={group.userId} className={styles.userUsage}>
                  <summary className={styles.userUsageSummary}>
                    <span className={styles.userUsageName}>
                      {group.label}
                      {group.email ? (
                        <span className={styles.userUsageEmail}> · {group.email}</span>
                      ) : null}
                    </span>
                    <span className={styles.userUsageTotal}>{group.total}</span>
                  </summary>
                  <ul className={styles.userUsageItems}>
                    {group.items.map((item) => (
                      <li key={item.utilityId} className={styles.userUsageItem}>
                        <span>{utilityNameById.get(item.utilityId) ?? item.utilityId}</span>
                        <span className={styles.userUsageCount}>{item.launchCount}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
