const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type CheckoutRequestBody = {
  turnstileToken?: string;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function getHeader(req: any, name: string): string | undefined {
  const value = req.headers?.[name.toLowerCase()] ?? req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

function getClientIp(req: any): string {
  const forwardedFor = getHeader(req, 'x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return (
    getHeader(req, 'x-real-ip') ??
    req.socket?.remoteAddress ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
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

  const result = await response.json() as {success?: boolean};
  return result.success === true;
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({error: 'Method not allowed'});
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({error: 'Too many requests'});
  }

  const expectedHeader = process.env.PAYMENT_REQUEST_HEADER_VALUE ?? 'support-page';
  if (getHeader(req, 'x-cadautoscript-payment') !== expectedHeader) {
    return res.status(403).json({error: 'Forbidden'});
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
}
