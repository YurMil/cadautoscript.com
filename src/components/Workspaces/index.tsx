import React, {useCallback, useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import {useI18n} from '@site/src/contexts/I18nContext';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {encodeUtilityState, SHARE_PARAM} from '@site/src/lib/utilityShare';
import {utilities} from '@site/src/data/utilities';
import {logger} from '@site/src/lib/logger';
import {
  buildInviteUrl,
  COMPANY_NAME_MAX,
  createInviteCode,
  createWorkspace,
  deleteWorkspace,
  deleteWorkspaceCalculation,
  getMyRole,
  leaveWorkspace,
  listMyWorkspaces,
  listWorkspaceCalculations,
  MAX_WORKSPACE_ENTRIES,
  PREFERRED_STANDARDS_MAX,
  removeMember,
  revokeInvites,
  updateWorkspace,
  WORKSPACE_NAME_MAX,
  type Workspace,
  type WorkspaceCalculation,
} from '@site/src/shared/workspaces';
import historyStyles from '@site/src/components/CalculationHistory/styles.module.css';
import styles from './styles.module.css';

const logError = (scope: string, err: unknown) =>
  logger.error(`[Workspaces] ${scope}`, err instanceof Error ? err.message : String(err));

/**
 * Team workspaces on the profile page (issue #122): create a workspace, invite
 * colleagues by link, manage members and report defaults, and browse the
 * history the team has shared.
 */
export default function Workspaces(): React.JSX.Element {
  const {t} = useI18n();
  const {user} = useAuthStatus();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState(false);

  const reload = useCallback(async (preferId?: string | null) => {
    try {
      const rows = await listMyWorkspaces();
      setWorkspaces(rows);
      setFailed(false);
      setSelectedId((current) => {
        const wanted = preferId ?? current;
        return rows.some((w) => w.id === wanted) ? (wanted as string) : (rows[0]?.id ?? null);
      });
    } catch (err) {
      setFailed(true);
      logError('Unable to load workspaces', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deep link from the join page: /profile/?workspace=<id>#workspaces
    const requested = new URLSearchParams(window.location.search).get('workspace');
    void reload(requested);
  }, [reload]);

  const runAction = useCallback(
    async (scope: string, action: () => Promise<unknown>, preferId?: string | null) => {
      setActionError(false);
      try {
        await action();
        await reload(preferId);
      } catch (err) {
        setActionError(true);
        logError(scope, err);
      }
    },
    [reload],
  );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setActionError(false);
    try {
      const id = await createWorkspace(newName);
      setNewName('');
      await reload(id);
    } catch (err) {
      setActionError(true);
      logError('Unable to create workspace', err);
    } finally {
      setCreating(false);
    }
  };

  const selected = workspaces.find((w) => w.id === selectedId) ?? null;

  return (
    <div id="workspaces">
      <p className={historyStyles.subtitle}>{t('workspaces.subtitle')}</p>

      {loading ? (
        <p className={historyStyles.subtle}>{t('workspaces.loading')}</p>
      ) : failed ? (
        <p className={historyStyles.subtle} role="alert">{t('workspaces.error')}</p>
      ) : (
        <>
          <form className={styles.row} onSubmit={handleCreate}>
            <label className={styles.field}>
              <span className={styles.label}>{t('workspaces.createLabel')}</span>
              <input
                className={styles.input}
                value={newName}
                maxLength={WORKSPACE_NAME_MAX}
                placeholder={t('workspaces.createPlaceholder')}
                onChange={(e) => setNewName(e.target.value)}
              />
            </label>
            <button type="submit" className="button button--primary button--sm" disabled={creating || !newName.trim()}>
              {creating ? t('workspaces.creating') : t('workspaces.create')}
            </button>
          </form>

          {actionError ? (
            <p className={styles.error} role="alert">{t('workspaces.actionFailed')}</p>
          ) : null}

          {workspaces.length === 0 ? (
            <p className={historyStyles.subtle}>{t('workspaces.empty')}</p>
          ) : (
            <>
              {workspaces.length > 1 ? (
                <label className={styles.field}>
                  <span className={styles.label}>{t('workspaces.select')}</span>
                  <select
                    className={styles.input}
                    value={selectedId ?? ''}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              {selected ? (
                <WorkspacePanel
                  key={selected.id}
                  workspace={selected}
                  userId={user?.id ?? null}
                  runAction={runAction}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}

type PanelProps = {
  workspace: Workspace;
  userId: string | null;
  runAction: (scope: string, action: () => Promise<unknown>, preferId?: string | null) => Promise<void>;
};

function WorkspacePanel({workspace, userId, runAction}: PanelProps): React.JSX.Element {
  const {t} = useI18n();
  const isOwner = getMyRole(workspace, userId) === 'owner';

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [invitesRevoked, setInvitesRevoked] = useState(false);

  const [form, setForm] = useState({
    name: workspace.name,
    companyName: workspace.companyName ?? '',
    preferredStandards: workspace.preferredStandards ?? '',
  });
  const [savedDefaults, setSavedDefaults] = useState(false);

  const handleInvite = () =>
    runAction('Unable to create invite', async () => {
      setInvitesRevoked(false);
      setInviteCopied(false);
      setInviteUrl(buildInviteUrl(await createInviteCode(workspace.id)));
    }, workspace.id);

  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    void navigator.clipboard.writeText(inviteUrl).then(
      () => setInviteCopied(true),
      (err) => logError('Unable to copy invite link', err),
    );
  };

  const handleRevoke = () =>
    runAction('Unable to revoke invites', async () => {
      await revokeInvites(workspace.id);
      setInviteUrl(null);
      setInvitesRevoked(true);
    }, workspace.id);

  const handleSaveDefaults = (event: React.FormEvent) => {
    event.preventDefault();
    void runAction('Unable to update workspace', async () => {
      await updateWorkspace(workspace.id, form);
      setSavedDefaults(true);
      window.setTimeout(() => setSavedDefaults(false), 2000);
    }, workspace.id);
  };

  const handleRemove = (memberId: string, name: string) => {
    if (!window.confirm(t('workspaces.removeConfirm', {name}))) return;
    void runAction('Unable to remove member', () => removeMember(workspace.id, memberId), workspace.id);
  };

  const handleLeave = () => {
    if (!window.confirm(t('workspaces.leaveConfirm', {name: workspace.name}))) return;
    void runAction('Unable to leave workspace', () => leaveWorkspace(workspace.id), null);
  };

  const handleDelete = () => {
    if (!window.confirm(t('workspaces.deleteConfirm', {name: workspace.name}))) return;
    void runAction('Unable to delete workspace', () => deleteWorkspace(workspace.id), null);
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.workspaceName}>{workspace.name}</h3>

      <section className={styles.block}>
        <h4 className={styles.blockTitle}>
          {t('workspaces.membersTitle', {count: String(workspace.members.length)})}
        </h4>
        <ul className={historyStyles.list}>
          {workspace.members.map((member) => (
            <li key={member.userId} className={historyStyles.item}>
              <div className={historyStyles.itemMain}>
                <span className={historyStyles.itemName}>
                  {member.displayName}
                  {member.userId === userId ? ` (${t('workspaces.you')})` : ''}
                </span>
                <span className={historyStyles.itemDate}>
                  {member.role === 'owner' ? t('workspaces.roleOwner') : t('workspaces.roleMember')}
                </span>
              </div>
              {isOwner && member.userId !== userId ? (
                <div className={historyStyles.itemActions}>
                  <button
                    type="button"
                    className={historyStyles.deleteButton}
                    onClick={() => handleRemove(member.userId, member.displayName)}
                  >
                    {t('workspaces.remove')}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {isOwner ? (
        <section className={styles.block}>
          <h4 className={styles.blockTitle}>{t('workspaces.inviteTitle')}</h4>
          <p className={historyStyles.subtle}>{t('workspaces.inviteHint')}</p>
          {inviteUrl ? (
            <div className={styles.row}>
              <input className={styles.input} value={inviteUrl} readOnly onFocus={(e) => e.target.select()} />
              <button type="button" className="button button--secondary button--sm" onClick={handleCopyInvite}>
                {inviteCopied ? t('workspaces.inviteCopied') : t('workspaces.copyInvite')}
              </button>
            </div>
          ) : null}
          <div className={styles.row}>
            <button type="button" className="button button--secondary button--sm" onClick={() => void handleInvite()}>
              {t('workspaces.createInvite')}
            </button>
            <button type="button" className={historyStyles.deleteButton} onClick={() => void handleRevoke()}>
              {t('workspaces.revokeInvites')}
            </button>
          </div>
          {invitesRevoked ? <p className={historyStyles.subtle}>{t('workspaces.invitesRevoked')}</p> : null}
        </section>
      ) : null}

      <section className={styles.block}>
        <h4 className={styles.blockTitle}>{t('workspaces.defaultsTitle')}</h4>
        <p className={historyStyles.subtle}>
          {t('workspaces.defaultsHint')} {isOwner ? '' : t('workspaces.ownerOnly')}
        </p>
        <form className={styles.defaults} onSubmit={handleSaveDefaults}>
          <label className={styles.field}>
            <span className={styles.label}>{t('workspaces.name')}</span>
            <input
              className={styles.input}
              value={form.name}
              maxLength={WORKSPACE_NAME_MAX}
              disabled={!isOwner}
              onChange={(e) => setForm((f) => ({...f, name: e.target.value}))}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t('workspaces.companyName')}</span>
            <input
              className={styles.input}
              value={form.companyName}
              maxLength={COMPANY_NAME_MAX}
              disabled={!isOwner}
              onChange={(e) => setForm((f) => ({...f, companyName: e.target.value}))}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>{t('workspaces.preferredStandards')}</span>
            <input
              className={styles.input}
              value={form.preferredStandards}
              maxLength={PREFERRED_STANDARDS_MAX}
              placeholder={t('workspaces.preferredStandardsPlaceholder')}
              disabled={!isOwner}
              onChange={(e) => setForm((f) => ({...f, preferredStandards: e.target.value}))}
            />
          </label>
          {isOwner ? (
            <div className={styles.row}>
              <button type="submit" className="button button--primary button--sm" disabled={!form.name.trim()}>
                {savedDefaults ? t('workspaces.saved') : t('workspaces.save')}
              </button>
            </div>
          ) : null}
        </form>
      </section>

      <section className={styles.block}>
        <h4 className={styles.blockTitle}>{t('workspaces.historyTitle')}</h4>
        <SharedHistory workspaceId={workspace.id} userId={userId} isOwner={isOwner} />
      </section>

      <div className={styles.row}>
        <button type="button" className={historyStyles.deleteButton} onClick={handleLeave}>
          {t('workspaces.leave')}
        </button>
        {isOwner ? (
          <button type="button" className={historyStyles.deleteButton} onClick={handleDelete}>
            {t('workspaces.deleteWorkspace')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SharedHistory({workspaceId, userId, isOwner}: {workspaceId: string; userId: string | null; isOwner: boolean}) {
  const {t, tu} = useI18n();
  const [entries, setEntries] = useState<WorkspaceCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void listWorkspaceCalculations(workspaceId)
      .then((rows) => {
        if (isMounted) setEntries(rows);
      })
      .catch((err) => {
        if (isMounted) setFailed(true);
        logError('Unable to load shared history', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  const handleDelete = (id: string) => {
    if (!window.confirm(t('history.deleteConfirm'))) return;
    const previous = entries;
    // Optimistic, restored on failure — same pattern as personal history.
    setEntries((rows) => rows.filter((row) => row.id !== id));
    void deleteWorkspaceCalculation(id).catch((err) => {
      setEntries(previous);
      logError('Unable to delete shared entry', err);
    });
  };

  const displayName = (entry: WorkspaceCalculation) => {
    const known = utilities.find((utility) => utility.id === entry.utilityId);
    return known ? tu(known.id).name || known.name : entry.label || entry.utilityId;
  };

  if (loading) return <p className={historyStyles.subtle}>{t('history.loading')}</p>;
  if (failed) return <p className={historyStyles.subtle} role="alert">{t('history.error')}</p>;

  return (
    <>
      <p className={historyStyles.subtle}>{t('workspaces.historySubtitle', {max: String(MAX_WORKSPACE_ENTRIES)})}</p>
      {entries.length === 0 ? (
        <p className={historyStyles.subtle}>{t('workspaces.historyEmpty')}</p>
      ) : (
        <ul className={historyStyles.list}>
          {entries.map((entry) => {
            const encoded = encodeUtilityState(entry.state);
            const canDelete = isOwner || entry.createdBy === userId;
            return (
              <li key={entry.id} className={historyStyles.item}>
                <div className={historyStyles.itemMain}>
                  <span className={historyStyles.itemName}>{displayName(entry)}</span>
                  <time className={historyStyles.itemDate} dateTime={entry.createdAt}>
                    {new Date(entry.createdAt).toLocaleString()} · {t('workspaces.savedBy', {name: entry.createdByName})}
                  </time>
                </div>
                <div className={historyStyles.itemActions}>
                  {encoded ? (
                    <Link
                      className={historyStyles.openLink}
                      to={`/utilities/${entry.utilityId}/?${SHARE_PARAM}=${encoded}`}
                      data-nobrokenlinkcheck
                    >
                      {t('history.open')}
                    </Link>
                  ) : null}
                  {canDelete ? (
                    <button type="button" className={historyStyles.deleteButton} onClick={() => handleDelete(entry.id)}>
                      {t('history.delete')}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
