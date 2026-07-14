import React from 'react';
import clsx from 'clsx';
import type {DashboardStats} from '@site/src/shared/admin-analytics';
import styles from '@site/src/pages/admin/index.module.css';

type Props = {
  stats: DashboardStats | null;
  statsLoading: boolean;
  onRefresh: () => void;
};

function renderDistribution(title: string, dist: Record<string, number>) {
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
  const max = entries.reduce((m, [, c]) => Math.max(m, c), 0) || 1;
  return (
    <div className={styles.distroCard}>
      <h3 className={styles.usageHeading}>{title}</h3>
      {entries.length === 0 ? (
        <p className={styles.muted}>No data yet.</p>
      ) : (
        entries.map(([key, count]) => (
          <div key={key} className={styles.distroRow}>
            <span>{key}</span>
            <span className={styles.distroTrack}>
              <span
                className={styles.distroFill}
                style={{width: `${Math.round((count / max) * 100)}%`}}
              />
            </span>
            <span className={styles.distroCount}>{count}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default function OverviewTab({stats, statsLoading, onRefresh}: Props): React.JSX.Element {
  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {statsLoading ? 'Loading dashboard...' : 'Site overview'}
        </div>
        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={onRefresh}
            disabled={statsLoading}
          >
            {statsLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {!stats ? (
        <p className={styles.muted}>{statsLoading ? 'Loading…' : 'No data yet.'}</p>
      ) : (
        <>
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalUsers}</div>
              <div className={styles.statLabel}>Total users</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.newUsers7d}</div>
              <div className={styles.statLabel}>New · 7 days</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.newUsers30d}</div>
              <div className={styles.statLabel}>New · 30 days</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.activeUsers7d}</div>
              <div className={styles.statLabel}>Active · 7 days</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalLaunches}</div>
              <div className={styles.statLabel}>Total launches</div>
            </div>
            <div className={clsx(styles.statCard, styles.statCardDanger)}>
              <div className={styles.statValue}>{stats.deletedAccountsTotal}</div>
              <div className={styles.statLabel}>
                Deleted accounts ({stats.deletedAccounts30d} in 30d)
              </div>
            </div>
          </div>

          <div className={styles.distroGrid}>
            {renderDistribution('Theme preference', stats.themeDistribution)}
            {renderDistribution('Interface language', stats.languageDistribution)}
            {renderDistribution('Display mode', stats.displayModeDistribution)}
          </div>
        </>
      )}
    </section>
  );
}
