import {getRevisionGroupingKey, getRevisionNumber} from './fileNaming';

type FileLike = {
  file: File;
  name: string;
};

export function getFilesToProcess<T extends FileLike>(entries: T[], latestOnly: boolean) {
  if (!latestOnly) {
    return entries.map((entry) => entry.file);
  }

  const fileGroups = new Map<string, {file: File; revisionNumber: number}>();

  for (const entry of entries) {
    const groupKey = getRevisionGroupingKey(entry.name);
    const revisionNumber = getRevisionNumber(entry.name);
    const current = fileGroups.get(groupKey);

    if (!current || revisionNumber > current.revisionNumber) {
      fileGroups.set(groupKey, {
        file: entry.file,
        revisionNumber,
      });
    }
  }

  return Array.from(fileGroups.values()).map((group) => group.file);
}

export function getIncludedFileNameSet<T extends FileLike>(entries: T[], latestOnly: boolean) {
  return new Set(getFilesToProcess(entries, latestOnly).map((file) => file.name));
}
