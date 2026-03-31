export function normalizePrefix(prefix: string) {
  return prefix || 'W';
}

export function escapeRegexValue(value: string) {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function buildSearchRegex(prefix: string, isGlobal = false) {
  const escapedPrefix = escapeRegexValue(normalizePrefix(prefix));
  return new RegExp(`${escapedPrefix}(\\d+)`, isGlobal ? 'g' : '');
}

export function buildBaseNumberRegex(prefix: string) {
  const escapedPrefix = escapeRegexValue(normalizePrefix(prefix));
  return new RegExp(`${escapedPrefix}\\d+`);
}
