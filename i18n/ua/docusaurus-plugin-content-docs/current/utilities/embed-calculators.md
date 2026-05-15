---
sidebar_position: 3
title: Вбудовування калькуляторів
---

Сторінки MDX можуть містити інтерактивні утиліти кількома способами:

## 1. Вбудований iframe

```mdx
<iframe
  src="/utilities/pipe-cutter/"
  title="Pipe Cutter"
  height="640"
  style={{width: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px'}}
/>
```

Використовуйте цей метод, якщо калькулятор постачається як окремий пакет у `static/utility-apps/<slug>/app.html`.

## 2. Обгортка у вигляді React-компонента

Якщо інструмент надає збірку React (наприклад, генератор DXF, експортований за допомогою Vite), створіть компонент у `src/components`:

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

Потім імпортуйте його безпосередньо всередині MDX:

```mdx
import PipeCutterEmbed from '@site/src/components/PipeCutterEmbed';

<PipeCutterEmbed height={720} />
```

## 3. Рендеринг JSX-утиліт

Для калькуляторів, написаних виключно на React, експортуйте їх із `src/components` та імпортуйте в MDX без використання iframe. Це збереже єдиний стиль з усім іншим сайтом.

```mdx
import KFactorPlayground from '@site/src/components/KFactorPlayground';

<KFactorPlayground defaultMaterial="S235" />
```

## Поради щодо стилізації

- Робіть контейнери адаптивними, щоб утиліти працювали на терміналах, планшетах та ноутбуках.
- Віддавайте перевагу темному інтерфейсу, щоб він відповідав темі документації.
- Зберігайте скріншоти у `static/img` і посилайтеся на них у MDX для швидкого візуального розуміння контексту.
