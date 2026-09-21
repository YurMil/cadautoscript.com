// Several pre-built utility apps bundle the same WebAssembly runtime (two ship
// the 48 MB OpenCascade build, seven ship replicad), so every deployment
// carried ~100 MB of byte-identical files. This keeps one copy per distinct
// payload and deletes the rest; vercel.json rewrites the deleted URLs to the
// copy that stays. Rewrites only apply when no file matches, so nothing else
// under these prefixes changes.
//
// The rules are derived from static/, which Docusaurus copies verbatim and
// which this script never touches, so validating the config stays a pure
// function of the committed tree however often the script runs. Only the
// deletions look at build/, and they run after dedupe-locale-static.js. As
// with that script, the deleted URLs resolve through vercel.json and therefore
// 404 under `docusaurus serve`.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STATIC_DIR = path.join(ROOT, 'static');
const BUILD_DIR = path.join(ROOT, 'build');
// The pre-built app bundles; generated pages live elsewhere and must never be
// collapsed, since identical HTML at two URLs is two real pages.
const SCAN_DIRS = ['utility-apps', 'mini-games'];
const LOCALE_PREFIX = '/:locale(ru|ua|de|es|et)?';
// Below this a rewrite costs more in config than it saves in bytes.
const MIN_BYTES = 1024 * 1024;

function walk(dir, rel = '') {
  const out = [];
  for (const entry of fs.readdirSync(path.join(dir, rel), {withFileTypes: true})) {
    const child = path.join(rel, entry.name);
    if (entry.isDirectory()) out.push(...walk(dir, child));
    else out.push(child);
  }
  return out;
}

// The URL a static/ file is served at, with forward slashes on every platform.
function urlFor(relPath) {
  return `/${relPath.split(path.sep).join('/')}`;
}

function key(rule) {
  return `${rule.source}\n${rule.destination}`;
}

function duplicateGroups() {
  const byHash = new Map();
  for (const scanDir of SCAN_DIRS) {
    const base = path.join(STATIC_DIR, scanDir);
    if (!fs.existsSync(base)) continue;
    for (const file of walk(base)) {
      if (file.endsWith('.html')) continue;
      const abs = path.join(base, file);
      if (fs.statSync(abs).size < MIN_BYTES) continue;
      const hash = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
      const group = byHash.get(hash) || [];
      group.push(path.join(scanDir, file));
      byHash.set(hash, group);
    }
  }
  // Sort so the kept copy is the same on every machine and every run.
  return [...byHash.values()].filter((g) => g.length > 1).map((g) => g.sort());
}

// Each removed copy needs exactly this rule, and the locale prefix keeps the
// localized URLs working without relying on one rewrite feeding another.
function expectedRule(duplicate, canonical) {
  return {source: `${LOCALE_PREFIX}${urlFor(duplicate)}`, destination: urlFor(canonical)};
}

const rewrites = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).rewrites || [];
const localeRuleIndex = rewrites.findIndex((r) => r.source.includes(':asset((?:'));
const ruleIndex = new Map(rewrites.map((rule, i) => [key(rule), i]));

const groups = duplicateGroups();
const expected = [];
for (const [canonical, ...duplicates] of groups) {
  for (const duplicate of duplicates) expected.push(expectedRule(duplicate, canonical));
}

// Report every problem at once: a renamed asset makes one rule missing and
// another stale, and this build takes minutes to reach here.
const problems = [];

const missing = expected.filter((rule) => !ruleIndex.has(key(rule)));
if (missing.length) {
  problems.push(
    `vercel.json is missing a rewrite for ${missing.length} duplicated asset(s). Add, before the locale ` +
      `static rewrite:\n${JSON.stringify(missing, null, 2)}`,
  );
}

// A rule left behind after an app is rebuilt points at nothing and would
// silently stop matching, whether its copy stopped being identical or the
// rebuild renamed it away. Treat leftovers as an error rather than letting the
// config drift.
const expectedKeys = new Set(expected.map(key));
const stale = rewrites.filter(
  (rule) =>
    SCAN_DIRS.some((dir) => rule.source.startsWith(`${LOCALE_PREFIX}/${dir}/`)) && !expectedKeys.has(key(rule)),
);
if (stale.length) {
  problems.push(
    `vercel.json has ${stale.length} shared-asset rewrite(s) that no longer point at a duplicate. ` +
      `Remove them:\n${JSON.stringify(stale, null, 2)}`,
  );
}

// First match wins, so a rule placed after the locale rewrite would never be
// reached for a localized URL.
const misordered = expected.filter((rule) => localeRuleIndex !== -1 && ruleIndex.get(key(rule)) > localeRuleIndex);
if (misordered.length) {
  problems.push(
    `vercel.json lists ${misordered.length} shared-asset rewrite(s) after the locale static rewrite, which ` +
      `matches first. Move them above it:\n${JSON.stringify(misordered, null, 2)}`,
  );
}

if (problems.length) throw new Error(problems.join('\n\n'));

let removed = 0;
let bytes = 0;
for (const [, ...duplicates] of groups) {
  for (const duplicate of duplicates) {
    const copy = path.join(BUILD_DIR, duplicate);
    // Absent on a second run over the same build; a different size means the
    // build carries something other than the static file, so leave it alone and
    // let the filesystem keep winning over the rewrite.
    if (!fs.existsSync(copy)) continue;
    const {size} = fs.statSync(copy);
    if (size !== fs.statSync(path.join(STATIC_DIR, duplicate)).size) continue;
    fs.unlinkSync(copy);
    removed += 1;
    bytes += size;
  }
}

console.log(
  `Removed ${removed} duplicated app assets shared between utility apps (${(bytes / 1024 / 1024).toFixed(1)} MB).`,
);
