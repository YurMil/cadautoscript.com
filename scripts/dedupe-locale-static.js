// Docusaurus copies the whole static/ folder into every locale build
// (build/ru/, build/ua/, ...), so each deployment carried six copies of the
// ~340 MB utility apps. This removes the locale copies; vercel.json rewrites
// /<locale>/<dir>/... back to the root copy. Rewrites only apply when no file
// matches, so generated locale pages under the same prefixes still win.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STATIC_DIR = path.join(ROOT, 'static');
const BUILD_DIR = path.join(ROOT, 'build');
const LOCALES = ['ru', 'ua', 'de', 'es', 'et'];
// Tiny, and utilities/ shares its prefix with generated /utilities/ pages;
// not worth a rewrite.
const KEEP = new Set(['utilities', '.nojekyll']);

function rewrittenEntries() {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const rule = (config.rewrites || []).find((r) => r.source.includes(':asset((?:'));
  if (!rule) throw new Error('vercel.json has no locale static rewrite with an :asset((?:...)) group');
  return new Set(rule.source.match(/:asset\(\(\?:([^)]+)\)/)[1].replace(/\\\./g, '.').split('|'));
}

function walk(dir, rel = '') {
  const out = [];
  for (const entry of fs.readdirSync(path.join(dir, rel), {withFileTypes: true})) {
    const child = path.join(rel, entry.name);
    if (entry.isDirectory()) out.push(...walk(dir, child));
    else out.push(child);
  }
  return out;
}

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
  for (const entry of fs.readdirSync(dir)) removeEmptyDirs(path.join(dir, entry));
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

const rewritten = rewrittenEntries();
const topLevel = fs.readdirSync(STATIC_DIR).filter((name) => !KEEP.has(name));
const uncovered = topLevel.filter((name) => !rewritten.has(name));
if (uncovered.length) {
  throw new Error(
    `static/ entries not covered by the locale rewrite in vercel.json: ${uncovered.join(', ')}. ` +
      'Add them to the :asset((?:...)) group or to KEEP in scripts/dedupe-locale-static.js.',
  );
}

let removed = 0;
let bytes = 0;
for (const name of topLevel) {
  const src = path.join(STATIC_DIR, name);
  const files = fs.statSync(src).isDirectory() ? walk(src).map((f) => path.join(name, f)) : [name];
  for (const locale of LOCALES) {
    for (const rel of files) {
      const copy = path.join(BUILD_DIR, locale, rel);
      if (!fs.existsSync(copy)) continue;
      const {size} = fs.statSync(copy);
      if (size !== fs.statSync(path.join(STATIC_DIR, rel)).size) continue;
      fs.unlinkSync(copy);
      removed += 1;
      bytes += size;
    }
    removeEmptyDirs(path.join(BUILD_DIR, locale, name));
  }
}

console.log(`Removed ${removed} duplicated static files from locale builds (${(bytes / 1024 / 1024).toFixed(1)} MB).`);
