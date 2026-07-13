/**
 * Supabase joins can return a related row either as an object or a
 * single-element array depending on the relationship inference; unwrap both.
 */
export function normalizeProfile<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
