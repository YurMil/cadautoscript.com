export type UtilityCategory =
  | 'calculators'
  | 'configurators'
  | 'pdf-tools'
  | 'cad-tools'
  | 'productivity';

export const UTILITY_CATEGORIES: {id: UtilityCategory; label: string}[] = [
  {id: 'calculators', label: 'Calculators'},
  {id: 'configurators', label: 'Configurators'},
  {id: 'pdf-tools', label: 'PDF Tools'},
  {id: 'cad-tools', label: 'CAD & 3D'},
  {id: 'productivity', label: 'Productivity'},
];

export type UtilityDescriptor = {
  id: string;
  name: string;
  category: UtilityCategory;
  /** ids of complementary tools shown as "Related tools" on the utility page */
  relatedIds?: string[];
  description: string;
  tech: string;
  standards: string;
  features: string[];
  href: string;
  thumbnail?: string;
};

export const utilities: UtilityDescriptor[] = [
  {
    id: 'pipe-cutter',
    relatedIds: ['metal-bending', 'dxf-editor', 'webstep-viewer'],
    category: 'cad-tools',
    name: 'Pipe Cutter Visualizer',
    description:
      'Preview saddle intersections, adjust offsets, and export CNC-ready DXF templates.',
    tech: 'WebGL',
    standards: 'ASME B31.3 · ISO 9606',
    features: ['Realtime 3D preview', 'DXF saddle export', 'Offset + bevel controls'],
    href: '/utilities/pipe-cutter/',
    thumbnail: '/img/utilities/pipe-cutter.png',
  },
  {
    id: 'shell-rolling',
    relatedIds: ['pressure-vessel-dished-end-calc', 'blind-flange-calculator', 'tube-sheet-generator', 'metal-bending'],
    category: 'calculators',
    name: 'Cylindrical Shell Rolling',
    description:
      'Calculate roll spacing, bending allowance, and developed lengths per EN / ASME presets.',
    tech: 'Calc',
    standards: 'EN 13445 · ASME VIII',
    features: ['Roll spacing hints', 'Printable offsets', 'Tolerance guidance'],
    href: '/utilities/cylindrical-shell-rolling/',
    thumbnail: '/img/utilities/shell-rolling.png',
  },
  {
    id: 'metal-bending',
    relatedIds: ['shell-rolling', 'pipe-cutter'],
    category: 'calculators',
    name: 'Sheet-metal Bending',
    description:
      'Simulate K-factors, reliefs, and bend deductions before locking CAM programs.',
    tech: 'Canvas',
    standards: 'ISO 2768 · EN 10149',
    features: ['K-factor tuning', 'Press brake presets', 'Metric + inch'],
    href: '/utilities/metal-bending/',
    thumbnail: '/img/utilities/metal-bending.png',
  },
  {
    id: 'thread-atlas',
    relatedIds: ['gear-pair-calculator', 'blind-flange-calculator'],
    category: 'productivity',
    name: 'Interactive Thread Atlas',
    description:
      'Filter ISO / UNC / UNF series, look up drill diameters, and copy callouts.',
    tech: 'Data',
    standards: 'ISO 965 · UNC/UNF',
    features: ['Filterable tables', 'Drill lookup', 'Copy-ready callouts'],
    href: '/utilities/interactive-thread/',
    thumbnail: '/img/utilities/thread-atlas.png',
  },
  {
    id: 'doc-parser',
    relatedIds: ['pdf-bom-extractor', 'pdf-master', 'wikalog-analyzer'],
    category: 'pdf-tools',
    name: 'PDF Number Extractor',
    description:
      'Highlight QA serials, BOM IDs, and inspection numbers locally via WASM.',
    tech: 'WASM',
    standards: 'Offline parsing',
    features: ['Regex filters', 'CSV export', 'Works offline'],
    href: '/utilities/pdf-number-extractor/',
    thumbnail: '/img/utilities/doc-parser.png',
  },
  {
    id: 'qr-nameplate',
    relatedIds: ['qr-master', 'webstep-viewer', 'dxf-editor'],
    category: 'cad-tools',
    name: '3D QR Nameplate',
    description:
      'Model equipment tags with QR codes; preview thickness, materials, and engraving in real time.',
    tech: 'WebGL + QR',
    standards: 'ISO 3864',
    features: ['Three.js preview', 'Material presets', 'QR + engraving'],
    href: '/utilities/qr-nameplate/',
    thumbnail: '/img/utilities/qr-nameplate.png',
  },
  {
    id: 'dxf-editor',
    relatedIds: ['pipe-cutter', 'webstep-viewer', 'qr-nameplate'],
    category: 'cad-tools',
    name: 'WebDXF Editor',
    description:
      'Trim, annotate, and resave DXF files in the browser for quick QA checks.',
    tech: 'Canvas',
    standards: 'DXF R12',
    features: ['Crossing selection', 'Trim + measure', 'Offline DXF I/O'],
    href: '/utilities/dxf-editor/',
    thumbnail: '/img/utilities/dxf-editor.png',
  },
  {
    id: 'pdf-master',
    relatedIds: ['pdf-batch-signer', 'pdf-bom-extractor', 'doc-parser'],
    category: 'pdf-tools',
    name: 'PDF Master',
    description:
      'Reorder, rotate, and merge drawing packs into a clean PDF — fully offline.',
    tech: 'PDF toolkit',
    standards: 'Offline processing',
    features: ['Drag & drop reorder', 'Merge PDFs', 'Rotate pages'],
    href: '/utilities/pdf-master/',
    thumbnail: '/img/utilities/pdf-master.png',
  },
  {
    id: 'pdf-batch-signer',
    relatedIds: ['pdf-master', 'pdf-bom-extractor', 'doc-parser'],
    category: 'pdf-tools',
    name: 'PDF Batch Signer',
    description:
      'Stamp a reusable signature across every page in multiple PDFs at once.',
    tech: 'PDF-lib + JSZip',
    standards: 'Local signing',
    features: ['Draw / upload signature', 'Drag placement', 'ZIP export'],
    href: '/utilities/pdf-batch-signer/',
    thumbnail: '/img/utilities/pdf-batch-signer.png',
  },
  {
    id: 'qr-master',
    relatedIds: ['qr-nameplate', 'pdf-batch-signer'],
    category: 'productivity',
    name: 'QR Master',
    description:
      'Scan QR / barcodes, generate custom codes, and manage scan history locally.',
    tech: 'Camera + QR',
    standards: 'Offline',
    features: ['Scan QR & barcodes', 'Wi-Fi / link codes', 'History import/export'],
    href: '/utilities/qr-master/',
    thumbnail: '/img/utilities/qr-master.png',
  },
  {
    id: 'pdf-bom-extractor',
    relatedIds: ['pdf-master', 'doc-parser', 'wikalog-analyzer'],
    category: 'pdf-tools',
    name: 'PDF BOM Extractor',
    description:
      'Extract BOM tables from CAD PDFs into clean CSVs with master report export.',
    tech: 'React + PDF.js',
    standards: 'Client-side',
    features: ['Smart table detection', 'Auto-trim footers', 'CSV + master report'],
    href: '/utilities/pdf-bom-extractor/',
    thumbnail: '/img/utilities/pdf-bom-extractor.png',
  },
  {
    id: 'file-renamer',
    relatedIds: ['folder-structure-builder', 'pdf-batch-signer'],
    category: 'productivity',
    name: 'Batch File Renamer',
    description: 'Bulk rename files with find/replace, prefixes, numbering, and ZIP export.',
    tech: 'React',
    standards: 'Local-only',
    features: ['Regex find/replace', 'Prefix + numbering', 'ZIP download'],
    href: '/utilities/file-renamer/',
    thumbnail: '/img/utilities/file-renamer.png',
  },
  {
    id: 'folder-structure-builder',
    relatedIds: ['file-renamer'],
    category: 'productivity',
    name: 'Folder Structure Builder',
    description: 'Design folder trees from JSON or ZIP; export bash / PowerShell scripts.',
    tech: 'React + JSZip',
    standards: 'Client-side',
    features: ['JSON / ZIP import', 'Shell scripts', 'ZIP + JSON export'],
    href: '/utilities/folder-structure-builder/',
    thumbnail: '/img/utilities/folder-structure-builder.png',
  },
  {
    id: 'magnetic-level-gauge-configurator',
    relatedIds: ['bourdon-gauge-configurator', 'industrial-thermometer-configurator'],
    category: 'configurators',
    name: 'Magnetic Level Gauge',
    description:
      'Configure connections, dimensions, and options; export a PDF datasheet.',
    tech: 'React + SVG',
    standards: 'DIN / EN · ASME',
    features: ['Connection presets', 'Live SVG sketch', 'PDF export'],
    href: '/utilities/magnetic-level-gauge-configurator/',
    thumbnail: '/img/utilities/magnetic-level-gauge-configurator.png',
  },
  {
    id: 'bourdon-gauge-configurator',
    relatedIds: ['industrial-thermometer-configurator', 'magnetic-level-gauge-configurator'],
    category: 'configurators',
    name: 'Bourdon Gauge Configurator',
    description:
      'Configure pressure gauges with ranges, connections, and accessories; export PDF.',
    tech: 'React + SVG',
    standards: 'EN 837-1 / 837-2',
    features: ['Range presets', 'Accessory options', 'Live preview + PDF'],
    href: '/utilities/bourdon-gauge-configurator/',
    thumbnail: '/img/utilities/bourdon-gauge-configurator.png',
  },
  {
    id: 'industrial-thermometer-configurator',
    relatedIds: ['bourdon-gauge-configurator', 'magnetic-level-gauge-configurator'],
    category: 'configurators',
    name: 'Industrial Thermometer',
    description:
      'Configure bimetal thermometers: ranges, stems, thermowells; export PDF datasheet.',
    tech: 'React + SVG',
    standards: 'EN 13190',
    features: ['Range presets', 'Stem + thermowell', 'Mounting preview + PDF'],
    href: '/utilities/industrial-thermometer-configurator/',
    thumbnail: '/img/utilities/industrial-thermometer-configurator.png',
  },
  {
    id: 'tube-sheet-generator',
    relatedIds: ['pressure-vessel-dished-end-calc', 'shell-rolling', 'blind-flange-calculator'],
    category: 'calculators',
    name: 'Tube Sheet Generator',
    description: 'Lay out tube hole patterns and export DXF or STEP files locally.',
    tech: 'Canvas + WASM',
    standards: 'Layout + fabrication',
    features: ['Square / triangular pitch', 'Partition preview', 'DXF + STEP export'],
    href: '/utilities/tube-sheet-generator/',
    thumbnail: '/img/utilities/tube-sheet-generator.png',
  },
  {
    id: 'webstep-viewer',
    relatedIds: ['dxf-editor', 'qr-nameplate', 'gear-pair-calculator'],
    category: 'cad-tools',
    name: 'WebSTEP Viewer',
    description: 'Inspect STEP assemblies, isolate parts, and measure geometry in the browser.',
    tech: 'WebGL + WASM',
    standards: 'STEP (.stp/.step)',
    features: ['Assembly tree', 'Geometry probes', 'CSV BOM export'],
    href: '/utilities/webstep-viewer/',
    thumbnail: '/img/utilities/webstep-viewer.png',
  },
  {
    id: 'engineering-prompt-catalog',
    category: 'productivity',
    name: 'Engineering Prompt Catalog',
    description:
      'Browse, filter, and export prompt templates for I&C, mech. design, and procurement.',
    tech: 'HTML + Chart.js',
    standards: 'Prompt library',
    features: ['Category filters', 'Copy / download MD', 'Chart navigation'],
    href: '/utilities/engineering-prompt-catalog/',
    thumbnail: '/img/utilities/engineering-prompt-catalog.png',
  },
  {
    id: 'business-calendar-generator',
    relatedIds: ['focus-planner'],
    category: 'productivity',
    name: 'Business Calendar',
    description:
      'Generate a yearly calendar with regional holidays and export PDF or PNG.',
    tech: 'React + PDF',
    standards: 'Holiday-aware',
    features: ['Country + year presets', 'Personalization', 'PDF / PNG export'],
    href: '/utilities/business-calendar-generator/',
    thumbnail: '/img/utilities/business-calendar-generator.png',
  },
  {
    id: 'react-table-editor',
    category: 'productivity',
    name: 'React Table Editor',
    description:
      'Open, edit, and validate tabular data with CSV / XLSX import and export.',
    tech: 'React + XLSX',
    standards: 'Client-side',
    features: ['CSV / XLSX import', 'Inline editing', 'CSV / XLSX export'],
    href: '/utilities/react-table-editor/',
    thumbnail: '/img/utilities/react-table-editor.png',
  },
  {
    id: 'focus-planner',
    relatedIds: ['business-calendar-generator'],
    category: 'productivity',
    name: 'Focus Planner',
    description:
      'Plan tasks, run standalone or task-linked timers, and review analytics in a local-first browser workspace.',
    tech: 'React + IndexedDB',
    standards: 'Local-first productivity',
    features: ['Calendar planning', 'Task + standalone timers', 'Local analytics'],
    href: '/utilities/focus-planner/',
    thumbnail: '/img/utilities/focus-planner.png',
  },
  {
    id: 'blind-flange-calculator',
    relatedIds: ['pressure-vessel-dished-end-calc', 'shell-rolling', 'tube-sheet-generator'],
    category: 'calculators',
    name: 'Blind Flange Calculator',
    description:
      'Auto-select PN class and calculate EN 13445-3 thickness with weight estimates.',
    tech: 'React + Calc',
    standards: 'EN 13445-3 / EN 1092-1',
    features: ['Auto PN selection', 'Thickness + corrosion', 'Weight estimate'],
    href: '/utilities/blind-flange-calculator/',
    thumbnail: '/img/utilities/blind-flange-calculator.png',
  },
  {
    id: 'busbar-calculator',
    category: 'calculators',
    name: 'Busbar Calculator',
    description:
      'Size copper and aluminium busbars, forecast heating, and export PDF reports locally.',
    tech: 'React + Calc',
    standards: 'DIN 43670 / 43671 · IEC 60664',
    features: ['Cu/Al candidates', 'Thermal forecast', 'PDF report export'],
    href: '/utilities/busbar-calculator/',
    thumbnail: '/img/utilities/busbar-calculator.svg',
  },
  {
    id: 'pressure-vessel-dished-end-calc',
    relatedIds: ['shell-rolling', 'blind-flange-calculator', 'tube-sheet-generator'],
    category: 'calculators',
    name: 'Dished End Calculator',
    description:
      'Size DIN 28011 / 28013 heads, add nozzle callouts, and print a QC worksheet.',
    tech: 'SVG + Calc',
    standards: 'DIN 28011 / 28013 / SS 895',
    features: ['Geometry preview', 'Nozzle callouts', 'QC report'],
    href: '/utilities/pressure-vessel-dished-end-calc/',
    thumbnail: '/img/utilities/pressure-vessel-dished-end-calc.png',
  },
  {
    id: 'gear-pair-calculator',
    relatedIds: ['thread-atlas', 'webstep-viewer', 'tube-sheet-generator'],
    category: 'calculators',
    name: 'Visual Gear Pair Calculator',
    description:
      'Calculate external spur gear pair geometry, solve profile shifts, check forces, and export DXF / STEP files.',
    tech: 'Three.js + R3F + WASM',
    standards: 'ISO 21771-1 · ISO 6336 · AGMA',
    features: ['Operating geometry solver', '2D / 3D engaged preview', 'DXF + STEP exports', 'PDF report with formulas'],
    href: '/utilities/gear-pair-calculator/',
    thumbnail: '/img/utilities/gear-pair-calculator.png',
  },
  {
    id: 'wikalog-analyzer',
    relatedIds: ['doc-parser', 'pdf-bom-extractor'],
    category: 'productivity',
    name: 'WIKA Log Analyzer',
    description:
      'Parse WIKA CPG1500 calibrator logs, review measurement data, and print QC reports locally.',
    tech: 'React + MUI',
    standards: 'WIKA CPG1500',
    features: ['Log file parsing', 'Measurement charts', 'Printable QC reports'],
    href: '/utilities/wikalog-analyzer/',
    thumbnail: '/img/utilities/wikalog-analyzer.png',
  },
  {
    id: 'whisper-transcriber',
    relatedIds: ['wikalog-analyzer', 'doc-parser', 'focus-planner'],
    category: 'productivity',
    name: 'Whisper Transcriber',
    description:
      'Transcribe audio and video to editable text with Whisper running fully in your browser.',
    tech: 'Transformers.js + WASM / WebGPU',
    standards: 'On-device inference',
    features: ['File or microphone input', 'Timestamped segments', 'TXT / SRT / WebVTT export'],
    href: '/utilities/whisper-transcriber/',
    thumbnail: '/img/utilities/whisper-transcriber.svg',
  },
];
