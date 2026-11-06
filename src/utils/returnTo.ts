// Kept free of Docusaurus imports so scripts/tests can load it directly.

/**
 * Only same-origin pages are valid return targets, and never the callback
 * itself: a sign-in started from the callback's error page would otherwise
 * land back on `/auth/callback?code=…` with a spent code and fail again.
 */
export const sanitizeReturnTo = (value: string | null, origin: string, fallback = '/'): string => {
  if (!value) return fallback;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return fallback;
    if (/\/auth\/callback\/?$/.test(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
};
