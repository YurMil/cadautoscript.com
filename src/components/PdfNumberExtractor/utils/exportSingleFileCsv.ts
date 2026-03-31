import {WELDING_REPORT_HEADERS} from '../constants';
import type {UploadedFileEntry} from '../types';
import {downloadText} from './download';
import {extractRevision, getFilePrefix} from './fileNaming';
import {buildBaseNumberRegex} from './regex';
import {sortSingleFileCsvRows} from './sorting';

export function exportSingleFileCsv(params: {
  fileEntry: UploadedFileEntry;
  prefix: string;
  includeRevisionInReports: boolean;
  removeCsvDuplicatesKeepLongest: boolean;
}) {
  const {fileEntry, prefix, includeRevisionInReports, removeCsvDuplicatesKeepLongest} = params;
  if (!fileEntry.scanResult || fileEntry.scanResult === 'scanning' || !fileEntry.scanResult.matches?.length) {
    return false;
  }

  const baseNumberRegex = buildBaseNumberRegex(prefix);
  const revision = extractRevision(fileEntry.name);
  const filePrefix = getFilePrefix(fileEntry.name);

  let rows = sortSingleFileCsvRows(
    fileEntry.scanResult.matches.map((matchText) => ({
      text: matchText,
      filePrefix,
      revision,
      comment: '',
    })),
    prefix,
  );

  if (removeCsvDuplicatesKeepLongest) {
    const deduplicated = new Map<
      string,
      {
        text: string;
        filePrefix: string;
        revision: string | null;
        comment: string;
      }
    >();

    for (const row of rows) {
      const baseNumber = (row.text.match(baseNumberRegex) || [row.text])[0];
      const key = `${row.filePrefix}${baseNumber}`;
      const existing = deduplicated.get(key);
      if (!existing || row.text.length > existing.text.length) {
        deduplicated.set(key, row);
      }
    }

    rows = Array.from(deduplicated.values());
  }

  let csv = `${WELDING_REPORT_HEADERS.join(',')}\n`;

  for (const row of rows) {
    const baseNumber = (row.text.match(baseNumberRegex) || [row.text])[0];
    const fullNumber = `${row.filePrefix}${baseNumber}`;

    let esliide = `"${fullNumber}"`;
    let sequenceNumber = '';
    const trailingNumberMatch = fullNumber.match(/^(.*?)(\d+)$/);
    if (trailingNumberMatch) {
      esliide = `"${trailingNumberMatch[1]}"`;
      sequenceNumber = `"${trailingNumberMatch[2]}"`;
    }

    const revisionValue = `"${includeRevisionInReports && row.revision ? row.revision : ''}"`;
    const comment = '""';

    csv += [
      esliide,
      sequenceNumber,
      revisionValue,
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
    ].join(',');
    csv += '\n';
  }

  downloadText(
    csv,
    `report_${prefix || 'W'}_${fileEntry.name.replace(/\.pdf$/i, '')}.csv`,
    'text/csv;charset=utf-8;',
    true,
  );

  return true;
}
