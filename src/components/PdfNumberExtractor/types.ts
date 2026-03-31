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

export type ScanResult = {
  total: number | 'Error';
  unique: number | '';
  matches?: string[];
};

export type UploadedFileEntry = {
  id: string;
  file: File;
  name: string;
  scanResult: ScanResult | 'scanning' | null;
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

export type CapturedResultDraft = Omit<CapturedResult, 'id' | 'excluded' | 'comment'>;

export type ExtractorView = 'config' | 'processing' | 'results';

export type ViewerState = {
  open: boolean;
  file: File | null;
  title: string;
  pageNumber: number | null;
  searchText: string | null;
};

export type ProcessingState = {
  running: boolean;
  statusText: string;
};

export type ExtractorState = {
  view: ExtractorView;
  uploadedFiles: UploadedFileEntry[];
  settings: ExtractorSettings;
  processing: ProcessingState;
  results: CapturedResult[];
  viewer: ViewerState;
  helpOpen: boolean;
};

export type PdfRuntimeConfig = {
  scriptSrc: string;
  workerSrc: string;
};

export type PdfTextItemLike = {
  str: string;
  transform: number[];
};

export type PdfTextContentLike = {
  items: PdfTextItemLike[];
};

export type PdfViewportLike = {
  width: number;
  height: number;
  transform: number[];
};

export type PdfPageLike = {
  getTextContent: () => Promise<PdfTextContentLike>;
  getViewport: (params: {scale: number}) => PdfViewportLike;
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewportLike;
  }) => {promise: Promise<void>};
};

export type PdfDocumentLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageLike>;
  destroy?: () => Promise<void> | void;
};

export type PdfRuntime = {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  Util: {
    transform: (first: number[], second: number[]) => number[];
  };
  getDocument: (source: {data: Uint8Array}) => {
    promise: Promise<PdfDocumentLike>;
  };
};
