/**
 * Classifies auth failures into the few cases a user can actually act on
 * (issue #102).
 *
 * Supabase and the browser surface raw technical strings — "Failed to fetch",
 * "NetworkError when attempting to fetch resource", "Supabase environment
 * variables are not configured" — which are untranslated, unactionable, and
 * leak internals. Showing the class of failure instead lets the UI say
 * something localized and useful, while the original message still goes to
 * the logs for diagnosis.
 */
export type AuthErrorKind = 'offline' | 'unavailable' | 'generic';

const NETWORK_PATTERNS =
  /failed to fetch|networkerror|network request failed|load failed|err_internet|err_network|err_connection|timed? ?out|aborted/i;

const UNAVAILABLE_PATTERNS =
  /not configured|service unavailable|bad gateway|gateway timeout|temporarily unavailable|\b50[234]\b/i;

export function classifyAuthError(error: unknown): AuthErrorKind {
  // A browser that knows it is offline is the most reliable signal available.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'offline';
  }

  const message = error instanceof Error ? error.message : String(error ?? '');
  if (NETWORK_PATTERNS.test(message)) {
    return 'offline';
  }
  if (UNAVAILABLE_PATTERNS.test(message)) {
    return 'unavailable';
  }
  return 'generic';
}

/**
 * i18n key carrying the user-facing message for a classified failure. Shared
 * by the sign-in modal and the OAuth callback page, so both speak the same
 * language about the same failure.
 */
export function authErrorMessageKey(kind: AuthErrorKind): string {
  switch (kind) {
    case 'offline':
      return 'authErrors.offline';
    case 'unavailable':
      return 'authErrors.unavailable';
    default:
      return 'authErrors.generic';
  }
}
