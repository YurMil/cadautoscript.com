import type {CapturedResult} from '../types';
import {buildBaseNumberRegex} from './regex';

export async function exportPdfReport(params: {
  results: CapturedResult[];
  prefix: string;
  includeRevisionInReports: boolean;
  captureWidth: number;
  captureHeight: number;
}) {
  const {results, prefix, includeRevisionInReports, captureWidth, captureHeight} = params;
  if (!results.length) {
    return false;
  }

  const {jsPDF} = await import('jspdf');
  const baseNumberRegex = buildBaseNumberRegex(prefix);
  const doc = new jsPDF({
    orientation: 'portrait',
    format: 'a4',
  });

  const margin = 10;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const imageWidth = 45;
  const imageHeight = (imageWidth / captureWidth) * captureHeight;
  let cursorY = margin + 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(16);
  doc.text('PDF Analysis Report', pageWidth / 2, cursorY, {align: 'center'});
  cursorY += 15;

  for (const [index, result] of results.entries()) {
    const baseNumber = (result.text.match(baseNumberRegex) || [result.text])[0];
    let label = `${result.filePrefix}${baseNumber} ( page ${result.page} )`;
    if (includeRevisionInReports && result.revision) {
      label += ` ${result.revision}`;
    }

    const commentLines = doc.splitTextToSize(
      result.comment || '',
      pageWidth - margin * 2 - imageWidth - 25,
    );
    const textHeight = (commentLines.length + 2) * 4;
    const rowHeight = Math.max(imageHeight, textHeight) + 10;

    if (cursorY + rowHeight > pageHeight - margin) {
      doc.addPage();
      doc.setFont('Helvetica', 'normal');
      cursorY = margin;
    }

    doc.setDrawColor(150, 150, 150);
    doc.rect(margin, cursorY, pageWidth - margin * 2, rowHeight);

    doc.setFontSize(10);
    doc.text(`${index + 1}.`, margin + 3, cursorY + rowHeight / 2 + 3);

    const imageX = margin + 10;
    const imageY = cursorY + (rowHeight - imageHeight) / 2;
    doc.addImage(result.dataUrl, 'PNG', imageX, imageY, imageWidth, imageHeight);

    let textY = cursorY + 7;
    doc.setFontSize(10);
    doc.text(label, margin + 20 + imageWidth, textY);
    textY += 6;
    doc.setFontSize(9);
    doc.text(commentLines, margin + 20 + imageWidth, textY);

    cursorY += rowHeight;
  }

  const totalPages = doc.getNumberOfPages();
  const footerText = 'PDF Number Extractor';

  for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
    doc.setPage(pageIndex);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(footerText, margin, pageHeight - margin / 2);
    const pageText = `Page ${pageIndex} of ${totalPages}`;
    const textWidth =
      (doc.getStringUnitWidth(pageText) * doc.getFontSize()) /
      doc.internal.scaleFactor;
    doc.text(pageText, pageWidth - margin - textWidth, pageHeight - margin / 2);
  }

  doc.save('pdf_analysis_report.pdf');
  return true;
}
