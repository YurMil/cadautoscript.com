import {supabase} from '@site/src/lib/supabaseClient';

/**
 * Self-service account actions, backed by SECURITY DEFINER RPCs and the
 * `account-self-delete` edge function. Each RPC re-derives the acting user from
 * the auth session server-side, so these helpers never pass a target id for the
 * caller themselves.
 */

/** Reset the current user's preferences to defaults (removes their settings row). */
export async function resetUserSettings(): Promise<void> {
  const {error} = await supabase.rpc('reset_user_settings');
  if (error) {
    throw new Error(`resetUserSettings: ${error.message}`);
  }
}

/** Wipe the current user's usage analytics. Returns the number of rows removed. */
export async function resetUserAnalytics(): Promise<number> {
  const {data, error} = await supabase.rpc('reset_user_analytics');
  if (error) {
    throw new Error(`resetUserAnalytics: ${error.message}`);
  }
  return typeof data === 'number' ? data : 0;
}

/**
 * Permanently delete the current user's own account. Writes the audit record
 * first (via `request_account_deletion`, which snapshots identity before the
 * cascade), then deletes the auth user through the edge function, then clears
 * the local session. After this resolves the caller should redirect away.
 */
export async function deleteOwnAccount(userId: string): Promise<void> {
  const {error: auditError} = await supabase.rpc('request_account_deletion', {
    p_target: userId,
  });
  if (auditError) {
    throw new Error(`deleteOwnAccount(audit): ${auditError.message}`);
  }

  const {data, error: fnError} = await supabase.functions.invoke(
    'account-self-delete',
    {body: {}},
  );
  if (fnError) {
    throw new Error(`deleteOwnAccount(delete): ${fnError.message}`);
  }
  if (data && typeof data === 'object' && 'error' in data && (data as {error?: string}).error) {
    throw new Error(`deleteOwnAccount(delete): ${(data as {error: string}).error}`);
  }

  // Best-effort local sign-out; the server-side user is already gone.
  try {
    await supabase.auth.signOut();
  } catch {
    /* session is already invalid — ignore */
  }
}
