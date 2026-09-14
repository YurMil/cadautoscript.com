import React from 'react';
import Head from '@docusaurus/Head';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  utilityPageConfigs,
  type UtilityPageSlug,
} from '@site/src/data/utilityShellPages';

export const EMBED_MESSAGE_SOURCE = 'cadautoscript-embed';

const FULL_PAGE_ORIGIN = 'https://cadautoscript.com';
const MIN_FRAME_HEIGHT = 320;
const INITIAL_FRAME_HEIGHT = 640;

/**
 * Minimal-chrome embed route for a utility calculator.
 *
 * - No navbar/footer: the page renders just the tool iframe plus a slim
 *   "Powered by" bar, so external sites can frame it cleanly.
 * - Auto-height: the tool runs in a same-origin iframe whose document is
 *   observed for size changes for as long as the page is open, so results
 *   that expand after user input still resize the widget. The page's total
 *   height is reported to the embedding parent via postMessage
 *   (`{source: 'cadautoscript-embed', type: 'resize', height, slug}`) only
 *   when it changes. No cookies are set.
 * - Framing by third-party sites is allowed only for /embed/* and the
 *   embedded app bundles; see the header rules in vercel.json.
 */
export function EmbedUtilityPage(slug: UtilityPageSlug) {
  return function EmbedUtilityRoute() {
    const config = utilityPageConfigs[slug];
    if (!config) {
      throw new Error(`Utility page configuration missing for slug "${slug}"`);
    }
    const {title, appPath, iframeAllow = ''} = config;
    const iframeSrc = useBaseUrl(appPath ?? `/utility-apps/${slug}/app.html`);
    const fullPageUrl = `${FULL_PAGE_ORIGIN}/utilities/${slug}/`;

    const frameRef = React.useRef<HTMLIFrameElement>(null);
    const mainRef = React.useRef<HTMLElement>(null);
    const [frameHeight, setFrameHeight] = React.useState(INITIAL_FRAME_HEIGHT);

    // 1) Follow the tool's content height. The observer is created from the
    //    iframe's own window and re-attached on every load (navigation inside
    //    the frame replaces the document).
    React.useEffect(() => {
      const frame = frameRef.current;
      if (!frame) return undefined;

      let observer: ResizeObserver | null = null;

      const attach = () => {
        observer?.disconnect();
        let doc: Document | null = null;
        try {
          doc = frame.contentDocument;
        } catch {
          return; // Not same-origin: keep the initial height.
        }
        const win = frame.contentWindow as (Window & typeof globalThis) | null;
        if (!doc?.documentElement || !win) return;

        // ResizeObserver already batches callbacks to once per frame, so the
        // measurement runs directly; it also works in a tab loaded hidden.
        const measure = () => {
          // body.scrollHeight tracks the content; documentElement.scrollHeight
          // never drops below the frame's own height, so it cannot shrink.
          const height = Math.ceil(doc?.body?.scrollHeight ?? 0);
          if (height >= MIN_FRAME_HEIGHT) {
            setFrameHeight((prev) => (prev === height ? prev : height));
          }
        };

        const Observer = win.ResizeObserver ?? ResizeObserver;
        observer = new Observer(measure);
        observer.observe(doc.documentElement);
        if (doc.body) observer.observe(doc.body);
        measure();
      };

      frame.addEventListener('load', attach);
      attach();

      return () => {
        frame.removeEventListener('load', attach);
        observer?.disconnect();
      };
    }, []);

    // 2) Report our total height to the embedding parent whenever it changes.
    // Measured on <main>, not the document: the document is never shorter than
    // the parent's iframe, so it could grow the widget but never shrink it.
    React.useEffect(() => {
      const main = mainRef.current;
      if (!main || window.parent === window) return undefined;

      let lastReported = 0;
      const report = () => {
        const height = Math.ceil(main.getBoundingClientRect().height);
        if (height === lastReported) return;
        lastReported = height;
        // The payload is only a height, so any parent may receive it.
        window.parent.postMessage({source: EMBED_MESSAGE_SOURCE, type: 'resize', height, slug}, '*');
      };

      const observer = new ResizeObserver(report);
      observer.observe(main);
      report();

      return () => observer.disconnect();
      // frameHeight: report right after the frame is resized, without waiting
      // for the observer (which does not fire while the tab is hidden).
    }, [slug, frameHeight]);

    return (
      <>
        <Head>
          <title>{`${title} — Embed`}</title>
          <meta name="robots" content="noindex" />
        </Head>
        <main ref={mainRef} style={{margin: 0, padding: 0, background: '#ffffff'}}>
          <iframe
            ref={frameRef}
            src={iframeSrc}
            title={title}
            scrolling="no"
            style={{
              width: '100%',
              height: `${frameHeight}px`,
              border: 'none',
              display: 'block',
            }}
            allow={iframeAllow}
          />
          <footer
            style={{
              padding: '10px 14px',
              textAlign: 'right',
              fontSize: '13px',
              lineHeight: 1.4,
              color: '#5b6472',
              background: '#f7f8fa',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              borderTop: '1px solid #e8ebf0',
            }}
          >
            Powered by{' '}
            <a
              href={fullPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{color: '#2f6feb', fontWeight: 600, textDecoration: 'none'}}
            >
              CAD AutoScript
            </a>
          </footer>
        </main>
      </>
    );
  };
}
