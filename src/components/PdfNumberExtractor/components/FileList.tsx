import React from 'react';
import type {UploadedFileEntry} from '../types';

type FileListProps = {
  entries: UploadedFileEntry[];
  includedFileNames: Set<string>;
  onOpenFile: (file: File, title?: string) => void;
  onRemoveFile: (fileId: string) => void;
  onExportSingleFileCsv: (entry: UploadedFileEntry) => void;
};

export default function FileList({
  entries,
  includedFileNames,
  onOpenFile,
  onRemoveFile,
  onExportSingleFileCsv,
}: FileListProps) {
  if (!entries.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 rounded-full border border-cyan-300/30 bg-cyan-300/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-50">
          PDF only
        </div>
        <p className="text-sm text-slate-200">
          <span className="font-semibold text-cyan-100">Click to upload</span> or drag and drop
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
      {entries.map((entry) => {
        const isIncluded = includedFileNames.has(entry.name);
        return (
          <div
            key={entry.id}
            className={[
              'flex items-center justify-between gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition',
              isIncluded ? '' : 'opacity-60',
            ].join(' ')}
          >
            <button
              type="button"
              className={[
                'min-w-0 appearance-none border-0 bg-transparent p-0 text-left text-[15px] font-semibold tracking-[0.01em] text-cyan-50 underline decoration-cyan-200/45 underline-offset-4 transition hover:text-white hover:decoration-cyan-100 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200',
                isIncluded ? '' : 'line-through',
              ].join(' ')}
              onClick={() => onOpenFile(entry.file, entry.name)}
              title={entry.name}
            >
              {entry.name}
            </button>

            <div className="flex flex-shrink-0 items-center gap-4">
              <ScanStatus entry={entry} onExportSingleFileCsv={onExportSingleFileCsv} />
              <button
                type="button"
                className="rounded-full border border-slate-500/70 bg-slate-900/90 px-2.5 py-1.5 text-sm font-semibold text-slate-100 transition hover:border-rose-300/40 hover:bg-slate-900 hover:text-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
                onClick={() => onRemoveFile(entry.id)}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScanStatus({
  entry,
  onExportSingleFileCsv,
}: {
  entry: UploadedFileEntry;
  onExportSingleFileCsv: (entry: UploadedFileEntry) => void;
}) {
  if (entry.scanResult === 'scanning' || entry.scanResult === null) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-300" />
      </span>
    );
  }

  if (entry.scanResult.total === 'Error') {
    return <span className="text-xs font-medium text-rose-300">Error</span>;
  }

  const isExportable = entry.scanResult.total > 0;

  return (
    <button
      type="button"
      className={[
        'appearance-none border-0 bg-transparent p-0 text-xs font-semibold tracking-[0.01em] transition',
        isExportable
          ? 'text-slate-100 hover:text-cyan-100 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200'
          : 'cursor-default text-slate-300',
      ].join(' ')}
      onClick={() => {
        if (isExportable) {
          onExportSingleFileCsv(entry);
        }
      }}
    >
      Found {entry.scanResult.total} ({entry.scanResult.unique} unique)
    </button>
  );
}
