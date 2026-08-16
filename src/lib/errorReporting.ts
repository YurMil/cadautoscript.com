import {logger} from './logger';

/**
 * Client-side error reporting (issue #98).
 *
 * Records uncaught errors into the `client_error_log` Supabase table so
 * production failures become visible. Privacy: no user id, no email — only the
 * error, the route, an optional tool context, user agent, and locale.
 *
 * Reports go through the `report-client-error` Edge Function rather than
 * inserting directly. The table used to grant INSERT to anon, which made the
 * caps below the only thing standing between the public anon key and unbounded
 * writes — and they stand on the wrong side of the network. The real limit is
 * now a per-address and per-hour quota enforced in the database.
 *
 * The caps here stay because they are still worth having on this side: they
 * keep a render loop from firing a hundred requests that the server would only
 * throw away.
 *  - production only (dev errors stay in the console);
 *  - per-page-load cap of MAX_REPORTS;
 *  - dedupe by message so a render loop reports once;
 *  - fields truncated to the DB check-constraint limits.
 *
 * The Supabase client is imported dynamically only when the first error is
 * actually reported, so this module adds nothing to the critical path.
 */

const MAX_REPORTS = 10;
const reported = new Set<string>();
let reportCount = 0;

type ClientErrorReport = {
  message: string;
  stack?: string | null;
  context?: string | null;
};

function truncate(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function reportClientError({message, stack, context}: ClientErrorReport): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('[ErrorReporting] (dev, not sent)', message);
    return;
  }
  const key = message.slice(0, 200);
  if (reportCount >= MAX_REPORTS || reported.has(key)) return;
  reported.add(key);
  reportCount += 1;

  void import('./supabaseClient')
    .then(({supabase}) =>
      // The user agent is not sent: the Edge Function reads it from the request
      // headers, where it cannot be dressed up by the caller.
      supabase.functions.invoke('report-client-error', {
        body: {
          message: truncate(message, 1000) ?? 'Unknown error',
          stack: truncate(stack, 6000),
          source: truncate(window.location.pathname, 300) ?? '/',
          context: truncate(context, 200),
          locale: truncate(document.documentElement.lang, 10),
        },
      }),
    )
    .then(({error}) => {
      if (error) logger.error('[ErrorReporting] Failed to store report', error.message);
    })
    .catch(() => {
      // Reporting must never throw — nothing sensible to do if Supabase is down.
    });
}

/**
 * Non-Error rejection reasons (plain objects, response payloads) stringify to
 * "[object Object]", which is useless and makes every such rejection dedupe
 * into one entry. Serialize them instead.
 */
function describeRejection(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === 'object' && reason !== null) {
    try {
      return JSON.stringify(reason).slice(0, 500);
    } catch {
      return String(reason);
    }
  }
  return String(reason);
}

/** Attaches global uncaught-error and unhandled-rejection listeners (idempotent). */
let installed = false;
export function installGlobalErrorReporting(): void {
  if (typeof window === 'undefined' || installed) return;
  installed = true;

  window.addEventListener('error', (event) => {
    // Resource load errors (img/script) surface as plain Events without error info.
    if (!event.message && !event.error) return;
    // Cross-origin scripts report an opaque "Script error." with no stack or
    // location — pure noise, skip it.
    if (event.message === 'Script error.' && !event.error) return;
    reportClientError({
      message: event.message || String(event.error),
      stack: event.error instanceof Error ? event.error.stack : null,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason: unknown = event.reason;
    reportClientError({
      message: `Unhandled rejection: ${describeRejection(reason)}`,
      stack: reason instanceof Error ? reason.stack : null,
    });
  });
}
