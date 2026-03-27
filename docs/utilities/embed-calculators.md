---
sidebar_position: 3
title: Embedding calculators
---

MDX pages can host interactive utilities in several ways:

## 1. Inline iframe

```mdx
<iframe
  src="/utilities/pipe-cutter/"
  title="Pipe Cutter"
  height="640"
  style={{width: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px'}}
/>
```

Use this when a calculator ships as a standalone bundle under `static/utility-apps/<slug>/app.html`.

## 2. Wrap as a React component

If the tool exposes a React build (for example, a DXF generator exported with Vite), create a component under `src/components`:

```tsx
type Props = {height?: number};

export default function PipeCutterEmbed({height = 620}: Props) {
  return (
    <iframe
      src="/utilities/pipe-cutter/"
      title="Pipe Cutter"
      height={height}
      style={{width: '100%', border: 'none'}}
      loading="lazy"
    />
  );
}
```

Then import it directly inside MDX:

```mdx
import PipeCutterEmbed from '@site/src/components/PipeCutterEmbed';

<PipeCutterEmbed height={720} />
```

## 3. Render JSX utilities

For calculators written purely in React, export them from `src/components` and import into MDX without iframes. This keeps styling consistent with the rest of the site.

```mdx
import KFactorPlayground from '@site/src/components/KFactorPlayground';

<KFactorPlayground defaultMaterial="S235" />
```

## Styling tips

- Keep containers fluid so the utilities work on kiosks, tablets, and laptops.
- Prefer dark UI to match the surrounding documentation theme.
- Store screenshots under `static/img` and reference them in MDX for quick visual context.
