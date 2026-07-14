import type {AuditEventType} from '@site/src/shared/admin-analytics';

export type RoleValue = 'user' | 'author' | 'admin';

export type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: RoleValue | null;
  created_at: string | null;
  email?: string | null;
  last_seen_at?: string | null;
};

export type CommentRow = {
  id: string;
  user_id: string;
  post_slug: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

export type ActionState =
  | {kind: 'idle'}
  | {kind: 'deleting'; targetId: string | null}
  | {kind: 'inviting'};

export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  account_deleted: 'Account deleted',
  settings_reset: 'Settings reset',
  analytics_reset: 'Analytics reset',
  role_changed: 'Role changed',
  user_invited: 'User invited',
};

export const AUDIT_EVENT_CHIP: Record<AuditEventType, string> = {
  account_deleted: 'chipDeleted',
  settings_reset: 'chipReset',
  analytics_reset: 'chipReset',
  role_changed: 'chipRole',
  user_invited: 'chipInvite',
};
