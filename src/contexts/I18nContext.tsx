import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {en} from '@site/src/i18n/locales/en';
import {
  type Locale,
  type TranslationDict,
  LOCALES,
  DEFAULT_LOCALE,
  detectLocale,
  loadLocale,
  resolveKey,
} from '@site/src/i18n';

type I18nContextType = {
  /** Current active locale code */
  locale: Locale;
  /** Change locale (saves to localStorage, updates <html lang="">) */
  setLocale: (locale: Locale) => void;
  /** Look up a translation key like 'settings.title'. Returns the key on miss. */
  t: (key: string, vars?: Record<string, string>) => string;
  /** Look up a utility's translated name and description by its ID */
  tu: (id: string) => { name: string; description: string };
  /** Look up a mini-game's translated strings by its ID */
  tg: (id: string) => { name: string; subtitle: string; description: string; about: string; note: string; features: string[] };
  /** All available locales with metadata */
  availableLocales: typeof LOCALES;
  /** True while the locale dictionary is loading */
  loadingLocale: boolean;
};

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
  tu: () => ({ name: '', description: '' }),
  tg: () => ({ name: '', subtitle: '', description: '', about: '', note: '', features: [] }),
  availableLocales: LOCALES,
  loadingLocale: false,
});

type I18nProviderProps = {
  children: React.ReactNode;
  /**
   * Optional locale override from UserSettingsContext.
   * When provided, takes priority over localStorage / browser detection.
   */
  preferredLocale?: string | null;
};

export function I18nProvider({children, preferredLocale}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [dict, setDict] = useState<TranslationDict>(en);
  const [loadingLocale, setLoadingLocale] = useState(false);
  // Keep track of whether we've initialised (to avoid double-loading on mount)
  const initialised = useRef(false);
  // Track the latest requested locale to prevent race conditions during async load
  const latestLocaleRequest = useRef<Locale | null>(null);

  // Load dictionary whenever locale changes
  const applyLocale = useCallback(async (next: Locale) => {
    latestLocaleRequest.current = next;
    setLoadingLocale(true);
    const loaded = await loadLocale(next);
    
    // Bail out if another locale was requested while we were loading
    if (latestLocaleRequest.current !== next) return;
    
    setDict(loaded);
    setLocaleState(next);
    setLoadingLocale(false);

    // Update <html lang=""> for accessibility + crawlers
    const meta = LOCALES.find((l) => l.code === next);
    if (meta) {
      document.documentElement.lang = meta.htmlLang;
      document.documentElement.dir = meta.dir;
    }
  }, []);

  // Initialise once on mount
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    const initial = detectLocale(preferredLocale);
    applyLocale(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync locale across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'site-locale' && e.newValue) {
        const match = LOCALES.find((l) => l.code === e.newValue);
        if (match && match.code !== locale) {
          applyLocale(match.code);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [applyLocale, locale]);

  // React to changes in preferredLocale (from UserSettings sync)
  useEffect(() => {
    if (!preferredLocale) return;
    const detected = detectLocale(preferredLocale);
    if (detected !== locale) {
      applyLocale(detected);
    }
  }, [preferredLocale, locale, applyLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      try {
        localStorage.setItem('site-locale', next);
      } catch {
        // ignore
      }
      applyLocale(next);
    },
    [applyLocale],
  );

  /** Translate a dot-notation key, optionally interpolating {var} placeholders. */
  const t = useCallback(
    (key: string, vars?: Record<string, string>): string => {
      let result = resolveKey(dict, key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
      }
      return result;
    },
    [dict],
  );

  /** Look up a utility's translated name and description by its ID */
  const tu = useCallback(
    (id: string): { name: string; description: string } => {
      const utils = (dict as Record<string, unknown>).utilities as
        | Record<string, { name: string; description: string }>
        | undefined;
      return utils?.[id] ?? { name: id, description: '' };
    },
    [dict],
  );

  /** Look up a mini-game's translated strings by its ID */
  const tg = useCallback(
    (id: string): { name: string; subtitle: string; description: string; about: string; note: string; features: string[] } => {
      const games = (dict as Record<string, unknown>).miniGames as
        | Record<string, { name: string; subtitle: string; description: string; about: string; note: string; features: string[] }>
        | undefined;
      return games?.[id] ?? { name: id, subtitle: '', description: '', about: '', note: '', features: [] };
    },
    [dict],
  );

  return (
    <I18nContext.Provider value={{locale, setLocale, t, tu, tg, availableLocales: LOCALES, loadingLocale}}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  return useContext(I18nContext);
}
