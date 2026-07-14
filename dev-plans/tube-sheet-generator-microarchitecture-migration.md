# Tube Sheet Generator Microarchitecture Migration Plan

## 1. Purpose

This document defines the technical plan for migrating `TubeSheetGenerator` from a Docusaurus-bundled React component into a separately buildable Vite micro-application published into the host site as a static utility app.

Current source module:

```text
src/components/tools/TubeSheetGenerator
```

Target Vite app source:

```text
apps/tube-sheet-generator
```

Target static deployment path:

```text
static/utility-apps/tube-sheet-generator/app.html
```

The migration should follow the existing standalone utility pattern already used by tools such as `dxf-editor`, where Docusaurus owns the page shell and the utility itself runs as an isolated browser app inside the utility frame.

---

## 2. Current State

### 2.1 Host Site Stack

The root site is a Docusaurus application using React, TypeScript, `pnpm`, Replicad/OpenCascade, Three.js-related packages, Zustand, PDF/export libraries, and shared utility-shell infrastructure. The root `package.json` already includes the CAD-related dependencies required by this tool, including `replicad` and `replicad-opencascadejs`.

### 2.2 Current Page Integration

The current Docusaurus page imports the tool directly and passes it into `UtilityShellPage` as a React node:

```tsx
import UtilityShellPage from '@site/src/components/Utilities/UtilityShellPage';
import TubeSheetGenerator from '@site/src/components/tools/TubeSheetGenerator';
import {utilityPageConfigs} from '@site/src/data/utilityShellPages';

export default function TubeSheetGeneratorPage() {
  const config = utilityPageConfigs['tube-sheet-generator'];
  if (!config) {
    throw new Error('Utility page configuration missing for slug "tube-sheet-generator"');
  }

  return <UtilityShellPage {...config} tool={<TubeSheetGenerator />} />;
}
```

This tightly couples the generator to the Docusaurus build, site aliases, and Docusaurus-only runtime helpers.

### 2.3 Current Tool Characteristics

`TubeSheetGenerator` is more advanced than a simple calculator. It already includes:

- parameter form
- live preview canvas
- tube layout calculation
- interactive hole modification
- DXF export
- STEP export
- CAD worker warmup and progress reporting
- OpenCascade/Replicad-based geometry generation

The current root component uses `@docusaurus/BrowserOnly`, direct DOM downloads, local React state, `buildTubeSheetDxf`, `useGeneratorState`, `PreviewCanvas`, and `GeneratorForm`.

### 2.4 Current CAD Worker Pipeline

The current hook `useGeneratorState` already manages:

- generator parameters
- derived tube coordinates
- worker status
- worker warmup
- STEP generation through `generateStepInWorker`

The CAD worker client creates a module worker using:

```ts
new Worker(new URL('./cad-worker.ts', import.meta.url), {type: 'module'})
```

The worker dynamically imports `replicad` and `replicad-opencascadejs`, resolves the OpenCascade WASM file, generates tube sheet solids, cuts holes in batches, reports progress, and returns a STEP `ArrayBuffer`.

This existing CAD boundary should be preserved and improved during migration, not removed.

---

## 3. Migration Goal

Move `TubeSheetGenerator` to a Vite micro-application while preserving the public route:

```text
/utilities/tube-sheet-generator/
```

The Docusaurus host remains responsible for:

- route and page metadata
- utility shell layout
- auth/access gate
- reactions/comments
- fullscreen shell controls
- utility catalog data

The Vite app becomes responsible for:

- tube sheet generator UI
- generator state
- layout algorithms
- DXF export
- STEP generation
- CAD worker lifecycle
- local tool settings
- future CAD/export improvements

---

## 4. Target Architecture

### 4.1 Recommended Repository Layout

Start inside the existing repository:

```text
apps/
  tube-sheet-generator/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    scripts/
      rename-html.mjs
      write-manifest.mjs
    src/
      main.tsx
      App.tsx
      styles.css
      components/
      domain/
      state/
      export/
      cad/
      workers/
      shared/

static/
  utility-apps/
    tube-sheet-generator/
      app.html
      assets/
      manifest.json
```

A separate repository can be introduced later after the internal app boundary is stable.

### 4.2 Why Start as an Internal App

Start in `apps/tube-sheet-generator` because:

- existing code can be moved without publishing a package first
- host integration can be verified in one repository
- worker/WASM bundling can be tested before introducing external release sync
- root dependency versions can be reused or mirrored
- the app can later be moved into a dedicated repository without changing the public route

### 4.3 Long-Term Separate Repository Model

After stabilization, move the app to a dedicated repository such as:

```text
YurMil/tube-sheet-generator-app
```

The standalone repository should publish a release artifact containing:

```text
app.html
assets/*
manifest.json
checksums.json
```

Recommended publication model:

1. Build Vite app in the app repository.
2. Upload static bundle as a GitHub Release asset.
3. Host site sync script downloads the release asset.
4. Sync script verifies checksums.
5. Sync script places files into `static/utility-apps/tube-sheet-generator`.

---

## 5. Host-Site Integration

### 5.1 Docusaurus Page Change

Replace direct component rendering with the standard standalone utility page wrapper:

```tsx
import {createUtilityPage} from '@site/src/components/Utilities/createUtilityPage';

export default createUtilityPage('tube-sheet-generator');
```

This matches the pattern used by standalone iframe utilities.

### 5.2 Utility Config

Keep the existing `tube-sheet-generator` entry in `src/data/utilityShellPages.tsx`. Optionally make the static app path explicit:

```ts
'tube-sheet-generator': {
  slug: 'tube-sheet-generator',
  title: 'Tube Sheet Generator',
  subtitle: 'Web utility - Tube layout preview with DXF/STEP export',
  description: 'Generate tube sheet patterns with square or triangular pitch, visualize baffle partitions, and export DXF or STEP files locally.',
  about: 'Lay out tube sheet hole patterns for heat exchangers, adjust pitch and edge margins, and visualize pass partitions before exporting DXF or STEP files. Everything runs in the browser.',
  tags: ['Heat exchangers', 'Tube sheet', 'DXF', 'STEP'],
  note: 'STEP export uses WebAssembly in the browser. Large hole counts may take longer to process.',
  features: [
    'Square or triangular pitch layouts',
    'Partition preview for multi-pass designs',
    'DXF + STEP export with local processing',
  ],
  scriptType: 'module',
  appPath: '/utility-apps/tube-sheet-generator/app.html',
}
```

### 5.3 Static App Path

The host shell already defaults to:

```ts
appPath ?? `/utility-apps/${slug}/app.html`
```

Therefore, if the app is built to:

```text
static/utility-apps/tube-sheet-generator/app.html
```

then explicit `appPath` is optional but recommended for clarity.

---

## 6. Vite Build Requirements

### 6.1 Vite Configuration

Use relative asset paths because the app is served from a static subdirectory inside the Docusaurus site:

```ts
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../../static/utility-apps/tube-sheet-generator',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  worker: {
    format: 'es',
  },
});
```

### 6.2 HTML Output

Vite emits `index.html` by default. The site expects `app.html`.

Recommended postbuild step:

```json
{
  "scripts": {
    "build": "vite build && node scripts/rename-html.mjs && node scripts/write-manifest.mjs"
  }
}
```

`rename-html.mjs` should rename:

```text
index.html -> app.html
```

### 6.3 WASM Handling

The current CAD worker resolves the OpenCascade WASM file through:

```ts
new URL('replicad-opencascadejs/src/replicad_single.wasm', import.meta.url)
```

During migration, verify that Vite copies and serves this WASM asset correctly from the built static directory. If Vite does not emit it correctly, add one of these solutions:

1. import the WASM URL explicitly with `?url`
2. copy the WASM file via `vite-plugin-static-copy`
3. place the WASM file under `public/wasm/` and resolve it from `./wasm/replicad_single.wasm`

Recommended first implementation: use an explicit `?url` import so the asset is included in the Vite asset graph.

Example:

```ts
import replicadWasmUrl from 'replicad-opencascadejs/src/replicad_single.wasm?url';
```

Then:

```ts
locateFile: (path) => (path.endsWith('.wasm') ? replicadWasmUrl : path)
```

---

## 7. Internal App Architecture

### 7.1 Design Principle

Do not migrate the tool as a single copied component. The migration should preserve behavior while creating a clean boundary for future CAD, DXF, layout, and preview improvements.

### 7.2 Recommended Folder Structure

```text
apps/tube-sheet-generator/src/
  main.tsx
  App.tsx
  styles.css

  components/
    layout/
      ToolLayout.tsx
      Panel.tsx
      StatusMessage.tsx
    input/
      GeneratorForm.tsx
      TubeLayoutSelector.tsx
      BoardInputs.tsx
      HoleInputs.tsx
      PassPartitionInputs.tsx
    preview/
      PreviewCanvas.tsx
      PreviewToolbar.tsx
      HoleContextMenu.tsx
      HoleLegend.tsx
    export/
      ExportPanel.tsx
      DxfExportButton.tsx
      StepExportButton.tsx

  domain/
    layout/
      layoutStrategies.ts
      squareLayout.ts
      triangularLayout.ts
      passPartitions.ts
    geometry/
      geometryUtils.ts
      tubeSheetGeometry.ts
      holeModification.ts
      validation.ts
    types/
      generatorTypes.ts
      cadTypes.ts

  state/
    useTubeSheetStore.ts
    selectors.ts
    defaults.ts
    persistence.ts

  export/
    dxf/
      dxfExporter.ts
      dxfLayers.ts
    files/
      download.ts
      filenames.ts

  cad/
    geometry/
      buildTubeSheetSolid.ts
      buildHoleCuts.ts
      validateCadGeometry.ts
    workers/
      cadWorker.ts
      cadWorkerClient.ts
      cadWorkerProtocol.ts
    hooks/
      useStepExport.ts

  shared/
    numberFormat.ts
    units.ts
    errors.ts
```

### 7.3 Domain Layer Rules

Domain modules must be framework-independent:

- no React imports
- no DOM access
- no Docusaurus imports
- no direct file downloads
- pure functions for layout, validation, and geometry where possible

### 7.4 UI Layer Rules

UI components should display state and call actions. They should not contain CAD generation logic or layout formulas directly.

### 7.5 CAD Layer Rules

CAD generation must remain isolated:

- worker protocol in one place
- worker client in one place
- geometry builder separate from worker message handling
- no React imports in CAD builder modules
- no DXF logic mixed into STEP generation

---

## 8. State Management

### 8.1 Current State

Current state is split between:

- local `useState` in `index.tsx` for STEP status and modified holes
- `useGeneratorState` for parameters, tube coordinates, worker status, and STEP generation

This works, but migration is a good point to consolidate state.

### 8.2 Recommended State Model

Use `zustand`, already used/available in the wider site stack.

Recommended slices:

- `paramsSlice`: board diameter, tube diameter, pitch, thickness, layout, margins, pass count
- `layoutSlice`: derived tube coordinates, selected layout strategy
- `modificationSlice`: hidden holes, custom hole diameters, selected hole
- `exportSlice`: DXF/STEP status, progress, errors
- `cadSlice`: worker status, warmup state, CAD errors
- `uiSlice`: active panel, preview zoom, display toggles

### 8.3 Persistence

Persist only safe user preferences:

- last used dimensions
- selected layout type
- preview settings
- export naming preference

Do not persist:

- generated STEP buffers
- large DXF strings
- temporary worker results

---

## 9. Export Architecture

### 9.1 DXF Export

Keep DXF export separate from UI and CAD:

```text
export/dxf/dxfExporter.ts
```

The export button should call a domain/export function and then use a small file download helper.

### 9.2 STEP Export

Keep the existing worker-based STEP generation model, but refactor responsibilities:

```text
cad/workers/cadWorkerClient.ts    // request lifecycle
cad/workers/cadWorkerProtocol.ts  // typed protocol
cad/workers/cadWorker.ts          // worker entry
cad/geometry/buildTubeSheetSolid.ts
cad/geometry/buildHoleCuts.ts
cad/geometry/validateCadGeometry.ts
```

### 9.3 Download Helper

Move DOM download code into a reusable helper:

```ts
export function downloadBlob(blob: Blob, filename: string): void;
```

Then UI code becomes simple:

```ts
await exportStep();
```

instead of creating links directly in the component.

---

## 10. Worker and Performance Requirements

### 10.1 Keep STEP Generation Off the Main Thread

The current worker design is correct and must remain. Generating STEP files for large tube sheets can be heavy, so OpenCascade/Replicad work must stay inside a Web Worker.

### 10.2 Preserve Progress Reporting

Current progress stages should be preserved:

- `init`
- `geometry`
- `export`

Recommended future stages:

- `validate`
- `build-base`
- `cut-holes`
- `heal`
- `export`

### 10.3 Batch Processing

The current worker already cuts holes in batches and has fallback strategies. Keep this approach, but move the implementation into CAD geometry modules so the worker entry file stays small.

### 10.4 Lazy CAD Loading

Do not load Replicad/OpenCascade on initial app render unless the current warmup behavior is intentionally preserved.

Recommended behavior:

- MVP: preserve current warmup-on-load behavior if user experience depends on faster first STEP export
- optimized phase: warm up on first hover/click of STEP export or when export panel opens

### 10.5 Large Layout Handling

Add explicit limits and warnings for very large hole counts:

- show estimated hole count before export
- warn when hole count exceeds performance threshold
- allow DXF export even if STEP generation is likely heavy
- keep UI responsive during worker initialization

---

## 11. Docusaurus Dependency Removal

### 11.1 Remove `@docusaurus/BrowserOnly`

The Vite app is browser-only by definition, so remove:

```ts
import BrowserOnly from '@docusaurus/BrowserOnly';
```

Replace the root component with a normal Vite app root:

```tsx
export default function App() {
  return <TubeSheetGeneratorApp />;
}
```

### 11.2 Remove Docusaurus CSS Class Dependencies

Current UI uses Docusaurus Infima classes such as:

- `site-container`
- `row`
- `col col--4`
- `card`
- `button button--primary`
- `alert alert--info`
- `margin-top--md`

The Vite app should not rely on these classes unless the CSS is copied intentionally.

Recommended approach:

- create local CSS classes for the app
- keep visual style close to the existing engineering tool UI
- avoid hidden dependency on Docusaurus theme styles inside the iframe

---

## 12. Build Scripts

### 12.1 Root Scripts

Add root scripts:

```json
{
  "scripts": {
    "dev:tube-sheet": "pnpm --dir apps/tube-sheet-generator dev",
    "build:tube-sheet": "pnpm --dir apps/tube-sheet-generator build",
    "typecheck:tube-sheet": "pnpm --dir apps/tube-sheet-generator typecheck",
    "sync:tube-sheet": "node scripts/sync-tube-sheet-generator.js"
  }
}
```

### 12.2 App Scripts

Inside `apps/tube-sheet-generator/package.json`:

```json
{
  "name": "@cadautoscript/tube-sheet-generator-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && node scripts/rename-html.mjs && node scripts/write-manifest.mjs",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## 13. CI Requirements

CI should run:

```bash
pnpm install --frozen-lockfile
pnpm typecheck:tube-sheet
pnpm build:tube-sheet
pnpm typecheck
pnpm build
```

The host site build should fail if:

- `static/utility-apps/tube-sheet-generator/app.html` is missing
- app assets are missing
- manifest is missing
- Vite build emits absolute asset paths that break under the static route

---

## 14. Testing Plan

### 14.1 Functional Regression Tests

Verify migrated app against current behavior:

- square tube layout
- triangular tube layout
- pass partition visualization
- hole count calculation
- hidden hole toggling
- custom hole diameter behavior
- DXF export
- STEP export
- progress messages
- worker error handling

### 14.2 CAD/STEP Tests

Test representative cases:

- small tube sheet with few holes
- medium tube sheet with hundreds of holes
- large tube sheet near performance threshold
- hidden holes
- custom hole diameters
- invalid diameter/thickness inputs
- worker initialization failure
- WASM loading failure

### 14.3 Host Integration Tests

Verify:

- `/utilities/tube-sheet-generator/` opens the Vite app in the utility shell
- auth/access gate still works
- reactions/comments still belong to the host page
- fullscreen shell controls still work
- app layout works inside iframe dimensions
- production Docusaurus build passes

---

## 15. Acceptance Criteria

### 15.1 Functional

- public route remains `/utilities/tube-sheet-generator/`
- tool loads inside existing utility shell
- all current inputs remain available
- preview updates correctly
- hole modifications work
- DXF export works
- STEP export works
- progress status is shown during STEP generation

### 15.2 Technical

- Docusaurus no longer imports `src/components/tools/TubeSheetGenerator`
- Vite app builds independently
- static output is published to `static/utility-apps/tube-sheet-generator`
- assets use relative paths
- OpenCascade WASM loads correctly in production build
- CAD generation remains in a Web Worker
- domain/layout logic has no React or Docusaurus dependency

### 15.3 Quality

- TypeScript passes for app and host
- no hidden dependency on Docusaurus CSS
- worker error messages are readable
- large tube sheets do not freeze the main UI
- architecture is ready for future CAD optimization and separate repository deployment

---

## 16. Implementation Plan

### Phase 1 — Create Vite App Shell

Tasks:

- create `apps/tube-sheet-generator`
- add Vite + React + TypeScript config
- add `main.tsx`, `App.tsx`, and local CSS
- copy current TubeSheetGenerator source into the app
- remove `@docusaurus/BrowserOnly`
- replace Docusaurus CSS dependencies with local styles

Deliverable:

- app runs with `pnpm dev:tube-sheet`

### Phase 2 — Preserve Current Behavior

Tasks:

- port `GeneratorForm`
- port `PreviewCanvas`
- port layout strategies and geometry utilities
- port DXF exporter
- port CAD worker protocol/client/worker
- verify DXF and STEP export in Vite dev mode

Deliverable:

- standalone Vite app behaves like the current embedded tool

### Phase 3 — Refactor Internal Architecture

Tasks:

- split UI, domain, export, CAD, and state modules
- move direct DOM download logic into download helpers
- move CAD solid generation out of worker entry file
- optionally introduce Zustand store
- keep formulas and layout behavior unchanged

Deliverable:

- same behavior, cleaner architecture

### Phase 4 — Static Publication

Tasks:

- configure Vite `base: './'`
- configure output to `static/utility-apps/tube-sheet-generator`
- emit `app.html`
- verify JS/CSS/WASM assets load correctly
- generate `manifest.json`

Deliverable:

- built app can be opened at `/utility-apps/tube-sheet-generator/app.html`

### Phase 5 — Host Integration

Tasks:

- update `src/pages/utilities/tube-sheet-generator.tsx` to use `createUtilityPage('tube-sheet-generator')`
- optionally set explicit `appPath`
- run Docusaurus build
- test shell controls, auth gate, comments, fullscreen

Deliverable:

- public utility page loads the Vite app through the shell iframe

### Phase 6 — Production Hardening

Tasks:

- add WASM loading verification
- add large-hole-count warnings
- improve worker error messages
- add regression fixtures for DXF/STEP export
- test mobile/iframe layout

Deliverable:

- production-ready migrated utility

### Phase 7 — Separate Repository Deployment

Tasks:

- create standalone repository
- move app source there
- set up GitHub Actions build
- publish static release artifact
- add host sync script
- verify checksums during sync

Deliverable:

- independent Tube Sheet Generator repository deploys versioned static builds into the main site

---

## 17. Recommended First PR Scope

The first PR should be migration-only:

- create Vite app
- port existing tool behavior
- make static build work
- switch host page to iframe mode

Do not combine this with major CAD performance rewrites, formula changes, or new features. Those should be follow-up PRs after the app boundary is stable.

---

## 18. Risks and Mitigations

### Risk: OpenCascade WASM asset breaks after Vite build

Mitigation:

- use explicit `?url` import or static copy
- test production build, not only Vite dev
- verify network path under `/utility-apps/tube-sheet-generator/`

### Risk: Docusaurus CSS dependency hidden in UI

Mitigation:

- replace Infima classes with local CSS
- test app directly at static app path

### Risk: Worker path changes after migration

Mitigation:

- keep `new Worker(new URL(..., import.meta.url), {type: 'module'})`
- use Vite worker build support
- run STEP export test from production build

### Risk: Large tube sheets produce slow STEP exports

Mitigation:

- keep worker execution
- keep batch cutting strategy
- add thresholds and warnings
- consider lazy worker warmup and geometry simplification later

### Risk: Migration changes engineering results

Mitigation:

- first PR should avoid formula/layout changes
- compare tube coordinates and DXF output before/after migration
- add regression cases for representative layouts

---

## 19. Definition of Done

Migration is complete when:

- `TubeSheetGenerator` is buildable as an independent Vite app
- built output is published to `static/utility-apps/tube-sheet-generator/app.html`
- Docusaurus page uses `createUtilityPage('tube-sheet-generator')`
- DXF export works
- STEP export works through Web Worker
- OpenCascade WASM loads correctly from the static deployment
- preview and hole modifications behave as before
- the codebase has a clear architecture for future CAD/export improvements
- the app is ready to be moved to a separate repository without changing the public route
