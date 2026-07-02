import React, {useEffect, useState} from 'react';
import clsx from 'clsx';
import type {User} from '@supabase/supabase-js';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import {useHistory} from '@docusaurus/router';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {useI18n} from '@site/src/contexts/I18nContext';
import {LOCALES} from '@site/src/i18n';
import {
  resetUserSettings,
  resetUserAnalytics,
  deleteOwnAccount,
} from '@site/src/shared/account';
import styles from './index.module.css';
import {useColorMode} from '@docusaurus/theme-common';

type DangerAction = 'settings' | 'analytics' | 'delete' | null;

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
  const [dangerBusy, setDangerBusy] = useState<DangerAction>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const {openLoginModal} = useAuthModal();
  const {setColorMode} = useColorMode();
  const {t, setLocale} = useI18n();
  const history = useHistory();

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
        setError(t('settings.errorLoad'));
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
    // Instantly apply language change so user can see effect immediately
    if (field === 'auto_translation_language' && typeof value === 'string') {
      // Map stored value to our locale codes (handle legacy 'uk' → 'ua')
      const mapped = value === 'uk' ? 'ua' : value;
      try {
        setLocale(mapped as Parameters<typeof setLocale>[0]);
      } catch {
        // ignore unknown locale codes — they'll fall back to 'en'
      }
    }
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
      setError(t('settings.errorSave'));
      setSaving(false);
      return;
    }

    setSuccess(t('settings.saved'));

    // Apply theme change locally immediately if needed
    if (settings.default_theme !== 'auto') {
      setColorMode(settings.default_theme);
    }

    setSaving(false);
  };

  const clearLocalPreferences = () => {
    try {
      localStorage.removeItem('theme');
      localStorage.removeItem('site-locale');
      localStorage.removeItem('utilities-compact');
    } catch {
      /* ignore storage errors */
    }
  };

  const handleResetSettings = async () => {
    if (!user || dangerBusy) {
      return;
    }
    if (!window.confirm(t('settings.dangerZone.resetSettingsConfirm'))) {
      return;
    }
    setDangerBusy('settings');
    setError(null);
    setSuccess(null);
    try {
      await resetUserSettings();
      setSettings(defaultSettings);
      clearLocalPreferences();
      setColorMode(null);
      try {
        setLocale('en');
      } catch {
        /* ignore */
      }
      setSuccess(t('settings.dangerZone.resetSettingsDone'));
    } catch (err) {
      console.error('[Settings] reset settings failed', err);
      setError(t('settings.dangerZone.actionError'));
    } finally {
      setDangerBusy(null);
    }
  };

  const handleResetAnalytics = async () => {
    if (!user || dangerBusy) {
      return;
    }
    if (!window.confirm(t('settings.dangerZone.resetAnalyticsConfirm'))) {
      return;
    }
    setDangerBusy('analytics');
    setError(null);
    setSuccess(null);
    try {
      const removed = await resetUserAnalytics();
      setSuccess(
        t('settings.dangerZone.resetAnalyticsDone').replace('{count}', String(removed)),
      );
    } catch (err) {
      console.error('[Settings] reset analytics failed', err);
      setError(t('settings.dangerZone.actionError'));
    } finally {
      setDangerBusy(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || dangerBusy) {
      return;
    }
    setDangerBusy('delete');
    setError(null);
    setSuccess(null);
    try {
      await deleteOwnAccount(user.id);
      // Suppress the "sign in" guard modal that would otherwise fire when the
      // user is cleared, before we redirect the just-deleted account home.
      setPromptedLogin(true);
      setUser(null);
      setDeleteModalOpen(false);
      history.push('/');
    } catch (err) {
      console.error('[Settings] delete account failed', err);
      setError(t('settings.dangerZone.actionError'));
      setDangerBusy(null);
    }
  };

  const renderUnauthed = () => (
    <div className={styles.guard}>
      <p className={styles.eyebrow}>{t('settings.eyebrow')}</p>
      <h1 className={styles.title}>{t('settings.signInTitle')}</h1>
      <p className={styles.subtle}>{t('settings.signInCopy')}</p>
      <div className={styles.guardActions}>
        <a className="button button--primary" href="/">
          {t('settings.returnHome')}
        </a>
        <button type="button" className="button button--secondary" onClick={openLoginModal}>
          {t('settings.openSignIn')}
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
                <p className={styles.eyebrow}>{t('settings.eyebrow')}</p>
                <h1 className={styles.title}>{t('settings.title')}</h1>
                <p className={styles.subtle}>{t('settings.subtitle')}</p>
              </header>

              {error ? (
                <div className={clsx(styles.alert, styles.alertError)}>{error}</div>
              ) : null}
              {success ? (
                <div className={clsx(styles.alert, styles.alertSuccess)}>{success}</div>
              ) : null}

              {loading ? (
                <div className={styles.loading}>{t('settings.loading')}</div>
              ) : (
                <form className={styles.form} onSubmit={handleSave}>
                  <div className={styles.field}>
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.smart_sorting}
                        onChange={(e) => handleChange('smart_sorting', e.target.checked)}
                      />
                      {t('settings.smartSorting')}
                    </label>
                    <p className={styles.hint}>{t('settings.smartSortingHint')}</p>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="default_theme">{t('settings.theme')}</label>
                    <select
                      id="default_theme"
                      value={settings.default_theme}
                      onChange={(e) => handleChange('default_theme', e.target.value)}
                    >
                      <option value="light">{t('settings.themeLight')}</option>
                      <option value="dark">{t('settings.themeDark')}</option>
                      <option value="auto">{t('settings.themeAuto')}</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="utility_display_mode">{t('settings.displayMode')}</label>
                    <select
                      id="utility_display_mode"
                      value={settings.utility_display_mode}
                      onChange={(e) => handleChange('utility_display_mode', e.target.value)}
                    >
                      <option value="compact">{t('settings.displayCompact')}</option>
                      <option value="detailed">{t('settings.displayDetailed')}</option>
                    </select>
                    <p className={styles.hint}>{t('settings.displayHint')}</p>
                  </div>

                  {/* Interface Language — replaces old "Auto-translation Language" */}
                  <div className={styles.field}>
                    <label htmlFor="auto_translation_language">{t('settings.language')}</label>
                    <select
                      id="auto_translation_language"
                      value={settings.auto_translation_language}
                      onChange={(e) => handleChange('auto_translation_language', e.target.value)}
                    >
                      {LOCALES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.label}
                        </option>
                      ))}
                    </select>
                    <p className={styles.hint}>{t('settings.languageHint')}</p>
                  </div>

                  <div className={styles.field}>
                    <label>
                      <input
                        type="checkbox"
                        checked={settings.fullscreen_utilities}
                        onChange={(e) => handleChange('fullscreen_utilities', e.target.checked)}
                      />
                      {t('settings.fullscreen')}
                    </label>
                    <p className={styles.hint}>{t('settings.fullscreenHint')}</p>
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className="button button--primary"
                      disabled={saving}
                    >
                      {saving ? t('settings.saving') : t('settings.save')}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>

        {user ? (
          <section className={clsx(styles.panel, styles.dangerPanel)}>
            <header className={styles.header}>
              <p className={clsx(styles.eyebrow, styles.dangerEyebrow)}>
                {t('settings.dangerZone.eyebrow')}
              </p>
              <h2 className={styles.title}>{t('settings.dangerZone.title')}</h2>
              <p className={styles.subtle}>{t('settings.dangerZone.subtitle')}</p>
            </header>

            <div className={styles.dangerList}>
              <div className={styles.dangerRow}>
                <div className={styles.dangerRowText}>
                  <span className={styles.dangerRowTitle}>
                    {t('settings.dangerZone.resetSettingsTitle')}
                  </span>
                  <p className={styles.dangerRowHint}>
                    {t('settings.dangerZone.resetSettingsHint')}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={handleResetSettings}
                  disabled={dangerBusy !== null}
                >
                  {dangerBusy === 'settings'
                    ? t('settings.dangerZone.working')
                    : t('settings.dangerZone.resetSettingsBtn')}
                </button>
              </div>

              <div className={styles.dangerRow}>
                <div className={styles.dangerRowText}>
                  <span className={styles.dangerRowTitle}>
                    {t('settings.dangerZone.resetAnalyticsTitle')}
                  </span>
                  <p className={styles.dangerRowHint}>
                    {t('settings.dangerZone.resetAnalyticsHint')}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.dangerBtn}
                  onClick={handleResetAnalytics}
                  disabled={dangerBusy !== null}
                >
                  {dangerBusy === 'analytics'
                    ? t('settings.dangerZone.working')
                    : t('settings.dangerZone.resetAnalyticsBtn')}
                </button>
              </div>

              <div className={styles.dangerRow}>
                <div className={styles.dangerRowText}>
                  <span className={styles.dangerRowTitle}>
                    {t('settings.dangerZone.deleteTitle')}
                  </span>
                  <p className={styles.dangerRowHint}>
                    {t('settings.dangerZone.deleteHint')}
                  </p>
                </div>
                <button
                  type="button"
                  className={clsx(styles.dangerBtn, styles.dangerBtnSolid)}
                  onClick={() => {
                    setDeleteConfirm('');
                    setDeleteModalOpen(true);
                  }}
                  disabled={dangerBusy !== null}
                >
                  {t('settings.dangerZone.deleteBtn')}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {deleteModalOpen ? (
          <div
            className={styles.modalBackdrop}
            role="dialog"
            aria-modal="true"
            onClick={() => (dangerBusy === 'delete' ? null : setDeleteModalOpen(false))}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>{t('settings.dangerZone.deleteModalTitle')}</h3>
              <p className={styles.subtle}>{t('settings.dangerZone.deleteModalBody')}</p>
              <label className={styles.dangerRowText}>
                <span className={styles.dangerRowHint}>
                  {t('settings.dangerZone.deleteModalLabel')}
                </span>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  autoFocus
                />
              </label>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={dangerBusy === 'delete'}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className={clsx(styles.dangerBtn, styles.dangerBtnSolid)}
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm.trim() !== 'DELETE' || dangerBusy === 'delete'}
                >
                  {dangerBusy === 'delete'
                    ? t('settings.dangerZone.deleting')
                    : t('settings.dangerZone.deleteConfirmBtn')}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
  );
}

export default function SettingsPage(): React.JSX.Element {
  const {t} = useI18n();
  return (
    <Layout title={t('settings.title')} description="Manage your CAD AutoScript settings.">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <SettingsContent />
    </Layout>
  );
}
