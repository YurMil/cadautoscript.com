import React from 'react';
import {sanitizeHtml} from '@site/src/utils/sanitizeHtml';
import {formatDateTime} from '@site/src/utils/formatDate';
import type {ActionState, CommentRow} from './types';
import styles from '@site/src/pages/admin/index.module.css';

type Props = {
  comments: CommentRow[];
  loadingComments: boolean;
  actionState: ActionState;
  onDeleteComment: (commentId: string) => void;
};

export default function CommentsTab({
  comments,
  loadingComments,
  actionState,
  onDeleteComment,
}: Props): React.JSX.Element {
  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        {loadingComments ? 'Refreshing comments...' : `Showing ${comments.length} comments`}
      </div>
      {comments.length === 0 ? (
        <p className={styles.muted}>No comments found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Author</th>
              <th>Content</th>
              <th>Location</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {comments.map((row) => {
              const author = row.profiles?.full_name || row.profiles?.username || 'Unknown';
              return (
                <tr key={row.id}>
                  <td>
                    <div className={styles.avatar}>
                      {row.profiles?.avatar_url ? (
                        <img src={row.profiles.avatar_url} alt="Avatar" referrerPolicy="no-referrer" />
                      ) : (
                        <span>{(author || 'U').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span dangerouslySetInnerHTML={{__html: sanitizeHtml(row.content)}} />
                  </td>
                  <td>{row.post_slug}</td>
                  <td>{formatDateTime(row.created_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => onDeleteComment(row.id)}
                        disabled={actionState.kind === 'deleting' && actionState.targetId === row.id}
                        title="Delete comment"
                      >
                        {actionState.kind === 'deleting' && actionState.targetId === row.id
                          ? 'Deleting...'
                          : '🗑 Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
