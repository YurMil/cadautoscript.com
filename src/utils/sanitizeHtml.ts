import DOMPurify from 'dompurify';

/**
 * Shared HTML sanitizer for user-generated content (comments, admin views).
 * Falls back to the raw value during SSR where DOMPurify has no DOM.
 */
export function sanitizeHtml(value: string): string {
  if (typeof DOMPurify.sanitize !== 'function') {
    return value;
  }
  return DOMPurify.sanitize(value, {USE_PROFILES: {html: true}});
}
