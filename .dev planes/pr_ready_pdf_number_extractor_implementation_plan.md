# PR-Ready Implementation Plan
## PDF Number Extractor Migration to React + TypeScript Inside the Main Site

## Document Purpose

This document describes the recommended implementation plan for migrating the existing `pdf-number-extractor` from a legacy static HTML/inline-JS page into a maintainable React + TypeScript module integrated directly into the main website codebase.

It is written for an engineer who will implement the migration inside the existing repository and open one or more pull requests.

---

## 1. Objective

Replace the legacy implementation currently located under:

```text
static/utility-apps/pdf-number-extractor/app.html
```

with a proper React + TypeScript implementation that:

- lives inside the main site codebase
- uses the site’s existing frontend architecture
- is routed and rendered through the main site
- preserves all current user-facing functionality
- is easier to maintain, test, and extend

This is an **in-repo migration**, not a separate product build.

---

## 2. Target Delivery Model

### In scope

- React + TypeScript implementation inside the main repo
- modularized business logic
- utility page integrated through the site’s standard page structure
- removal of inline DOM-driven architecture for the main version
- preservation of current extraction/export behavior

### Out of scope

- introducing a backend API
- server-side PDF processing
- creating a standalone Vite app as the primary solution
- iframe-based main integration
- redesigning business rules unless required for correctness

---

## 3. Recommended Delivery Strategy

The safest delivery strategy is a **phased migration with parity checks**, not a full rewrite in one commit.

### Recommended PR split

#### PR 1 — Foundation and scaffolding
Create the new feature structure, types, state hook, and empty UI shells.

#### PR 2 — Extraction engine migration
Move quick scan, full analysis, revision handling, and screenshot capture into typed modules.

#### PR 3 — Results, viewer, and exports
Rebuild the results UI, PDF preview flow, exclusion/comments behavior, and export actions.

#### PR 4 — Site integration and legacy deprecation
Wire the utility into the main site route/page, update navigation, and downgrade/remove the legacy entry point.

If the team prefers a single PR, keep the commit history clearly split by concern in the same order.

---

## 4. Recommended Final Structure

A structure like the following is recommended.

```text
src/
  components/
    PdfNumberExtractor/
      PdfNumberExtractor.tsx
      types.ts
      constants.ts
      hooks/
        usePdfNumberExtractor.ts
      components/
        FileDropzone.tsx
        FileList.tsx
        ExtractionSettings.tsx
        ScreenshotSettings.tsx
        ProcessingSection.tsx
        ResultsSection.tsx
        ResultsList.tsx
        ResultItem.tsx
        PdfViewerModal.tsx
        HelpModal.tsx
        SummaryBanner.tsx
        ExportActions.tsx
      utils/
        regex.ts
        fileNaming.ts
        revisions.ts
        sorting.ts
        pdfRuntime.ts
        quickScan.ts
        pageAnalysis.ts
        capture.ts
        canvas.ts
        exportTxt.ts
        exportCsv.ts
        exportSingleFileCsv.ts
        exportPdfReport.ts
      __tests__/
        regex.test.ts
        revisions.test.ts
        fileNaming.test.ts
        sorting.test.ts
        exportCsv.test.ts

docs/
  utilities/
    pdf-number-extractor.mdx
```

### Notes on structure

- Keep UI and business logic separated.
- Avoid putting extraction logic directly inside UI components.
- Keep file naming/revision rules in dedicated helpers because those rules are business-critical and likely to be reused.
- Keep export functions isolated because they are easy to regression-test independently.

---

## 5. Implementation Phases

## Phase 1 — Discovery and parity baseline

### Goals

- understand the legacy behavior precisely
- identify business rules that must remain unchanged
- define parity expectations before refactoring

### Tasks

1. Read the legacy `app.html` end to end.
2. List all functional features and implicit behaviors.
3. Capture a small test fixture set of PDFs covering:
   - normal matches
   - no matches
   - duplicate matches
   - multiple revisions
   - damaged/invalid PDF
   - `EST-` file prefix case
4. Record current output behavior from the legacy implementation:
   - quick scan counts
   - full extraction counts
   - TXT export
   - CSV export
   - single-file CSV export
   - PDF report export

### Deliverables

- parity checklist
- sample files for manual validation
- expected output notes

### Important nuance

The legacy file contains several behaviors that may look incidental but should be treated as product behavior unless intentionally changed:

- prefix escaping in regex
- length filtering applied to the numeric portion only
- `EST-` filename prefix special case
- revision extraction from filename
- “keep longest match” logic for CSV duplicate reduction
- positional screenshot generation based on X/Y offsets

Do not “clean up” those rules prematurely.

---

## Phase 2 — Scaffolding and state model

### Goals

- build the shell of the new implementation
- define stable types and state ownership
- remove dependence on DOM querying

### Tasks

1. Create the feature directory under `src/components/PdfNumberExtractor`.
2. Define core types in `types.ts`.
3. Implement a dedicated state hook:
   - `usePdfNumberExtractor`
4. Define state slices for:
   - uploaded files
   - settings
   - processing state
   - captured results
   - viewer modal state
   - help modal state
5. Create top-level rendering flow:
   - config view
   - processing view
   - results view

### Recommended state shape

```ts
export type ExtractorSettings = {
  prefix: string;
  maxLength: number;
  processLatestRevisionOnly: boolean;
  includeRevisionInReports: boolean;
  removeCsvDuplicatesKeepLongest: boolean;
  prefillCommentsWithDrawingName: boolean;
  captureWidth: number;
  captureHeight: number;
  captureX: number;
  captureY: number;
};

export type UploadedFileEntry = {
  id: string;
  file: File;
  name: string;
  scanResult: ScanResult | 'scanning' | null;
};

export type ScanResult = {
  total: number | 'Error';
  unique: number | '';
  matches?: string[];
};

export type CapturedResult = {
  id: string;
  dataUrl: string;
  text: string;
  page: number;
  gridCoord: string;
  filePrefix: string;
  revision: string | null;
  sourceFileName: string;
  sourceFile: File;
  excluded: boolean;
  comment: string;
};
```

### Recommended approach

Use `useReducer` if the feature state becomes dense. Use `useState` only if the state transitions remain easy to reason about. A custom hook that exposes typed actions is strongly preferred either way.

### Important nuance

Do not store transient heavy intermediate PDF.js objects in React state. Keep those inside processing functions. State should store durable UI-facing data only.

---

## Phase 3 — Business logic extraction

### Goals

- migrate business logic from inline script into testable modules
- preserve behavior before polishing UI

### Modules to implement

#### `utils/regex.ts`
Responsibilities:
- escape prefix safely
- build search regex
- build base-number regex

#### `utils/fileNaming.ts`
Responsibilities:
- derive `filePrefix`
- handle `EST-` special case
- extract revision
- derive default drawing name

#### `utils/revisions.ts`
Responsibilities:
- group files by base identity
- choose latest revision
- preserve files without revision correctly

#### `utils/sorting.ts`
Responsibilities:
- sort extracted results consistently
- sort by file prefix first, numeric sequence second

#### `utils/canvas.ts`
Responsibilities:
- blank canvas detection
- reusable canvas helpers if needed

#### `utils/capture.ts`
Responsibilities:
- compute screenshot crop origin from text position and configured offsets
- crop the image region safely

#### `utils/quickScan.ts`
Responsibilities:
- PDF quick scan for counts and unique counts

#### `utils/pageAnalysis.ts`
Responsibilities:
- page text scanning
- matching
- coordinate handling
- grid coordinate generation
- screenshot capture result assembly

### Important nuance

Keep pure functions pure where possible. The more logic that is detached from React and PDF object lifecycles, the easier the regression testing will be.

---

## Phase 4 — PDF runtime setup

### Goals

- replace legacy script-tag PDF.js loading with module-based setup
- ensure worker configuration works in the site build

### Tasks

1. Add module-based PDF.js integration.
2. Configure worker loading in a way compatible with the site build system.
3. Create a small helper module such as `pdfRuntime.ts` that initializes runtime config in one place.

### Example responsibility

```ts
// pdfRuntime.ts
// centralize pdf.js worker setup and shared imports
```

### Important nuance

PDF.js worker configuration is one of the highest-risk migration points.

Common failure modes:
- worker not loading in production build
- asset path mismatch after static site generation
- local dev working while production fails
- bundler-specific import syntax differences

Do not scatter worker configuration across components. Centralize it once.

---

## Phase 5 — File ingestion and quick scan UI

### Goals

- rebuild the upload flow in React
- preserve multi-file and drag-drop behavior
- trigger quick scan safely and predictably

### Components

- `FileDropzone`
- `FileList`

### Tasks

1. Implement file input and drag-and-drop ingestion.
2. Filter accepted files to PDF only.
3. Prevent duplicate file names from being added twice.
4. Trigger quick scan for newly added files.
5. Render scan state:
   - loading spinner
   - counts
   - error state
6. Allow single-file removal and full clear.
7. Allow clicking file name to open PDF preview.

### Important nuance

Avoid race conditions when adding multiple files quickly.

Recommended pattern:
- append file entries synchronously
- launch quick scan asynchronously per file
- update only the matching file entry when each scan resolves

Do not rely on array index identity during asynchronous updates. Use stable IDs.

---

## Phase 6 — Extraction settings and capture settings UI

### Goals

- rebuild the configuration area as controlled React UI
- preserve user-visible behavior

### Components

- `ExtractionSettings`
- `ScreenshotSettings`

### Tasks

1. Convert all settings to controlled inputs.
2. Build a live capture preview.
3. Validate numeric fields defensively.
4. Ensure settings flow correctly into both quick scan and full analysis.

### Important nuance

In the legacy implementation, quick scan and full analysis both depend on settings. The new version should define explicitly which settings are applied immediately and which require rerun behavior.

Recommended behavior:
- prefix / max length affect quick scan and full analysis
- if these values change after files were scanned, either:
  - automatically re-scan quick summaries, or
  - show that current summaries are stale and refresh them

Pick one behavior intentionally and document it in the PR.

---

## Phase 7 — Full analysis flow

### Goals

- migrate the full extraction pipeline with parity
- preserve processing-state UX

### Components

- `ProcessingSection`
- hook actions for `runAnalysis`

### Tasks

1. Build `getFilesToProcess` behavior using revision filters.
2. Iterate through selected files.
3. Load each PDF via PDF.js.
4. Iterate through each page.
5. Extract text items.
6. Match text using configured prefix and max length.
7. Calculate screenshot crop area.
8. Generate image previews.
9. Skip blank captures.
10. Assemble result objects.
11. Update processing status text.
12. Transition to results view when done.

### Important nuance

Keep processing logic outside the render path.

Avoid patterns that make React re-render on every low-level page operation unless needed. Prefer coarse-grained progress updates.

### Optional enhancement

If processing large files causes visible UI blocking, consider yielding back to the browser periodically between pages. This is optional unless performance becomes an issue.

---

## Phase 8 — Results UI rebuild

### Goals

- reproduce the current review workflow
- keep exclusion and comments behavior stable

### Components

- `ResultsSection`
- `ResultsList`
- `ResultItem`
- `SummaryBanner`
- `ExportActions`

### Tasks

1. Sort results deterministically.
2. Render screenshot previews.
3. Render label text and page metadata.
4. Render revision only when the option is enabled.
5. Support exclusion toggle per result.
6. Support editable comments.
7. Keep active/unique summary accurate.
8. Provide “Back to Config” behavior.

### Important nuance

Exclusion should be a reversible display state, not destructive deletion.

Exports must use the filtered active result set, while the UI still preserves excluded items in the session.

---

## Phase 9 — PDF viewer and modal behavior

### Goals

- preserve file preview workflows from both file list and result list

### Components

- `PdfViewerModal`
- `HelpModal`

### Tasks

1. Implement object URL lifecycle for the PDF viewer.
2. Support open from file list.
3. Support open from result item with page and search text context.
4. Revoke object URLs on close and cleanup.
5. Rebuild help modal content in JSX/MDX-safe form.

### Important nuance

Object URL cleanup is easy to miss. Failure to revoke URLs can cause avoidable memory retention over long sessions.

---

## Phase 10 — Export migration

### Goals

- reproduce all exports with behavioral parity
- isolate export logic from UI

### Modules

- `exportTxt.ts`
- `exportCsv.ts`
- `exportSingleFileCsv.ts`
- `exportPdfReport.ts`

### Tasks

1. Rebuild TXT export using active results.
2. Rebuild full CSV export.
3. Rebuild single-file CSV export from quick scan results.
4. Rebuild PDF report generation using jsPDF.
5. Keep BOM behavior intentionally where required.
6. Preserve delimiter rules exactly where needed.

### Important nuance

The legacy implementation uses slightly different CSV behavior across export paths. Do not normalize these casually without checking downstream usage.

Check specifically:
- separator choice
- BOM handling
- revision inclusion logic
- comment escaping
- “keep longest” duplicate resolution
- split between prefix and trailing numeric sequence in CSV columns

If downstream consumers expect this exact format, preserving it matters more than making it look cleaner.

---

## Phase 11 — Site integration

### Goals

- mount the new feature through the main site properly
- make the React version the primary user entry point

### Tasks

1. Create the top-level component:

```tsx
export default function PdfNumberExtractor() {
  return <... />;
}
```

2. Create or update the utility docs/page entry, for example:

```text
docs/utilities/pdf-number-extractor.mdx
```

3. Render the React component from the page.
4. Update any internal links/nav entries that currently point to the legacy static page.
5. Make the main user-facing route resolve to the new embedded version.

### Important nuance

Do not leave the navigation pointing at the old static HTML after migration, or the rewrite will exist without actually becoming the product.

---

## Phase 12 — Legacy handling

### Goals

- reduce migration risk without keeping two primary implementations indefinitely

### Recommended path

During migration:
- keep the legacy `app.html` in place temporarily

After validation:
- remove it entirely, or
- keep it as a legacy fallback not linked from main navigation, or
- move it under a clearly marked legacy/archive location

### Important nuance

Avoid dual-primary ownership. There should be one canonical implementation after rollout.

---

## 6. Testing Strategy

## Unit tests

Prioritize testing pure logic:

- regex creation
- prefix escaping
- revision extraction
- latest revision selection
- file prefix parsing
- sorting behavior
- CSV row shaping where practical

## Manual functional tests

### Upload and file handling
- add single PDF
- add multiple PDFs
- drag-and-drop
- duplicate filename rejection
- remove one file
- clear all files

### Quick scan
- valid PDF with matches
- valid PDF without matches
- invalid/corrupt PDF
- changed prefix/max length behavior

### Full analysis
- normal extraction
- multiple pages
- no-match PDF
- latest revision filtering
- `EST-` filename case

### Results review
- exclude/include result
- edit comments
- back to config
- summary updates

### Viewer and modals
- open file preview
- open result preview to page/search
- close viewer and reopen
- help modal open/close

### Export
- TXT export
- CSV export
- single-file CSV export
- PDF report export
- include revision on/off
- duplicate filtering on/off

## Parity regression

Run the legacy implementation and the new implementation on the same PDF fixture set and compare:

- quick scan counts
- final result counts
- unique count behavior
- exported TXT values
- exported CSV formatting and row shape
- PDF report basic correctness

---

## 7. Key Risks and Engineering Notes

## Risk 1 — PDF.js worker setup
High risk. Validate both local dev and production build.

## Risk 2 — Async file update races
Do not use array indices as durable identity in async scan/update paths.

## Risk 3 — Behavior drift in filename parsing
The filename prefix and revision logic are domain-specific. Preserve behavior exactly unless change is explicitly approved.

## Risk 4 — CSV compatibility drift
CSV output may be consumed by downstream workflows. Preserve shape and delimiter rules intentionally.

## Risk 5 — Memory use with object URLs and canvases
Clean up object URLs. Avoid retaining large temporary canvases longer than necessary.

## Risk 6 — Overcoupling UI and engine logic
If extraction logic stays inside components, future fixes will become much harder. Keep it modular from the start.

---

## 8. Acceptance Criteria

The migration is ready to merge when all of the following are true:

1. The feature is implemented in React + TypeScript inside the main site codebase.
2. The new page is accessible through the intended site route.
3. The main user path points to the new implementation.
4. All major legacy features are preserved.
5. No inline script-based architecture remains in the main implementation.
6. Local build succeeds.
7. Production build succeeds.
8. Manual smoke tests pass.
9. Parity checks against the legacy implementation are acceptable.
10. Legacy entry point is either deprecated, archived, or removed from primary navigation.

---

## 9. Suggested PR Description Template

```md
## Summary
Migrates PDF Number Extractor from the legacy static HTML implementation to a React + TypeScript module integrated directly into the main site.

## What changed
- Added modular React implementation under `src/components/PdfNumberExtractor`
- Migrated PDF scanning and extraction logic into typed utility modules
- Rebuilt results, viewer, comments, and export flows
- Integrated the utility through the main site page structure
- Deprecated legacy static entry point from primary navigation

## Why
- improve maintainability
- align with site architecture
- remove inline DOM-driven legacy implementation
- make future changes safer

## Validation
- smoke tested upload, scan, results, viewer, and exports
- compared extraction behavior against legacy implementation using sample PDFs
- validated production build behavior

## Follow-ups
- add deeper automated tests for PDF fixture-based extraction parity
- remove legacy files fully after rollout confidence
```

---

## 10. Recommended Execution Order Summary

If implemented in one uninterrupted stream, use this order:

1. Baseline legacy behavior
2. Create types and feature shell
3. Add state hook
4. Extract pure utility logic
5. Configure PDF.js runtime
6. Rebuild file upload and quick scan
7. Rebuild settings panels
8. Migrate full analysis pipeline
9. Rebuild results screen
10. Rebuild viewer/help modals
11. Rebuild exports
12. Integrate into the site route/page
13. Run parity validation against legacy version
14. Remove/deprecate legacy navigation path

---

## 11. Final Guidance

This migration should be treated as a **behavior-preserving architectural rewrite**, not as a UI redesign and not as a product rethink.

The correct implementation outcome is:
- same business outcome
- cleaner architecture
- better maintainability
- first-class integration into the main website

When in doubt, prefer:
- parity first
- modularity second
- polish third
```

