import type {PdfRuntimeConfig, ScanResult} from '../types';
import {getFilePrefix} from './fileNaming';
import {getPdfRuntime} from './pdfRuntime';
import {buildBaseNumberRegex, buildSearchRegex} from './regex';

export async function quickScanFile(params: {
  file: File;
  prefix: string;
  maxLength: number;
  runtimeConfig: PdfRuntimeConfig;
}): Promise<ScanResult> {
  const {file, prefix, maxLength, runtimeConfig} = params;
  const searchRegex = buildSearchRegex(prefix, true);
  const baseNumberRegex = buildBaseNumberRegex(prefix);
  const matches: string[] = [];

  try {
    const runtime = await getPdfRuntime(runtimeConfig);
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await runtime.getDocument({data}).promise;

    try {
      for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
        const page = await pdf.getPage(pageIndex);
        const textContent = await page.getTextContent();

        for (const item of textContent.items) {
          let match: RegExpExecArray | null;
          searchRegex.lastIndex = 0;
          while ((match = searchRegex.exec(item.str)) !== null) {
            if (match[1].length <= maxLength) {
              matches.push(match[0]);
            }
          }
        }
      }
    } finally {
      await pdf.destroy?.();
    }

    const filePrefix = getFilePrefix(file.name);
    const uniqueNumbers = new Set(
      matches.map((text) => {
        const baseNumber = (text.match(baseNumberRegex) || [text])[0];
        return `${filePrefix}${baseNumber}`;
      }),
    );

    return {
      total: matches.length,
      unique: uniqueNumbers.size,
      matches,
    };
  } catch (error) {
    console.error(`Quick scan error for ${file.name}:`, error);
    return {
      total: 'Error',
      unique: '',
    };
  }
}
