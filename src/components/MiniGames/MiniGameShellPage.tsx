import React, {useState, useEffect} from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import ReactionsBar from '@site/src/components/Reactions/ReactionsBar';
import Comments from '@site/src/components/Comments';
import {useI18n} from '@site/src/contexts/I18nContext';
import type {MiniGamePageConfig} from '@site/src/data/miniGamePages';

type HeroLink = {label: string; href: string; variant?: 'primary' | 'ghost'; external?: boolean};

export default function MiniGameShellPage(config: MiniGamePageConfig) {
  const {slug, tags: defaultTags, scriptType = 'defer', stage} = config;
  const {t, tg} = useI18n();
  const gameStrings = tg(slug);

  // Use translated strings if available, fallback to config
  const title = gameStrings.name || config.title;
  const subtitle = gameStrings.subtitle || config.subtitle;
  const description = gameStrings.description || config.description;
  const about = gameStrings.about || config.about;
  const note = gameStrings.note || config.note;
  const features = (gameStrings.features && gameStrings.features.length > 0) ? gameStrings.features : config.features;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);

  const iframeSrc = useBaseUrl(`/mini-games/${slug}/app.html`);
  const stylesHref = useBaseUrl('/styles.css');
  const shellCssHref = useBaseUrl('/utilities/util-shell.css');
  const shellLightHref = useBaseUrl('/utilities/util-shell.light.css');
  const shellScriptSrc = useBaseUrl('/utilities/util-shell.js');

  const heroLinks: HeroLink[] = [
    {label: t('miniGamesPage.backToMiniGames'), href: '/mini-games/', variant: 'ghost'},
    {label: t('utility.macroCatalog'), href: '/', variant: 'primary'},
  ];

  const reactionsSlug = config.reactionSlug ?? `mini-${slug}`;

  useEffect(() => {
    document.body.classList.add('utility-shell-page');
    return () => document.body.classList.remove('utility-shell-page');
  }, []);

  useEffect(() => {
    document.body.classList.toggle('utility-is-fullscreen', isFullscreen);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleInfo = () => {
    setIsInfoCollapsed(!isInfoCollapsed);
  };

  const canonicalUrl = `https://cadautoscript.com/mini-games/${slug}/`;

  return (
    <Layout title={title} description={description}>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <link rel="stylesheet" href={stylesHref} />
        <link rel="stylesheet" href={shellCssHref} />
        <link rel="stylesheet" href={shellLightHref} />
        {scriptType === 'module' ? (
          <script type="module" src={shellScriptSrc}></script>
        ) : (
          <script defer src={shellScriptSrc}></script>
        )}
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
            {stage ? (
              <div className="tool-frame">{stage}</div>
            ) : (
              <iframe className="tool-frame" src={iframeSrc} title={title} loading="lazy" data-nobrokenlinkcheck></iframe>
            )}
          </div>
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
          <div className="utility-reactions">
            <ReactionsBar slug={reactionsSlug} />
          </div>
          <aside className={`utility-info ${isInfoCollapsed ? 'is-collapsed' : ''}`} data-collapsible>
            <div className="utility-info__header">
              <h2>{t('miniGamesPage.aboutHeading')}</h2>
              {typeof about === 'string' ? (
                <p dangerouslySetInnerHTML={{ __html: about }} />
              ) : (
                <p>{about}</p>
              )}
            </div>
            <div className="utility-tags">
              {defaultTags.map((tag) => (
                <span key={tag} className="utility-tag">
                  {tag}
                </span>
              ))}
            </div>
            {note && (
              <p className="utility-note">
                {typeof note === 'string' ? (
                  <span dangerouslySetInnerHTML={{ __html: note }} />
                ) : (
                  note
                )}
              </p>
            )}
            {features && features.length > 0 ? (
              <div className="utility-card">
                <h2>{t('miniGamesPage.highlightsHeading')}</h2>
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
          <div className={`utility-fullscreen-exit-zone ${isFullscreen ? 'is-active' : ''}`}>
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
