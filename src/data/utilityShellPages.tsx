import type {ReactNode} from 'react';

export type UtilityPageSlug =
  | 'pipe-cutter'
  | 'cylindrical-shell-rolling'
  | 'metal-bending'
  | 'interactive-thread'
  | 'pdf-number-extractor'
  | 'pdf-batch-signer'
  | 'qr-nameplate'
  | 'dxf-editor'
  | 'pdf-master'
  | 'qr-master'
  | 'pdf-bom-extractor'
  | 'file-renamer'
  | 'folder-structure-builder'
  | 'magnetic-level-gauge-configurator'
  | 'bourdon-gauge-configurator'
  | 'industrial-thermometer-configurator'
  | 'tube-sheet-generator'
  | 'webstep-viewer'
  | 'engineering-prompt-catalog'
  | 'business-calendar-generator'
  | 'react-table-editor'
  | 'focus-planner'
  | 'blind-flange-calculator'
  | 'pressure-vessel-dished-end-calc'
  | 'wikalog-analyzer';

export type UtilityPageConfig = {
  slug: UtilityPageSlug;
  title: string;
  subtitle: string;
  description: string;
  about: ReactNode;
  tags: string[];
  note?: ReactNode;
  features?: string[];
  scriptType?: 'module' | 'defer';
  reactionSlug?: string;
  appPath?: string;
};

export const utilityPageConfigs: Record<UtilityPageSlug, UtilityPageConfig> = {
  'pipe-cutter': {
    slug: 'pipe-cutter',
    title: 'Pipe Cutter Visualizer',
    subtitle: 'Web utility — 3D joint preview for tube cutting',
    description:
      'Preview saddle intersections, adjust offsets, and export DXF templates ready for CNC plasma or waterjet tables.',
    about:
      'Visualize saddle cuts for pipe-to-pipe intersections, tweak wall thickness, angles, and offsets, and export the developed contour for CNC plasma or handheld cutting.',
    tags: ['Piping', '3D preview', 'Fabrication'],
    note: 'The embedded Three.js scene stays local. Use screenshots or exported DXF files for shop travellers.',
    scriptType: 'module',
  },
  'cylindrical-shell-rolling': {
    slug: 'cylindrical-shell-rolling',
    title: 'Cylindrical Shell Rolling Calculator',
    subtitle: 'Web utility — Plate rolling setup helper',
    description:
      'Estimate roll spacing, bending allowance, and developed length for cylindrical shells with EN 13445 / ASME VIII presets.',
    about:
      'Estimate roll positions, bending allowance, and developed length for cylindrical shells. Use it to prep CNC roll data for EN 13445 / ASME VIII pressure shell jobs and export the parameters for documentation.',
    tags: ['Plate rolling', 'Pressure vessels', 'EN 13445'],
    note: 'Runs entirely in the browser. Numbers stay on your device until you save them manually.',
    scriptType: 'module',
  },
  'metal-bending': {
    slug: 'metal-bending',
    title: 'Metal Bending Prototype',
    subtitle: 'Web utility — K-factor playground',
    description:
      'Model flange lengths, neutral axis positions, and bend deductions for sheet metal before locking CAM or tooling.',
    about:
      'Model flange lengths, neutral axis positions, and bend deductions for sheet-metal jobs. Adjust tooling data to keep fabrication in sync with ISO 2768 / ANSI Y14.5 tolerance blocks.',
    tags: ['Sheet metal', 'K-factor', 'Bend deduction'],
    note:
      'Export the calculated allowances to spreadsheets or copy the summary into SolidWorks configurations to keep downstream teams aligned.',
    scriptType: 'module',
  },
  'interactive-thread': {
    slug: 'interactive-thread',
    title: 'Interactive Thread Cheat Sheet',
    subtitle: 'Web utility — ISO/UNC/UNF visual lookup',
    description:
      'Filter ISO, UNC, and UNF series, reference drill diameters, and copy callouts for drawings directly from the browser.',
    about:
      'Quickly compare metric and imperial thread forms, pull recommended drill sizes, and copy callouts for CAD drawings or manufacturing travellers.',
    tags: ['ISO 965', 'UNC / UNF', 'Fasteners'],
    note: 'Use search and filters inside the utility to jump between coarse, fine, or custom pitch values.',
    scriptType: 'module',
  },
  'pdf-number-extractor': {
    slug: 'pdf-number-extractor',
    title: 'PDF Number Extractor',
    subtitle: 'Web utility — Pull IDs directly from PDFs',
    description:
      'Highlight QA serials, BOM IDs, and inspection numbers locally with WASM-powered parsing. No uploads, no queues.',
    about:
      'Drop production PDFs or test reports, highlight numeric strings, and export BOM IDs or drawing references without uploading documents to external services.',
    tags: ['PDF parsing', 'Quality records', 'Offline'],
    note: 'Files never leave your browser. Close the tab to clear the buffer or save the extracted list as CSV.',
    scriptType: 'module',
  },
  'qr-nameplate': {
    slug: 'qr-nameplate',
    title: 'QR Nameplate Generator',
    subtitle: 'Web utility — Serialize equipment tags',
    description:
      'Model serialized QR-enabled equipment tags with adjustable materials, engraving depths, and branding layers.',
    about:
      'Create QR-enabled nameplates with logos, asset metadata, and safety messaging. Export high-resolution PNG/SVG graphics ready for laser marking or UV printing.',
    tags: ['Traceability', 'QR codes', 'Branding'],
    note:
      'Supports Latin and Cyrillic character sets. Update contents on the fly and send the image directly to documentation systems.',
    scriptType: 'module',
  },
  'pdf-batch-signer': {
    slug: 'pdf-batch-signer',
    title: 'PDF Batch Signer',
    subtitle: 'Stamp a reusable signature across multiple PDFs at once.',
    description:
      'Upload drawings, design one signature, drag its placement, and export a ZIP of signed PDFs without leaving the browser.',
    about:
      'Build a signature by sketching, typing, or uploading a scan, position it on a live PDF preview, and apply it to every page in your stack. Optional Gemini analysis can read title blocks to prefill metadata when you provide your own API key.',
    tags: ['PDF', 'Signatures', 'Offline'],
    note: 'Signing runs locally with pdf-lib and JSZip. Gemini title-block extraction is opt-in and uses your key client-side.',
    features: [
      'Multi-file upload with per-file metadata',
      'Drag + resize placement synced to every page',
      'ZIP export of signed PDFs',
      'Optional Gemini title-block extraction',
    ],
    scriptType: 'module',
  },
  'dxf-editor': {
    slug: 'dxf-editor',
    title: 'WebDXF Editor',
    subtitle: 'Browser CAD — Trim, annotate, and export DXF geometry',
    description:
      'Trim geometry, annotate lengths, and resave DXF files directly in the browser for quick QA or macro testing.',
    about:
      'Upload DXF drawings, perform trim or measurement edits, and save changes back to DXF without leaving the browser. Gimbal-style zoom, crossing selection, and snapping mirror the desktop workflow.',
    tags: ['DXF', 'Trim', 'Measurement'],
    note:
      'Works entirely client-side. Use it for quick edits, QA markups, or to test snippets generated by CAD macros.',
    scriptType: 'module',
  },
  'pdf-master': {
    slug: 'pdf-master',
    title: 'PDF Master',
    subtitle: 'Mix, merge, rotate, and reorganize PDF pages in the browser.',
    description:
      'Organize drawing packs, reorder or rotate individual sheets, and export a clean merged PDF before shop release.',
    about:
      'PDF Master is a drag-and-drop command center for wrangling drawing packages before shop release. Blend multiple source files, reorder or rotate single sheets, and create a clean package without leaving the browser.',
    tags: ['PDF curation', 'Offline', 'QA packs'],
    note: (
      <>
        Processing happens locally through <abbr title="WebAssembly">WASM</abbr> powered libraries—
        no uploads, no queue times, and no vendor lock-in.
      </>
    ),
    features: [
      'Drag & drop reordering',
      'Merge multiple PDFs',
      'Rotate individual pages',
      'View pages inside their original file',
    ],
    scriptType: 'defer',
  },
  'qr-master': {
    slug: 'qr-master',
    title: 'QR Master',
    subtitle: 'Scan QR, barcodes, or generate Wi-Fi/link codes locally.',
    description:
      'Scan QR codes and barcodes instantly, generate custom codes for links or WiFi, and manage your scan history locally.',
    about:
      'QR Master pairs live camera scanning with paste/upload workflows, so you can read QR codes and barcodes, generate Wi-Fi or contact codes, and keep everything in a local history with import/export.',
    tags: ['QR', 'Barcode', 'Offline'],
    note: 'Camera, paste, and file scans run locally. History stays in your browser and can be exported as JSON.',
    features: [
      'Live QR + barcode scan with camera',
      'Paste or image upload scanning',
      'Generate Wi-Fi, link, or contact codes',
      'Local history with import/export',
    ],
    scriptType: 'module',
  },
  'pdf-bom-extractor': {
    slug: 'pdf-bom-extractor',
    title: 'PDF BOM Extractor',
    subtitle: 'Web utility - Pull BOM and spec tables into CSV',
    description:
      'Extract BOM and specification tables from vector PDFs into clean CSVs, batch-downloadable locally.',
    about:
      'Drop CAD-generated PDFs (SolidWorks, AutoCAD, etc.) and automatically detect headers/columns, trim revision/footer noise, review rows, and export either per-file CSVs or a merged master report.',
    tags: ['PDF', 'BOM', 'CSV'],
    note: 'Runs 100% in the browser with PDF.js. Drawings and extracted data stay on your device.',
    features: [
      'Smart header + column detection (no OCR)',
      'Auto-trim revision tables and footer notes',
      'Batch upload with per-file CSV or master report export',
    ],
    scriptType: 'module',
  },
  'file-renamer': {
    slug: 'file-renamer',
    title: 'Batch File Renamer',
    subtitle: 'Web utility - Bulk rename and export as ZIP',
    description:
      'Rename files in bulk with find/replace, prefixes, casing, numbering, and instant ZIP download-all locally.',
    about:
      'Upload multiple files, preview automatic renames with regex or literal find/replace, add prefixes/suffixes, change casing, apply numbering, and download the renamed set as a ZIP without sending files anywhere.',
    tags: ['Files', 'Rename', 'Offline'],
    note: 'Runs fully client-side. ZIP creation and name conflict handling stay in your browser.',
    features: ['Regex or literal find/replace', 'Prefix/suffix + numbering', 'ZIP download with conflict handling'],
    scriptType: 'module',
  },
  'folder-structure-builder': {
    slug: 'folder-structure-builder',
    title: 'Folder Structure Builder',
    subtitle: 'Web utility - Plan a scaffold, export scripts, and download ZIPs',
    description:
      'Design folder trees from scratch or imports, then export ready-to-run bash/PowerShell scripts, JSON presets, or a ZIP scaffold.',
    about:
      'Map out project folder structures quickly, import an existing layout from JSON or ZIP, and export bash or PowerShell scripts that recreate the same scaffold on any machine. Everything runs locally in the browser.',
    tags: ['Folders', 'Scaffold', 'Offline'],
    note: 'Imports stay on your device. Download JSON or ZIP outputs to share presets with your team.',
    features: ['Add folders/files inline', 'Import JSON or ZIP trees', 'Export bash/PowerShell scripts', 'Download ZIP scaffold or JSON preset'],
    scriptType: 'module',
  },
  'magnetic-level-gauge-configurator': {
    slug: 'magnetic-level-gauge-configurator',
    title: 'Magnetic Level Gauge Configurator',
    subtitle: 'Web utility - Configure MLG specs and export datasheets',
    description:
      'Configure magnetic level gauge dimensions, connections, and options with a live sketch and PDF datasheet export.',
    about:
      'Set process connections, vent/drain options, materials, and project data, then export a PDF technical datasheet with a preliminary sketch.',
    tags: ['Instrumentation', 'Datasheets', 'Piping'],
    note: 'Runs entirely in the browser. The PDF is generated locally when you export the data sheet.',
    features: [
      'Process connection presets (DIN, ANSI, weld/thread)',
      'Live SVG preview for key dimensions',
      'PDF export with specs and sketch',
    ],
    scriptType: 'module',
  },
  'bourdon-gauge-configurator': {
    slug: 'bourdon-gauge-configurator',
    title: 'Bourdon Gauge Configurator',
    subtitle: 'Web utility - Configure pressure gauges and export specs',
    description:
      'Pick nominal sizes, ranges, connections, and accessories for Bourdon tube gauges, view the preview, and export a PDF datasheet.',
    about:
      'Set gauge range and units, choose connection standards, case fill, siphon/valve accessories, and project metadata, then export a PDF sheet with a sketch and selections.',
    tags: ['Instrumentation', 'Pressure gauges', 'Datasheets'],
    note: 'Runs fully in the browser. Datasheet export uses local PDF generation.',
    features: [
      'Range presets with custom span option',
      'Connection + case fill presets',
      'Accessory toggles (siphon, valve, flange)',
      'Live gauge drawing with stem adjustments',
      'PDF datasheet export',
    ],
    scriptType: 'module',
  },
  'industrial-thermometer-configurator': {
    slug: 'industrial-thermometer-configurator',
    title: 'Industrial Thermometer Configurator',
    subtitle: 'Web utility - Configure bimetal thermometers and export datasheets',
    description:
      'Select ranges, stems, thermowells, and connections for industrial thermometers, preview the build, and export a PDF datasheet.',
    about:
      'Adjust range units, stem length/diameter, case fill, mounting design, and thermowell options. Review the live SVG preview and generate a datasheet PDF with your selections and project metadata.',
    tags: ['Instrumentation', 'Thermometer', 'Datasheets'],
    note: 'Runs fully in the browser. PDF export is generated locally.',
    features: [
      'Range presets plus custom span',
      'Stem length/diameter + thermowell options',
      'Lower/back/adjustable mounting preview',
      'Project metadata and accessory toggles',
      'PDF datasheet export',
    ],
    scriptType: 'module',
  },
  'tube-sheet-generator': {
    slug: 'tube-sheet-generator',
    title: 'Tube Sheet Generator',
    subtitle: 'Web utility - Tube layout preview with DXF/STEP export',
    description:
      'Generate tube sheet patterns with square or triangular pitch, visualize baffle partitions, and export DXF or STEP files locally.',
    about:
      'Lay out tube sheet hole patterns for heat exchangers, adjust pitch and edge margins, and visualize pass partitions before exporting DXF or STEP files. Everything runs in the browser.',
    tags: ['Heat exchangers', 'Tube sheet', 'DXF', 'STEP'],
    note:
      'STEP export uses WebAssembly in the browser. Large hole counts may take longer to process.',
    features: [
      'Square or triangular pitch layouts',
      'Partition preview for multi-pass designs',
      'DXF + STEP export with local processing',
    ],
    scriptType: 'module',
  },
  'webstep-viewer': {
    slug: 'webstep-viewer',
    title: 'WebSTEP Viewer',
    subtitle: 'Web utility - Inspect STEP assemblies in the browser',
    description:
      'Load STEP assemblies, isolate parts, and measure geometry locally with a WebAssembly viewer.',
    about:
      'Drop .step or .stp files to preview the assembly tree, isolate solids, and take measurements without leaving the browser.',
    tags: ['STEP', 'Assembly', '3D'],
    note:
      'Large assemblies may take longer to parse. Files stay local in your browser cache unless you clear it.',
    features: [
      'Assembly tree with isolate/hide',
      'Measurement and geometry probes',
      'CSV BOM export',
      'View modes with edge/grid toggles',
    ],
    scriptType: 'module',
  },
  'engineering-prompt-catalog': {
    slug: 'engineering-prompt-catalog',
    title: 'Engineering Prompt Catalog',
    subtitle: 'Web utility - Prompt templates for technical workflows',
    description:
      'Browse, filter, and copy engineering prompt templates for I&C, mechanical design, and procurement.',
    about:
      'Search by discipline, filter by subcategory, and export any prompt as Markdown. Everything runs locally in the browser with no uploads.',
    tags: ['Prompts', 'LLM workflows', 'Engineering'],
    note: 'Prompts are stored locally in the page source. Copy or download templates without leaving the utility.',
    features: [
      'Category + subcategory navigation',
      'Instant search and prompt count',
      'Copy to clipboard or download Markdown',
      'Chart-driven category overview',
    ],
    scriptType: 'module',
  },
  'business-calendar-generator': {
    slug: 'business-calendar-generator',
    title: 'Business Calendar Generator',
    subtitle: 'Web utility - Holiday-aware yearly calendar exports',
    description:
      'Build a yearly business calendar with country holidays, personalization, and PDF/PNG export.',
    about:
      'Select a country and year, set hours per day, add company branding and personal time off, and export a print-ready calendar.',
    tags: ['Calendars', 'Planning', 'Exports'],
    note:
      'Runs entirely in the browser. Personalization and logos are stored locally until you clear them.',
    features: [
      'Country holiday presets + year selector',
      'Personalization for vacation, sick days, and custom workdays',
      'Company logo + theme/backdrop settings',
      'PDF and PNG export with A-series sizes',
    ],
    scriptType: 'module',
  },
  'react-table-editor': {
    slug: 'react-table-editor',
    title: 'React Table Editor',
    subtitle: 'Web utility - Edit CSV/XLSX tables directly in the browser',
    description:
      'Open, edit, filter, and export table data locally with CSV/XLSX support and no server upload.',
    about:
      'Load tabular files, update values inline, manage columns and rows, and export clean CSV or XLSX files. Useful for quick engineering logs, BOM cleanup, or QA data prep without desktop spreadsheet installs.',
    tags: ['Tables', 'CSV/XLSX', 'Offline'],
    note: 'Runs entirely in the browser. Imported files and edits stay local to your session.',
    features: ['CSV/XLSX import', 'Inline cell editing', 'Column and row management', 'CSV/XLSX export'],
    scriptType: 'module',
    appPath: '/utility-apps/react-table-editor/app.html',
  },
  'focus-planner': {
    slug: 'focus-planner',
    title: 'Focus Planner',
    subtitle: 'Web utility - Local-first planning, focus tracking, and analytics',
    description:
      'Plan work on a calendar, manage tasks, run focus timers, and review analytics with local browser storage.',
    about:
      'Focus Planner is a local-first browser workspace with dashboard, calendar, task management, dedicated timers, analytics, and settings screens. It stores data locally, supports timer recovery, and includes backup import/export flows for a private planning workflow without a backend.',
    tags: ['Planning', 'Focus timer', 'Analytics', 'Local-first'],
    note:
      'Runs as a standalone browser bundle under the utility catalog. Tasks, sessions, and settings stay local in the browser unless you explicitly export them.',
    features: [
      'Dashboard, calendar, tasks, timers, analytics, and settings views',
      'Task-linked and standalone timers with recovery support',
      'IndexedDB-backed local storage with backup import/export',
      'Planning and reporting without a backend',
    ],
    scriptType: 'module',
  },
  'blind-flange-calculator': {
    slug: 'blind-flange-calculator',
    title: 'Blind Flange Calculator',
    subtitle: 'Web utility - EN 13445-3 blind flange sizing',
    description:
      'Auto-select EN 1092-1 PN class, calculate blind flange thickness, and estimate weight from DN and pressure.',
    about:
      'Enter DN, operating and test pressure, temperature, material, and corrosion allowance. The calculator selects the nearest PN class from EN 1092-1, computes minimum thickness per EN 13445-3, and recommends a standard plate thickness with a weight estimate.',
    tags: ['EN 13445-3', 'EN 1092-1', 'Flanges'],
    note:
      'Runs entirely in the browser. Validate final flange sizing, bolt loads, and gasket selection against project specs.',
    features: [
      'Automatic PN selection from operating pressure',
      'Minimum and recommended thickness outputs',
      'Bolt circle data and weight estimate',
    ],
    scriptType: 'module',
  },
  'pressure-vessel-dished-end-calc': {
    slug: 'pressure-vessel-dished-end-calc',
    title: 'Dished End (Vessel Head) Calculator',
    subtitle: 'Web utility - Dished end sizing + QC sheet',
    description:
      'Size DIN 28011 / 28013 dished heads, preview dimensions, add nozzle callouts, and print a QC worksheet.',
    about:
      'Configure common DIN dished end geometries, visualize the profile, add nozzle markers for planning, and generate a printable QC worksheet for shop inspection.',
    tags: ['Pressure vessels', 'DIN', 'Fabrication'],
    note: 'All calculations run in the browser. Use the QC report view to print or save as PDF.',
    features: ['DIN 28011 / 28013 geometry presets', 'Nozzle offset callouts', 'Printable QC worksheet'],
    scriptType: 'module',
  },
  'wikalog-analyzer': {
    slug: 'wikalog-analyzer',
    title: 'WIKA CPG1500 Log Analyzer',
    subtitle: 'Web utility — Parse and report on WIKA calibrator logs',
    description:
      'Drop WIKA CPG1500 log files, inspect device identity and measurement readings, visualize pressure data, and print QC reports — all locally in the browser.',
    about:
      'Upload log files exported from a WIKA CPG1500 digital pressure calibrator, review device identity and calibration metadata, browse timestamped measurement rows, visualize pressure curves on interactive charts, and generate print-ready QC reports without uploading data anywhere.',
    tags: ['Calibration', 'WIKA CPG1500', 'QC reports'],
    note:
      'All parsing runs locally in the browser. Log files and extracted data stay on your device until you close the tab.',
    features: [
      'WIKA CPG1500 log file parsing',
      'Device identity and calibration metadata',
      'Measurement data grid with search',
      'Pressure chart visualization',
      'Print-optimized QC report export',
    ],
    scriptType: 'module',
  },
};
