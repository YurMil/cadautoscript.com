import React, {useCallback, useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import {useI18n} from '@site/src/contexts/I18nContext';
import {encodeUtilityState, SHARE_PARAM} from '@site/src/lib/utilityShare';
import {
  deleteCalculation,
  listCalculationHistory,
  MAX_HISTORY_ENTRIES,
  type CalculationHistoryEntry,
} from '@site/src/shared/calculation-history';
import {utilities} from '@site/src/data/utilities';
import {logger} from '@site/src/lib/logger';
import styles from './styles.module.css';

/**
 * Saved calculation history (issue #115).
 *
 * "Open" rebuilds a share link from the stored input snapshot, so restoring an
 * entry goes through exactly the same validated path as opening a shared URL
 * (dev-plans/utility-share-protocol.md) — no second restore mechanism to keep
 * in sync, and the tool always recomputes its results.
 */
export default function CalculationHistory(): React.JSX.Element {
  const {t, tu} = useI18n();
  const [entries, setEntries] = useState<CalculationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void listCalculationHistory()
      .then((rows) => {
        if (isMounted) setEntries(rows);
      })
      .catch((err) => {
        if (!isMounted) return;
        setFailed(true);
        const message = err instanceof Error ? err.message : 'Unable to load history.';
        logger.error('[CalculationHistory] Unable to load history', message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (!window.confirm(t('history.deleteConfirm'))) return;
      const previous = entries;
      // Optimistic: the row is gone from the list immediately, restored if the
      // delete fails so the UI never claims something that did not happen.
      setEntries((rows) => rows.filter((row) => row.id !== id));
      void deleteCalculation(id).catch((err) => {
        setEntries(previous);
        const message = err instanceof Error ? err.message : 'Unable to delete entry.';
        logger.error('[CalculationHistory] Unable to delete entry', message);
      });
    },
    [entries, t],
  );

  const entryHref = (entry: CalculationHistoryEntry): string | null => {
    const encoded = encodeUtilityState(entry.state);
    if (!encoded) return null;
    return `/utilities/${entry.utilityId}/?${SHARE_PARAM}=${encoded}`;
  };

  const displayName = (entry: CalculationHistoryEntry): string => {
    const known = utilities.find((utility) => utility.id === entry.utilityId);
    if (known) {
      return tu(known.id).name || known.name;
    }
    return entry.label || entry.utilityId;
  };

  return (
    <>
      <p className={styles.subtitle}>{t('history.subtitle', {max: String(MAX_HISTORY_ENTRIES)})}</p>
      {loading ? (
        <p className={styles.subtle}>{t('history.loading')}</p>
      ) : failed ? (
        <p className={styles.subtle} role="alert">
          {t('history.error')}
        </p>
      ) : entries.length === 0 ? (
        <p className={styles.subtle}>{t('history.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {entries.map((entry) => {
            const href = entryHref(entry);
            return (
              <li key={entry.id} className={styles.item}>
                <div className={styles.itemMain}>
                  <span className={styles.itemName}>{displayName(entry)}</span>
                  <time className={styles.itemDate} dateTime={entry.createdAt}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </time>
                </div>
                <div className={styles.itemActions}>
                  {href ? (
                    <Link className={styles.openLink} to={href} data-nobrokenlinkcheck>
                      {t('history.open')}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => handleDelete(entry.id)}
                  >
                    {t('history.delete')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
