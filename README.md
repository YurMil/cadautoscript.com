# CAD AutoScript

[![Docusaurus](https://img.shields.io/badge/Docusaurus-3.9-green?logo=docusaurus)](https://docusaurus.io/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

Engineering documentation portal and browser-based utilities for mechanical design, fabrication, QA workflows, and CAD automation. All tools run client-side in Chromium with WebGL 2 and WebAssembly.

**Live site:** [cadautoscript.com](https://cadautoscript.com)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Utilities Catalog](#utilities-catalog)
- [Mini Games](#mini-games)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Serve production build locally
npm run serve
```

---

## Utilities Catalog

### CAD / Geometry Tools

| Utility | Description | Tech |
|---------|-------------|------|
| **Pipe Cutter Visualizer** | Preview saddle intersections, adjust offsets, export DXF templates for CNC plasma/waterjet | WebGL |
| **Cylindrical Shell Rolling** | Calculate roll spacing, bending allowance, developed lengths (EN 13445 / ASME VIII) | Calc |
| **Sheet-Metal Bending Sandbox** | Simulate K-factors, reliefs, bend deductions before CAM | Canvas |
| **Tube Sheet Generator** | Lay out tube sheet hole patterns, export DXF or STEP | Canvas + WASM |
| **WebDXF Editor** | Trim geometry, annotate lengths, resave DXF files in browser | Canvas |
| **WebSTEP Viewer** | Inspect STEP assemblies, isolate parts, measure geometry | WebGL + WASM |

### Instrumentation Configurators

| Utility | Description | Tech |
|---------|-------------|------|
| **Magnetic Level Gauge Configurator** | Configure connections, dimensions, export PDF datasheet (DIN/EN + ASME/ANSI) | React + SVG |
| **Bourdon Gauge Configurator** | Configure pressure gauges with ranges, connections, accessories (EN 837-1/2) | React + SVG |
| **Industrial Thermometer Configurator** | Configure bimetal thermometers: ranges, stems, thermowells (EN 13190) | React + SVG |

### Pressure Vessel Engineering

| Utility | Description | Tech |
|---------|-------------|------|
| **Blind Flange Calculator** | Auto-select PN class, calculate EN 13445-3 thickness with weight estimates | React + Calc |
| **Dished End Calculator** | Size DIN 28011/28013 heads, preview dimensions, add nozzle callouts | SVG + Calc |

### PDF & Document Tools

| Utility | Description | Tech |
|---------|-------------|------|
| **PDF Master** | Reorder, rotate, merge PDF pages locally | PDF toolkit |
| **PDF Batch Signer** | Stamp signatures across multiple PDFs with one placement | PDF-lib + JSZip |
| **PDF Number Extractor** | Extract QA serials, BOM IDs with WASM-powered parsing | WASM |
| **PDF BOM Extractor** | Extract BOM tables from CAD PDFs into CSV | React + PDF.js |

### QR & Traceability

| Utility | Description | Tech |
|---------|-------------|------|
| **QR Master** | Scan QR/barcodes, generate Wi-Fi/link codes, manage history | Camera + QR |
| **3D QR Nameplate Generator** | Model serialized equipment tags with QR codes in 3D | WebGL + QR |

### Reference & Data Tools

| Utility | Description | Tech |
|---------|-------------|------|
| **Interactive Thread Atlas** | Filter ISO, UNC, UNF series; reference drill diameters | Data |
| **Engineering Prompt Catalog** | Browse and export prompt templates for I&C/mechanical workflows | HTML + Chart.js |
| **React Table Editor** | Import, edit, validate CSV/XLSX data in browser | React + XLSX |

### File & Productivity Tools

| Utility | Description | Tech |
|---------|-------------|------|
| **Batch File Renamer** | Bulk rename with find/replace, prefixes, numbering, ZIP export | React |
| **Folder Structure Builder** | Design folder trees, export bash/PowerShell scripts | React + JSZip |
| **Business Calendar Generator** | Generate yearly calendars with holidays, export PDF/PNG | React + PDF |

---

## Mini Games

Interactive browser games with engineering themes:

| Game | Description | Tech |
|------|-------------|------|
| **Engineering Blueprint NCR** | Minesweeper-style grid with CAD QA stakes | HTML5 |
| **Flanges Memory Matrix** | Memory game with flange tile patterns | Phaser |
| **Pressure Vessel Tycoon** | Factorio-inspired factory builder for pressure vessels | Phaser + React |
| **Railroad Bottle Smash** | Physics sandbox with glass destruction | Three.js + cannon-es |
| **Eco Sort: Atmospheric** | First-person recycling sorting game | Three.js + Rapier |

---

## Project Structure

```
cadautoscript.com/
├── docs/                        # MDX documentation
│   ├── intro.md                 # Site overview
│   ├── guides/                  # Deployment, npm, package.json guides
│   └── utilities/               # Per-utility documentation pages
├── blog/                        # Technical blog posts (MDX)
├── src/
│   ├── components/              # React components
│   │   ├── Auth/                # Authentication UI
│   │   ├── MiniGames/           # Game components
│   │   ├── Utilities/           # Utility page wrappers
│   │   └── HomepageFeatures/    # Landing page sections
│   ├── contexts/                # React contexts (auth modal)
│   ├── css/                     # Global styles
│   ├── data/                    # Utility & game metadata
│   │   ├── utilities.ts         # Utility catalog definitions
│   │   └── miniGames.ts         # Game catalog definitions
│   ├── features/                # Feature-specific modules
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # External service clients (Supabase)
│   ├── pages/                   # Docusaurus pages
│   │   ├── index.tsx            # Landing page
│   │   ├── utilities/           # Utility page routes
│   │   └── mini-games/          # Game page routes
│   ├── theme/                   # Docusaurus theme overrides
│   └── utils/                   # Helper functions
├── static/
│   ├── utilities/               # Shared utility shell assets (CSS/JS)
│   ├── utility-apps/            # Standalone embedded utility builds
│   ├── mini-games/              # Game static assets
│   ├── img/                     # Images and icons
│   └── vendor/                  # Third-party libraries
├── build/                       # Production output (generated)
├── scripts/                     # Build scripts
│   ├── sitemap-sections.js      # Post-build sitemap generator
│   └── sync-webstep-viewer-embed.js
├── docusaurus.config.ts         # Docusaurus configuration
├── sidebars.ts                  # Documentation sidebar structure
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── vercel.json                  # Optional Vercel-compatible settings
```

---

## Technology Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| [Docusaurus](https://docusaurus.io/) | 3.9.2 | Static site generator with MDX support |
| [React](https://react.dev/) | 19.2.1 | UI component library |
| [TypeScript](https://www.typescriptlang.org/) | 5.6 | Type-safe JavaScript |

### Styling

| Technology | Purpose |
|------------|---------|
| [Tailwind CSS](https://tailwindcss.com/) 4.x | Utility-first CSS framework |
| CSS Modules | Scoped component styles |
| [Framer Motion](https://www.framer.com/motion/) | Animation library |

### 3D Graphics & CAD

| Technology | Purpose |
|------------|---------|
| [Three.js](https://threejs.org/) | WebGL 3D rendering |
| [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | React renderer for Three.js |
| [@react-three/drei](https://github.com/pmndrs/drei) | Three.js helpers and abstractions |
| [ReplicAD](https://replicad.xyz/) + OpenCascade.js | CAD kernel for STEP/geometry |

### Physics & Games

| Technology | Purpose |
|------------|---------|
| [Rapier](https://rapier.rs/) (WASM) | Physics engine for 3D games |
| cannon-es | Alternative physics engine |
| Phaser | 2D game framework |

### Document Processing

| Technology | Purpose |
|------------|---------|
| [PDF-lib](https://pdf-lib.js.org/) | PDF creation and modification |
| [PDF.js](https://mozilla.github.io/pdf.js/) | PDF parsing and rendering |
| [jsPDF](https://github.com/parallax/jsPDF) | PDF generation |
| [JSZip](https://stuk.github.io/jszip/) | ZIP file handling |
| [SheetJS (XLSX)](https://sheetjs.com/) | Excel file processing |

### Editor & Code

| Technology | Purpose |
|------------|---------|
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | VS Code editor component |

### Backend & Analytics

| Technology | Purpose |
|------------|---------|
| [Supabase](https://supabase.com/) | Authentication and database |
| [Vercel Analytics](https://vercel.com/analytics) | Performance monitoring |
| [Vercel Speed Insights](https://vercel.com/docs/speed-insights) | Core Web Vitals tracking |

### State Management

| Technology | Purpose |
|------------|---------|
| [Zustand](https://github.com/pmndrs/zustand) | Lightweight state management |

### Markdown & Content

| Technology | Purpose |
|------------|---------|
| MDX | Markdown with JSX components |
| remark/rehype plugins | Markdown processing |
| Prism | Syntax highlighting |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server with hot reload |
| `npm run build` | Build production static site to `build/` |
| `npm run serve` | Serve production build locally |
| `npm run clear` | Clear Docusaurus cache |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run sitemap:sections` | Generate sectioned sitemaps |
| `npm run sync:webstep-viewer` | Sync WebSTEP viewer embed |

---

## Deployment

The repository's checked-in deployment workflow publishes the site to GitHub Pages on pushes to `main`.

### Manual Deployment

```bash
# Build production bundle
npm run build

# Deploy build/ directory to your hosting platform
```

### Environment Variables

Create `.env.local` for local development:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Adding a New Utility

1. Add utility metadata to `src/data/utilities.ts`
2. Create page route in `src/pages/utilities/`
3. Add documentation in `docs/utilities/`
4. Place standalone build assets in `static/utility-apps/<slug>/` if needed

---

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.
