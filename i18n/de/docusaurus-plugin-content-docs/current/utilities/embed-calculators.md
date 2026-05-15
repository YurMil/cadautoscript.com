---
sidebar_position: 3
title: Rechner einbetten
---

MDX-Seiten können interaktive Dienstprogramme auf verschiedene Weise hosten:

## 1. Inline-Iframe

```mdx
<iframe
  src="/utilities/pipe-cutter/"
  title="Rohrschneider"
  height="640"
  style={{width: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px'}}
/>
```

Verwenden Sie dies, wenn ein Rechner als eigenständiges Paket unter `static/utility-apps/<slug>/app.html` bereitgestellt wird.

## 2. Als React-Komponente verpacken

Wenn das Tool einen React-Build bereitstellt (zum Beispiel einen mit Vite exportierten DXF-Generator), erstellen Sie eine Komponente unter `src/components`:

```tsx
type Props = {height?: number};

export default function PipeCutterEmbed({height = 620}: Props) {
  return (
    <iframe
      src="/utilities/pipe-cutter/"
      title="Rohrschneider"
      height={height}
      style={{width: '100%', border: 'none'}}
      loading="lazy"
    />
  );
}
```

Importieren Sie sie dann direkt in MDX:

```mdx
import PipeCutterEmbed from '@site/src/components/PipeCutterEmbed';

<PipeCutterEmbed height={720} />
```

## 3. JSX-Dienstprogramme rendern

Für rein in React geschriebene Rechner exportieren Sie diese aus `src/components` und importieren sie ohne Iframes in MDX. Dadurch bleibt das Styling konsistent mit dem Rest der Website.

```mdx
import KFactorPlayground from '@site/src/components/KFactorPlayground';

<KFactorPlayground defaultMaterial="S235" />
```

## Styling-Tipps

- Halten Sie Container flüssig, damit die Dienstprogramme auf Kiosken, Tablets und Laptops funktionieren.
- Bevorzugen Sie eine dunkle Benutzeroberfläche, die zum Thema der umgebenden Dokumentation passt.
- Speichern Sie Screenshots unter `static/img` and verweisen Sie in MDX darauf, um einen schnellen visuellen Kontext zu ermöglichen.
