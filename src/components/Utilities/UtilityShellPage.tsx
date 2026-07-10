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
import {incrementUtilityUsage, shouldReportUtilityUsage} from '@site/src/shared/utility-usage';
import type {UtilityPageConfig} from '@site/src/data/utilityShellPages';

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

  React.useEffect(() => {
    document.body.classList.add('utility-shell-page');
    return () => document.body.classList.remove('utility-shell-page');
  }, []);

  const utilityIndex = useMemo(
    () => utilities.findIndex((utility) => utility.href === `/utilities/${slug}/` || utility.id === slug),
    [slug],
  );
  const trackedUtility = utilityIndex >= 0 ? utilities[utilityIndex] : null;
  const isFreeUtility = utilityIndex >= 0 && utilityIndex < 3;
  const isAuthRequired = !utilitiesPublicAccess;
  const isLocked = isAuthRequired && !isAuthenticated && !isFreeUtility;
  const isCheckingAccess = isAuthRequired && !authChecked && !isFreeUtility;

  React.useEffect(() => {
    if (!authChecked || !isAuthenticated || isLocked || isCheckingAccess || !trackedUtility) {
      return;
    }

    if (!shouldReportUtilityUsage(trackedUtility.id, user?.id ?? null)) {
      return;
    }

    void incrementUtilityUsage(trackedUtility.id).catch((err) => {
      const message = err instanceof Error ? err.message : 'Unable to increment utility usage.';
      console.warn('[UtilityUsage] Unable to record utility launch', message);
    });
  }, [authChecked, isAuthenticated, isLocked, isCheckingAccess, trackedUtility, user?.id]);

  React.useEffect(() => {
    if (settings.fullscreen_utilities && !isLocked && !isCheckingAccess) {
      setIsFullscreen(true);
    }
  }, [settings.fullscreen_utilities, isLocked, isCheckingAccess]);

  React.useEffect(() => {
    document.body.classList.toggle('utility-is-fullscreen', isFullscreen);
    return () => {
      document.body.classList.remove('utility-is-fullscreen');
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (!next) {
        const stage = document.querySelector('.utility-stage');
        if (stage) {
          stage.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
      }
      return next;
    });
  };

  const toggleInfo = () => {
    setIsInfoCollapsed((prev) => !prev);
  };

  const heroLinks = defaultHeroLinks;
  const reactionsSlug = config.reactionSlug ?? `tool-${slug}`;
  const toolFrame = tool ? (
    <div className="tool-frame">
      <div className="h-full overflow-y-auto">{tool}</div>
    </div>
  ) : (
    <iframe className="tool-frame" src={iframeSrc} title={title} loading="lazy" data-nobrokenlinkcheck></iframe>
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
            {isCheckingAccess ? (
              <div className="utility-locked">
                <p className="utility-locked__eyebrow">{t('utility.checkingAccess')}</p>
                <h2>{t('utility.holdOn')}</h2>
                <p className="utility-locked__copy">
                  {t('utility.verifyingSession', {name: title})}
                </p>
              </div>
            ) : isLocked ? (
              <div className="utility-locked">
                <p className="utility-locked__eyebrow">{t('utility.signInRequired')}</p>
                <h2>{t('utility.unlockTitle')}</h2>
                <p className="utility-locked__copy">
                  {t('utility.unlockCopy', {name: title})}
                </p>
                <div className="utility-locked__actions">
                  <button type="button" className="button primary" onClick={openLoginModal}>
                    {t('auth.signIn')}
                  </button>
                  <Link className="button ghost" to="/utilities/pipe-cutter/">
                    {t('utility.viewFreeUtilities')}
                  </Link>
                </div>
              </div>
            ) : (
              toolFrame
            )}
          </div>
          {!isLocked ? (
            <div className="utility-toolbar" role="toolbar">
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
          ) : null}
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
          <div className="utility-comments">
            <Comments slug={reactionsSlug} />
          </div>
          <div className="utility-fullscreen-exit-zone top">
            <div className="utility-fullscreen-indicator" aria-hidden="true"></div>
            <button 
              type="button" 
              className="utility-fullscreen-exit-button"
              onClick={() => setIsFullscreen(false)}
            >
              {t('utility.exitFullScreen')}
            </button>
          </div>
          <div className="utility-fullscreen-exit-zone bottom">
            <div className="utility-fullscreen-indicator" aria-hidden="true"></div>
            <button 
              type="button" 
              className="utility-fullscreen-exit-button"
              onClick={() => setIsFullscreen(false)}
            >
              {t('utility.exitFullScreen')}
            </button>
          </div>
        </section>
      </main>
    </Layout>
  );
}
