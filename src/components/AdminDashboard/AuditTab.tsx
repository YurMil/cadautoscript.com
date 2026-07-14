import React from 'react';
import clsx from 'clsx';
import type {AuditEventType, AuditLogEntry} from '@site/src/shared/admin-analytics';
import {formatDateTime} from '@site/src/utils/formatDate';
import {AUDIT_EVENT_CHIP, AUDIT_EVENT_LABELS} from './types';
import styles from '@site/src/pages/admin/index.module.css';

type Props = {
  auditEntries: AuditLogEntry[];
  auditLoading: boolean;
  auditFilter: AuditEventType | '';
  auditHasMore: boolean;
  onFilterChange: (value: AuditEventType | '') => void;
  onRefresh: () => void;
  onLoadMore: () => void;
};

const formatAuditDetail = (entry: AuditLogEntry): string => {
  const meta = entry.metadata || {};
  if (entry.eventType === 'role_changed' && meta.from && meta.to) {
    return `${String(meta.from)} → ${String(meta.to)}`;
  }
  if (entry.eventType === 'analytics_reset' && meta.deleted_count != null) {
    return `${String(meta.deleted_count)} records cleared`;
  }
  if (entry.eventType === 'account_deleted') {
    return meta.self_service ? 'Self-service' : 'By admin';
  }
  if (entry.eventType === 'user_invited' && meta.email) {
    return String(meta.email);
  }
  return '';
};

export default function AuditTab({
  auditEntries,
  auditLoading,
  auditFilter,
  auditHasMore,
  onFilterChange,
  onRefresh,
  onLoadMore,
}: Props): React.JSX.Element {
  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {auditLoading
            ? 'Loading audit log...'
            : `${auditEntries.length} event${auditEntries.length === 1 ? '' : 's'}`}
        </div>
        <div className={styles.toolbarRight}>
          <select
            className={styles.auditFilter}
            value={auditFilter}
            onChange={(e) => onFilterChange(e.target.value as AuditEventType | '')}
            disabled={auditLoading}
          >
            <option value="">All events</option>
            <option value="account_deleted">Account deleted</option>
            <option value="role_changed">Role changed</option>
            <option value="settings_reset">Settings reset</option>
            <option value="analytics_reset">Analytics reset</option>
            <option value="user_invited">User invited</option>
          </select>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={onRefresh}
            disabled={auditLoading}
          >
            {auditLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {auditEntries.length === 0 ? (
        <p className={styles.muted}>
          {auditLoading ? 'Loading…' : 'No events recorded yet.'}
        </p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>When</th>
                <th>Event</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.createdAt)}</td>
                  <td>
                    <span
                      className={clsx(
                        styles.chip,
                        styles[AUDIT_EVENT_CHIP[entry.eventType] as keyof typeof styles],
                      )}
                    >
                      {AUDIT_EVENT_LABELS[entry.eventType]}
                    </span>
                  </td>
                  <td>{entry.actorEmail || '-'}</td>
                  <td>
                    <span className={styles.auditTarget}>
                      <span>{entry.targetName || entry.targetEmail || '-'}</span>
                      {entry.targetName && entry.targetEmail ? (
                        <span className={styles.auditTargetEmail}>{entry.targetEmail}</span>
                      ) : null}
                    </span>
                  </td>
                  <td className={styles.auditMeta}>{formatAuditDetail(entry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {auditHasMore ? (
            <div className={styles.toolbar} style={{marginTop: '0.75rem'}}>
              <div className={styles.toolbarLeft} />
              <div className={styles.toolbarRight}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={onLoadMore}
                  disabled={auditLoading}
                >
                  {auditLoading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
