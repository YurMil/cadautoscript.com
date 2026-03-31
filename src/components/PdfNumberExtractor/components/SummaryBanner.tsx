import React from 'react';

type SummaryBannerProps = {
  totalResults: number;
  activeResults: number;
  uniqueResults: number;
};

export default function SummaryBanner({
  totalResults,
  activeResults,
  uniqueResults,
}: SummaryBannerProps) {
  return (
    <div className="rounded-[24px] border border-emerald-400/10 bg-emerald-500/10 px-5 py-4">
      <p className="text-sm font-medium text-emerald-100">
        {totalResults === 0
          ? 'No matches found.'
          : `Found ${activeResults} matches (${uniqueResults} unique). Review results below.`}
      </p>
    </div>
  );
}
