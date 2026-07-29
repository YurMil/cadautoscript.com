// Newsletter signup with double opt-in (issue #119).
//
// Runs under the service role because the confirmation token must never reach
// the browser: if the caller learned it, they could confirm an address they do
// not own, which is the one thing double opt-in exists to prevent. The token
// leaves this function only inside the email.
//
// The response is deliberately identical whether the address was new, already
// pending, already confirmed, or rate-limited — otherwise this endpoint would
// answer "is this person subscribed?" for any address someone cares to try.
import {createClient} from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** One confirmation email per address per hour, so signup cannot be used to mailbomb. */
const RESEND_COOLDOWN_MINUTES = 60;
const SUPPORTED_LOCALES = ['en', 'ru', 'ua', 'de', 'es', 'et'];

const SUBJECTS: Record<string, string> = {
  en: 'Confirm your CAD AutoScript subscription',
  ru: 'Подтвердите подписку на CAD AutoScript',
  ua: 'Підтвердьте підписку на CAD AutoScript',
  de: 'Bestätigen Sie Ihr CAD AutoScript-Abonnement',
  es: 'Confirma tu suscripción a CAD AutoScript',
  et: 'Kinnita oma CAD AutoScripti tellimus',
};

const BODIES: Record<string, {intro: string; action: string; ignore: string}> = {
  en: {
    intro: 'You asked to receive updates about new engineering utilities on CAD AutoScript.',
    action: 'Confirm subscription',
    ignore: 'If this was not you, ignore this message — nothing was subscribed.',
  },
  ru: {
    intro: 'Вы запросили обновления о новых инженерных утилитах на CAD AutoScript.',
    action: 'Подтвердить подписку',
    ignore: 'Если это были не вы, просто игнорируйте письмо — подписка не оформлена.',
  },
  ua: {
    intro: 'Ви запросили оновлення про нові інженерні утиліти на CAD AutoScript.',
    action: 'Підтвердити підписку',
    ignore: 'Якщо це були не ви, проігноруйте цей лист — підписку не оформлено.',
  },
  de: {
    intro: 'Sie haben Updates zu neuen Ingenieur-Tools auf CAD AutoScript angefordert.',
    action: 'Abonnement bestätigen',
    ignore: 'Falls Sie das nicht waren, ignorieren Sie diese Nachricht — es wurde nichts abonniert.',
  },
  es: {
    intro: 'Solicitaste recibir novedades sobre nuevas utilidades de ingeniería en CAD AutoScript.',
    action: 'Confirmar suscripción',
    ignore: 'Si no fuiste tú, ignora este mensaje — no se ha suscrito nada.',
  },
  et: {
    intro: 'Soovisid saada uudiseid uute inseneritööriistade kohta CAD AutoScriptis.',
    action: 'Kinnita tellimus',
    ignore: 'Kui see polnud sina, eira seda kirja — midagi ei tellitud.',
  },
};

function buildEmail(locale: string, confirmUrl: string) {
  const copy = BODIES[locale] ?? BODIES.en;
  const text = `${copy.intro}\n\n${copy.action}: ${confirmUrl}\n\n${copy.ignore}`;
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>${copy.intro}</p>
<p><a href="${confirmUrl}" style="display:inline-block;padding:10px 18px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none">${copy.action}</a></p>
<p style="font-size:13px;color:#666">${copy.ignore}</p>
</body></html>`;
  return {subject: SUBJECTS[locale] ?? SUBJECTS.en, text, html};
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

  try {
    const {email, locale} = (await req.json().catch(() => ({}))) as {
      email?: unknown;
      locale?: unknown;
    };

    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email) || email.length > 254) {
      // A malformed address is a client mistake, not an enumeration signal.
      return json({ok: false, error: 'invalid-email'}, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const lang = typeof locale === 'string' && SUPPORTED_LOCALES.includes(locale) ? locale : 'en';

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://cadautoscript.com';
    const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
    const fromAddress = Deno.env.get('NEWSLETTER_FROM') ?? 'CAD AutoScript <noreply@cadautoscript.com>';

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {persistSession: false, autoRefreshToken: false},
    });

    const {data: existing} = await admin
      .from('newsletter_subscribers')
      .select('id, status, token, last_email_sent_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    // Already confirmed: do nothing at all. Re-sending would let anyone spam a
    // known subscriber, and there is nothing to confirm.
    if (existing?.status === 'confirmed') {
      return genericOk();
    }

    if (existing?.last_email_sent_at) {
      const elapsedMinutes = (Date.now() - new Date(existing.last_email_sent_at).getTime()) / 60000;
      if (elapsedMinutes < RESEND_COOLDOWN_MINUTES) {
        return genericOk();
      }
    }

    let token = existing?.token as string | undefined;

    if (existing?.id) {
      // Re-subscribing after unsubscribing, or a repeat request past the
      // cooldown: issue a fresh token so an older link cannot be replayed.
      token = crypto.randomUUID();
      await admin
        .from('newsletter_subscribers')
        .update({status: 'pending', token, locale: lang, last_email_sent_at: new Date().toISOString()})
        .eq('id', existing.id);
    } else {
      token = crypto.randomUUID();
      const {error: insertError} = await admin.from('newsletter_subscribers').insert({
        email: normalizedEmail,
        token,
        locale: lang,
        last_email_sent_at: new Date().toISOString(),
      });
      if (insertError) {
        console.error('[newsletter-subscribe] insert failed', insertError.message);
        return json({ok: false, error: 'storage-failed'}, 500);
      }
    }

    const confirmUrl = `${siteUrl}/newsletter/confirm/?token=${token}`;

    if (!resendKey) {
      // Not configured yet: the subscription is stored as pending, but nothing
      // was sent — say so in the log rather than reporting success silently.
      console.warn('[newsletter-subscribe] RESEND_API_KEY not set; confirmation email not sent');
      return genericOk();
    }

    const {subject, text, html} = buildEmail(lang, confirmUrl);
    const mailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({from: fromAddress, to: [normalizedEmail], subject, text, html}),
    });

    if (!mailResponse.ok) {
      console.error('[newsletter-subscribe] send failed', mailResponse.status, await mailResponse.text());
      // The row stays pending; the visitor can retry after the cooldown.
    }

    return genericOk();
  } catch (error) {
    console.error('[newsletter-subscribe] unexpected error', error);
    return json({ok: false, error: 'unexpected'}, 500);
  }
});
