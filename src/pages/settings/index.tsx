import React, {useEffect, useState} from 'react';
import clsx from 'clsx';
import type {User} from '@supabase/supabase-js';
import Layout from '@theme/Layout';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import styles from './index.module.css';
import {useColorMode} from '@docusaurus/theme-common';

type UserSettings = {
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

const shouldSilence = (message?: string | null) =>
  !message || message.toLowerCase().includes('auth session missing');

function SettingsContent(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [promptedLogin, setPromptedLogin] = useState(false);
  const {openLoginModal} = useAuthModal();
  const {setColorMode} = useColorMode();

  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      try {
        const {data, error} = await supabase.auth.getSession();
        if (!isMounted) {
          return;
        }
        if (error && !shouldSilence(error.message)) {
          console.error('[Supabase Auth] Unable to fetch session', error.message);
        }
        setUser(data?.session?.user ?? null);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Unable to fetch auth session.';
        console.error('[Supabase Auth] Unable to fetch session', message);
      } finally {
        if (isMounted) {
          setAuthChecked(true);
        }
      }
    };

    resolveSession();

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authChecked && !user && !promptedLogin) {
      openLoginModal();
      setPromptedLogin(true);
      setLoading(false);
    }
  }, [authChecked, openLoginModal, promptedLogin, user]);

  useEffect(() => {
    if (!user) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchSettings = async () => {
      const {data, error: settingsError} = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (settingsError && !shouldSilence(settingsError.message)) {
        console.error('[Supabase Settings] Unable to load settings', settingsError.message);
        setError('Unable to load your settings. Please try again.');
      }

      if (data) {
        setSettings({
          smart_sorting: data.smart_sorting,
          default_theme: data.default_theme,
          utility_display_mode: data.utility_display_mode,
          auto_translation_language: data.auto_translation_language,
          fullscreen_utilities: data.fullscreen_utilities,
        });
      }
      setLoading(false);
    };

    void fetchSettings();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleChange = (field: keyof UserSettings, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);

    const {error: upsertError} = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        smart_sorting: settings.smart_sorting,
        default_theme: settings.default_theme,
        utility_display_mode: settings.utility_display_mode,
        auto_translation_language: settings.auto_translation_language,
        fullscreen_utilities: settings.fullscreen_utilities,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      console.error('[Supabase Settings] Unable to save settings', upsertError.message);
      setError('Unable to save your settings. Please try again.');
      setSaving(false);
      return;
    }

    setSuccess('Settings saved successfully.');
    
    // Apply theme change locally immediately if needed
    if (settings.default_theme !== 'auto') {
      setColorMode(settings.default_theme);
    }

    setSaving(false);
  };

  const renderUnauthed = () => (
    <div className={styles.guard}>
      <p className={styles.eyebrow}>Settings</p>
      <h1 className={styles.title}>Sign in to view settings</h1>
      <p className={styles.subtle}>
        This page is protected. Start a session to view or edit your personal settings.
      </p>
      <div className={styles.guardActions}>
        <a className="button button--primary" href="/">
          Return home
        </a>
        <button type="button" className="button button--secondary" onClick={openLoginModal}>
          Open sign in
        </button>
      </div>
    </div>
  );

  return (
    <main className={styles.main}>
      <section className={styles.panel}>
          {authChecked && !user ? (
            renderUnauthed()
          ) : (
            <>
              <header className={styles.header}>
                <p className={styles.eyebrow}>Preferences</p>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.subtle}>Manage your site preferences and personalization.</p>
              </header>

              {error ? (
                <div className={clsx(styles.alert, styles.alertError)}>{error}</div>
              ) : null}
              {success ? (
                <div className={clsx(styles.alert, styles.alertSuccess)}>{success}</div>
              ) : null}

              {loading ? (
                <div className={styles.loading}>Loading your settings...</div>
              ) : (
                <form className={styles.form} onSubmit={handleSave}>
                  <div className={styles.field}>
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.smart_sorting}
                        onChange={(e) => handleChange('smart_sorting', e.target.checked)}
                      />
                      Enable smart sorting of utilities on homepage
                    </label>
                    <p className={styles.hint}>Utilities will be sorted based on your usage frequency.</p>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="default_theme">Default Theme</label>
                    <select
                      id="default_theme"
                      value={settings.default_theme}
                      onChange={(e) => handleChange('default_theme', e.target.value)}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Automatic (System)</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="utility_display_mode">Utility Display Mode</label>
                    <select
                      id="utility_display_mode"
                      value={settings.utility_display_mode}
                      onChange={(e) => handleChange('utility_display_mode', e.target.value)}
                    >
                      <option value="compact">Compact View</option>
                      <option value="detailed">Detailed View</option>
                    </select>
                    <p className={styles.hint}>This option can also be toggled directly from the homepage.</p>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="auto_translation_language">Auto-translation Language</label>
                    <select
                      id="auto_translation_language"
                      value={settings.auto_translation_language}
                      onChange={(e) => handleChange('auto_translation_language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="uk">Ukrainian</option>
                      <option value="pl">Polish</option>
                      <option value="zh">Chinese</option>
                    </select>
                    <p className={styles.hint}>Set the default language for automatic website page translation.</p>
                  </div>

                  <div className={styles.field}>
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.fullscreen_utilities}
                        onChange={(e) => handleChange('fullscreen_utilities', e.target.checked)}
                      />
                      Open utilities in fullscreen
                    </label>
                    <p className={styles.hint}>Any utility opened from the homepage will launch immediately in fullscreen mode.</p>
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className="button button--primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      </main>
  );
}

export default function SettingsPage(): React.JSX.Element {
  return (
    <Layout title="Settings" description="Manage your CAD AutoScript settings.">
      <SettingsContent />
    </Layout>
  );
}
