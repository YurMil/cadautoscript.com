import {useCallback, useEffect, useReducer} from 'react';
import type {User} from '@supabase/supabase-js';
import type {History} from 'history';
import {supabase} from '@site/src/lib/supabaseClient';
import {logger} from '@site/src/lib/logger';
import {normalizeProfile} from '@site/src/utils/normalizeProfile';
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
import type {ActionState, CommentRow, ProfileRow, RoleValue} from './types';

export type TabKey = 'overview' | 'users' | 'comments' | 'usage' | 'audit' | 'settings';

const AUDIT_PAGE_SIZE = 50;

type AdminState = {
  sessionUser: User | null;
  profile: ProfileRow | null;
  loadingAuth: boolean;
  profiles: ProfileRow[];
  comments: CommentRow[];
  loadingUsers: boolean;
  loadingComments: boolean;
  error: string | null;
  toast: string | null;
  actionState: ActionState;
  roleUpdating: string | null;
  utilitiesPublicAccess: boolean;
  settingsLoading: boolean;
  settingsSaving: boolean;
  globalUsage: UtilityPopularity[];
  perUserUsage: AdminUtilityUsageRow[];
  usageLoading: boolean;
  usageLoaded: boolean;
  stats: DashboardStats | null;
  statsLoading: boolean;
  statsLoaded: boolean;
  auditEntries: AuditLogEntry[];
  auditLoading: boolean;
  auditLoaded: boolean;
  auditFilter: AuditEventType | '';
  auditHasMore: boolean;
};

const initialState: AdminState = {
  sessionUser: null,
  profile: null,
  loadingAuth: true,
  profiles: [],
  comments: [],
  loadingUsers: false,
  loadingComments: false,
  error: null,
  toast: null,
  actionState: {kind: 'idle'},
  roleUpdating: null,
  utilitiesPublicAccess: DEFAULT_UTILITIES_PUBLIC_ACCESS,
  settingsLoading: false,
  settingsSaving: false,
  globalUsage: [],
  perUserUsage: [],
  usageLoading: false,
  usageLoaded: false,
  stats: null,
  statsLoading: false,
  statsLoaded: false,
  auditEntries: [],
  auditLoading: false,
  auditLoaded: false,
  auditFilter: '',
  auditHasMore: false,
};

// A `patch` action handles the many independent flag/value updates; the few
// updates that derive from the previous list get dedicated actions so no
// stale-closure snapshots are involved.
type Action =
  | {type: 'patch'; payload: Partial<AdminState>}
  | {type: 'removeProfile'; id: string}
  | {type: 'updateRole'; id: string; role: RoleValue}
  | {type: 'removeComment'; id: string}
  | {type: 'setAudit'; rows: AuditLogEntry[]; hasMore: boolean; append: boolean};

function reducer(state: AdminState, action: Action): AdminState {
  switch (action.type) {
    case 'patch':
      return {...state, ...action.payload};
    case 'removeProfile':
      return {...state, profiles: state.profiles.filter((p) => p.id !== action.id)};
    case 'updateRole':
      return {
        ...state,
        profiles: state.profiles.map((p) => (p.id === action.id ? {...p, role: action.role} : p)),
      };
    case 'removeComment':
      return {...state, comments: state.comments.filter((c) => c.id !== action.id)};
    case 'setAudit':
      return {
        ...state,
        auditEntries: action.append ? [...state.auditEntries, ...action.rows] : action.rows,
        auditHasMore: action.hasMore,
      };
    default:
      return state;
  }
}

/**
 * Owns all server-derived admin state (issue #81): a single reducer plus the
 * data loaders and mutation handlers, so the page component is just layout +
 * local UI state (active tab, invite modal). Behavior is unchanged from the
 * previous ~28-useState version.
 */
export function useAdminData(activeTab: TabKey, history: History) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadProfiles = useCallback(async () => {
    dispatch({type: 'patch', payload: {loadingUsers: true, error: null}});

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
      logger.error('[Admin] Unable to load profiles fallback', profilesFallbackError.message);
    } else if (rawProfiles) {
      const existingIds = new Set(merged.map((p: ProfileRow) => p.id));
      const missing = rawProfiles.filter((p) => !existingIds.has(p.id));
      merged = [...merged, ...missing];
    }

    if (profilesError && !merged.length) {
      logger.error('[Admin] Unable to fetch profiles', profilesError.message);
      dispatch({type: 'patch', payload: {error: 'Unable to load users.'}});
    }

    dispatch({type: 'patch', payload: {profiles: merged as ProfileRow[], loadingUsers: false}});
  }, []);

  const loadSiteSettings = useCallback(async () => {
    dispatch({type: 'patch', payload: {settingsLoading: true}});

    try {
      const {data, error} = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', UTILITIES_PUBLIC_ACCESS_KEY)
        .maybeSingle();

      if (error) {
        logger.error('[Admin] Unable to load site settings', error.message);
        dispatch({type: 'patch', payload: {error: 'Unable to load site settings.'}});
        return;
      }

      const parsed = parseBooleanSetting(data?.value);
      if (parsed !== null) {
        dispatch({type: 'patch', payload: {utilitiesPublicAccess: parsed}});
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load site settings.';
      logger.error('[Admin] Unable to load site settings', message);
      dispatch({type: 'patch', payload: {error: 'Unable to load site settings.'}});
    } finally {
      dispatch({type: 'patch', payload: {settingsLoading: false}});
    }
  }, []);

  const loadUsage = useCallback(async () => {
    dispatch({type: 'patch', payload: {usageLoading: true}});
    try {
      const [global, perUser] = await Promise.all([
        listUtilityPopularity(),
        listAdminUtilityUsage(),
      ]);
      dispatch({type: 'patch', payload: {globalUsage: global, perUserUsage: perUser}});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load usage analytics.';
      logger.error('[Admin] Unable to load usage analytics', message);
      dispatch({type: 'patch', payload: {error: 'Unable to load usage analytics.'}});
    } finally {
      // Mark as loaded even on failure so the lazy-load effect doesn't retry
      // in a loop; the Refresh button still allows a manual retry.
      dispatch({type: 'patch', payload: {usageLoaded: true, usageLoading: false}});
    }
  }, []);

  const loadStats = useCallback(async () => {
    dispatch({type: 'patch', payload: {statsLoading: true}});
    try {
      const result = await getAdminDashboardStats();
      dispatch({type: 'patch', payload: {stats: result}});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load dashboard stats.';
      logger.error('[Admin] Unable to load dashboard stats', message);
      dispatch({type: 'patch', payload: {error: 'Unable to load dashboard stats.'}});
    } finally {
      dispatch({type: 'patch', payload: {statsLoaded: true, statsLoading: false}});
    }
  }, []);

  const loadAudit = useCallback(
    async (opts?: {filter?: AuditEventType | ''; append?: boolean}) => {
      const filter = opts?.filter ?? state.auditFilter;
      const append = opts?.append ?? false;
      dispatch({type: 'patch', payload: {auditLoading: true}});
      try {
        const offset = append ? state.auditEntries.length : 0;
        const rows = await getAdminAuditLog({
          limit: AUDIT_PAGE_SIZE,
          offset,
          eventType: filter === '' ? null : filter,
        });
        dispatch({type: 'setAudit', rows, hasMore: rows.length === AUDIT_PAGE_SIZE, append});
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load audit log.';
        logger.error('[Admin] Unable to load audit log', message);
        dispatch({type: 'patch', payload: {error: 'Unable to load audit log.'}});
      } finally {
        dispatch({type: 'patch', payload: {auditLoaded: true, auditLoading: false}});
      }
    },
    [state.auditFilter, state.auditEntries.length],
  );

  // Access control: fetch session + profile, redirect if not admin.
  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      try {
        const {data: sessionData} = await supabase.auth.getSession();
        if (!isMounted) return;
        const user = sessionData?.session?.user ?? null;
        dispatch({type: 'patch', payload: {sessionUser: user}});
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
          logger.error('[Admin] Unable to fetch profile', profileError.message);
          dispatch({type: 'patch', payload: {error: 'Unable to verify permissions.'}});
          history.replace('/');
          return;
        }

        dispatch({type: 'patch', payload: {profile: profileData ?? null}});
        const isAdmin = profileData?.role === 'admin';
        if (!isAdmin) {
          history.replace('/');
          return;
        }
      } finally {
        if (isMounted) {
          dispatch({type: 'patch', payload: {loadingAuth: false}});
        }
      }
    };

    void checkAccess();
    return () => {
      isMounted = false;
    };
  }, [history]);

  const isAdmin = !state.loadingAuth && state.profile?.role === 'admin';

  // Fetch users
  useEffect(() => {
    if (!isAdmin) return;
    void loadProfiles();
  }, [isAdmin, loadProfiles]);

  // Fetch settings
  useEffect(() => {
    if (!isAdmin) return;
    void loadSiteSettings();
  }, [isAdmin, loadSiteSettings]);

  // Fetch comments
  useEffect(() => {
    if (!isAdmin) return;
    const loadComments = async () => {
      dispatch({type: 'patch', payload: {loadingComments: true, error: null}});
      const {data: comments, error: commentsError} = await supabase
        .from('comments')
        .select('id, user_id, post_slug, content, created_at, profiles:profiles(full_name, username, avatar_url)')
        .order('created_at', {ascending: false})
        .limit(50);

      if (commentsError) {
        logger.error('[Admin] Unable to fetch comments', commentsError.message);
        dispatch({type: 'patch', payload: {error: 'Unable to load comments.', loadingComments: false}});
        return;
      }

      const normalized = (comments ?? []).map((comment) => ({
        ...comment,
        profiles: normalizeProfile(comment.profiles),
      }));
      dispatch({type: 'patch', payload: {comments: normalized, loadingComments: false}});
    };

    void loadComments();
  }, [isAdmin]);

  // Lazy-load usage analytics only when the admin opens the Usage tab.
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'usage' || state.usageLoaded || state.usageLoading) return;
    void loadUsage();
  }, [activeTab, isAdmin, state.usageLoaded, state.usageLoading, loadUsage]);

  // Lazy-load the Overview stats when first opened.
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'overview' || state.statsLoaded || state.statsLoading) return;
    void loadStats();
  }, [activeTab, isAdmin, state.statsLoaded, state.statsLoading, loadStats]);

  // Lazy-load the Audit log when first opened.
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'audit' || state.auditLoaded || state.auditLoading) return;
    void loadAudit();
  }, [activeTab, isAdmin, state.auditLoaded, state.auditLoading, loadAudit]);

  const handleDeleteComment = async (commentId: string) => {
    if (!commentId) return;
    dispatch({type: 'patch', payload: {actionState: {kind: 'deleting', targetId: commentId}}});
    const {error: deleteError} = await supabase.from('comments').delete().eq('id', commentId);
    if (deleteError) {
      logger.error('[Admin] Unable to delete comment', deleteError.message);
      dispatch({
        type: 'patch',
        payload: {error: 'Unable to delete comment. Check RLS or permissions.', actionState: {kind: 'idle'}},
      });
      return;
    }
    dispatch({type: 'removeComment', id: commentId});
    dispatch({type: 'patch', payload: {actionState: {kind: 'idle'}}});
  };

  const handleRoleChange = async (userId: string, newRole: RoleValue) => {
    dispatch({type: 'patch', payload: {roleUpdating: userId, toast: null}});
    const {error: roleError} = await supabase.from('profiles').update({role: newRole}).eq('id', userId);
    if (roleError) {
      logger.error('[Admin] Unable to update role', roleError.message);
      dispatch({type: 'patch', payload: {error: 'Unable to update role.', roleUpdating: null}});
      return;
    }
    dispatch({type: 'updateRole', id: userId, role: newRole});
    dispatch({type: 'patch', payload: {roleUpdating: null, toast: 'Role updated'}});
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId) return;
    if (!window.confirm('Удалить пользователя? Это действие необратимо.')) return;
    dispatch({type: 'patch', payload: {error: null, toast: null, actionState: {kind: 'deleting', targetId: userId}}});
    // Record the deletion in the audit log (snapshotting identity) BEFORE the
    // cascade removes the profile. Non-fatal: proceed with deletion regardless.
    const {error: auditError} = await supabase.rpc('request_account_deletion', {
      p_target: userId,
    });
    if (auditError) {
      logger.warn('[Admin] Unable to write deletion audit entry', auditError.message);
    }
    const {error: fnError} = await supabase.functions.invoke('super-function', {
      body: {action: 'delete', targetUserId: userId},
    });
    if (fnError) {
      logger.error('[Admin] Unable to delete user', fnError.message);
      dispatch({
        type: 'patch',
        payload: {
          error: 'Не удалось удалить пользователя. Проверьте edge function или права.',
          actionState: {kind: 'idle'},
        },
      });
      return;
    }
    dispatch({type: 'removeProfile', id: userId});
    dispatch({type: 'patch', payload: {toast: 'User deleted', actionState: {kind: 'idle'}}});
  };

  const handleToggleUtilitiesAccess = async () => {
    if (state.settingsSaving) return;
    dispatch({type: 'patch', payload: {settingsSaving: true, error: null, toast: null}});
    const nextValue = !state.utilitiesPublicAccess;

    const {error: updateError} = await supabase
      .from('site_settings')
      .upsert(
        {key: UTILITIES_PUBLIC_ACCESS_KEY, value: serializeBooleanSetting(nextValue)},
        {onConflict: 'key'},
      );

    if (updateError) {
      logger.error('[Admin] Unable to update utilities access', updateError.message);
      dispatch({type: 'patch', payload: {error: 'Unable to update utilities access setting.', settingsSaving: false}});
      return;
    }

    dispatch({
      type: 'patch',
      payload: {utilitiesPublicAccess: nextValue, settingsSaving: false, toast: 'Utilities access updated'},
    });
  };

  // Returns true on success so the page can clear its local invite-modal state.
  const inviteUser = async (inviteEmail: string): Promise<boolean> => {
    if (!inviteEmail) {
      dispatch({type: 'patch', payload: {error: 'Введите email для приглашения.'}});
      return false;
    }
    dispatch({type: 'patch', payload: {error: null, toast: null, actionState: {kind: 'inviting'}}});
    const {data: result, error: fnError} = await supabase.functions.invoke('super-function', {
      body: {action: 'invite', email: inviteEmail},
    });
    if (fnError) {
      logger.error('[Admin] Unable to invite user', fnError.message);
      dispatch({
        type: 'patch',
        payload: {
          error: 'Не удалось отправить приглашение. Проверьте edge function или права.',
          actionState: {kind: 'idle'},
        },
      });
      return false;
    }
    dispatch({type: 'patch', payload: {toast: result?.message || 'Invitation sent', actionState: {kind: 'idle'}}});
    void logAdminEvent('user_invited', {email: inviteEmail});
    void loadProfiles();
    return true;
  };

  const handleAuditFilterChange = (value: AuditEventType | '') => {
    dispatch({type: 'patch', payload: {auditFilter: value}});
    void loadAudit({filter: value, append: false});
  };

  return {
    state,
    loadStats,
    loadUsage,
    loadAudit,
    handleDeleteComment,
    handleRoleChange,
    handleDeleteUser,
    handleToggleUtilitiesAccess,
    inviteUser,
    handleAuditFilterChange,
  };
}
