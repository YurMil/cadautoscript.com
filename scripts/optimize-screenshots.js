#!/usr/bin/env node
/**
 * Generates optimized WebP siblings for the utility screenshots that docs
 * pages embed inline.
 *
 * Source:  static/img/og/utilities/<slug>.png   (also used as og:image meta)
 * Output:  static/img/og/utilities/<slug>.webp   (max 1200px wide, quality 80)
 *
 * The docs MDX references the .webp (see docs/utilities/*.mdx), which is a
 * fraction of the PNG size, while the original PNG is kept untouched for
 * social-card og:image use. Never modifies or deletes the source PNG.
 *
 * Idempotent — skips files whose WebP sibling is newer than the source.
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'static', 'img', 'og', 'utilities');
const MAX_WIDTH = 1200;
const QUALITY = 80;

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
  const srcPath = path.join(DIR, filename);
  const base = path.basename(filename, path.extname(filename));
  const outPath = path.join(DIR, `${base}.webp`);

  if (await isUpToDate(srcPath, outPath)) {
    return {outName: `${base}.webp`, skipped: true};
  }

  await sharp(srcPath)
    .resize(MAX_WIDTH, null, {fit: 'inside', withoutEnlargement: true})
    .webp({quality: QUALITY, effort: 6})
    .toFile(outPath);

  const {size: bytes} = await fs.promises.stat(outPath);
  return {outName: `${base}.webp`, bytes};
}

async function main() {
  if (!fs.existsSync(DIR)) {
    console.log('No screenshot directory found, skipping.');
    return;
  }
  const pngs = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.png'));
  let converted = 0;
  let skipped = 0;
  for (const filename of pngs) {
    const result = await convertOne(filename);
    if (result.skipped) {
      skipped += 1;
    } else {
      converted += 1;
      console.log(`  ${result.outName} (${Math.round(result.bytes / 1024)}KB)`);
    }
  }
  console.log(`Screenshot WebP: ${converted} generated, ${skipped} up-to-date.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
