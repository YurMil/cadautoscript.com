export const PAYPAL_LINK = 'https://www.paypal.com/donate/?hosted_button_id=ZDAWJ7N234PWE';
export const STRIPE_CHECKOUT_API = '/api/create-checkout-session';
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
