import React, {useRef} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import FileDropzone from './components/FileDropzone';
import FileList from './components/FileList';
import ExtractionSettings from './components/ExtractionSettings';
import ScreenshotSettings from './components/ScreenshotSettings';
import ProcessingSection from './components/ProcessingSection';
import ResultsSection from './components/ResultsSection';
import PdfViewerModal from './components/PdfViewerModal';
import HelpModal from './components/HelpModal';
import {usePdfNumberExtractor} from './hooks/usePdfNumberExtractor';
import {exportCsv} from './utils/exportCsv';
import {exportPdfReport} from './utils/exportPdfReport';
import {exportSingleFileCsv} from './utils/exportSingleFileCsv';
import {exportTxt} from './utils/exportTxt';
import type {ExtractorSettings, UploadedFileEntry} from './types';

export default function PdfNumberExtractor() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const runtimeConfig = {
    scriptSrc: useBaseUrl('/vendor/pdf.min.js'),
    workerSrc: useBaseUrl('/vendor/pdf.worker.min.js'),
  };

  const {
    state,
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
  } = usePdfNumberExtractor(runtimeConfig);

  return (
    <>
      <div className="min-h-full overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#030712_56%,_#020617_100%)] text-slate-100">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">
          <header className="mb-8 flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-100">
                Integrated React utility
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                PDF Number Extractor
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                Extract prefixed numbers from production PDFs, review screenshot captures, and
                export filtered welding report data without leaving the main site.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-slate-500/70 bg-slate-900/88 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-200/40 hover:bg-slate-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
              onClick={openHelp}
            >
              Help
            </button>
          </header>

          <main className="rounded-[34px] border border-white/8 bg-slate-900/70 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-7">
            {state.view === 'processing' ? (
              <ProcessingSection statusText={state.processing.statusText} />
            ) : state.view === 'results' ? (
              <ResultsSection
                results={state.results}
                activeResultCount={activeResults.length}
                uniqueResultCount={uniqueActiveCount}
                prefix={state.settings.prefix}
                includeRevisionInReports={state.settings.includeRevisionInReports}
                onBack={backToConfig}
                onOpenViewer={(result) =>
                  openViewer({
                    file: result.sourceFile,
                    title: result.sourceFileName,
                    pageNumber: result.page,
                    searchText: result.text,
                  })
                }
                onToggleExcluded={toggleExcluded}
                onCommentChange={updateComment}
                onExportPdf={() => {
                  void exportPdfReport({
                    results: activeResults,
                    prefix: state.settings.prefix,
                    includeRevisionInReports: state.settings.includeRevisionInReports,
                    captureWidth: state.settings.captureWidth,
                    captureHeight: state.settings.captureHeight,
                  });
                }}
                onExportTxt={() => {
                  exportTxt(activeResults, state.settings.prefix);
                }}
                onExportCsv={() => {
                  exportCsv({
                    results: activeResults,
                    prefix: state.settings.prefix,
                    includeRevisionInReports: state.settings.includeRevisionInReports,
                    removeCsvDuplicatesKeepLongest:
                      state.settings.removeCsvDuplicatesKeepLongest,
                  });
                }}
              />
            ) : (
              <ConfigView
                entries={state.uploadedFiles}
                includedFileNames={includedFileNames}
                inputRef={fileInputRef}
                settings={state.settings}
                onFiles={addFiles}
                onOpenFile={(file, title) => openViewer({file, title})}
                onRemoveFile={removeFile}
                onClearFiles={clearFiles}
                onSettingChange={updateSetting}
                onRunAnalysis={() => {
                  void runAnalysis();
                }}
                onExportSingleFileCsv={(entry) => {
                  exportSingleFileCsv({
                    fileEntry: entry,
                    prefix: state.settings.prefix,
                    includeRevisionInReports: state.settings.includeRevisionInReports,
                    removeCsvDuplicatesKeepLongest:
                      state.settings.removeCsvDuplicatesKeepLongest,
                  });
                }}
              />
            )}
          </main>
        </div>
      </div>

      <PdfViewerModal viewer={state.viewer} onClose={closeViewer} />
      <HelpModal open={state.helpOpen} onClose={closeHelp} />
    </>
  );
}

function ConfigView({
  entries,
  includedFileNames,
  inputRef,
  settings,
  onFiles,
  onOpenFile,
  onRemoveFile,
  onClearFiles,
  onSettingChange,
  onRunAnalysis,
  onExportSingleFileCsv,
}: {
  entries: UploadedFileEntry[];
  includedFileNames: Set<string>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  settings: ExtractorSettings;
  onFiles: (files: FileList | File[]) => void;
  onOpenFile: (file: File, title?: string) => void;
  onRemoveFile: (fileId: string) => void;
  onClearFiles: () => void;
  onSettingChange: <Key extends keyof ExtractorSettings>(
    key: Key,
    value: ExtractorSettings[Key],
  ) => void;
  onRunAnalysis: () => void;
  onExportSingleFileCsv: (entry: UploadedFileEntry) => void;
}) {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">1. Files & configuration</h2>
          <p className="mt-1 text-sm text-slate-200">
            Upload PDFs, verify quick scan counts, then tune extraction and screenshot rules.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-cyan-100/10 bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-[0_12px_24px_rgba(34,211,238,0.22)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100"
            onClick={() => inputRef.current?.click()}
          >
            + Add files
          </button>
          <button
            type="button"
            disabled={entries.length === 0}
            className={[
              'rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200',
              entries.length === 0
                ? 'cursor-not-allowed border-slate-500/40 bg-slate-100/90 text-slate-400'
                : 'border-slate-500/70 bg-slate-900/88 text-slate-100 hover:border-cyan-200/35 hover:bg-slate-900 hover:text-white',
            ].join(' ')}
            onClick={onClearFiles}
          >
            Clear list
          </button>
        </div>
      </div>

      <FileDropzone
        hasFiles={entries.length > 0}
        inputRef={inputRef}
        onFiles={onFiles}
      >
        <FileList
          entries={entries}
          includedFileNames={includedFileNames}
          onOpenFile={onOpenFile}
          onRemoveFile={onRemoveFile}
          onExportSingleFileCsv={onExportSingleFileCsv}
        />
      </FileDropzone>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ExtractionSettings
          settings={settings}
          onSettingChange={onSettingChange}
        />
        <ScreenshotSettings
          settings={settings}
          onSettingChange={onSettingChange}
        />
      </div>

      <div className="mt-10 flex justify-end">
        <button
          type="button"
          className="rounded-full border border-cyan-100/10 bg-cyan-300 px-8 py-3 text-base font-bold text-slate-950 shadow-[0_16px_32px_rgba(34,211,238,0.24)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100"
          onClick={onRunAnalysis}
        >
          Run analysis
        </button>
      </div>
    </section>
  );
}
