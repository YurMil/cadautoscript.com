export function downloadBlob(blob: Blob, fileName: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function downloadText(
  content: string,
  fileName: string,
  mimeType: string,
  withBom = false,
) {
  const bom = '\uFEFF';
  const blob = new Blob(withBom ? [bom, content] : [content], {
    type: mimeType,
  });
  downloadBlob(blob, fileName);
}
