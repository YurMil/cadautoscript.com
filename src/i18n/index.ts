import type {TranslationDict} from './locales/en';

export type {TranslationDict};

export type Locale = 'en' | 'ru' | 'ua' | 'de' | 'es' | 'et';

export type LocaleMeta = {
  code: Locale;
  /** Human-readable name shown in UI */
  label: string;
  /** BCP-47 tag for the HTML lang attribute */
  htmlLang: string;
  /** Emoji flag */
  flag: string;
  dir: 'ltr' | 'rtl';
};

export const LOCALES: LocaleMeta[] = [
  {code: 'en', label: 'English', htmlLang: 'en', flag: '🇬🇧', dir: 'ltr'},
  {code: 'et', label: 'Eesti', htmlLang: 'et', flag: '🇪🇪', dir: 'ltr'},
  {code: 'es', label: 'Español', htmlLang: 'es', flag: '🇪🇸', dir: 'ltr'},
  {code: 'de', label: 'Deutsch', htmlLang: 'de', flag: '🇩🇪', dir: 'ltr'},
  {code: 'ua', label: 'Українська', htmlLang: 'uk', flag: '🇺🇦', dir: 'ltr'},
  {code: 'ru', label: 'Русский', htmlLang: 'ru', flag: '🇷🇺', dir: 'ltr'},
];

export const DEFAULT_LOCALE: Locale = 'en';

/** Detect the best locale from browser/settings. Falls back to 'en'. */
export function detectLocale(stored?: string | null): Locale {
  const candidates: (string | null | undefined)[] = [
    stored,
    typeof localStorage !== 'undefined' ? localStorage.getItem('site-locale') : null,
    typeof navigator !== 'undefined' ? navigator.language : null,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = candidate.toLowerCase().split('-')[0];
    const match = LOCALES.find(
      (l) => l.code === normalized || l.htmlLang === normalized,
    );
    if (match) return match.code;
  }
  return DEFAULT_LOCALE;
}

/**
 * Dynamically import a locale dictionary.
 * Returns English fallback on error.
 */
export async function loadLocale(locale: Locale): Promise<TranslationDict> {
  try {
    switch (locale) {
      case 'ru':
        return (await import('./locales/ru')).ru;
      case 'ua':
        return (await import('./locales/ua')).ua;
      case 'de':
        return (await import('./locales/de')).de;
      case 'es':
        return (await import('./locales/es')).es;
      case 'et':
        return (await import('./locales/et')).et;
      default:
        return (await import('./locales/en')).en;
    }
  } catch {
    return (await import('./locales/en')).en;
  }
}

/**
 * Resolve a nested translation key like 'settings.title'.
 * Returns the key itself if not found.
 */
export function resolveKey(dict: TranslationDict, key: string): string {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = dict;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return key;
    current = current[part];
  }
  if (typeof current === 'string') return current;
  return key;
}
