import type {CapturedResult} from '../types';
import {buildBaseNumberRegex, buildSearchRegex} from './regex';

export function sortCapturedResults(results: CapturedResult[], prefix: string) {
  const sortRegex = buildSearchRegex(prefix);
  return [...results].sort((left, right) => {
    const filePrefixComparison = left.filePrefix.localeCompare(right.filePrefix);
    if (filePrefixComparison !== 0) {
      return filePrefixComparison;
    }

    const leftMatch = left.text.match(sortRegex);
    const rightMatch = right.text.match(sortRegex);
    const leftNumber = leftMatch ? Number.parseInt(leftMatch[1], 10) : Number.MAX_SAFE_INTEGER;
    const rightNumber = rightMatch ? Number.parseInt(rightMatch[1], 10) : Number.MAX_SAFE_INTEGER;

    return leftNumber - rightNumber;
  });
}

export function sortUniqueExportValues(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function sortSingleFileCsvRows<T extends {filePrefix: string; text: string}>(
  rows: T[],
  prefix: string,
) {
  const baseNumberRegex = buildBaseNumberRegex(prefix);
  return [...rows].sort((left, right) => {
    const leftNumber = `${left.filePrefix}${(left.text.match(baseNumberRegex) || [left.text])[0]}`;
    const rightNumber = `${right.filePrefix}${(right.text.match(baseNumberRegex) || [right.text])[0]}`;
    return leftNumber.localeCompare(rightNumber, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
}
