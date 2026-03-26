export const SUPPORT_LINK = 'https://www.paypal.com/donate/?hosted_button_id=ZDAWJ7N234PWE';
export const SUPPORT_LOCAL_PATH = '/support';

export function getSupportDestination(hostname?: string): {
  href: string;
  openInNewTab: boolean;
} {
  const normalized = hostname?.toLowerCase();
  const isLocalHost =
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '0.0.0.0' ||
    normalized === '::1';

  if (isLocalHost) {
    return {
      href: SUPPORT_LOCAL_PATH,
      openInNewTab: false,
    };
  }

  return {
    href: SUPPORT_LINK,
    openInNewTab: true,
  };
}

export const SUPPORT_TEXT = {
  buttonLabel: 'Support',
  description: 'If this project helps you, you can support its development.',
} as const;
