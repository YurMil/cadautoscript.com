export const PAYPAL_LINK = 'https://www.paypal.com/donate/?hosted_button_id=ZDAWJ7N234PWE';
/**
 * Stripe Payment Link URL — create at dashboard.stripe.com/payment-links
 * test mode: 'https://buy.stripe.com/test_00weVd1uSceGgXrb4W8k800'
 */
export const STRIPE_LINK = 'https://buy.stripe.com/4gM9AT1ve2PG76OaZ7dZ600';
export const SUPPORT_LOCAL_PATH = '/support';

/** @deprecated Use PAYPAL_LINK directly */
export const SUPPORT_LINK = PAYPAL_LINK;

export function getSupportDestination(_hostname?: string): {
  href: string;
  openInNewTab: boolean;
} {
  // Always route to the support page so the user can choose PayPal or Stripe
  return {
    href: SUPPORT_LOCAL_PATH,
    openInNewTab: false,
  };
}

export const SUPPORT_TEXT = {
  buttonLabel: 'Support',
  description: 'If this project helps you, you can support its development.',
} as const;
