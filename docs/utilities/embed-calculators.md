---
sidebar_position: 3
title: Embedding calculators
---

Manufacturers, suppliers and engineering blogs can put a calculator directly on
their own pages. Each embed route renders the tool with minimal chrome — no
navbar, no footer, just the calculator and a small "Powered by CAD AutoScript"
bar — and resizes itself to its content.

Currently available embeds:

| Calculator | Embed URL |
|---|---|
| Blind Flange Calculator | `https://cadautoscript.com/embed/blind-flange-calculator/` |
| Dished End (Vessel Head) Calculator | `https://cadautoscript.com/embed/pressure-vessel-dished-end-calc/` |

## Copy-paste snippet

```html
<iframe
  src="https://cadautoscript.com/embed/blind-flange-calculator/"
  title="Blind Flange Calculator"
  data-cadautoscript-embed
  style="width: 100%; height: 640px; border: 1px solid #e8ebf0; border-radius: 12px;"
  loading="lazy"
></iframe>

<script>
  // Each embed reports its height via postMessage, so the iframe grows and
  // shrinks with the calculator's content. One listener serves every embed on
  // the page: messages are matched to the iframe that sent them.
  window.addEventListener('message', (event) => {
    if (event.origin !== 'https://cadautoscript.com') return;
    const data = event.data;
    if (!data || data.source !== 'cadautoscript-embed' || data.type !== 'resize') return;

    for (const frame of document.querySelectorAll('iframe[data-cadautoscript-embed]')) {
      if (frame.contentWindow === event.source) {
        frame.style.height = Math.max(320, Number(data.height) || 0) + 'px';
      }
    }
  });
</script>
```

To embed the dished end calculator, use the same snippet with its URL — or add
a second iframe; the listener handles both:

```html
<iframe
  src="https://cadautoscript.com/embed/pressure-vessel-dished-end-calc/"
  title="Dished End (Vessel Head) Calculator"
  data-cadautoscript-embed
  style="width: 100%; height: 640px; border: 1px solid #e8ebf0; border-radius: 12px;"
  loading="lazy"
></iframe>
```

Without the script the widget still works; it just keeps the fixed height from
the `style` attribute and scrolls inside it.

## How the embed works

- **Auto-height via postMessage** — the embed page follows the calculator's
  content size for as long as it is open and posts
  `{source: 'cadautoscript-embed', type: 'resize', height, slug}` to the parent
  page whenever the height changes. The message carries nothing but the height.
- **No cookies** — the embed route sets none, and the calculation runs entirely
  in the visitor's browser; no input is sent to a server.
- **Framing policy** — only `/embed/*` and the embedded calculator bundles may be
  framed by other sites (`frame-ancestors *`). Every other page keeps
  `X-Frame-Options: SAMEORIGIN`.
- **Powered-by backlink** — every embed shows a slim footer linking to the full
  calculator page.
- **Not indexed** — embed pages carry `robots: noindex` and are excluded from the
  sitemap, so search traffic goes to the full calculator pages.

## Adding another calculator

1. Create `src/pages/embed/<slug>.tsx`:

   ```tsx
   import {EmbedUtilityPage} from '@site/src/components/Utilities/EmbedUtilityPage';

   export default EmbedUtilityPage('<slug>');
   ```

   The wrapper reuses the `appPath`, `title` and `iframeAllow` values from the
   slug's entry in `src/data/utilityShellPages.tsx`.

2. Add the slug to the `utility-apps` framing rule **and** to the exclusion in
   the global header rule in `vercel.json`. Without this, browsers refuse to
   render the calculator inside a third-party page.

3. Add a row to the table above.
