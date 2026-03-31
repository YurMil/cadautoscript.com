import React from 'react';
import type {CapturedResult} from '../types';
import {buildBaseNumberRegex} from '../utils/regex';
import ResultItem from './ResultItem';

type ResultsListProps = {
  results: CapturedResult[];
  prefix: string;
  includeRevisionInReports: boolean;
  onOpenViewer: (result: CapturedResult) => void;
  onToggleExcluded: (resultId: string) => void;
  onCommentChange: (resultId: string, comment: string) => void;
};

export default function ResultsList({
  results,
  prefix,
  includeRevisionInReports,
  onOpenViewer,
  onToggleExcluded,
  onCommentChange,
}: ResultsListProps) {
  const baseNumberRegex = buildBaseNumberRegex(prefix);

  return (
    <div className="space-y-4">
      {results.map((result, index) => {
        const baseNumber = (result.text.match(baseNumberRegex) || [result.text])[0];
        return (
          <ResultItem
            key={result.id}
            result={result}
            index={index}
            prefix={prefix}
            includeRevisionInReports={includeRevisionInReports}
            baseNumber={baseNumber}
            onOpenViewer={() => onOpenViewer(result)}
            onToggleExcluded={() => onToggleExcluded(result.id)}
            onCommentChange={(comment) => onCommentChange(result.id, comment)}
          />
        );
      })}
    </div>
  );
}
