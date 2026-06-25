const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 3;

// Lightweight bot filter. This value is sent by the support page and is visible
// in the browser, so it is NOT a secret — it only weeds out unsophisticated
// bots before the real Turnstile + rate-limit checks. Keep it in sync with the
// `x-cadautoscript-payment` header set in src/pages/support.tsx.
const PAYMENT_REQUEST_HEADER = 'x-cadautoscript-payment';
const PAYMENT_REQUEST_HEADER_VALUE = 'support-page';

type CheckoutRequestBody = {
  turnstileToken?: string;
};

// Best-effort in-memory fallback used when Upstash Redis is not configured or
// is temporarily unreachable. On serverless each instance keeps its own map, so
// this is weaker than the centralized limiter, but it prevents a total outage
// (and keeps some friction against bursts) instead of blocking every visitor.
const memoryRateLimitStore = new Map<string, {count: number; expiresAt: number}>();

function incrementInMemoryRateLimit(key: string): number {
  const now = Date.now();
  const existing = memoryRateLimitStore.get(key);

  if (!existing || existing.expiresAt <= now) {
    memoryRateLimitStore.set(key, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000,
    });
    return 1;
  }

  existing.count += 1;
  return existing.count;
}

function getHeader(req: any, name: string): string | undefined {
  const value = req.headers?.[name.toLowerCase()] ?? req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

function getClientIp(req: any): string {
  const realIp = getHeader(req, 'x-real-ip');
  if (realIp) {
    return realIp;
  }

  const forwardedFor = getHeader(req, 'x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress ?? 'unknown';
}

async function incrementUpstashRateLimit(key: string): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Upstash Redis rate limiting is not configured');
  }

  const request = async (command: string, ...args: string[]) => {
    const path = [command, ...args].map(encodeURIComponent).join('/');
    const response = await fetch(`${url.replace(/\/$/, '')}/${path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstash ${command} failed with ${response.status}`);
    }

    return response.json() as Promise<{result?: unknown}>;
  };

  // Create the counter together with its TTL atomically (SET ... EX ... NX).
  // Doing INCR first and EXPIRE second left a window where a failed EXPIRE
  // could keep a key without any expiry, blocking that IP permanently.
  const created = await request('set', key, '1', 'EX', String(RATE_LIMIT_WINDOW_SECONDS), 'NX');
  if (created.result === 'OK') {
    return 1;
  }

  const incrementResult = await request('incr', key);
  const count = Number(incrementResult.result);

  if (!Number.isFinite(count)) {
    throw new Error('Upstash incr returned an invalid counter');
  }

  return count;
}

async function isRateLimited(ip: string): Promise<boolean> {
  const key = `checkout-rate-limit:${ip}`;
  const upstashConfigured = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );

  if (!upstashConfigured) {
    return incrementInMemoryRateLimit(key) > RATE_LIMIT_MAX_REQUESTS;
  }

  try {
    const count = await incrementUpstashRateLimit(key);
    return count > RATE_LIMIT_MAX_REQUESTS;
  } catch (error) {
    console.error('Centralized rate limit failed, falling back to in-memory limiter:', error);
    return incrementInMemoryRateLimit(key) > RATE_LIMIT_MAX_REQUESTS;
  }
}

function parseBody(req: any): CheckoutRequestBody {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as CheckoutRequestBody;
    } catch {
      return {};
    }
  }

  return req.body as CheckoutRequestBody;
}

function getOrigin(req: any): string {
  const configuredUrl = process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (configuredUrl) {
    return configuredUrl.startsWith('http') ? configuredUrl : `https://${configuredUrl}`;
  }

  const host = getHeader(req, 'host') ?? 'cadautoscript.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

async function verifyTurnstileToken(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret || !token) {
    return false;
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    }),
  });

  if (!response.ok) {
    return false;
  }

  const result = await response.json() as {success?: boolean; hostname?: string};
  if (result.success !== true) {
    return false;
  }

  // Optional defense-in-depth: reject tokens solved on an unexpected hostname.
  // Set TURNSTILE_ALLOWED_HOSTNAMES (comma-separated) in production. Left empty,
  // the check is skipped so Vercel preview deployments keep working.
  const allowedHostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  if (allowedHostnames.length > 0 && (!result.hostname || !allowedHostnames.includes(result.hostname))) {
    console.error('Turnstile hostname mismatch:', result.hostname);
    return false;
  }

  return true;
}

async function createStripeCheckoutSession(origin: string): Promise<string | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!secretKey || !priceId) {
    return null;
  }

  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/support/?stripe=success`,
    cancel_url: `${origin}/support/?stripe=cancelled`,
  });

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secretKey}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Stripe Checkout Session creation failed', response.status, errorBody);
    return null;
  }

  const session = await response.json() as {url?: string};
  return session.url ?? null;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({error: 'Method not allowed'});
    }

    if (getHeader(req, PAYMENT_REQUEST_HEADER) !== PAYMENT_REQUEST_HEADER_VALUE) {
      return res.status(403).json({error: 'Forbidden'});
    }

    const ip = getClientIp(req);
    if (await isRateLimited(ip)) {
      return res.status(429).json({error: 'Too many requests'});
    }

    const {turnstileToken} = parseBody(req);
    const isHuman = await verifyTurnstileToken(turnstileToken, ip);
    if (!isHuman) {
      return res.status(403).json({error: 'CAPTCHA validation failed'});
    }

    const checkoutUrl = await createStripeCheckoutSession(getOrigin(req));
    if (!checkoutUrl) {
      return res.status(500).json({error: 'Unable to create checkout session'});
    }

    return res.status(200).json({url: checkoutUrl});
  } catch (error) {
    console.error('Checkout session handler failed:', error);
    return res.status(500).json({error: 'Internal server error'});
  }
}
