import {useEffect, useReducer, useRef} from 'react';
import type {Dispatch} from 'react';
import {INITIAL_STATE, QUICK_SCAN_DEBOUNCE_MS} from '../constants';
import {logger} from '../../../lib/logger';
import type {
  CapturedResult,
  ExtractorSettings,
  ExtractorState,
  PdfRuntimeConfig,
  UploadedFileEntry,
  ViewerState,
} from '../types';
import {useI18n} from '../../../contexts/I18nContext';
import {classifyPdfError, pdfErrorMessageKey, validatePdfFile} from '../../../lib/pdfValidation';
import {getDefaultDrawingName} from '../utils/fileNaming';
import {analyzePdfFile} from '../utils/pageAnalysis';
import {buildBaseNumberRegex} from '../utils/regex';
import {getIncludedFileNameSet, getFilesToProcess} from '../utils/revisions';
import {quickScanFile} from '../utils/quickScan';
import {sortCapturedResults} from '../utils/sorting';

type Action =
  | {type: 'ADD_FILES'; entries: UploadedFileEntry[]}
  | {type: 'REMOVE_FILE'; id: string}
  | {type: 'CLEAR_FILES'}
  | {type: 'MARK_ALL_SCANNING'}
  | {type: 'SET_SCAN_RESULT'; id: string; scanResult: UploadedFileEntry['scanResult']}
  | {
      type: 'SET_SETTING';
      key: keyof ExtractorSettings;
      value: ExtractorSettings[keyof ExtractorSettings];
    }
  | {type: 'START_ANALYSIS'; statusText: string}
  | {type: 'SET_STATUS_TEXT'; statusText: string}
  | {type: 'COMPLETE_ANALYSIS'; results: CapturedResult[]}
  | {type: 'SET_VIEW'; view: ExtractorState['view']}
  | {type: 'TOGGLE_EXCLUDED'; id: string}
  | {type: 'SET_COMMENT'; id: string; comment: string}
  | {type: 'OPEN_VIEWER'; viewer: ViewerState}
  | {type: 'CLOSE_VIEWER'}
  | {type: 'OPEN_HELP'}
  | {type: 'CLOSE_HELP'};

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function reducer(state: ExtractorState, action: Action): ExtractorState {
  switch (action.type) {
    case 'ADD_FILES':
      return {
        ...state,
        uploadedFiles: [...state.uploadedFiles, ...action.entries],
      };
    case 'REMOVE_FILE':
      return {
        ...state,
        uploadedFiles: state.uploadedFiles.filter((entry) => entry.id !== action.id),
      };
    case 'CLEAR_FILES':
      return {
        ...state,
        uploadedFiles: [],
      };
    case 'MARK_ALL_SCANNING':
      return {
        ...state,
        uploadedFiles: state.uploadedFiles.map((entry) => ({
          ...entry,
          scanResult: 'scanning',
        })),
      };
    case 'SET_SCAN_RESULT':
      return {
        ...state,
        uploadedFiles: state.uploadedFiles.map((entry) =>
          entry.id === action.id
            ? {
                ...entry,
                scanResult: action.scanResult,
              }
            : entry,
        ),
      };
    case 'SET_SETTING':
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.key]: action.value,
        },
      };
    case 'START_ANALYSIS':
      return {
        ...state,
        view: 'processing',
        processing: {
          running: true,
          statusText: action.statusText,
        },
      };
    case 'SET_STATUS_TEXT':
      return {
        ...state,
        processing: {
          ...state.processing,
          statusText: action.statusText,
        },
      };
    case 'COMPLETE_ANALYSIS':
      return {
        ...state,
        view: 'results',
        processing: {
          running: false,
          statusText: 'Done.',
        },
        results: action.results,
      };
    case 'SET_VIEW':
      return {
        ...state,
        view: action.view,
      };
    case 'TOGGLE_EXCLUDED':
      return {
        ...state,
        results: state.results.map((result) =>
          result.id === action.id
            ? {
                ...result,
                excluded: !result.excluded,
              }
            : result,
        ),
      };
    case 'SET_COMMENT':
      return {
        ...state,
        results: state.results.map((result) =>
          result.id === action.id
            ? {
                ...result,
                comment: action.comment,
              }
            : result,
        ),
      };
    case 'OPEN_VIEWER':
      return {
        ...state,
        viewer: action.viewer,
      };
    case 'CLOSE_VIEWER':
      return {
        ...state,
        viewer: {
          open: false,
          file: null,
          title: '',
          pageNumber: null,
          searchText: null,
        },
      };
    case 'OPEN_HELP':
      return {
        ...state,
        helpOpen: true,
      };
    case 'CLOSE_HELP':
      return {
        ...state,
        helpOpen: false,
      };
    default:
      return state;
  }
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

export function usePdfNumberExtractor(runtimeConfig: PdfRuntimeConfig) {
  const {t} = useI18n();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const quickScanSessionRef = useRef(0);
  const analysisSessionRef = useRef(0);

  const fileSignature = state.uploadedFiles.map((entry) => entry.id).join('|');

  useEffect(() => {
    if (!state.uploadedFiles.length || typeof window === 'undefined') {
      return undefined;
    }

    const sessionId = quickScanSessionRef.current + 1;
    quickScanSessionRef.current = sessionId;

    const timeoutId = window.setTimeout(() => {
      void runQuickScans({
        sessionId,
        entries: state.uploadedFiles,
        prefix: state.settings.prefix,
        maxLength: state.settings.maxLength,
        runtimeConfig,
        dispatch,
        getCurrentSession: () => quickScanSessionRef.current,
      });
    }, QUICK_SCAN_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [
    fileSignature,
    runtimeConfig.scriptSrc,
    runtimeConfig.workerSrc,
    state.settings.maxLength,
    state.settings.prefix,
    state.uploadedFiles.length,
  ]);

  const filesToProcess = getFilesToProcess(
    state.uploadedFiles,
    state.settings.processLatestRevisionOnly,
  );
  const includedFileNames = getIncludedFileNameSet(
    state.uploadedFiles,
    state.settings.processLatestRevisionOnly,
  );
  const activeResults = state.results.filter((result) => !result.excluded);
  const baseNumberRegex = buildBaseNumberRegex(state.settings.prefix);
  const uniqueActiveCount = new Set(
    activeResults.map((result) => {
      const baseNumber = (result.text.match(baseNumberRegex) || [result.text])[0];
      return `${result.filePrefix}${baseNumber}`;
    }),
  ).size;

  function addFiles(files: FileList | File[]) {
    const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200 MB per file
    const incomingFiles = Array.from(files);
    const existingNames = new Set(state.uploadedFiles.map((entry) => entry.name));
    const incomingNames = new Set<string>();
    let skippedOversized = 0;

    const entries = incomingFiles
      .filter((file) => {
        const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
        if (!isPdf) {
          return false;
        }
        if (file.size > MAX_FILE_BYTES) {
          skippedOversized += 1;
          logger.warn(
            `[PdfNumberExtractor] Skipped "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB) — exceeds 200 MB limit`,
          );
          return false;
        }
        if (existingNames.has(file.name) || incomingNames.has(file.name)) {
          return false;
        }
        incomingNames.add(file.name);
        return true;
      })
      .map<UploadedFileEntry>((file) => ({
        id: createId(),
        file,
        name: file.name,
        scanResult: null,
      }));

    if (!entries.length) {
      if (skippedOversized > 0) {
        dispatch({
          type: 'SET_STATUS_TEXT',
          statusText: `Skipped ${skippedOversized} file${skippedOversized === 1 ? '' : 's'} larger than 200 MB.`,
        });
      }
      return;
    }

    if (skippedOversized > 0) {
      dispatch({
        type: 'SET_STATUS_TEXT',
        statusText: `Skipped ${skippedOversized} oversized file${skippedOversized === 1 ? '' : 's'} (limit: 200 MB).`,
      });
    }

    dispatch({
      type: 'ADD_FILES',
      entries,
    });
  }

  function removeFile(fileId: string) {
    dispatch({
      type: 'REMOVE_FILE',
      id: fileId,
    });
  }

  function clearFiles() {
    dispatch({
      type: 'CLEAR_FILES',
    });
  }

  function updateSetting<Key extends keyof ExtractorSettings>(
    key: Key,
    value: ExtractorSettings[Key],
  ) {
    dispatch({
      type: 'SET_SETTING',
      key,
      value,
    });
  }

  async function runAnalysis() {
    if (!filesToProcess.length) {
      window.alert('No files to process.');
      return;
    }

    const sessionId = analysisSessionRef.current + 1;
    analysisSessionRef.current = sessionId;

    dispatch({
      type: 'START_ANALYSIS',
      statusText: 'Initializing...',
    });

    const collectedResults: CapturedResult[] = [];

    const skipped: string[] = [];

    for (const file of filesToProcess) {
      if (analysisSessionRef.current !== sessionId) {
        return;
      }

      // Reject unusable input before it reaches the parser, so the user gets
      // the actual reason instead of an opaque parser failure (issue #100).
      const invalid = await validatePdfFile(file);
      if (invalid) {
        skipped.push(`${file.name} — ${t(pdfErrorMessageKey(invalid))}`);
        dispatch({
          type: 'SET_STATUS_TEXT',
          statusText: `${file.name}: ${t(pdfErrorMessageKey(invalid))}`,
        });
        await delay(900);
        continue;
      }

      try {
        const drafts = await analyzePdfFile({
          file,
          settings: state.settings,
          runtimeConfig,
          onStatus: (statusText) => {
            if (analysisSessionRef.current !== sessionId) {
              return;
            }
            dispatch({
              type: 'SET_STATUS_TEXT',
              statusText,
            });
          },
        });

        if (analysisSessionRef.current !== sessionId) {
          return;
        }

        for (const draft of drafts) {
          collectedResults.push({
            ...draft,
            id: createId(),
            excluded: false,
            comment: state.settings.prefillCommentsWithDrawingName
              ? getDefaultDrawingName(file.name)
              : '',
          });
        }
      } catch (error) {
        logger.error(`Error processing ${file.name}:`, error);
        if (analysisSessionRef.current !== sessionId) {
          return;
        }
        // Name the cause (encrypted / corrupt / no pages) rather than a
        // generic "Error with file X" so the user knows what to fix.
        const reason = t(pdfErrorMessageKey(classifyPdfError(error)));
        skipped.push(`${file.name} — ${reason}`);
        dispatch({
          type: 'SET_STATUS_TEXT',
          statusText: `${file.name}: ${reason}`,
        });
        await delay(1200);
      }
    }

    if (skipped.length > 0) {
      logger.warn('[PdfNumberExtractor] Skipped files:', skipped.join('; '));
    }

    if (analysisSessionRef.current !== sessionId) {
      return;
    }

    dispatch({
      type: 'COMPLETE_ANALYSIS',
      results: sortCapturedResults(collectedResults, state.settings.prefix),
    });
  }

  function backToConfig() {
    dispatch({
      type: 'SET_VIEW',
      view: 'config',
    });
  }

  function toggleExcluded(resultId: string) {
    dispatch({
      type: 'TOGGLE_EXCLUDED',
      id: resultId,
    });
  }

  function updateComment(resultId: string, comment: string) {
    dispatch({
      type: 'SET_COMMENT',
      id: resultId,
      comment,
    });
  }

  function openViewer(params: {
    file: File;
    title?: string;
    pageNumber?: number | null;
    searchText?: string | null;
  }) {
    dispatch({
      type: 'OPEN_VIEWER',
      viewer: {
        open: true,
        file: params.file,
        title: params.title ?? params.file.name,
        pageNumber: params.pageNumber ?? null,
        searchText: params.searchText ?? null,
      },
    });
  }

  function closeViewer() {
    dispatch({
      type: 'CLOSE_VIEWER',
    });
  }

  function openHelp() {
    dispatch({
      type: 'OPEN_HELP',
    });
  }

  function closeHelp() {
    dispatch({
      type: 'CLOSE_HELP',
    });
  }

  return {
    state,
    filesToProcess,
    includedFileNames,
    activeResults,
    uniqueActiveCount,
    addFiles,
    removeFile,
    clearFiles,
    updateSetting,
    runAnalysis,
    backToConfig,
    toggleExcluded,
    updateComment,
    openViewer,
    closeViewer,
    openHelp,
    closeHelp,
  };
}

async function runQuickScans(params: {
  sessionId: number;
  entries: UploadedFileEntry[];
  prefix: string;
  maxLength: number;
  runtimeConfig: PdfRuntimeConfig;
  dispatch: Dispatch<Action>;
  getCurrentSession: () => number;
}) {
  const {sessionId, entries, prefix, maxLength, runtimeConfig, dispatch, getCurrentSession} = params;

  dispatch({
    type: 'MARK_ALL_SCANNING',
  });

  for (const entry of entries) {
    const scanResult = await quickScanFile({
      file: entry.file,
      prefix,
      maxLength,
      runtimeConfig,
    });

    if (getCurrentSession() !== sessionId) {
      return;
    }

    dispatch({
      type: 'SET_SCAN_RESULT',
      id: entry.id,
      scanResult,
    });
  }
}
