import React from 'react';
import type {ActionState} from './types';
import styles from '@site/src/pages/admin/index.module.css';

type Props = {
  open: boolean;
  email: string;
  actionState: ActionState;
  onEmailChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function InviteModal({
  open,
  email,
  actionState,
  onEmailChange,
  onClose,
  onSubmit,
}: Props): React.JSX.Element | null {
  if (!open) {
    return null;
  }
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h3>Invite user</h3>
        <p className={styles.muted}>Отправим приглашение через Supabase Auth.</p>
        <label className={styles.modalLabel}>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className={styles.input}
            placeholder="user@example.com"
          />
        </label>
        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onSubmit}
            disabled={actionState.kind === 'inviting'}
          >
            {actionState.kind === 'inviting' ? 'Sending...' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  );
}
