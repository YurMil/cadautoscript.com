#!/usr/bin/env node
/**
 * Generates malformed PDF fixtures for manually testing the PDF tools
 * (issue #100). See dev-plans/pdf-input-test-matrix.md for what each file is
 * meant to prove.
 *
 *   node scripts/make-pdf-fixtures.mjs [outputDir]
 *
 * Default output is .pdf-fixtures/ (gitignored) — the files are disposable and
 * some are deliberately large.
 */
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const outputDir = process.argv[2] ?? '.pdf-fixtures';

const MINIMAL_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj
trailer<</Root 1 0 R>>
%%EOF
`;

const fixtures = [
  {
    name: 'empty.pdf',
    describe: 'zero bytes',
    build: () => Buffer.alloc(0),
  },
  {
    name: 'not-a-pdf.pdf',
    describe: 'HTML error page saved with a .pdf extension',
    build: () =>
      Buffer.from('<!doctype html><title>404 Not Found</title><h1>Not Found</h1>\n'),
  },
  {
    name: 'truncated.pdf',
    describe: 'valid header, body cut off mid-object',
    build: () => Buffer.from(MINIMAL_PDF.slice(0, 60)),
  },
  {
    name: 'header-only.pdf',
    describe: 'signature present, nothing else',
    build: () => Buffer.from('%PDF-1.7\n'),
  },
  {
    name: 'garbage-body.pdf',
    describe: 'valid signature followed by random bytes',
    build: () =>
      Buffer.concat([Buffer.from('%PDF-1.5\n'), Buffer.from(Array.from({length: 4096}, (_, i) => (i * 7919) % 256))]),
  },
  {
    name: 'no-pages.pdf',
    describe: 'structurally parseable, Count 0',
    build: () =>
      Buffer.from(
        MINIMAL_PDF.replace('/Kids[3 0 R]/Count 1', '/Kids[]/Count 0'),
      ),
  },
];

const written = [];
await mkdir(outputDir, {recursive: true});
for (const fixture of fixtures) {
  const target = join(outputDir, fixture.name);
  const bytes = fixture.build();
  await writeFile(target, bytes);
  written.push(`${fixture.name.padEnd(20)} ${String(bytes.length).padStart(7)} B  ${fixture.describe}`);
}

console.log(`Wrote ${written.length} fixtures to ${outputDir}/\n`);
console.log(written.join('\n'));
console.log(
  '\nNot generated (produce manually):\n' +
    '  encrypted.pdf   password-protected — export one from any PDF editor\n' +
    '  oversized.pdf   >200 MB — concatenate a large file to exceed the size cap',
);
