# Bundle Audit — July 2026 (issue #99)

Run `ANALYZE=1 npm run build` to regenerate the interactive report at
`build/bundle-report.html` (webpack-bundle-analyzer, client bundle only).

## Headline result

The micro-app migrations (#93/#94/#95) already achieved the audit's main goal:
**no WASM, 3D, or document library ships on the critical path.** Every page
loads the same two files first:

| File | Parsed size | Contents |
|---|---|---|
| `main.<hash>.js` | 633 KB | react-dom (174 KB), prism-react-renderer + prismjs (109 KB), Docusaurus theme/runtime (~140 KB), lunr + language stemmers (71 KB, offline search), mark.js (17 KB), site code incl. the `en` dictionary (33 KB) |
| `runtime~main.<hash>.js` | 9 KB | webpack runtime |

Everything in `main` is framework or deliberately-global functionality
(search, syntax highlighting, theme). There is no obvious low-effort cut left:
the next meaningful step would be swapping search or highlighting strategies,
which trades UX for bytes.

## Heavy libraries — all verified lazy

| Chunk | Size | Contents | Loaded on |
|---|---|---|---|
| `7084.*` | 3.0 MB | rapier physics (2.2 MB) + three.js (698 KB) + react-three-fiber | Eco Sort game page only |
| `5741.*` | 743 KB | @mdx-js/mdx compiler + acorn + framer-motion | MDX post editor only |
| `3512.*` | 391 KB | jspdf | PDF-export tools only |
| `5527.*` | 262 KB | emoji-picker-react | comment editor interaction |
| locale chunks | ~15 KB each | `ru/ua/de/es/et` dictionaries | on language switch (only `en` is in `main`) |

Supabase is dynamically imported by the lazy client facade
(`src/lib/supabaseClient.ts`) and does not appear in `main`.

## Changes made in this audit

1. **Removed dead dependencies `replicad` and `replicad-opencascadejs`** —
   zero imports remained in `src/` after the CAD tools moved to standalone
   apps. Shrinks installs/CI by ~15 MB (the OpenCascade WASM binary alone is
   ~11 MB in node_modules); runtime bundles were never affected because
   webpack only bundles imported modules.
2. **Removed the replicad WASM webpack config** (`asyncWebAssembly`,
   `__filename` mocks, `fs/path/crypto` fallbacks) — nothing in the site
   bundle imports WASM anymore. Verified by a clean production build.
3. **Committed the analyzer tooling** (`ANALYZE=1` flag in the webpack
   plugin) so future audits are a one-liner.

## Acceptance criteria mapping

- *Bundle analysis report committed or documented* — this file + reproducible
  `ANALYZE=1` build.
- *No WASM/3D library loaded on the landing or docs pages* — verified: the
  only render-path JS is `main` + `runtime` (table above); three/rapier live
  exclusively in the Eco Sort chunk.
- *Measurable reduction in first-load JS for non-tool pages* — the big
  reduction was delivered by the migrations this audit verified (the last
  in-bundle CAD tool previously pulled replicad/OpenCascade context into
  shared chunks); this pass removes the leftover dependency and config debt
  and establishes the measurement baseline (642 KB total first-load) to hold
  the line against regressions.
