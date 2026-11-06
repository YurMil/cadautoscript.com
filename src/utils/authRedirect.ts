import siteConfig from '@generated/docusaurus.config';
import {sanitizeReturnTo} from './returnTo';

type AuthRedirectConfig = {
  AUTH_REDIRECT_URL?: string;
};

const {AUTH_REDIRECT_URL} = siteConfig.customFields as AuthRedirectConfig;
const STORAGE_KEY = 'auth:returnTo';

export const getAuthRedirectUrl = (): string | undefined => {
  if (AUTH_REDIRECT_URL) {
    return AUTH_REDIRECT_URL;
  }
  if (typeof window === 'undefined') {
    return undefined;
  }
  return `${window.location.origin}/auth/callback`;
};

export const rememberReturnTo = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, window.location.href);
  } catch {
    /* ignore storage errors */
  }
};

export const consumeReturnTo = (fallback = '/') => {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return sanitizeReturnTo(value, window.location.origin, fallback);
  } catch {
    return fallback;
  }
};
