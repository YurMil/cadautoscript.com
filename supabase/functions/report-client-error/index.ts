// Client-side error intake (follow-up to issue #98).
//
// The browser used to INSERT into `client_error_log` directly with the anon
// key. That key is public — it ships in the JS bundle — so the per-page-load
// cap and dedupe in src/lib/errorReporting.ts bounded only well-behaved
// clients; anything else could POST unbounded ~8 KB rows to PostgREST. The
// table no longer grants INSERT to anon, and reports come through here instead.
//
// This function runs under the service role and calls record_client_error(),
// which enforces the quota in the same transaction as the insert. The quota is
// keyed on a salted hash of the caller's address: enough to count against,
// never enough to identify anyone. The error log itself still stores no
// identity of any kind.
//
// The response is always the same, whether the report was stored, throttled or
// malformed — a caller who could tell throttling apart from acceptance could
// calibrate against the limit, and the browser has nothing useful to do with
// the difference either way.
import {createClient} from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Mirrors the check constraints on client_error_log. */
const LIMITS = {
  message: 1000,
  stack: 6000,
  source: 300,
  context: 200,
  userAgent: 400,
  locale: 10,
} as const;

/**
 * Bodies larger than this are rejected before parsing. The longest legitimate
 * report is a little under 8 KB of column data; the rest is JSON overhead.
 */
const MAX_BODY_BYTES = 16_000;

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

/**
 * Best-effort client address.
 *
 * `cf-connecting-ip` is written by the edge network and cannot be set by the
 * caller, so it is preferred. The leftmost `x-forwarded-for` entry is the
 * fallback and *is* forgeable, which only costs an attacker a wider spread
 * across quota buckets — the global per-window ceiling in record_client_error()
 * is what actually bounds the damage, and it does not depend on this value.
 */
function clientAddress(req: Request): string {
  const direct = req.headers.get('cf-connecting-ip');
  if (direct) return direct.trim();
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return 'unknown';
}

async function hashAddress(address: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}:${address}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
    });

  // Same answer for every outcome below — see the note at the top.
  const genericOk = () => json({ok: true});

  if (req.method !== 'POST') {
    return json({ok: false, error: 'method-not-allowed'}, 405);
  }

  try {
    const declaredLength = Number(req.headers.get('content-length') ?? '0');
    if (declaredLength > MAX_BODY_BYTES) {
      return genericOk();
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return genericOk();
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return genericOk();
    }

    const message = clean(payload.message, LIMITS.message);
    if (!message) {
      return genericOk();
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // A dedicated salt is preferred, but falling back to the service role key
    // keeps the hash unguessable without adding a deploy step that, if
    // forgotten, would silently make the digests reversible by dictionary.
    const salt = Deno.env.get('ERROR_LOG_IP_SALT') || serviceRoleKey;
    if (!salt || !serviceRoleKey || !supabaseUrl) {
      console.error('[report-client-error] missing environment configuration');
      return genericOk();
    }

    const ipHash = await hashAddress(clientAddress(req), salt);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {persistSession: false, autoRefreshToken: false},
    });

    // The user agent comes from the request headers rather than the body: it is
    // the same value the browser would have sent, and taking it here is one
    // less caller-controlled string to size-check.
    const {error} = await admin.rpc('record_client_error', {
      p_ip_hash: ipHash,
      p_message: message,
      p_stack: clean(payload.stack, LIMITS.stack),
      p_source: clean(payload.source, LIMITS.source),
      p_context: clean(payload.context, LIMITS.context),
      p_user_agent: clean(req.headers.get('user-agent'), LIMITS.userAgent),
      p_locale: clean(payload.locale, LIMITS.locale),
    });

    if (error) {
      console.error('[report-client-error] record failed', error.message);
    }

    return genericOk();
  } catch (err) {
    console.error('[report-client-error] unexpected error', err);
    return genericOk();
  }
});
