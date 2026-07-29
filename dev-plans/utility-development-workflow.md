# Where utility code lives

This is the answer to "I have a new tool — where do I put it?" and to "I found
two copies of this utility, which one is real?"

## The rule

**Every published utility has exactly one source of truth, and it is a git
repository.** The site never holds a second editable copy of a tool's source.

There are three shapes a utility can take. Pick by how heavy it is, not by
preference.

### 1. Standalone micro-app — the default

The tool lives in its own repository (`YurMil/<tool-name>`), builds with Vite,
and its CI pushes the built bundle into this repo at
`static/utility-apps/<slug>/`. The Docusaurus page is a three-line shell:

```tsx
import {createUtilityPage} from '@site/src/components/Utilities/createUtilityPage';
export default createUtilityPage('blind-flange-calculator');
```

Choose this when the tool has real dependencies — 3D, WASM, a CAD kernel, PDF
generation. It keeps that weight out of the site bundle: those libraries load
only when someone opens the tool. See
`dev-plans/blind-flange-calculator-microarchitecture-migration.md` for a worked
migration.

**`static/utility-apps/<slug>/` is build output.** Never edit it by hand —
the next CI run overwrites it.

### 2. In-repo React component

The tool lives in `src/components/<Name>/` and is lazy-loaded into the shell:

```tsx
const Tool = lazy(() => import('@site/src/components/PdfNumberExtractor'));
```

Choose this only when the tool adds no heavy dependency the site does not
already carry. It gets the site's i18n, auth and styling for free, at the cost
of sharing its build. `PdfNumberExtractor` and `MdxPostEditor` work this way.

### 3. Legacy standalone HTML

A single `app.html` in `static/utility-apps/<slug>/` with inline scripts and
vendored libraries from `static/vendor/`. **Do not start new tools this way.**
QR Master and PDF Batch Signer are the remaining examples; they are edited in
place because there is no upstream repo to rebuild them from.

If you touch one, remember it cannot import from the site bundle — shared
helpers have to be duplicated (see the PDF validation copy in each), and every
external CDN reference is blocked by the site's Content Security Policy.

## Adding a utility

1. Build it in its own repo (shape 1) or under `src/components/` (shape 2).
2. Register it in `src/data/utilities.ts` — this drives the catalog, search and
   related-tool links.
3. Add the page config to `src/data/utilityShellPages.ts` and a route in
   `src/pages/utilities/<slug>.tsx`.
4. Add the name and description to **all six** locale dictionaries in
   `src/i18n/locales/`. `pnpm typecheck` fails until you do — that is
   deliberate.
5. Write the docs page at `docs/utilities/<slug>.mdx`.
6. For shape 1, wire the deploy workflow that pushes the build here.

Optional but expected for calculators:
- the **share-link protocol** (`dev-plans/utility-share-protocol.md`), which
  also gives you saved history for free;
- **unit tests for the calculation engine**, with the fixtures doubling as the
  published validation cases on the docs page.

## Scratch work

Prototypes belong outside the repository, or in a path listed in
`.gitignore` — as `dev new utility/` is. Nothing there is tracked, built or
deployed.

Once a prototype ships, **delete the scratch copy**. A second copy of a live
tool is not a backup; it is a source of confusion about which one is real, and
it silently goes stale. The published repository is the backup.
