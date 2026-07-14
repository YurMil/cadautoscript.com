import React, {useCallback, useEffect, useMemo, useState} from 'react';
import clsx from 'clsx';
import {useHistory} from '@docusaurus/router';
import type {User} from '@supabase/supabase-js';
import Layout from '@theme/Layout';
import {sanitizeHtml} from '@site/src/utils/sanitizeHtml';
import {formatDateTime} from '@site/src/utils/formatDate';
import {normalizeProfile} from '@site/src/utils/normalizeProfile';
import {supabase} from '@site/src/lib/supabaseClient';
import {
  DEFAULT_UTILITIES_PUBLIC_ACCESS,
  UTILITIES_PUBLIC_ACCESS_KEY,
  parseBooleanSetting,
  serializeBooleanSetting,
} from '@site/src/utils/siteSettings';
import {
  listUtilityPopularity,
  listAdminUtilityUsage,
  type UtilityPopularity,
  type AdminUtilityUsageRow,
} from '@site/src/shared/utility-usage';
import {
  getAdminDashboardStats,
  getAdminAuditLog,
  logAdminEvent,
  type DashboardStats,
  type AuditLogEntry,
  type AuditEventType,
} from '@site/src/shared/admin-analytics';
import {utilities} from '@site/src/data/utilities';
import UsageRanking from '@site/src/components/UtilityUsage/UsageRanking';
import styles from './index.module.css';

type RoleValue = 'user' | 'author' | 'admin';

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: RoleValue | null;
  created_at: string | null;
  email?: string | null;
  last_seen_at?: string | null;
};

type CommentRow = {
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

type TabKey = 'overview' | 'users' | 'comments' | 'usage' | 'audit' | 'settings';

const AUDIT_PAGE_SIZE = 50;

const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  account_deleted: 'Account deleted',
  settings_reset: 'Settings reset',
  analytics_reset: 'Analytics reset',
  role_changed: 'Role changed',
  user_invited: 'User invited',
};

const AUDIT_EVENT_CHIP: Record<AuditEventType, string> = {
  account_deleted: 'chipDeleted',
  settings_reset: 'chipReset',
  analytics_reset: 'chipReset',
  role_changed: 'chipRole',
  user_invited: 'chipInvite',
};

const utilityNameById = new Map(utilities.map((u) => [u.id, u.name]));

const initialState: {profiles: ProfileRow[]; comments: CommentRow[]} = {
  profiles: [],
  comments: [],
};

type ActionState =
  | {kind: 'idle'}
  | {kind: 'deleting'; targetId: string | null}
  | {kind: 'inviting'};

export default function AdminPage(): React.JSX.Element {
  const history = useHistory();
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [data, setData] = useState(initialState);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>({kind: 'idle'});
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [utilitiesPublicAccess, setUtilitiesPublicAccess] = useState(DEFAULT_UTILITIES_PUBLIC_ACCESS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [globalUsage, setGlobalUsage] = useState<UtilityPopularity[]>([]);
  const [perUserUsage, setPerUserUsage] = useState<AdminUtilityUsageRow[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageLoaded, setUsageLoaded] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [auditFilter, setAuditFilter] = useState<AuditEventType | ''>('');
  const [auditHasMore, setAuditHasMore] = useState(false);

  const loadProfiles = useCallback(async () => {
    setLoadingUsers(true);
    setError(null);

    const {data: rpcProfiles, error: profilesError} = await supabase
      .rpc('get_admin_users_list')
      .order('created_at', {ascending: false});

    let merged = rpcProfiles ?? [];

    // Fallback: fetch profiles directly to catch records that may not join with auth.users
    const {data: rawProfiles, error: profilesFallbackError} = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, role, created_at, last_seen_at, email')
      .order('created_at', {ascending: false});

    if (profilesFallbackError) {
      console.error('[Admin] Unable to load profiles fallback', profilesFallbackError.message);
    } else if (rawProfiles) {
      const existingIds = new Set(merged.map((p: ProfileRow) => p.id));
      const missing = rawProfiles.filter((p) => !existingIds.has(p.id));
      merged = [...merged, ...missing];
    }

    if (profilesError && !merged.length) {
      console.error('[Admin] Unable to fetch profiles', profilesError.message);
      setError('Unable to load users.');
    }

    setData((prev) => ({...prev, profiles: merged as ProfileRow[]}));
    setLoadingUsers(false);
  }, []);

  const loadSiteSettings = useCallback(async () => {
    setSettingsLoading(true);

    try {
      const {data, error} = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', UTILITIES_PUBLIC_ACCESS_KEY)
        .maybeSingle();

      if (error) {
        console.error('[Admin] Unable to load site settings', error.message);
        setError('Unable to load site settings.');
        return;
      }

      const parsed = parseBooleanSetting(data?.value);
      if (parsed !== null) {
        setUtilitiesPublicAccess(parsed);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load site settings.';
      console.error('[Admin] Unable to load site settings', message);
      setError('Unable to load site settings.');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const loadUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const [global, perUser] = await Promise.all([
        listUtilityPopularity(),
        listAdminUtilityUsage(),
      ]);
      setGlobalUsage(global);
      setPerUserUsage(perUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load usage analytics.';
      console.error('[Admin] Unable to load usage analytics', message);
      setError('Unable to load usage analytics.');
    } finally {
      // Mark as loaded even on failure so the lazy-load effect doesn't retry
      // in a loop; the Refresh button still allows a manual retry.
      setUsageLoaded(true);
      setUsageLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await getAdminDashboardStats();
      setStats(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load dashboard stats.';
      console.error('[Admin] Unable to load dashboard stats', message);
      setError('Unable to load dashboard stats.');
    } finally {
      setStatsLoaded(true);
      setStatsLoading(false);
    }
  }, []);

  const loadAudit = useCallback(
    async (opts?: {filter?: AuditEventType | ''; append?: boolean}) => {
      const filter = opts?.filter ?? auditFilter;
      const append = opts?.append ?? false;
      setAuditLoading(true);
      try {
        const offset = append ? auditEntries.length : 0;
        const rows = await getAdminAuditLog({
          limit: AUDIT_PAGE_SIZE,
          offset,
          eventType: filter === '' ? null : filter,
        });
        setAuditEntries((prev) => (append ? [...prev, ...rows] : rows));
        setAuditHasMore(rows.length === AUDIT_PAGE_SIZE);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load audit log.';
        console.error('[Admin] Unable to load audit log', message);
        setError('Unable to load audit log.');
      } finally {
        setAuditLoaded(true);
        setAuditLoading(false);
      }
    },
    [auditFilter, auditEntries.length],
  );

  // Access control: fetch session + profile, redirect if not admin.
  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      try {
        const {data: sessionData} = await supabase.auth.getSession();
        if (!isMounted) return;
        const user = sessionData?.session?.user ?? null;
        setSessionUser(user);
        if (!user) {
          history.replace('/');
          return;
        }

        const {data: profileData, error: profileError} = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, role, created_at')
          .eq('id', user.id)
          .maybeSingle();

        if (!isMounted) return;
        if (profileError) {
          console.error('[Admin] Unable to fetch profile', profileError.message);
          setError('Unable to verify permissions.');
          history.replace('/');
          return;
        }

        setProfile(profileData ?? null);
        const isAdmin = profileData?.role === 'admin';
        if (!isAdmin) {
          history.replace('/');
          return;
        }
      } finally {
        if (isMounted) {
          setLoadingAuth(false);
        }
      }
    };

    void checkAccess();
    return () => {
      isMounted = false;
    };
  }, [history]);

  // Fetch users
  useEffect(() => {
    if (loadingAuth || profile?.role !== 'admin') {
      return;
    }
    void loadProfiles();
  }, [loadProfiles, loadingAuth, profile?.role]);

  // Fetch settings
  useEffect(() => {
    if (loadingAuth || profile?.role !== 'admin') {
      return;
    }
    void loadSiteSettings();
  }, [loadSiteSettings, loadingAuth, profile?.role]);

  // Fetch comments
  useEffect(() => {
    if (loadingAuth || profile?.role !== 'admin') {
      return;
    }
    const loadComments = async () => {
      setLoadingComments(true);
      setError(null);
      const {data: comments, error: commentsError} = await supabase
        .from('comments')
        .select('id, user_id, post_slug, content, created_at, profiles:profiles(full_name, username, avatar_url)')
        .order('created_at', {ascending: false})
        .limit(50);

      if (commentsError) {
        console.error('[Admin] Unable to fetch comments', commentsError.message);
        setError('Unable to load comments.');
        setLoadingComments(false);
        return;
      }

      const normalized = (comments ?? []).map((comment) => ({
        ...comment,
        profiles: normalizeProfile(comment.profiles),
      }));
      setData((prev) => ({...prev, comments: normalized}));
      setLoadingComments(false);
    };

    void loadComments();
  }, [loadingAuth, profile?.role]);

  // Lazy-load usage analytics only when the admin opens the Usage tab.
  useEffect(() => {
    if (loadingAuth || profile?.role !== 'admin') {
      return;
    }
    if (activeTab !== 'usage' || usageLoaded || usageLoading) {
      return;
    }
    void loadUsage();
  }, [activeTab, loadingAuth, profile?.role, usageLoaded, usageLoading, loadUsage]);

  // Lazy-load the Overview stats when first opened.
  useEffect(() => {
    if (loadingAuth || profile?.role !== 'admin') {
      return;
    }
    if (activeTab !== 'overview' || statsLoaded || statsLoading) {
      return;
    }
    void loadStats();
  }, [activeTab, loadingAuth, profile?.role, statsLoaded, statsLoading, loadStats]);

  // Lazy-load the Audit log when first opened.
  useEffect(() => {
    if (loadingAuth || profile?.role !== 'admin') {
      return;
    }
    if (activeTab !== 'audit' || auditLoaded || auditLoading) {
      return;
    }
    void loadAudit();
  }, [activeTab, loadingAuth, profile?.role, auditLoaded, auditLoading, loadAudit]);

  const handleDeleteComment = async (commentId: string) => {
    if (!commentId) return;
    setActionState({kind: 'deleting', targetId: commentId});
    const {error: deleteError} = await supabase.from('comments').delete().eq('id', commentId);
    if (deleteError) {
      console.error('[Admin] Unable to delete comment', deleteError.message);
      setError('Unable to delete comment. Check RLS or permissions.');
      setActionState({kind: 'idle'});
      return;
    }
    setData((prev) => ({
      ...prev,
      comments: prev.comments.filter((c) => c.id !== commentId),
    }));
    setActionState({kind: 'idle'});
  };

  const displayName = useMemo(
    () => profile?.full_name || profile?.username || sessionUser?.email || 'Admin',
    [profile?.full_name, profile?.username, sessionUser?.email],
  );

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

  const handleRoleChange = async (userId: string, newRole: RoleValue) => {
    setRoleUpdating(userId);
    setToast(null);
    const {error: roleError} = await supabase.from('profiles').update({role: newRole}).eq('id', userId);
    if (roleError) {
      console.error('[Admin] Unable to update role', roleError.message);
      setError('Unable to update role.');
      setRoleUpdating(null);
      return;
    }
    setData((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => (p.id === userId ? {...p, role: newRole} : p)),
    }));
    setRoleUpdating(null);
    setToast('Role updated');
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId) return;
    if (!window.confirm('Удалить пользователя? Это действие необратимо.')) return;
    setError(null);
    setToast(null);
    setActionState({kind: 'deleting', targetId: userId});
    // Record the deletion in the audit log (snapshotting identity) BEFORE the
    // cascade removes the profile. Non-fatal: proceed with deletion regardless.
    const {error: auditError} = await supabase.rpc('request_account_deletion', {
      p_target: userId,
    });
    if (auditError) {
      console.warn('[Admin] Unable to write deletion audit entry', auditError.message);
    }
    const {error: fnError} = await supabase.functions.invoke('super-function', {
      body: {action: 'delete', targetUserId: userId},
    });
    if (fnError) {
      console.error('[Admin] Unable to delete user', fnError.message);
      setError('Не удалось удалить пользователя. Проверьте edge function или права.');
      setActionState({kind: 'idle'});
      return;
    }
    setData((prev) => ({
      ...prev,
      profiles: prev.profiles.filter((p) => p.id !== userId),
    }));
    setToast('User deleted');
    setActionState({kind: 'idle'});
  };

  const handleToggleUtilitiesAccess = async () => {
    if (settingsSaving) return;
    setSettingsSaving(true);
    setError(null);
    setToast(null);
    const nextValue = !utilitiesPublicAccess;

    const {error: updateError} = await supabase
      .from('site_settings')
      .upsert(
        {key: UTILITIES_PUBLIC_ACCESS_KEY, value: serializeBooleanSetting(nextValue)},
        {onConflict: 'key'},
      );

    if (updateError) {
      console.error('[Admin] Unable to update utilities access', updateError.message);
      setError('Unable to update utilities access setting.');
      setSettingsSaving(false);
      return;
    }

    setUtilitiesPublicAccess(nextValue);
    setSettingsSaving(false);
    setToast('Utilities access updated');
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      setError('Введите email для приглашения.');
      return;
    }
    setError(null);
    setToast(null);
    setActionState({kind: 'inviting'});
    const {data: result, error: fnError} = await supabase.functions.invoke('super-function', {
      body: {action: 'invite', email: inviteEmail},
    });
    if (fnError) {
      console.error('[Admin] Unable to invite user', fnError.message);
      setError('Не удалось отправить приглашение. Проверьте edge function или права.');
      setActionState({kind: 'idle'});
      return;
    }
    setToast(result?.message || 'Invitation sent');
    void logAdminEvent('user_invited', {email: inviteEmail});
    setInviteEmail('');
    setInviteOpen(false);
    setActionState({kind: 'idle'});
    void loadProfiles();
  };

  const handleAuditFilterChange = (value: AuditEventType | '') => {
    setAuditFilter(value);
    void loadAudit({filter: value, append: false});
  };

  const renderDistribution = (title: string, dist: Record<string, number>) => {
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

  if (loadingAuth) {
    return (
      <Layout title="Admin">
        <main className={styles.main}>
          <p className={styles.muted}>Checking access...</p>
        </main>
      </Layout>
    );
  }

  // In case redirect failed for any reason.
  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <Layout title="Admin" description="Moderate users and comments.">
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <p className={styles.subtle}>Signed in as {displayName} (admin)</p>
            <h1 className={styles.title}>Admin Dashboard</h1>
          </div>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'comments' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              Comments
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'usage' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('usage')}
            >
              Usage
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'audit' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              Audit
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'settings' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>
        </div>

        {error ? <div className={styles.alert}>{error}</div> : null}
        {toast ? <div className={clsx(styles.alert, styles.alertSuccess)}>{toast}</div> : null}

        {activeTab === 'overview' ? (
          <section className={styles.panel}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                {statsLoading ? 'Loading dashboard...' : 'Site overview'}
              </div>
              <div className={styles.toolbarRight}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => void loadStats()}
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
        ) : null}

        {activeTab === 'users' ? (
          <section className={styles.panel}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                {loadingUsers ? 'Refreshing users...' : `${data.profiles.length} users`}
              </div>
              <div className={styles.toolbarRight}>
                <button type="button" className={styles.primaryBtn} onClick={() => setInviteOpen(true)}>
                  + Invite user
                </button>
              </div>
            </div>
            {data.profiles.length === 0 ? (
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
                  {data.profiles.map((row) => (
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
                          onChange={(event) => handleRoleChange(row.id, event.target.value as RoleValue)}
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
                            onClick={() => handleDeleteUser(row.id)}
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
        ) : null}

        {activeTab === 'comments' ? (
          <section className={styles.panel}>
            <div className={styles.toolbar}>
              {loadingComments ? 'Refreshing comments...' : `Showing ${data.comments.length} comments`}
            </div>
            {data.comments.length === 0 ? (
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
                  {data.comments.map((row) => {
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
                              onClick={() => handleDeleteComment(row.id)}
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
        ) : null}

        {activeTab === 'usage' ? (
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
                  onClick={() => void loadUsage()}
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
        ) : null}

        {activeTab === 'audit' ? (
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
                  onChange={(e) => handleAuditFilterChange(e.target.value as AuditEventType | '')}
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
                  onClick={() => void loadAudit({append: false})}
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
                        onClick={() => void loadAudit({append: true})}
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
        ) : null}

        {activeTab === 'settings' ? (
          <section className={styles.panel}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                {settingsLoading ? 'Loading settings...' : 'Utilities access'}
              </div>
              <div className={styles.toolbarRight}>
                <button
                  type="button"
                  className={utilitiesPublicAccess ? styles.secondaryBtn : styles.primaryBtn}
                  onClick={handleToggleUtilitiesAccess}
                  disabled={settingsLoading || settingsSaving}
                >
                  {settingsSaving
                    ? 'Saving...'
                    : utilitiesPublicAccess
                    ? 'Disable public access'
                    : 'Enable public access'}
                </button>
              </div>
            </div>
            <p className={styles.muted}>
              When enabled, all utilities open without sign-in. When disabled, only the first three are free.
            </p>
            <p className={styles.subtle}>
              Status: {utilitiesPublicAccess ? 'Open to all visitors' : 'Sign-in required for most utilities'}
            </p>
          </section>
        ) : null}

        {inviteOpen ? (
          <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
              <h3>Invite user</h3>
              <p className={styles.muted}>Отправим приглашение через Supabase Auth.</p>
              <label className={styles.modalLabel}>
                Email
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className={styles.input}
                  placeholder="user@example.com"
                />
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setInviteOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleInviteUser}
                  disabled={actionState.kind === 'inviting'}
                >
                  {actionState.kind === 'inviting' ? 'Sending...' : 'Send invite'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </Layout>
  );
}
