export function getFilePrefix(fileName: string) {
  return fileName.toUpperCase().startsWith('EST-')
    ? fileName.substring(4, 10)
    : fileName.substring(0, 10);
}

export function extractRevision(fileName: string) {
  const revisionMatch = fileName.match(/_r?(\d+)/i);
  return revisionMatch ? `r${revisionMatch[1]}` : null;
}

export function getRevisionGroupingKey(fileName: string) {
  const revisionMatch = fileName.match(/(.+?)(?:_r?(\d+))(.*)$/i);
  if (!revisionMatch) {
    return fileName;
  }
  return `${revisionMatch[1] ?? ''}${revisionMatch[3] ?? ''}`;
}

export function getRevisionNumber(fileName: string) {
  const revisionMatch = fileName.match(/(.+?)(?:_r?(\d+))(.*)$/i);
  if (!revisionMatch) {
    return -1;
  }
  return Number.parseInt(revisionMatch[2] ?? '-1', 10);
}

export function getDefaultDrawingName(fileName: string) {
  return fileName.replace(/\.pdf$/i, '');
}
