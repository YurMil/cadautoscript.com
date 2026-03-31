import React from 'react';
import type {CapturedResult} from '../types';

type ResultItemProps = {
  result: CapturedResult;
  index: number;
  prefix: string;
  includeRevisionInReports: boolean;
  baseNumber: string;
  onOpenViewer: () => void;
  onToggleExcluded: () => void;
  onCommentChange: (comment: string) => void;
};

export default function ResultItem({
  result,
  index,
  includeRevisionInReports,
  baseNumber,
  onOpenViewer,
  onToggleExcluded,
  onCommentChange,
}: ResultItemProps) {
  return (
    <article
      className={[
        'rounded-[26px] border border-white/8 bg-slate-950/75 p-4 transition',
        result.excluded ? 'opacity-40' : 'hover:bg-slate-950',
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="xl:w-[34%]">
          <div className="relative rounded-[20px] border border-white/10 bg-slate-900 p-3 shadow-inner">
            <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2 py-1 text-xs font-bold text-slate-300">
              {index + 1}.
            </span>
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full border border-rose-300/15 bg-slate-950/85 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:border-rose-300/35 hover:bg-slate-900"
              onClick={onToggleExcluded}
            >
              {result.excluded ? 'Restore' : 'Exclude'}
            </button>

            <button
              type="button"
              className="block w-full cursor-pointer"
              onClick={onOpenViewer}
            >
              <img
                src={result.dataUrl}
                alt={`${result.filePrefix}${baseNumber}`}
                className="mb-3 w-full rounded-xl border border-white/5"
              />
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2 text-center">
              <span className="font-mono text-sm font-semibold tracking-wide text-cyan-200">
                {result.filePrefix}
                {baseNumber} (pg {result.page})
              </span>
              {includeRevisionInReports && result.revision ? (
                <span className="rounded-full border border-fuchsia-400/15 bg-fuchsia-400/10 px-2 py-0.5 text-xs font-bold text-fuchsia-200">
                  {result.revision}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/8 px-2 py-1">{result.gridCoord}</span>
              <span>{result.sourceFileName}</span>
            </div>
          </div>
        </div>

        <div className="xl:flex-1">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Comments
          </label>
          <textarea
            value={result.comment}
            placeholder="Enter comments here..."
            className="h-36 w-full rounded-[22px] border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/55 focus:bg-slate-900"
            onChange={(event) => onCommentChange(event.target.value)}
          />
        </div>
      </div>
    </article>
  );
}
