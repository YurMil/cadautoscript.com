import React from 'react';
import {formatDateTime} from '@site/src/utils/formatDate';
import type {ActionState, ProfileRow, RoleValue} from './types';
import styles from '@site/src/pages/admin/index.module.css';

type Props = {
  profiles: ProfileRow[];
  loadingUsers: boolean;
  roleUpdating: string | null;
  actionState: ActionState;
  onRoleChange: (userId: string, role: RoleValue) => void;
  onDeleteUser: (userId: string) => void;
  onOpenInvite: () => void;
};

const formatRelative = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Online';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleString();
};

export default function UsersTab({
  profiles,
  loadingUsers,
  roleUpdating,
  actionState,
  onRoleChange,
  onDeleteUser,
  onOpenInvite,
}: Props): React.JSX.Element {
  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {loadingUsers ? 'Refreshing users...' : `${profiles.length} users`}
        </div>
        <div className={styles.toolbarRight}>
          <button type="button" className={styles.primaryBtn} onClick={onOpenInvite}>
            + Invite user
          </button>
        </div>
      </div>
      {profiles.length === 0 ? (
        <p className={styles.muted}>No users found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Role</th>
              <th>Last Seen</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className={styles.avatar}>
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt="Avatar" referrerPolicy="no-referrer" />
                    ) : (
                      <span>{(row.full_name || row.username || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </td>
                <td>{row.full_name || '-'}</td>
                <td>{row.email || '-'}</td>
                <td>{row.username || '-'}</td>
                <td>
                  <select
                    value={row.role || 'user'}
                    onChange={(event) => onRoleChange(row.id, event.target.value as RoleValue)}
                    disabled={roleUpdating === row.id}
                    className={styles.roleSelect}
                  >
                    <option value="user">user</option>
                    <option value="author">author</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{formatRelative(row.last_seen_at)}</td>
                <td>{formatDateTime(row.created_at)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => onDeleteUser(row.id)}
                      disabled={actionState.kind === 'deleting' && actionState.targetId === row.id}
                    >
                      {actionState.kind === 'deleting' && actionState.targetId === row.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
