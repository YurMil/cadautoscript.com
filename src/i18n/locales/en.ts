export const en = {
  nav: {
    docs: 'Docs',
    blog: 'Blog',
    miniGames: 'Mini Games',
    settings: 'Settings',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    profile: 'Profile',
  },
  home: {
    heroTitle: 'Engineering tools,\nbuilt for the browser',
    heroSubtitle:
      'Free web utilities for mechanical engineers — pipe cutters, shell rolling, thread atlases, and more. No install required.',
    liveUtilities: 'Live utilities',
    runtime: 'Runtime',
    formats: 'Formats',
    launchApp: 'Launch app',
    locked: 'Sign in to unlock this utility',
    signInToUnlock: 'Sign in to unlock',
    viewAll: 'View all utilities',
    getAccess: 'Get full access',
    free: 'Free',
    featuredTools: 'Featured Tools',
    allTools: 'All Tools',
    compactView: 'Compact',
    detailedView: 'Detailed',
  },
  utility: {
    fullScreen: 'Full screen',
    exitFullScreen: 'Exit full screen',
    hideInfo: 'Hide info',
    showInfo: 'Show info',
    about: 'About this tool',
    keyActions: 'Key actions',
    signInRequired: 'Sign in required',
    unlockTitle: 'Unlock this utility',
    unlockCopy:
      'Guests can open the first three tools. Sign in to launch {name} and the rest of the catalog.',
    checkingAccess: 'Checking access…',
    holdOn: 'Hold on',
    verifyingSession: 'Verifying your session for {name}.',
    backToUtilities: 'Back to Web utilities',
    macroCatalog: 'Macro catalog',
    viewFreeUtilities: 'View free utilities',
  },
  settings: {
    title: 'Settings',
    eyebrow: 'Preferences',
    subtitle: 'Manage your site preferences and personalization.',
    saved: 'Settings saved successfully.',
    saving: 'Saving...',
    save: 'Save Settings',
    loading: 'Loading your settings...',
    errorLoad: 'Unable to load your settings. Please try again.',
    errorSave: 'Unable to save your settings. Please try again.',
    smartSorting: 'Enable smart sorting of utilities on homepage',
    smartSortingHint: 'Utilities will be sorted based on your usage frequency.',
    theme: 'Default Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeAuto: 'Automatic (System)',
    displayMode: 'Utility Display Mode',
    displayCompact: 'Compact View',
    displayDetailed: 'Detailed View',
    displayHint: 'This option can also be toggled directly from the homepage.',
    language: 'Interface Language',
    languageHint: 'Choose the language for the site interface.',
    fullscreen: 'Open utilities in fullscreen',
    fullscreenHint:
      'Any utility opened from the homepage will launch immediately in fullscreen mode.',
    signInTitle: 'Sign in to view settings',
    signInCopy:
      'This page is protected. Start a session to view or edit your personal settings.',
    returnHome: 'Return home',
    openSignIn: 'Open sign in',
  },
  auth: {
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    email: 'Email',
    password: 'Password',
    continueWith: 'Continue with',
    orContinueWith: 'Or continue with',
  },
  common: {
    loading: 'Loading...',
    learnMore: 'Learn more',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    error: 'Error',
    success: 'Success',
  },
  utilities: {
    'pipe-cutter': {
      name: 'Pipe Cutter Visualizer',
      description: 'Preview saddle intersections, adjust offsets, and export CNC-ready DXF templates.',
    },
    'shell-rolling': {
      name: 'Cylindrical Shell Rolling',
      description: 'Calculate roll spacing, bending allowance, and developed lengths per EN / ASME presets.',
    },
    'metal-bending': {
      name: 'Sheet-metal Bending',
      description: 'Simulate K-factors, reliefs, and bend deductions before locking CAM programs.',
    },
    'thread-atlas': {
      name: 'Interactive Thread Atlas',
      description: 'Filter ISO / UNC / UNF series, look up drill diameters, and copy callouts.',
    },
    'doc-parser': {
      name: 'PDF Number Extractor',
      description: 'Highlight QA serials, BOM IDs, and inspection numbers locally via WASM.',
    },
    'qr-nameplate': {
      name: '3D QR Nameplate',
      description: 'Model equipment tags with QR codes; preview thickness, materials, and engraving in real time.',
    },
    'dxf-editor': {
      name: 'WebDXF Editor',
      description: 'Trim, annotate, and resave DXF files in the browser for quick QA checks.',
    },
    'pdf-master': {
      name: 'PDF Master',
      description: 'Reorder, rotate, and merge drawing packs into a clean PDF — fully offline.',
    },
    'pdf-batch-signer': {
      name: 'PDF Batch Signer',
      description: 'Stamp a reusable signature across every page in multiple PDFs at once.',
    },
    'qr-master': {
      name: 'QR Master',
      description: 'Scan QR / barcodes, generate custom codes, and manage scan history locally.',
    },
    'pdf-bom-extractor': {
      name: 'PDF BOM Extractor',
      description: 'Extract BOM tables from CAD PDFs into clean CSVs with master report export.',
    },
    'file-renamer': {
      name: 'Batch File Renamer',
      description: 'Bulk rename files with find/replace, prefixes, numbering, and ZIP export.',
    },
    'folder-structure-builder': {
      name: 'Folder Structure Builder',
      description: 'Design folder trees from JSON or ZIP; export bash / PowerShell scripts.',
    },
    'magnetic-level-gauge-configurator': {
      name: 'Magnetic Level Gauge',
      description: 'Configure connections, dimensions, and options; export a PDF datasheet.',
    },
    'bourdon-gauge-configurator': {
      name: 'Bourdon Gauge Configurator',
      description: 'Configure pressure gauges with ranges, connections, and accessories; export PDF.',
    },
    'industrial-thermometer-configurator': {
      name: 'Industrial Thermometer',
      description: 'Configure bimetal thermometers: ranges, stems, thermowells; export PDF datasheet.',
    },
    'tube-sheet-generator': {
      name: 'Tube Sheet Generator',
      description: 'Lay out tube hole patterns and export DXF or STEP files locally.',
    },
    'webstep-viewer': {
      name: 'WebSTEP Viewer',
      description: 'Inspect STEP assemblies, isolate parts, and measure geometry in the browser.',
    },
    'engineering-prompt-catalog': {
      name: 'Engineering Prompt Catalog',
      description: 'Browse, filter, and export prompt templates for I&C, mech. design, and procurement.',
    },
    'business-calendar-generator': {
      name: 'Business Calendar',
      description: 'Generate a yearly calendar with regional holidays and export PDF or PNG.',
    },
    'react-table-editor': {
      name: 'React Table Editor',
      description: 'Open, edit, and validate tabular data with CSV / XLSX import and export.',
    },
    'focus-planner': {
      name: 'Focus Planner',
      description: 'Plan tasks, run standalone or task-linked timers, and review analytics in a local-first browser workspace.',
    },
    'blind-flange-calculator': {
      name: 'Blind Flange Calculator',
      description: 'Auto-select PN class and calculate EN 13445-3 thickness with weight estimates.',
    },
    'pressure-vessel-dished-end-calc': {
      name: 'Dished End Calculator',
      description: 'Size DIN 28011 / 28013 heads, add nozzle callouts, and print a QC worksheet.',
    },
    'wikalog-analyzer': {
      name: 'WIKA Log Analyzer',
      description: 'Parse WIKA CPG1500 calibrator logs, review measurement data, and print QC reports locally.',
    },
  },
};

export type TranslationDict = typeof en;
