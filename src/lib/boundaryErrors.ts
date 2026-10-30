import {reportClientError} from './errorReporting';

/**
 * Errors caught by a React error boundary never reach `window.onerror`, so the
 * global reporter in errorReporting.ts did not see page crashes at all. The
 * swizzled @theme/Error and @theme/ErrorPageContent call this instead.
 *
 * It also recovers from the most common crash after a deploy: a tab opened on
 * the previous build asks for a route chunk whose hashed file no longer
 * exists. A single reload fetches the current HTML and its chunks. A
 * timestamp in sessionStorage keeps a chunk that is genuinely broken from
 * turning that into a reload loop.
 */

const RELOAD_KEY = 'chunk-reload-at';
const RELOAD_WINDOW_MS = 30_000;

const CHUNK_ERROR_PATTERN =
  /Loading (?:CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

function causalChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  let current: unknown = error;
  while (current && chain.length < 5 && !chain.includes(current)) {
    chain.push(current);
    current = (current as {cause?: unknown}).cause;
  }
  return chain;
}

export function isChunkLoadError(error: unknown): boolean {
  return causalChain(error).some((item) => {
    if (!(item instanceof Error)) return false;
    return item.name === 'ChunkLoadError' || CHUNK_ERROR_PATTERN.test(item.message);
  });
}

/** Returns true when a reload was started (the caller can skip its own UI work). */
function reloadOnceForChunkError(): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) ?? '0');
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Without storage there is no way to tell a first attempt from a loop.
    return false;
  }
  window.location.reload();
  return true;
}

const handled = new WeakSet<object>();

export function handleBoundaryError(error: unknown, context: string): void {
  if (typeof window === 'undefined') return;
  if (typeof error === 'object' && error !== null) {
    if (handled.has(error)) return;
    handled.add(error);
  }

  if (isChunkLoadError(error) && reloadOnceForChunkError()) {
    return;
  }

  reportClientError({
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : null,
    context,
  });
}
