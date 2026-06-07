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
 * The blog is not translated: non-default locales serve English fallback posts
 * (the per-locale docusaurus-plugin-content-blog folders under i18n are empty).
 * Those duplicate pages get crawled but never indexed by Google, so we mark
 * every localized blog route
 * noindex. Docusaurus' sitemap plugin also drops noindex pages automatically.
 * Revisit if the blog ever gets real per-locale translations.
 */
function LocalizedBlogNoindex() {
  const {i18n} = useDocusaurusContext();
  const {pathname} = useLocation();
  const isDefaultLocale = i18n.currentLocale === i18n.defaultLocale;
  const isBlogRoute = /(^|\/)blog(\/|$)/.test(pathname);
  if (isDefaultLocale || !isBlogRoute) {
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
