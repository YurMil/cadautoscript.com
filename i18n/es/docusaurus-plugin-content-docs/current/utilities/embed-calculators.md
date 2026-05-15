---
sidebar_position: 3
title: Incrustación de calculadoras
---

Las páginas MDX pueden albergar utilidades interactivas de varias maneras:

## 1. iframe en línea

```mdx
<iframe
  src="/utilities/pipe-cutter/"
  title="Pipe Cutter"
  height="640"
  style={{width: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px'}}
/>
```

Usa esto cuando una calculadora se distribuye como un paquete independiente bajo `static/utility-apps/<slug>/app.html`.

## 2. Envolver como un componente de React

Si la herramienta expone una compilación de React (por ejemplo, un generador de DXF exportado con Vite), crea un componente bajo `src/components`:

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

Luego impórtalo directamente dentro de MDX:

```mdx
import PipeCutterEmbed from '@site/src/components/PipeCutterEmbed';

<PipeCutterEmbed height={720} />
```

## 3. Renderizar utilidades JSX

Para calculadoras escritas puramente en React, expórtalas desde `src/components` e impórtalas en MDX sin iframes. Esto mantiene el estilo consistente con el resto del sitio.

```mdx
import KFactorPlayground from '@site/src/components/KFactorPlayground';

<KFactorPlayground defaultMaterial="S235" />
```

## Consejos de estilo

- Mantén los contenedores fluidos para que las utilidades funcionen en quioscos, tabletas y computadoras portátiles.
- Prefiere la interfaz de usuario oscura para que coincida con el tema de la documentación circundante.
- Almacena capturas de pantalla bajo `static/img` y haz referencia a ellas en MDX para un contexto visual rápido.
