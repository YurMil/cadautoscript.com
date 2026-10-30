import React, {createContext, useContext, useEffect, useState} from 'react';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {logger} from '../lib/logger';
import {safeSetItem} from '../utils/safeStorage';

export type UserSettings = {
  smart_sorting: boolean;
  default_theme: 'light' | 'dark' | 'auto';
  utility_display_mode: 'compact' | 'detailed';
  auto_translation_language: string;
  fullscreen_utilities: boolean;
};

const defaultSettings: UserSettings = {
  smart_sorting: false,
  default_theme: 'auto',
  utility_display_mode: 'compact',
  auto_translation_language: '',
  fullscreen_utilities: false,
};

type UserSettingsContextType = {
  settings: UserSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
};

const UserSettingsContext = createContext<UserSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  updateSettings: async () => {},
});

function getInitialSettings(): UserSettings {
  if (typeof window === 'undefined') return defaultSettings;
  let guestDisplayMode = defaultSettings.utility_display_mode;
  let guestLocale = defaultSettings.auto_translation_language;
  let guestTheme = defaultSettings.default_theme;
  try {
    const legacyCompact = localStorage.getItem('utilities-compact');
    if (legacyCompact !== null) {
      guestDisplayMode = legacyCompact === 'false' ? 'detailed' : 'compact';
    }
    const siteLocale = localStorage.getItem('site-locale');
    if (siteLocale !== null) {
      guestLocale = siteLocale;
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
      guestTheme = savedTheme;
    }
  } catch { /* ignore */ }

  return {
    ...defaultSettings,
    utility_display_mode: guestDisplayMode,
    auto_translation_language: guestLocale,
    default_theme: guestTheme
  };
}

export function UserSettingsProvider({children}: {children: React.ReactNode}) {
  // Start from deterministic defaults so the server-rendered HTML matches the
  // client's first render. Reading localStorage during the initial render would
  // produce different markup on the client (e.g. the compact/detailed view
  // toggle) and trigger a hydration mismatch (React error #418).
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const {user} = useAuthStatus();
  // Keyed on the id, not the object: every token refresh hands out a new User
  // object, which used to refetch (and briefly reset `loading`) once an hour.
  const userId = user?.id ?? null;

  // Apply guest preferences from localStorage only after hydration.
  useEffect(() => {
    setSettings((prev) => ({...prev, ...getInitialSettings()}));
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchSettings = async () => {
      const {data, error} = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!isMounted) return;

      if (data) {
        setSettings({
          smart_sorting: data.smart_sorting ?? defaultSettings.smart_sorting,
          default_theme: data.default_theme ?? defaultSettings.default_theme,
          utility_display_mode: data.utility_display_mode ?? defaultSettings.utility_display_mode,
          auto_translation_language: data.auto_translation_language ?? defaultSettings.auto_translation_language,
          fullscreen_utilities: data.fullscreen_utilities ?? defaultSettings.fullscreen_utilities,
        });
      } else if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching user settings:', error.message);
      } else {
        // No settings exist yet, let's migrate legacy local storage keys
        let initialDisplayMode = defaultSettings.utility_display_mode;
        let initialLanguage = defaultSettings.auto_translation_language;
        try {
          const legacyCompact = localStorage.getItem('utilities-compact');
          if (legacyCompact !== null) {
            initialDisplayMode = legacyCompact === 'false' ? 'detailed' : 'compact';
            localStorage.removeItem('utilities-compact');
          }
          const siteLocale = localStorage.getItem('site-locale');
          if (siteLocale !== null) {
             initialLanguage = siteLocale;
          }
        } catch { /* ignore */ }

        const migratedSettings = {
          ...defaultSettings,
          utility_display_mode: initialDisplayMode,
          auto_translation_language: initialLanguage,
        };

        setSettings(migratedSettings);

        // Persist migrated settings (fire-and-forget, log on error)
        void (async () => {
          const {error: insertErr} = await supabase.from('user_settings').insert({
            user_id: userId,
            ...migratedSettings,
            updated_at: new Date().toISOString(),
          });
          if (insertErr) logger.error('Failed to save migrated settings:', insertErr.message);
        })();
      }
    };

    // `loading` gates applying the theme and locale below, so it has to clear
    // even when the fetch throws — otherwise those effects never run.
    fetchSettings()
      .catch((err) => {
        logger.error('Error fetching user settings:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Sync settings across tabs (for both guests and logged in users, until Realtime is implemented)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'site-locale' && e.newValue) {
        setSettings((prev) => ({ ...prev, auto_translation_language: e.newValue! }));
      }
      if (e.key === 'utilities-compact' && e.newValue) {
        setSettings((prev) => ({
          ...prev,
          utility_display_mode: e.newValue === 'true' ? 'compact' : 'detailed',
        }));
      }
      if (e.key === 'theme' && e.newValue) {
        setSettings((prev) => ({ ...prev, default_theme: e.newValue as UserSettings['default_theme'] }));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = {...settings, ...newSettings};
    setSettings(updated);

    // Always persist to localStorage for instant cross-tab sync (both guest and auth)
    if (newSettings.utility_display_mode) {
      try {
        localStorage.setItem('utilities-compact', newSettings.utility_display_mode === 'compact' ? 'true' : 'false');
      } catch { /* ignore */ }
    }
    if (newSettings.auto_translation_language) {
      try {
        localStorage.setItem('site-locale', newSettings.auto_translation_language);
      } catch { /* ignore */ }
    }
    if (newSettings.default_theme) {
      try {
        localStorage.setItem('theme', newSettings.default_theme);
      } catch { /* ignore */ }
    }

    if (userId) {
      try {
        const {error} = await supabase.from('user_settings').upsert({
          user_id: userId,
          ...updated,
          updated_at: new Date().toISOString(),
        });
        if (error) logger.error('Failed to save user settings:', error.message);
      } catch (err) {
        logger.error('Failed to save user settings:', err);
      }
    }
  };

  // Apply settings automatically when they change
  useEffect(() => {
    if (loading) return;

    // Apply theme
    if (settings.default_theme !== 'auto') {
      document.documentElement.setAttribute('data-theme', settings.default_theme);
      // Unguarded, this threw when site data is blocked and — being an effect
      // in the root provider — took the entire site down with it.
      safeSetItem('theme', settings.default_theme);
    }

    // Persist locale choice to localStorage so I18nContext can pick it up
    // (I18nProvider reads 'site-locale' on mount)
    const lang = settings.auto_translation_language;
    if (lang) {
      safeSetItem('site-locale', lang);
    }
  }, [settings, loading]);

  return (
    <UserSettingsContext.Provider value={{settings, loading, updateSettings}}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  return useContext(UserSettingsContext);
}
