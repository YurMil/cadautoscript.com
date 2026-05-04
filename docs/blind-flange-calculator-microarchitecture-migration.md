# Blind Flange Calculator Microarchitecture Migration Plan

## 1. Purpose

This document defines the technical plan for migrating `BlindFlangeCalculator` from a Docusaurus-bundled React component into a separately maintained Vite application that is published into the host site as a static utility app.

Target source module:

```text
src/components/tools/BlindFlangeCalculator
```

Target published app path:

```text
static/utility-apps/blind-flange-calculator/app.html
```

The migration should follow the existing utility-shell pattern already used by standalone utilities such as `dxf-editor`, where the Docusaurus page renders the common site shell and loads the utility app inside the tool frame.

---

## 2. Current State

### 2.1 Host Site Stack

The root site is a Docusaurus application named `cadautoscript-site`. It already uses React, TypeScript, Tailwind-related tooling, Vercel analytics, Supabase, Three.js, Replicad/OpenCascade, Monaco, Zustand, `jspdf`, `lucide-react`, and other browser utility dependencies. The package manager is `pnpm@10.33.0`, and the Node engine is `22.x`.

### 2.2 Current Blind Flange Integration

The current page imports the calculator directly into the Docusaurus bundle:

```tsx
import UtilityShellPage from '@site/src/components/Utilities/UtilityShellPage';
import BlindFlangeCalculator from '@site/src/components/tools/BlindFlangeCalculator';
import {utilityPageConfigs} from '@site/src/data/utilityShellPages';

export default function BlindFlangeCalculatorPage() {
  const config = utilityPageConfigs['blind-flange-calculator'];
  if (!config) {
    throw new Error('Utility page configuration missing for slug "blind-flange-calculator"');
  }

  return <UtilityShellPage {...config} tool={<BlindFlangeCalculator />} />;
}
```

This means the tool is compiled together with the documentation site and is tightly coupled to Docusaurus aliases, theme build settings, and site dependency resolution.

### 2.3 Existing Standalone Utility Pattern

`UtilityShellPage` already supports two rendering modes:

1. If a `tool` React node is passed, it renders the tool directly.
2. If no `tool` is passed, it loads a static utility app through an iframe.

The default iframe path is:

```ts
appPath ?? `/utility-apps/${slug}/app.html`
```

The `dxf-editor` page uses the generic standalone utility wrapper:

```tsx
import {createUtilityPage} from '@site/src/components/Utilities/createUtilityPage';

export default createUtilityPage('dxf-editor');
```

This is the desired integration model for `blind-flange-calculator` after migration.

---

## 3. Migration Goal

Move `BlindFlangeCalculator` to a separately buildable Vite micro-application while preserving the existing public route:

```text
/utilities/blind-flange-calculator/
```

The Docusaurus site remains responsible for:

- route ownership
- SEO metadata
- utility shell layout
- auth/access gate
- reactions/comments
- fullscreen shell controls
- utility catalog data

The Vite app becomes responsible for:

- calculator UI
- calculator state
- engineering domain logic
- export actions
- CAD/STEP generation improvements
- local persistence for tool-specific settings, if needed
- future internal architecture evolution independent of the Docusaurus bundle

---

## 4. Architectural Direction

### 4.1 Recommended Architecture

Use a repository-level monorepo-style structure with a standalone Vite app inside the existing repository first. This keeps deployment simple and avoids introducing cross-repository automation too early.

Recommended repository layout:

```text
apps/
  blind-flange-calculator/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    src/
      main.tsx
      App.tsx
      styles.css
      components/
      domain/
      data/
      export/
      cad/
      workers/
      state/
      shared/

static/
  utility-apps/
    blind-flange-calculator/
      app.html
      assets/
```

A later phase can split `apps/blind-flange-calculator` into a separate repository and publish the built artifact back into this site repository.

### 4.2 Why Start Inside the Same Repository

Starting inside the same repository reduces risk because:

- current calculator code can be moved without package publishing overhead
- Docusaurus integration can be changed in one PR
- build output can be validated against the existing static utility pattern
- root dependencies and versions can be reused or mirrored
- future split into a dedicated repository remains possible once the app boundary is stable

### 4.3 Later Separate Repository Model

After the Vite app is stable, move it to a separate repository, for example:

```text
biosxxx/blind-flange-calculator-app
```

That repository should publish a versioned static artifact containing:

```text
app.html
assets/*
manifest.json
checksums.json
```

The host site can then consume it through one of these approaches:

1. GitHub Actions artifact download
2. Git submodule
3. Git subtree
4. package tarball from GitHub Packages
5. release asset sync script

Recommended long-term approach: GitHub release asset sync, because it keeps the host repository clean and avoids submodule friction.

---

## 5. Target Runtime Integration

### 5.1 Docusaurus Page

Replace the direct component page with the generic utility page:

```tsx
import {createUtilityPage} from '@site/src/components/Utilities/createUtilityPage';

export default createUtilityPage('blind-flange-calculator');
```

This matches the standalone utility pattern used by `dxf-editor`.

### 5.2 Utility Config

Keep the existing `blind-flange-calculator` entry in `src/data/utilityShellPages.tsx`, but optionally make the app path explicit:

```ts
'blind-flange-calculator': {
  slug: 'blind-flange-calculator',
  title: 'Blind Flange Calculator',
  subtitle: 'Web utility - EN 13445-3 blind flange sizing',
  description: 'Auto-select EN 1092-1 PN class, calculate blind flange thickness, and estimate weight from DN and pressure.',
  about: 'Enter DN, operating and test pressure, temperature, material, and corrosion allowance. The calculator selects the nearest PN class from EN 1092-1, computes minimum thickness per EN 13445-3, and recommends a standard plate thickness with a weight estimate.',
  tags: ['EN 13445-3', 'EN 1092-1', 'Flanges'],
  note: 'Runs entirely in the browser. Validate final flange sizing, bolt loads, and gasket selection against project specs.',
  features: [
    'Automatic PN selection from operating pressure',
    'Minimum and recommended thickness outputs',
    'Bolt circle data and weight estimate',
  ],
  scriptType: 'module',
  appPath: '/utility-apps/blind-flange-calculator/app.html',
}
```

### 5.3 Vite Build Output

Configure Vite so the generated HTML file is named `app.html` and all assets use relative paths.

Required Vite settings:

```ts
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../../static/utility-apps/blind-flange-calculator',
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
});
```

After build, rename or emit `index.html` as `app.html`. Prefer a small postbuild script so Vite remains conventional:

```json
{
  "scripts": {
    "build": "vite build && node scripts/rename-html.mjs"
  }
}
```

---

## 6. Application Internal Architecture

### 6.1 Design Principle

The migration must not simply copy the existing component tree into Vite. It should create a maintainable app boundary with clear separation between UI, domain calculations, data, exports, workers, and future CAD features.

### 6.2 Recommended App Structure

```text
apps/blind-flange-calculator/src/
  main.tsx
  App.tsx

  components/
    layout/
      ToolHeader.tsx
      Panel.tsx
      Section.tsx
    input/
      InputForm.tsx
      GeometryModeSelector.tsx
      PressureInputs.tsx
      MaterialInputs.tsx
      FastenerInputs.tsx
    results/
      ResultsPanel.tsx
      ThicknessSummary.tsx
      BoltSummary.tsx
      ValidationMessages.tsx
    export/
      ExportActions.tsx
      PdfExportButton.tsx
      StepExportButton.tsx

  domain/
    calculations/
      calculateBlindFlange.ts
      hydrotest.ts
      customSizing.ts
      manualCheck.ts
    standards/
      en1092.ts
      en13445.ts
      materials.ts
      fasteners.ts
      gaskets.ts
    validation/
      inputValidation.ts
      geometryValidation.ts
    types/
      blindFlangeTypes.ts
      calculationTypes.ts

  state/
    useBlindFlangeStore.ts
    selectors.ts
    defaults.ts
    persistence.ts

  export/
    pdf/
    text/
    download.ts
    fileNames.ts

  cad/
    geometry/
      computeBlindFlangeCadGeometry.ts
      buildBoltHolePattern.ts
      validation.ts
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

### 6.3 State Management

Use `zustand`, already present in the site dependencies, for app-level state instead of passing many props through the entire tree.

Recommended store slices:

- `inputSlice`: DN, pressures, temperature, material, corrosion allowance
- `geometrySlice`: standard/custom mode, custom dimensions, selected design config
- `fastenerSlice`: standard, type, grade, friction, tightening method
- `resultSlice`: calculated result, custom result, manual check result
- `exportSlice`: PDF/STEP generation state
- `uiSlice`: expanded panels, warnings, selected tabs

Persist only user preferences and non-sensitive calculator defaults. Do not persist generated file buffers.

### 6.4 Domain Layer Rules

The domain layer must remain framework-independent:

- no React imports
- no DOM access
- no Docusaurus aliases
- no direct file download side effects
- deterministic pure functions where possible

This allows future unit tests, CLI checks, and possible package extraction.

### 6.5 UI Layer Rules

The UI layer should consume domain selectors and actions. It should not contain engineering formulas directly.

Bad:

```tsx
const requiredThickness = Math.sqrt(...formula...);
```

Good:

```tsx
const result = useBlindFlangeResult();
```

---

## 7. Dependency Strategy

### 7.1 Reuse Existing Technologies

Use technologies already present in the site where practical:

- React 19
- TypeScript
- Zustand
- Lucide React
- jsPDF
- Replicad / OpenCascade for future STEP generation
- Three.js only if a 3D preview is later added
- existing CSS/Tailwind-compatible utility classes where possible

### 7.2 Vite-Specific Dependencies

Add only the minimal Vite app dependencies:

```json
{
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest"
  }
}
```

Use workspace/shared versions where possible. Avoid adding a second UI framework.

### 7.3 Styling Strategy

Do not depend on Docusaurus theme CSS inside the Vite app.

Use one of these approaches:

1. Local CSS modules or plain CSS files copied with the app
2. Tailwind build inside the Vite app, if the app needs utility-first styling
3. A small shared design-token CSS file copied from the host site

Recommended for the first migration: local CSS with CSS variables matching the current dark engineering UI.

---

## 8. Build and Publication Pipeline

### 8.1 Root Scripts

Add scripts to the root `package.json`:

```json
{
  "scripts": {
    "dev:blind-flange": "pnpm --dir apps/blind-flange-calculator dev",
    "build:blind-flange": "pnpm --dir apps/blind-flange-calculator build",
    "typecheck:blind-flange": "pnpm --dir apps/blind-flange-calculator typecheck",
    "sync:blind-flange": "node scripts/sync-blind-flange-calculator.js"
  }
}
```

### 8.2 Local Development

Use two modes:

1. Standalone app development:

```bash
pnpm dev:blind-flange
```

2. Host integration check:

```bash
pnpm build:blind-flange
pnpm start
```

Then open:

```text
/utilities/blind-flange-calculator/
```

### 8.3 CI Requirements

CI should run:

```bash
pnpm install --frozen-lockfile
pnpm typecheck:blind-flange
pnpm build:blind-flange
pnpm typecheck
pnpm build
```

The host site build must fail if the static app output is missing.

### 8.4 Artifact Manifest

Generate a small manifest during Vite build:

```json
{
  "name": "blind-flange-calculator",
  "version": "0.1.0",
  "buildTime": "2026-05-04T00:00:00.000Z",
  "entry": "app.html",
  "assets": ["assets/index-xxxxx.js", "assets/index-yyyyy.css"]
}
```

The host site can later use this for diagnostics and release verification.

---

## 9. Cross-App Communication

### 9.1 MVP

No complex host/app communication is required for the first migration. The iframe app should run independently.

### 9.2 Recommended Future Protocol

If the host needs to control theme, fullscreen state, analytics, or auth context, use `postMessage` with a typed protocol.

Example:

```ts
export type HostToUtilityMessage =
  | {type: 'theme'; value: 'light' | 'dark'}
  | {type: 'fullscreen'; active: boolean}
  | {type: 'utility-shell-ready'};

export type UtilityToHostMessage =
  | {type: 'utility-ready'; slug: 'blind-flange-calculator'}
  | {type: 'utility-error'; message: string}
  | {type: 'utility-analytics-event'; name: string; payload?: Record<string, unknown>};
```

Keep this optional until a real need appears.

---

## 10. STEP/CAD Roadmap Alignment

There is already a separate technical specification for adding 3D STEP generation to `BlindFlangeCalculator`. The Vite migration should prepare for that work by reserving a dedicated `cad/` subsystem.

Recommended CAD architecture inside the Vite app:

```text
cad/
  geometry/
    computeBlindFlangeCadGeometry.ts
    buildBlindFlangeSolid.ts
    buildBoltHolePattern.ts
    validation.ts
  workers/
    cadWorker.ts
    cadWorkerClient.ts
    cadWorkerProtocol.ts
  hooks/
    useStepExport.ts
```

CAD/STEP generation must run in a Web Worker so the calculator UI remains responsive.

---

## 11. Implementation Plan

### Phase 1 — Prepare App Boundary

Tasks:

- create `apps/blind-flange-calculator`
- add Vite, React, TypeScript configuration
- create `main.tsx` and `App.tsx`
- move existing calculator files into the Vite app structure
- remove Docusaurus-specific aliases from moved code
- replace `@site` imports with relative or package-local imports
- copy or recreate required CSS locally

Deliverable:

- calculator runs with `pnpm dev:blind-flange`

### Phase 2 — Reorganize Internal Code

Tasks:

- split UI components from engineering domain logic
- move standards data into `domain/standards`
- move calculations into `domain/calculations`
- move export/download helpers into `export/`
- introduce Zustand store for app state
- keep existing calculation behavior unchanged

Deliverable:

- calculator behavior matches current production behavior, but internal structure is cleaner

### Phase 3 — Static Build Publication

Tasks:

- configure Vite build output to `static/utility-apps/blind-flange-calculator`
- ensure generated HTML is available as `app.html`
- ensure assets are loaded through relative paths
- add artifact manifest
- add root build scripts

Deliverable:

- `static/utility-apps/blind-flange-calculator/app.html` is produced by the Vite build

### Phase 4 — Host Shell Integration

Tasks:

- change `src/pages/utilities/blind-flange-calculator.tsx` to use `createUtilityPage('blind-flange-calculator')`
- optionally set explicit `appPath` in `utilityShellPages.tsx`
- verify auth gate still works through `UtilityShellPage`
- verify fullscreen and info-panel controls still work
- verify reactions/comments remain on the host page

Deliverable:

- `/utilities/blind-flange-calculator/` loads the Vite app inside the existing utility shell

### Phase 5 — Validation and Regression Testing

Tasks:

- compare current and migrated outputs for representative inputs
- test standard geometry mode
- test custom geometry mode
- test manual check/custom sizing paths
- test PDF/export actions
- test mobile layout inside iframe
- test fullscreen mode
- test production Docusaurus build

Deliverable:

- migration accepted with no functional regression

### Phase 6 — Separate Repository Publication

Tasks:

- create a dedicated repository for the Vite app
- move app source from `apps/blind-flange-calculator`
- configure GitHub Actions build
- publish release artifact with `app.html`, assets, and manifest
- add host-site sync script to download and place artifact under `static/utility-apps/blind-flange-calculator`
- add checksum verification

Deliverable:

- standalone repository publishes versioned app builds consumed by the site repository

---

## 12. Detailed Acceptance Criteria

### 12.1 Functional

- existing URL remains `/utilities/blind-flange-calculator/`
- calculator loads inside the standard utility shell
- all current inputs remain available
- automatic PN selection still works
- hydrotest pressure logic still works
- standard/custom geometry modes still work
- export actions still work
- mobile and fullscreen shell modes remain usable

### 12.2 Technical

- Docusaurus no longer imports `src/components/tools/BlindFlangeCalculator`
- standalone app builds through Vite
- static output is placed under `static/utility-apps/blind-flange-calculator`
- generated app uses relative asset paths
- domain calculations are framework-independent
- app does not depend on Docusaurus runtime aliases
- future CAD worker code has a reserved architecture path

### 12.3 Quality

- TypeScript passes for both host and utility app
- production Docusaurus build passes
- no duplicated engineering formulas between host and app
- no hidden runtime dependency on root Docusaurus CSS
- errors inside the iframe app are readable to the user

---

## 13. Risks and Mitigations

### Risk: Duplicated dependency versions

The standalone app can accidentally drift from the host dependency versions.

Mitigation:

- keep it inside the same repository first
- use pnpm workspace version alignment
- document allowed dependency additions

### Risk: Broken asset paths after static publication

Vite defaults may emit absolute paths that fail under `/utility-apps/...`.

Mitigation:

- set `base: './'`
- test built `app.html` through Docusaurus locally

### Risk: Losing shell features

Direct component rendering currently avoids iframe boundaries. After migration, shell controls must still work.

Mitigation:

- keep shell-owned features in `UtilityShellPage`
- avoid moving comments/reactions/auth into the app
- use the existing iframe fallback path

### Risk: Over-coupled app source

Simply copying the old folder can preserve tight coupling and make future improvements difficult.

Mitigation:

- reorganize into `domain`, `state`, `export`, `cad`, and `components`
- enforce no React imports in domain modules

### Risk: Large CAD/WASM payload later

Future STEP generation may increase bundle size.

Mitigation:

- lazy-load CAD workers
- split CAD code into separate chunks
- warm up the worker only when user opens export/CAD actions

---

## 14. Recommended First PR Scope

Keep the first PR focused on migration mechanics only:

- create Vite app
- move current calculator code
- build static app
- switch Docusaurus page to iframe utility mode
- preserve existing behavior

Do not combine this with major formula changes or STEP generation. CAD/STEP work should be a follow-up PR using the new `cad/` architecture.

---

## 15. Definition of Done

The migration is complete when:

- `BlindFlangeCalculator` is buildable as an independent Vite app
- the built app is published to `static/utility-apps/blind-flange-calculator/app.html`
- the Docusaurus page uses `createUtilityPage('blind-flange-calculator')`
- current calculator functionality is preserved
- the codebase has a clear internal architecture for future improvements
- the app is ready to be moved to a separate repository without changing the public site route
