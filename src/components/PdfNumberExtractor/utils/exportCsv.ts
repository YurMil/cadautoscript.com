import {WELDING_REPORT_HEADERS} from '../constants';
import type {CapturedResult} from '../types';
import {downloadText} from './download';
import {buildBaseNumberRegex} from './regex';

export function exportCsv(params: {
  results: CapturedResult[];
  prefix: string;
  includeRevisionInReports: boolean;
  removeCsvDuplicatesKeepLongest: boolean;
}) {
  const {results, prefix, includeRevisionInReports, removeCsvDuplicatesKeepLongest} = params;
  if (!results.length) {
    return false;
  }

  const baseNumberRegex = buildBaseNumberRegex(prefix);
  let rows = results;

  if (removeCsvDuplicatesKeepLongest) {
    const deduplicated = new Map<string, CapturedResult>();
    for (const result of results) {
      const baseNumber = (result.text.match(baseNumberRegex) || [result.text])[0];
      const key = `${result.filePrefix}${baseNumber}`;
      const existing = deduplicated.get(key);
      if (!existing || result.text.length > existing.text.length) {
        deduplicated.set(key, result);
      }
    }
    rows = Array.from(deduplicated.values());
  }

  let csv = `${WELDING_REPORT_HEADERS.join(';')}\n`;

  for (const result of rows) {
    const baseNumber = (result.text.match(baseNumberRegex) || [result.text])[0];
    const fullNumber = `${result.filePrefix}${baseNumber}`;

    let esliide = `"${fullNumber}"`;
    let sequenceNumber = '';
    const trailingNumberMatch = fullNumber.match(/^(.*?)(\d+)$/);
    if (trailingNumberMatch) {
      esliide = `"${trailingNumberMatch[1]}"`;
      sequenceNumber = `"${trailingNumberMatch[2]}"`;
    }

    const revision = `"${includeRevisionInReports && result.revision ? result.revision : ''}"`;
    const comment = `"${(result.comment || '').replace(/"/g, '""')}"`;

    csv += [
      esliide,
      sequenceNumber,
      revision,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      comment,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ].join(';');
    csv += '\n';
  }

  const csvWithLegacyBomPrefix = `\uFEFF${csv}`;
  downloadText(
    csvWithLegacyBomPrefix,
    'welding_report_export.csv',
    'text/csv;charset=utf-8;',
    true,
  );

  return true;
}
