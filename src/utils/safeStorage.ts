/**
 * localStorage that never throws.
 *
 * Merely touching `window.localStorage` throws a SecurityError when the browser
 * blocks site data (Chrome/Firefox "block cookies", some embedded webviews),
 * and `setItem` throws QuotaExceededError when storage is full or in older
 * Safari private mode. A throw from a render or effect at the root of the app
 * takes the whole page down, so storage is treated as a best-effort cache:
 * reads fall back to `null`, writes report whether they stuck.
 */
function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    const store = storage();
    if (!store) return false;
    store.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    storage()?.removeItem(key);
  } catch {
    /* best effort */
  }
}
