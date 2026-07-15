import React, {Suspense, lazy} from 'react';
import Root from '@theme-original/Root';
import type {Props} from '@theme/Root';
import Head from '@docusaurus/Head';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import LoginModal from '@site/src/components/Auth/LoginModal';
import {AuthModalProvider} from '@site/src/contexts/AuthModalContext';
import {UserSettingsProvider, useUserSettings} from '@site/src/contexts/UserSettingsContext';
import {I18nProvider} from '@site/src/contexts/I18nContext';

// Lazy load SpeedInsights component (client-side only)
const SpeedInsights = lazy(() =>
  import('@vercel/speed-insights/react').then((module) => ({
    default: module.SpeedInsights,
  }))
);

// Lazy load Analytics component (client-side only)
const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((module) => ({
    default: module.Analytics,
  }))
);

/**
 * Inner wrapper that reads preferredLocale from UserSettings and passes it to I18nProvider.
 * Must be inside UserSettingsProvider to access the hook.
 */
function I18nBridge({children}: {children: React.ReactNode}) {
  const {settings} = useUserSettings();
  return (
    <I18nProvider preferredLocale={settings.auto_translation_language}>
      {children}
    </I18nProvider>
  );
}

/**
 * Locales without real blog translations serve English fallback posts and get
 * flagged as duplicates in Google Search Console, so their blog routes are
 * marked noindex. The blog is translated for the locales listed below —
 * extend the set when more translations land (issues #66, #84).
 */
const BLOG_TRANSLATED_LOCALES = new Set(['en', 'ru', 'de', 'ua', 'es', 'et']);

function LocalizedBlogNoindex() {
  const {i18n} = useDocusaurusContext();
  const {pathname} = useLocation();
  const isTranslatedLocale = BLOG_TRANSLATED_LOCALES.has(i18n.currentLocale);
  const isBlogRoute = /(^|\/)blog(\/|$)/.test(pathname);
  if (isTranslatedLocale || !isBlogRoute) {
    return null;
  }
  return (
    <Head>
      <meta name="robots" content="noindex" />
    </Head>
  );
}

export default function RootWrapper(props: Props) {
  return (
    <AuthModalProvider>
      <UserSettingsProvider>
        <I18nBridge>
          <LocalizedBlogNoindex />
          <Root {...props} />
          <LoginModal />
          <Suspense fallback={null}>
            <SpeedInsights />
            <Analytics />
          </Suspense>
        </I18nBridge>
      </UserSettingsProvider>
    </AuthModalProvider>
  );
}
