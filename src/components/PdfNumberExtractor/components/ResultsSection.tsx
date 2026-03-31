import React from 'react';
import type {CapturedResult} from '../types';
import ExportActions from './ExportActions';
import ResultsList from './ResultsList';
import SummaryBanner from './SummaryBanner';

type ResultsSectionProps = {
  results: CapturedResult[];
  activeResultCount: number;
  uniqueResultCount: number;
  prefix: string;
  includeRevisionInReports: boolean;
  onBack: () => void;
  onOpenViewer: (result: CapturedResult) => void;
  onToggleExcluded: (resultId: string) => void;
  onCommentChange: (resultId: string, comment: string) => void;
  onExportPdf: () => void;
  onExportTxt: () => void;
  onExportCsv: () => void;
};

export default function ResultsSection({
  results,
  activeResultCount,
  uniqueResultCount,
  prefix,
  includeRevisionInReports,
  onBack,
  onOpenViewer,
  onToggleExcluded,
  onCommentChange,
  onExportPdf,
  onExportTxt,
  onExportCsv,
}: ResultsSectionProps) {
  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">2. Results & export</h2>
          <p className="mt-1 text-sm text-slate-200">
            Review each capture, exclude false positives, then export the filtered set.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-slate-500/70 bg-slate-900/88 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-200/35 hover:bg-slate-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
          onClick={onBack}
        >
          Back to config
        </button>
      </div>

      <SummaryBanner
        totalResults={results.length}
        activeResults={activeResultCount}
        uniqueResults={uniqueResultCount}
      />

      <div className="mt-6 max-h-[60vh] overflow-y-auto pr-1">
        <ResultsList
          results={results}
          prefix={prefix}
          includeRevisionInReports={includeRevisionInReports}
          onOpenViewer={onOpenViewer}
          onToggleExcluded={onToggleExcluded}
          onCommentChange={onCommentChange}
        />
      </div>

      <ExportActions
        disabled={activeResultCount === 0}
        onExportPdf={onExportPdf}
        onExportTxt={onExportTxt}
        onExportCsv={onExportCsv}
      />
    </section>
  );
}
