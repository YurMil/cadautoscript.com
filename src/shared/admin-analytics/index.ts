import {supabase} from '@site/src/lib/supabaseClient';
import {logger} from '../../lib/logger';

/**
 * Admin dashboard analytics. All backed by admin-only SECURITY DEFINER RPCs
 * (`get_admin_dashboard_stats`, `get_admin_audit_log`, `log_admin_event`) that
 * raise unless the caller is an admin.
 */

export type AuditEventType =
  | 'account_deleted'
  | 'settings_reset'
  | 'analytics_reset'
  | 'role_changed'
  | 'user_invited';

export type DashboardStats = {
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  activeUsers7d: number;
  deletedAccountsTotal: number;
  deletedAccounts30d: number;
  totalLaunches: number;
  themeDistribution: Record<string, number>;
  languageDistribution: Record<string, number>;
  displayModeDistribution: Record<string, number>;
};

type DashboardStatsRpc = {
  total_users?: number;
  new_users_7d?: number;
  new_users_30d?: number;
  active_users_7d?: number;
  deleted_accounts_total?: number;
  deleted_accounts_30d?: number;
  total_launches?: number;
  theme_distribution?: Record<string, number>;
  language_distribution?: Record<string, number>;
  display_mode_distribution?: Record<string, number>;
};

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const {data, error} = await supabase.rpc('get_admin_dashboard_stats');
  if (error) {
    throw new Error(`getAdminDashboardStats: ${error.message}`);
  }
  const raw = (data ?? {}) as DashboardStatsRpc;
  return {
    totalUsers: raw.total_users ?? 0,
    newUsers7d: raw.new_users_7d ?? 0,
    newUsers30d: raw.new_users_30d ?? 0,
    activeUsers7d: raw.active_users_7d ?? 0,
    deletedAccountsTotal: raw.deleted_accounts_total ?? 0,
    deletedAccounts30d: raw.deleted_accounts_30d ?? 0,
    totalLaunches: raw.total_launches ?? 0,
    themeDistribution: raw.theme_distribution ?? {},
    languageDistribution: raw.language_distribution ?? {},
    displayModeDistribution: raw.display_mode_distribution ?? {},
  };
}

export type AuditLogEntry = {
  id: string;
  eventType: AuditEventType;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  targetId: string | null;
  targetEmail: string | null;
  targetName: string | null;
  targetRole: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type AuditLogRpcRow = {
  id: string;
  event_type: AuditEventType;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  target_id: string | null;
  target_email: string | null;
  target_name: string | null;
  target_role: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function getAdminAuditLog(options?: {
  limit?: number;
  offset?: number;
  eventType?: AuditEventType | null;
}): Promise<AuditLogEntry[]> {
  const {data, error} = await supabase.rpc('get_admin_audit_log', {
    p_limit: options?.limit ?? 100,
    p_offset: options?.offset ?? 0,
    p_event_type: options?.eventType ?? null,
  });
  if (error) {
    throw new Error(`getAdminAuditLog: ${error.message}`);
  }
  return ((data ?? []) as AuditLogRpcRow[]).map((row) => ({
    id: row.id,
    eventType: row.event_type,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    targetId: row.target_id,
    targetEmail: row.target_email,
    targetName: row.target_name,
    targetRole: row.target_role,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  }));
}

/** Log an admin-initiated event that has no dedicated RPC (e.g. invites). */
export async function logAdminEvent(
  eventType: AuditEventType,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const {error} = await supabase.rpc('log_admin_event', {
    p_event_type: eventType,
    p_metadata: metadata,
  });
  if (error) {
    // Non-fatal for the calling flow — surface via console only.
    logger.warn('[admin-analytics] logAdminEvent failed', error.message);
  }
}
