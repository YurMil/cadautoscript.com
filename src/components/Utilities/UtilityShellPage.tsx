import React, {useMemo} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import ReactionsBar from '@site/src/components/Reactions/ReactionsBar';
import Comments from '@site/src/components/Comments';
import {utilities} from '@site/src/data/utilities';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {useUtilitiesAccess} from '@site/src/hooks/useUtilitiesAccess';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {useUserSettings} from '@site/src/contexts/UserSettingsContext';
import {useI18n} from '@site/src/contexts/I18nContext';
import {
  incrementGuestUtilityUsage,
  incrementUtilityUsage,
  shouldReportUtilityUsage,
} from '@site/src/shared/utility-usage';
import type {UtilityPageConfig} from '@site/src/data/utilityShellPages';
// Related tools reuse the catalog card from the home page rather than a
// look-alike of their own, so a utility is presented the same way wherever it
// appears — same thumbnail, same tech badge, same localized copy.
import UtilityCard from '@site/src/components/Home/UtilityCard';
import homeStyles from '@site/src/pages/index.module.css';
import UtilityErrorBoundary from './UtilityErrorBoundary';
import {saveCalculation} from '@site/src/shared/calculation-history';
import {
  SHARE_MESSAGE_RESTORE,
  SHARE_MESSAGE_STATE_UPDATE,
  SHARE_MESSAGE_SUPPORT,
  SHARE_PARAM,
  SHARE_SCHEMA_VERSION,
  decodeUtilityState,
  encodeUtilityState,
} from '../../lib/utilityShare';
import {logger} from '../../lib/logger';

type UtilityShellPageProps = UtilityPageConfig & {tool?: React.ReactNode};

type HeroLink = {label: string; href: string; variant?: 'primary' | 'ghost'; external?: boolean};

const defaultHeroLinks: HeroLink[] = [
  {label: 'Back to Web utilities', href: '/docs/utilities/overview/', variant: 'ghost'},
  {label: 'Macro catalog', href: '/', variant: 'primary'},
];

export default function UtilityShellPage({tool, ...config}: UtilityShellPageProps) {
  const {
    slug,
    title,
    subtitle,
    description,
    about,
    tags,
    note,
    features,
    scriptType = 'module',
    appPath,
    // Delegate nothing unless a tool asks for it. The default used to be
    // "camera 'self'", which handed the camera to every embedded utility and
    // forced the Permissions-Policy header to allow it site-wide.
    iframeAllow = '',
  } = config;

  const iframeSrc = useBaseUrl(appPath ?? `/utility-apps/${slug}/app.html`);
  const stylesHref = useBaseUrl('/styles.css');
  const shellCssHref = useBaseUrl('/utilities/util-shell.css');
  // Light-theme overrides are now merged into util-shell.css.
  const shellScriptSrc = useBaseUrl('/utilities/util-shell.js');
  const {user, isAuthenticated, authChecked} = useAuthStatus();
  const {utilitiesPublicAccess} = useUtilitiesAccess();
  const {openLoginModal} = useAuthModal();
  const {settings} = useUserSettings();
  const {t} = useI18n();

  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isInfoCollapsed, setIsInfoCollapsed] = React.useState(false);

  // Share-link protocol (issue #113): utilities that speak the postMessage
  // protocol announce support, stream their input state to the shell, and can
  // restore state from a shared `?calc=` URL. See
  // dev-plans/utility-share-protocol.md for the app-side contract.
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const latestToolState = React.useRef<unknown>(null);
  const [shareSupported, setShareSupported] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Utility apps are same-origin static bundles; ignore everything else,
      // including messages from other frames on the page.
      if (event.origin !== window.location.origin) return;
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      const data: unknown = event.data;
      if (!data || typeof data !== 'object') return;
      const {type} = data as {type?: unknown};

      if (type === SHARE_MESSAGE_SUPPORT) {
        setShareSupported(true);
        const encoded = new URLSearchParams(window.location.search).get(SHARE_PARAM);
        const state = decodeUtilityState(encoded);
        if (state !== null && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            {type: SHARE_MESSAGE_RESTORE, version: SHARE_SCHEMA_VERSION, state},
            window.location.origin,
          );
        }
      } else if (type === SHARE_MESSAGE_STATE_UPDATE) {
        latestToolState.current = (data as {state?: unknown}).state ?? null;
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const copyShareLink = React.useCallback(() => {
    const url = new URL(window.location.href);
    const encoded = encodeUtilityState(latestToolState.current);
    if (encoded) {
      url.searchParams.set(SHARE_PARAM, encoded);
    } else {
      url.searchParams.delete(SHARE_PARAM);
    }
    navigator.clipboard
      .writeText(url.toString())
      .then(() => {
        setLinkCopied(true);
        window.setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch((err) => {
        logger.warn('[UtilityShare] Unable to copy share link', err);
      });
  }, []);

  // Saving a calculation stores the same input snapshot the share link carries
  // (issue #115), so reopening an entry from the profile is just reopening a
  // share link. Only offered to signed-in users — this is the personal-data
  // side of the guest/account split from #112.
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const userId = user?.id ?? null;

  const saveCurrentCalculation = React.useCallback(() => {
    if (!userId || latestToolState.current === null) return;
    setSaveState('saving');
    void saveCalculation({
      userId,
      utilityId: slug,
      state: latestToolState.current,
      label: title,
    })
      .then(() => {
        setSaveState('saved');
        window.setTimeout(() => setSaveState('idle'), 2000);
      })
      .catch((err) => {
        setSaveState('error');
        window.setTimeout(() => setSaveState('idle'), 3000);
        const message = err instanceof Error ? err.message : 'Unable to save calculation.';
        logger.error('[CalculationHistory] Unable to save calculation', message);
      });
  }, [slug, title, userId]);

  React.useEffect(() => {
    document.body.classList.add('utility-shell-page');
    return () => document.body.classList.remove('utility-shell-page');
  }, []);

  const utilityIndex = useMemo(
    () => utilities.findIndex((utility) => utility.href === `/utilities/${slug}/` || utility.id === slug),
    [slug],
  );
  const trackedUtility = utilityIndex >= 0 ? utilities[utilityIndex] : null;
  const relatedUtilities = useMemo(() => {
    if (!trackedUtility?.relatedIds?.length) return [];
    const byId = new Map(utilities.map((u) => [u.id, u]));
    return trackedUtility.relatedIds
      .map((id) => byId.get(id))
      .filter((u): u is (typeof utilities)[number] => Boolean(u));
  }, [trackedUtility]);
  // Every utility is open to guests; sign-in gates persistent/output features
  // instead (issue #112). The utilities_public_access site setting now controls
  // whether guests see the sign-in notice, not whether the tool renders.
  const showGuestNotice = !utilitiesPublicAccess && authChecked && !isAuthenticated;

  React.useEffect(() => {
    if (!authChecked || !trackedUtility) {
      return;
    }

    if (isAuthenticated) {
      if (!shouldReportUtilityUsage(trackedUtility.id, user?.id ?? null)) {
        return;
      }
      void incrementUtilityUsage(trackedUtility.id).catch((err) => {
        const message = err instanceof Error ? err.message : 'Unable to increment utility usage.';
        logger.warn('[UtilityUsage] Unable to record utility launch', message);
      });
      return;
    }

    // Guest launches feed an aggregate per-utility counter — no identity stored.
    if (!shouldReportUtilityUsage(trackedUtility.id, 'guest')) {
      return;
    }
    void incrementGuestUtilityUsage(trackedUtility.id).catch((err) => {
      const message = err instanceof Error ? err.message : 'Unable to increment guest utility usage.';
      logger.warn('[UtilityUsage] Unable to record guest launch', message);
    });
  }, [authChecked, isAuthenticated, trackedUtility, user?.id]);

  React.useEffect(() => {
    if (settings.fullscreen_utilities) {
      setIsFullscreen(true);
    }
  }, [settings.fullscreen_utilities]);

  React.useEffect(() => {
    document.body.classList.toggle('utility-is-fullscreen', isFullscreen);
    return () => {
      document.body.classList.remove('utility-is-fullscreen');
    };
  }, [isFullscreen]);

  const exitFullscreen = () => {
    setIsFullscreen(false);
    const stage = document.querySelector('.utility-stage');
    if (stage) {
      stage.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      setIsFullscreen(true);
    }
  };

  const toggleInfo = () => {
    setIsInfoCollapsed((prev) => !prev);
  };

  const heroLinks = defaultHeroLinks;
  const reactionsSlug = config.reactionSlug ?? `tool-${slug}`;
  const toolFrame = (
    <UtilityErrorBoundary utilityName={title}>
      {tool ? (
        <div className="tool-frame">
          <div className="h-full overflow-y-auto">{tool}</div>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          className="tool-frame"
          src={iframeSrc}
          title={title}
          loading="lazy"
          allow={iframeAllow}
          data-nobrokenlinkcheck
        ></iframe>
      )}
    </UtilityErrorBoundary>
  );

  const canonicalUrl = `https://cadautoscript.com/utilities/${slug}/`;

  return (
    <Layout title={title} description={description}>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <link rel="stylesheet" href={stylesHref} />
        <link rel="stylesheet" href={shellCssHref} />
      </Head>
      <main className={`utility-shell ${isFullscreen ? 'utility-shell--fullscreen' : ''}`}>
        <header className="utility-header">
          <div>
            <Link className="utility-logo" to="/">
              CAD AutoScript
            </Link>
            <h1>{title}</h1>
            <p className="utility-subtitle">{subtitle}</p>
          </div>
          <div className="utility-actions">
            {heroLinks.map(({label, href, variant = 'ghost', external}) => (
              <Link
                key={label}
                className={`button ${variant}`}
                to={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
              >
                {label}
              </Link>
            ))}
          </div>
        </header>
        <section className="utility-main">
          <div className={`utility-stage ${isFullscreen ? 'is-fullscreen' : ''}`}>
            {toolFrame}
          </div>
          {showGuestNotice ? (
            <div className="utility-guest-notice" role="note">
              <span>{t('utility.guestExportNotice', {name: title})}</span>
              <button type="button" className="button primary" onClick={openLoginModal}>
                {t('auth.signIn')}
              </button>
            </div>
          ) : null}
          <div className="utility-toolbar" role="toolbar">
            {shareSupported ? (
              <button className="utility-toggle" type="button" onClick={copyShareLink}>
                {linkCopied ? t('utility.linkCopied') : t('utility.copyLink')}
              </button>
            ) : null}
            {shareSupported && isAuthenticated ? (
              <button
                className="utility-toggle"
                type="button"
                onClick={saveCurrentCalculation}
                disabled={saveState === 'saving'}
              >
                {saveState === 'saved'
                  ? t('utility.calculationSaved')
                  : saveState === 'error'
                    ? t('utility.saveCalculationFailed')
                    : t('utility.saveCalculation')}
              </button>
            ) : null}
            <button
              className="utility-toggle"
              type="button"
              aria-expanded={!isInfoCollapsed}
              onClick={toggleInfo}
            >
              {isInfoCollapsed ? t('utility.showInfo') : t('utility.hideInfo')}
            </button>
            <button
              className="utility-fullscreen"
              type="button"
              aria-pressed={isFullscreen}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? t('utility.exitFullScreen') : t('utility.fullScreen')}
            </button>
          </div>
          <div className="utility-reactions">
            <ReactionsBar slug={reactionsSlug} />
          </div>
          <aside className={`utility-info ${isInfoCollapsed ? 'is-collapsed' : ''}`} data-collapsible>
            <div className="utility-info__header">
              <h2>{t('utility.about')}</h2>
              <p>{about}</p>
            </div>
            <div className="utility-tags">
              {tags.map((tag) => (
                <span key={tag} className="utility-tag">
                  {tag}
                </span>
              ))}
            </div>
            {note ? <p className="utility-note">{note}</p> : null}
            {features && features.length > 0 ? (
              <div className="utility-card">
                <h2>{t('utility.keyActions')}</h2>
                <ul>
                  {features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
          {relatedUtilities.length > 0 ? (
            <div className="utility-related">
              <h2 className="utility-related__title">{t('relatedTools.title')}</h2>
              <div className={homeStyles.utilityGrid}>
                {relatedUtilities.map((related) => (
                  <UtilityCard key={related.id} utility={related} />
                ))}
              </div>
            </div>
          ) : null}
          <div className="utility-comments">
            <Comments slug={reactionsSlug} />
          </div>
          <div className="utility-fullscreen-exit-zone top">
            <div className="utility-fullscreen-indicator" aria-hidden="true"></div>
            <button 
              type="button" 
              className="utility-fullscreen-exit-button"
              onClick={exitFullscreen}
            >
              {t('utility.exitFullScreen')}
            </button>
          </div>
          <div className="utility-fullscreen-exit-zone bottom">
            <div className="utility-fullscreen-indicator" aria-hidden="true"></div>
            <button 
              type="button" 
              className="utility-fullscreen-exit-button"
              onClick={exitFullscreen}
            >
              {t('utility.exitFullScreen')}
            </button>
          </div>
        </section>
      </main>
    </Layout>
  );
}
