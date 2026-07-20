/**
 * Shareable calculation links (issue #113) — shell side.
 *
 * A utility's input state is serialized into the page URL as
 * `?calc=<base64url(JSON)>` with a versioned envelope, so links survive tool
 * updates and old links can be migrated or rejected explicitly. The state
 * itself is defined by each utility app and exchanged over postMessage (see
 * dev-plans/utility-share-protocol.md). Never place personal data in the
 * state — the URL is the transport.
 */

export const SHARE_PARAM = 'calc';
export const SHARE_MESSAGE_SUPPORT = 'cas:share-support';
export const SHARE_MESSAGE_STATE_UPDATE = 'cas:state-update';
export const SHARE_MESSAGE_RESTORE = 'cas:restore-state';
export const SHARE_SCHEMA_VERSION = 1;

/** Keep links comfortably under browser/proxy URL limits. */
const MAX_ENCODED_LENGTH = 2000;

type ShareEnvelope = {v: number; s: unknown};

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): Uint8Array | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Serializes tool state into a URL-safe token. Returns null when there is no
 * state or the payload would produce an oversized URL.
 */
export function encodeUtilityState(state: unknown): string | null {
  if (state === null || state === undefined) return null;
  try {
    const envelope: ShareEnvelope = {v: SHARE_SCHEMA_VERSION, s: state};
    const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(envelope)));
    return encoded.length <= MAX_ENCODED_LENGTH ? encoded : null;
  } catch {
    return null;
  }
}

/**
 * Decodes a `?calc=` token back into tool state. Returns null for missing,
 * malformed, or unsupported-version tokens — a bad link degrades to the
 * tool's defaults instead of an error.
 */
export function decodeUtilityState(encoded: string | null): unknown | null {
  if (!encoded) return null;
  const bytes = fromBase64Url(encoded);
  if (!bytes) return null;
  try {
    const envelope = JSON.parse(new TextDecoder().decode(bytes)) as ShareEnvelope;
    if (!envelope || envelope.v !== SHARE_SCHEMA_VERSION) return null;
    return envelope.s ?? null;
  } catch {
    return null;
  }
}
