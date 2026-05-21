#!/usr/bin/env node
/**
 * Generates downscaled WebP siblings for utility-card thumbnails.
 *
 * Source:  static/img/utilities/<slug>.png
 * Output:  static/img/utilities/cards/<slug>.webp        (128x128)
 *          static/img/utilities/cards/<slug>@2x.webp     (256x256)
 *
 * Original PNGs are NEVER modified or deleted. The <picture> markup
 * in src/pages/index.tsx falls back to the PNG when WebP is unavailable
 * (e.g. very old browsers).
 *
 * Idempotent — skips files whose WebP siblings are newer than the source.
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'static', 'img', 'utilities');
const OUT_DIR = path.join(SRC_DIR, 'cards');

const VARIANTS = [
  {suffix: '', size: 128},
  {suffix: '@2x', size: 256},
];
const QUALITY = 82;

async function isUpToDate(srcPath, outPath) {
  try {
    const [srcStat, outStat] = await Promise.all([
      fs.promises.stat(srcPath),
      fs.promises.stat(outPath),
    ]);
    return outStat.mtimeMs >= srcStat.mtimeMs;
  } catch {
    return false;
  }
}

async function convertOne(filename) {
  const srcPath = path.join(SRC_DIR, filename);
  const base = path.basename(filename, path.extname(filename));
  const results = [];

  for (const {suffix, size} of VARIANTS) {
    const outName = `${base}${suffix}.webp`;
    const outPath = path.join(OUT_DIR, outName);

    if (await isUpToDate(srcPath, outPath)) {
      results.push({outName, skipped: true});
      continue;
    }

    await sharp(srcPath)
      .resize(size, size, {fit: 'inside', withoutEnlargement: true})
      .webp({quality: QUALITY, effort: 6})
      .toFile(outPath);

    const {size: bytes} = await fs.promises.stat(outPath);
    results.push({outName, bytes, skipped: false});
  }

  return results;
}

async function main() {
  await fs.promises.mkdir(OUT_DIR, {recursive: true});

  const entries = await fs.promises.readdir(SRC_DIR);
  const pngs = entries.filter((name) => name.toLowerCase().endsWith('.png'));

  if (pngs.length === 0) {
    console.log('No PNG thumbnails found in', SRC_DIR);
    return;
  }

  let generated = 0;
  let skipped = 0;
  let totalOut = 0;

  for (const png of pngs) {
    const results = await convertOne(png);
    for (const r of results) {
      if (r.skipped) {
        skipped += 1;
      } else {
        generated += 1;
        totalOut += r.bytes;
      }
    }
  }

  console.log(
    `WebP thumbnails: ${generated} generated, ${skipped} up-to-date. ` +
      `Total written: ${(totalOut / 1024).toFixed(1)} KiB.`,
  );
}

main().catch((err) => {
  console.error('optimize-thumbnails failed:', err);
  process.exit(1);
});
