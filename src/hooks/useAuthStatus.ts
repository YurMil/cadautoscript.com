import {useEffect, useSyncExternalStore} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from '@site/src/lib/supabaseClient';
import {logger} from '../lib/logger';

const shouldSilence = (message?: string | null) =>
  !message || message.toLowerCase().includes('auth session missing');

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  authChecked: boolean;
};

type AuthSnapshot = {user: User | null; authChecked: boolean};

/**
 * One auth state for the whole app.
 *
 * Every component used to run its own getSession() and onAuthStateChange()
 * subscription, so a page with a navbar, settings provider, reactions and
 * comments held half a dozen listeners whose `authChecked` flipped at
 * different moments — sections signed in one after another, and logic keyed
 * on "checked and signed out" (guest notices, guest usage counters) could run
 * before a pending OAuth exchange finished. The store below starts once, on
 * the first mounted consumer, and `authChecked` turns true only after the
 * redirect has been handled and the stored session read.
 */
const SERVER_SNAPSHOT: AuthSnapshot = {user: null, authChecked: false};
let snapshot: AuthSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let started = false;

/** Same account, same profile revision: keep the old object so consumers keyed on it do not re-run. */
function sameUser(a: User | null, b: User | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.updated_at === b.updated_at && a.email === b.email;
}

function publish(next: Partial<AuthSnapshot>) {
  const user = next.user !== undefined && !sameUser(snapshot.user, next.user) ? next.user : snapshot.user;
  const authChecked = next.authChecked ?? snapshot.authChecked;
  if (user === snapshot.user && authChecked === snapshot.authChecked) return;
  snapshot = {user, authChecked};
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => SERVER_SNAPSHOT;

/**
 * Exchanges an OAuth redirect (?code= / #access_token=) for a session. Runs at
 * most once per page load: concurrent exchanges of the same code fail.
 */
async function handleAuthRedirect(): Promise<void> {
  // /auth/callback runs its own exchange (src/pages/auth/callback.tsx);
  // touching the URL params here would race with it.
  if (window.location.pathname.includes('/auth/callback')) return;

  // Handle implicit flow fragments (e.g., #access_token=... after logout/login)
  const cleanedHash = window.location.hash.replace(/^#+/, '');
  const hashParams = new URLSearchParams(cleanedHash);
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  if (accessToken && refreshToken) {
    try {
      const {error} = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error && !shouldSilence(error.message)) {
        logger.error('[Supabase Auth] Unable to set session from hash', error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to set session from hash.';
      if (!shouldSilence(message)) {
        logger.error('[Supabase Auth] Hash handling failed', message);
      }
    } finally {
      window.location.hash = '';
    }
  }

  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const errorDescription = url.searchParams.get('error_description');

  if (errorDescription && !shouldSilence(errorDescription)) {
    logger.error('[Supabase Auth] Redirect error', errorDescription);
  }

  if (!code) return;

  try {
    const {error} = await supabase.auth.exchangeCodeForSession(code);
    if (error && !shouldSilence(error.message)) {
      logger.error('[Supabase Auth] Unable to exchange code for session', error.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to complete auth redirect.';
    if (!shouldSilence(message)) {
      logger.error('[Supabase Auth] Redirect handling failed', message);
    }
  } finally {
    // Clean URL to avoid re-processing the code param on navigation
    for (const param of ['code', 'state', 'scope', 'auth_type', 'provider', 'error_description']) {
      url.searchParams.delete(param);
    }
    window.history.replaceState({}, '', url.toString());
  }
}

function startAuthStore() {
  if (started || typeof window === 'undefined') return;
  started = true;

  // Lives for the whole page: the store outlives any one consumer.
  supabase.auth.onAuthStateChange((_event, session) => {
    publish({user: session?.user ?? null});
  });

  void (async () => {
    try {
      await handleAuthRedirect();
      const {data, error} = await supabase.auth.getSession();
      if (error && !shouldSilence(error.message)) {
        logger.error('[Supabase Auth] Unable to fetch auth session', error.message);
      }
      publish({user: data?.session?.user ?? null});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch auth session.';
      if (!shouldSilence(message)) {
        logger.error('[Supabase Auth] Unable to fetch auth session', message);
      }
    } finally {
      publish({authChecked: true});
    }
  })();
}

export function useAuthStatus(): AuthState {
  const {user, authChecked} = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    startAuthStore();
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    authChecked,
  };
}
