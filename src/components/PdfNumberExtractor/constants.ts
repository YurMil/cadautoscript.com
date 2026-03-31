import type {ExtractorSettings, ExtractorState} from './types';

export const DEFAULT_SETTINGS: ExtractorSettings = {
  prefix: 'W',
  maxLength: 6,
  processLatestRevisionOnly: false,
  includeRevisionInReports: false,
  removeCsvDuplicatesKeepLongest: false,
  prefillCommentsWithDrawingName: true,
  captureWidth: 400,
  captureHeight: 175,
  captureX: 30,
  captureY: 50,
};

export const INITIAL_STATE: ExtractorState = {
  view: 'config',
  uploadedFiles: [],
  settings: DEFAULT_SETTINGS,
  processing: {
    running: false,
    statusText: 'Initializing...',
  },
  results: [],
  viewer: {
    open: false,
    file: null,
    title: '',
    pageNumber: null,
    searchText: null,
  },
  helpOpen: false,
};

export const CAPTURE_PREVIEW_SCALE = 0.25;
export const GRID_COLUMNS = 10;
export const GRID_ROWS = 10;
export const QUICK_SCAN_DEBOUNCE_MS = 180;

export const WELDING_REPORT_HEADERS = [
  'Esliide',
  'Jrk nr.',
  'Revision',
  'Job',
  'Repaired',
  'Liide',
  'WPS nr.',
  'WPAR / WPQR nr.',
  'Keevitus protsess',
  'Keevitaja ID',
  'Keevituse tüüp',
  'Märkused',
  'Keevitaja 1',
  'Keevitaja 2',
  'IP 100%',
  'F/P/W',
  'Kuupäev',
  'RT %',
  'MT %',
  'PT %',
  'PMI QTY',
  'Fin.Qty',
  'Preheat',
  'PWHT',
];
