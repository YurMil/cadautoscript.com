---
sidebar_position: 1
---

# CAD AutoScript overview

CAD AutoScript is a documentation-first home for SolidWorks macros, fabrication calculators, and QA tools. This site is built on **Docusaurus + MDX**, so every utility is documented right next to its interactive React component.

## What lives here

- **SolidWorks macros** that cover BOM exports, title block checks, and configuration helpers.
- **Web calculators** that run entirely in Chromium (Pipe Cutter, Shell Rolling, QR tags, and more).
- **QA generators** for PDF parsing, serial tracking, and report automation.
- **Release notes and recipes** so shop-floor engineers know how and when to use each tool.

:::tip Chromium only
All utilities are bundled as static assets and expect a Chromium-based browser (Chrome, Edge, Arc, etc.) with WebGL 2 and WebAssembly enabled.
:::

## Quick start for contributors

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the docs locally**
   ```bash
   npm start
   ```
3. **Edit content**
   - Markdown pages live under `docs/`
   - React components live under `src/`
   - Standalone utility bundles live under `static/utility-apps/`
   - Shared utility shell assets live under `static/utilities/`

Docusaurus hot reloads changes instantly. When you're ready to publish, run `npm run build` and deploy the `build/` output to GitHub Pages.

## Embedding live utilities

MDX lets us import React components or iframe-like utilities directly inside documentation pages. See [Embedding calculators](utilities/embed-calculators.md) for a walkthrough on wrapping `/utilities/*` apps or creating bespoke React widgets.

## What's next

Browse the [Utility catalog](./utilities/overview.mdx) to see every calculator with specs, supported standards, and launch links. Each entry explains when to use it and how to embed it inside MDX.
