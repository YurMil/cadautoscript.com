import React from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import ReactionsBar from '@site/src/components/Reactions/ReactionsBar';
import Comments from '@site/src/components/Comments';
import type {MiniGamePageConfig} from '@site/src/data/miniGamePages';

type HeroLink = {label: string; href: string; variant?: 'primary' | 'ghost'; external?: boolean};

const defaultHeroLinks: HeroLink[] = [
  {label: 'Back to Mini Games', href: '/mini-games/', variant: 'ghost'},
  {label: 'Macro catalog', href: '/', variant: 'primary'},
];

export default function MiniGameShellPage(config: MiniGamePageConfig) {
  const {slug, title, subtitle, description, about, tags, note, features, scriptType = 'defer', stage} = config;

  const iframeSrc = useBaseUrl(`/mini-games/${slug}/app.html`);
  const stylesHref = useBaseUrl('/styles.css');
  const shellCssHref = useBaseUrl('/utilities/util-shell.css');
  const shellLightHref = useBaseUrl('/utilities/util-shell.light.css');
  const shellScriptSrc = useBaseUrl('/utilities/util-shell.js');

  const heroLinks = defaultHeroLinks;
  const reactionsSlug = config.reactionSlug ?? `mini-${slug}`;
  React.useEffect(() => {
    document.body.classList.add('utility-shell-page');
    return () => document.body.classList.remove('utility-shell-page');
  }, []);

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
      <main className="utility-shell">
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
          <div className="utility-stage">
            {stage ? (
              <div className="tool-frame">{stage}</div>
            ) : (
              <iframe className="tool-frame" src={iframeSrc} title={title} loading="lazy" data-nobrokenlinkcheck></iframe>
            )}
          </div>
          <div className="utility-toolbar" role="toolbar">
            <button className="utility-toggle" type="button" aria-expanded="true">
              Hide info
            </button>
            <button className="utility-fullscreen" type="button" aria-pressed="false">
              Full screen
            </button>
          </div>
          <div className="utility-reactions">
            <ReactionsBar slug={reactionsSlug} />
          </div>
          <aside className="utility-info" data-collapsible>
            <div className="utility-info__header">
              <h2>About this game</h2>
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
                <h2>Highlights</h2>
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
          <div className="utility-fullscreen-exit-zone">
            <div className="utility-fullscreen-indicator" aria-hidden="true"></div>
            <button type="button" className="utility-fullscreen-exit-button">
              Exit full screen
            </button>
          </div>
        </section>
      </main>
    </Layout>
  );
}
