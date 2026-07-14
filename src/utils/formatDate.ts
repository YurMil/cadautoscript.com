const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

/**
 * Shared timestamp formatter (comments, admin tables).
 * Returns '-' for missing values.
 */
export function formatDateTime(value?: string | null): string {
  return value ? new Date(value).toLocaleString(undefined, DATE_TIME_OPTIONS) : '-';
}
