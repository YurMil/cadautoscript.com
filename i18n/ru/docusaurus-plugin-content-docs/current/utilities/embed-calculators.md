---
sidebar_position: 3
title: Встраивание калькуляторов
---

Страницы MDX могут содержать интерактивные утилиты несколькими способами:

## 1. Встроенный iframe

```mdx
<iframe
  src="/utilities/pipe-cutter/"
  title="Pipe Cutter"
  height="640"
  style={{width: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px'}}
/>
```

Используйте этот метод, если калькулятор поставляется как отдельный пакет в `static/utility-apps/<slug>/app.html`.

## 2. Обертка в виде React-компонента

Если инструмент предоставляет сборку React (например, генератор DXF, экспортированный с помощью Vite), создайте компонент в `src/components`:

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

Затем импортируйте его непосредственно внутри MDX:

```mdx
import PipeCutterEmbed from '@site/src/components/PipeCutterEmbed';

<PipeCutterEmbed height={720} />
```

## 3. Рендеринг JSX-утилит

Для калькуляторов, написанных исключительно на React, экспортируйте их из `src/components` и импортируйте в MDX без использования iframe. Это сохранит единообразие стилей со всем остальным сайтом.

```mdx
import KFactorPlayground from '@site/src/components/KFactorPlayground';

<KFactorPlayground defaultMaterial="S235" />
```

## Советы по стилизации

- Делайте контейнеры адаптивными, чтобы утилиты работали на терминалах, планшетах и ноутбуках.
- Отдавайте предпочтение темному интерфейсу, чтобы он соответствовал теме документации.
- Храните скриншоты в `static/img` и ссылайтесь на них в MDX для быстрого визуального понимания контекста.
