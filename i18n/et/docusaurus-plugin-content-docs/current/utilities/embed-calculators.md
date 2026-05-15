---
sidebar_position: 3
title: Kalkulaatorite manustamine
---

MDX-lehed võivad interaktiivseid utiliite majutada mitmel viisil:

## 1. Reasisene iframe

```mdx
<iframe
  src="/utilities/pipe-cutter/"
  title="Pipe Cutter"
  height="640"
  style={{width: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px'}}
/>
```

Kasutage seda, kui kalkulaator on pakendatud eraldiseisva kimpuna asukohas `static/utility-apps/<slug>/app.html`.

## 2. Mähkimine React-komponendina

Kui tööriist eksponeerib React-ehitust (näiteks Vite'iga eksporditud DXF-generaator), looge komponent `src/components` alla:

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

Seejärel importige see otse MDX-is:

```mdx
import PipeCutterEmbed from '@site/src/components/PipeCutterEmbed';

<PipeCutterEmbed height={720} />
```

## 3. JSX-utiliitide renderdamine

Puhtalt Reactis kirjutatud kalkulaatorite jaoks eksportige need `src/components`-ist ja importige MDX-i ilma iframesita. See hoiab stiilistiku ülejäänud saidiga järjepidevana.

```mdx
import KFactorPlayground from '@site/src/components/KFactorPlayground';

<KFactorPlayground defaultMaterial="S235" />
```

## Stiilinäpunäited

- Hoidke konteinerid vedelana, et utiliidid töötaksid kioskidel, tahvelarvutitel ja sülearvutitel.
- Eelistage tumedat kasutajaliidest, et see sobiks ümbritseva dokumentatsiooni teemaga.
- Salvestage ekraanipildid `static/img` alla ja viidake neile MDX-is kiire visuaalse konteksti jaoks.
