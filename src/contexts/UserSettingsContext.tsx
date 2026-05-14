import React, {createContext, useContext, useEffect, useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from '@site/src/lib/supabaseClient';

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
  auto_translation_language: 'en',
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

export function UserSettingsProvider({children}: {children: React.ReactNode}) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      try {
        const {data} = await supabase.auth.getSession();
        if (isMounted) {
          setUser(data?.session?.user ?? null);
        }
      } catch (err) {
        console.error('Error getting session in settings context', err);
      }
    };

    resolveSession();

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      // Try to load from localStorage for guests so they don't lose preference before logging in
      let guestDisplayMode = defaultSettings.utility_display_mode;
      try {
        const legacyCompact = localStorage.getItem('utilities-compact');
        if (legacyCompact !== null) {
          guestDisplayMode = legacyCompact === 'false' ? 'detailed' : 'compact';
        }
      } catch { /* ignore */ }

      setSettings({
        ...defaultSettings,
        utility_display_mode: guestDisplayMode
      });
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchSettings = async () => {
      const {data, error} = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
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
        console.error('Error fetching user settings:', error.message);
      } else {
        // No settings exist yet, let's migrate legacy local storage keys
        let initialDisplayMode = defaultSettings.utility_display_mode;
        try {
          const legacyCompact = localStorage.getItem('utilities-compact');
          if (legacyCompact !== null) {
            initialDisplayMode = legacyCompact === 'false' ? 'detailed' : 'compact';
            localStorage.removeItem('utilities-compact');
          }
        } catch { /* ignore */ }

        const migratedSettings = {
          ...defaultSettings,
          utility_display_mode: initialDisplayMode,
        };

        setSettings(migratedSettings);

        // Persist migrated settings (fire-and-forget, log on error)
        void (async () => {
          const {error: insertErr} = await supabase.from('user_settings').insert({
            user_id: user.id,
            ...migratedSettings,
            updated_at: new Date().toISOString(),
          });
          if (insertErr) console.error('Failed to save migrated settings:', insertErr.message);
        })();
      }
      
      setLoading(false);
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = {...settings, ...newSettings};
    setSettings(updated);

    if (user) {
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        ...updated,
        updated_at: new Date().toISOString(),
      });
    } else {
      // For guests, we persist the display mode to localStorage so they don't lose it between reloads,
      // and so it can be migrated when they eventually log in.
      if (newSettings.utility_display_mode) {
        try {
          localStorage.setItem('utilities-compact', newSettings.utility_display_mode === 'compact' ? 'true' : 'false');
        } catch { /* ignore */ }
      }
    }
  };

  // Apply settings automatically when they change
  useEffect(() => {
    if (loading) return;

    // Apply theme
    if (settings.default_theme !== 'auto') {
      document.documentElement.setAttribute('data-theme', settings.default_theme);
      localStorage.setItem('theme', settings.default_theme);
    }

    // Persist locale choice to localStorage so I18nContext can pick it up
    // (I18nProvider reads 'site-locale' on mount)
    const lang = settings.auto_translation_language;
    if (lang) {
      try {
        localStorage.setItem('site-locale', lang);
      } catch { /* ignore */ }
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
