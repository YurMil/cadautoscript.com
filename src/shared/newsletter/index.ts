import {supabase} from '@site/src/lib/supabaseClient';

/**
 * Newsletter subscription client (issue #119).
 *
 * Signup goes through an Edge Function rather than an RPC on purpose: the
 * confirmation token must stay server-side, because a caller who learned it
 * could confirm an address they do not own. Confirmation and unsubscribe are
 * plain RPCs — possession of the token is the authorisation, and it only ever
 * reached the subscribed mailbox.
 */

export type SubscribeResult = 'ok' | 'invalid-email' | 'failed';
export type ConfirmResult = 'confirmed' | 'already-confirmed' | 'invalid' | 'failed';
export type UnsubscribeResult = 'unsubscribed' | 'already-unsubscribed' | 'invalid' | 'failed';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 254 && EMAIL_PATTERN.test(trimmed);
}

/**
 * Requests a confirmation email. The response is intentionally the same
 * whether the address was new, already pending or already subscribed — the
 * server does not reveal who is on the list.
 */
export async function subscribeToNewsletter(email: string, locale: string): Promise<SubscribeResult> {
  if (!isValidEmail(email)) {
    return 'invalid-email';
  }

  try {
    const {data, error} = await supabase.functions.invoke('newsletter-subscribe', {
      body: {email: email.trim(), locale},
    });

    if (error) return 'failed';
    if (data && typeof data === 'object' && (data as {ok?: unknown}).ok === false) {
      return (data as {error?: string}).error === 'invalid-email' ? 'invalid-email' : 'failed';
    }
    return 'ok';
  } catch {
    return 'failed';
  }
}

export async function confirmSubscription(token: string): Promise<ConfirmResult> {
  try {
    const {data, error} = await supabase.rpc('confirm_newsletter_subscription', {p_token: token});
    if (error) return 'failed';
    return (data as ConfirmResult) ?? 'invalid';
  } catch {
    return 'failed';
  }
}

export async function unsubscribeFromNewsletter(token: string): Promise<UnsubscribeResult> {
  try {
    const {data, error} = await supabase.rpc('unsubscribe_from_newsletter', {p_token: token});
    if (error) return 'failed';
    return (data as UnsubscribeResult) ?? 'invalid';
  } catch {
    return 'failed';
  }
}
