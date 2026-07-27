Original prompt: Нужно аккуратно найти и устранить проблему для игр именно — с кнопками выхода из полноэкранного режима и починить их, чтобы они работали так же корректно и находились с самого низу и верху, как и в приложениях.

## Progress

- Root cause: `MiniGameShellPage` rendered one fullscreen exit zone without the required `top` or `bottom` positioning class.
- Replaced it with the same top and bottom exit-zone structure used by `UtilityShellPage`.
- Reused a shared `exitFullscreen` handler and added body-class cleanup on unmount.
- `pnpm typecheck` passed.
- `pnpm build` passed for all six locales.
- Browser validation passed on the production build:
  - top zone: viewport y=0–120;
  - bottom zone: final 120 px of the viewport;
  - both exit buttons successfully leave fullscreen mode.
- Visually inspected the fullscreen screenshot; the indicators are aligned to the top and bottom edges.

## TODO

- None for this fix.
