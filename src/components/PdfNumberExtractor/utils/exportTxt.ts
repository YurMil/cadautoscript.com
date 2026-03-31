import type {CapturedResult} from '../types';
import {downloadText} from './download';
import {buildBaseNumberRegex} from './regex';
import {sortUniqueExportValues} from './sorting';

export function exportTxt(results: CapturedResult[], prefix: string) {
  if (!results.length) {
    return false;
  }

  const baseNumberRegex = buildBaseNumberRegex(prefix);
  const unique = sortUniqueExportValues(
    Array.from(
      new Set(
        results.map((result) => {
          const baseNumber = (result.text.match(baseNumberRegex) || [result.text])[0];
          return `${result.filePrefix}${baseNumber}`;
        }),
      ),
    ),
  );

  downloadText(
    unique.join('\n'),
    'prefixed_numbers_unique.txt',
    'text/plain;charset=utf-8;',
    true,
  );

  return true;
}
