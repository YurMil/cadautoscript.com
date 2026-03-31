import {GRID_COLUMNS, GRID_ROWS} from '../constants';
import type {
  CapturedResultDraft,
  ExtractorSettings,
  PdfPageLike,
  PdfRuntime,
  PdfRuntimeConfig,
} from '../types';
import {isCanvasBlank} from './canvas';
import {cropCanvasRegion, getCaptureOrigin} from './capture';
import {extractRevision, getFilePrefix} from './fileNaming';
import {getPdfRuntime} from './pdfRuntime';
import {buildSearchRegex} from './regex';

function waitForPaint() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

export async function analyzePdfFile(params: {
  file: File;
  settings: ExtractorSettings;
  runtimeConfig: PdfRuntimeConfig;
  onStatus?: (statusText: string) => void;
}) {
  const {file, settings, runtimeConfig, onStatus} = params;
  const runtime = await getPdfRuntime(runtimeConfig);
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await runtime.getDocument({data}).promise;
  const results: CapturedResultDraft[] = [];
  const filePrefix = getFilePrefix(file.name);
  const revision = extractRevision(file.name);

  try {
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      onStatus?.(`Analyzing ${file.name} (page ${pageIndex} of ${pdf.numPages})...`);
      const page = await pdf.getPage(pageIndex);
      const pageResults = await analyzePage({
        page,
        pageNumber: pageIndex,
        filePrefix,
        revision,
        sourceFile: file,
        settings,
        runtime,
      });
      results.push(...pageResults);
      await waitForPaint();
    }
  } finally {
    await pdf.destroy?.();
  }

  return results;
}

async function analyzePage(params: {
  page: PdfPageLike;
  pageNumber: number;
  filePrefix: string;
  revision: string | null;
  sourceFile: File;
  settings: ExtractorSettings;
  runtime: PdfRuntime;
}) {
  const {page, pageNumber, filePrefix, revision, sourceFile, settings, runtime} = params;
  const textContent = await page.getTextContent();
  const searchRegex = buildSearchRegex(settings.prefix, true);
  const potentialMatches: typeof textContent.items = [];

  for (const item of textContent.items) {
    let match: RegExpExecArray | null;
    searchRegex.lastIndex = 0;
    while ((match = searchRegex.exec(item.str)) !== null) {
      if (match[1].length <= settings.maxLength) {
        potentialMatches.push({
          ...item,
          str: match[0],
        });
      }
    }
  }

  if (!potentialMatches.length) {
    return [];
  }

  const originalViewport = page.getViewport({scale: 1});
  const cellWidth = originalViewport.width / GRID_COLUMNS;
  const cellHeight = originalViewport.height / GRID_ROWS;

  const scale = 3;
  const viewport = page.getViewport({scale});
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = viewport.width;
  pageCanvas.height = viewport.height;

  const pageContext = pageCanvas.getContext('2d');
  if (!pageContext) {
    throw new Error('Could not initialize PDF render canvas.');
  }

  await page.render({
    canvasContext: pageContext,
    viewport,
  }).promise;

  const results: CapturedResultDraft[] = [];

  for (const item of potentialMatches) {
    const textX = item.transform[4];
    const textY = item.transform[5];

    if (
      textX < 0 ||
      textX > originalViewport.width ||
      textY < 0 ||
      textY > originalViewport.height
    ) {
      continue;
    }

    const columnIndex = Math.min(
      GRID_COLUMNS - 1,
      Math.floor(textX / cellWidth),
    );
    const rowIndex = Math.min(
      GRID_ROWS - 1,
      Math.floor((originalViewport.height - textY) / cellHeight),
    );
    const gridCoord = `${String.fromCharCode('A'.charCodeAt(0) + columnIndex)}${rowIndex + 1}`;

    const transformed = runtime.Util.transform(viewport.transform, item.transform);
    const canvasX = transformed[4];
    const canvasY = transformed[5];

    const {sx, sy} = getCaptureOrigin({
      canvasX,
      canvasY,
      captureWidth: settings.captureWidth,
      captureHeight: settings.captureHeight,
      captureX: settings.captureX,
      captureY: settings.captureY,
    });

    const screenshot = cropCanvasRegion({
      sourceCanvas: pageCanvas,
      sx,
      sy,
      captureWidth: settings.captureWidth,
      captureHeight: settings.captureHeight,
    });

    if (isCanvasBlank(screenshot)) {
      continue;
    }

    results.push({
      dataUrl: screenshot.toDataURL('image/png'),
      text: item.str,
      page: pageNumber,
      gridCoord,
      filePrefix,
      revision,
      sourceFileName: sourceFile.name,
      sourceFile,
    });
  }

  return results;
}
