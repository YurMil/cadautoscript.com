// Several pre-built utility apps bundle the same WebAssembly runtime (two ship
// the 48 MB OpenCascade build, seven ship replicad), so every deployment
// carried ~100 MB of byte-identical files. This keeps one copy per distinct
// payload and deletes the rest; vercel.json rewrites the deleted URLs to the
// copy that stays. Rewrites only apply when no file matches, so nothing else
// under these prefixes changes.
//
// Runs after dedupe-locale-static.js, i.e. on a build/ whose locale trees no
// longer hold static files. As with that script, the deleted URLs resolve
// through vercel.json and therefore 404 under `docusaurus serve`.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
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

// The URL a build/ file is served at, with forward slashes on every platform.
function urlFor(relPath) {
  return `/${relPath.split(path.sep).join('/')}`;
}

function buildPath(url) {
  return path.join(BUILD_DIR, ...url.replace(/^\//, '').split('/'));
}

function key(rule) {
  return `${rule.source}\n${rule.destination}`;
}

function duplicateGroups() {
  const byHash = new Map();
  for (const scanDir of SCAN_DIRS) {
    const base = path.join(BUILD_DIR, scanDir);
    if (!fs.existsSync(base)) continue;
    for (const file of walk(base)) {
      if (file.endsWith('.html')) continue;
      const abs = path.join(base, file);
      const {size} = fs.statSync(abs);
      if (size < MIN_BYTES) continue;
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

const missing = expected.filter((rule) => !ruleIndex.has(key(rule)));
if (missing.length) {
  throw new Error(
    `vercel.json is missing a rewrite for ${missing.length} duplicated asset(s). Add, before the locale ` +
      `static rewrite:\n${JSON.stringify(missing, null, 2)}`,
  );
}

// A rule left behind after an app is rebuilt would silently stop matching, so
// treat leftovers as an error rather than letting the config drift. A rule this
// script already applied is not one of them: its copy is gone precisely because
// the rule exists, which is also what makes a second run a no-op.
const expectedKeys = new Set(expected.map(key));
const stale = rewrites.filter((rule) => {
  if (expectedKeys.has(key(rule))) return false;
  if (!SCAN_DIRS.some((dir) => rule.source.startsWith(`${LOCALE_PREFIX}/${dir}/`))) return false;
  const duplicate = rule.source.slice(LOCALE_PREFIX.length);
  return fs.existsSync(buildPath(duplicate)) || !fs.existsSync(buildPath(rule.destination));
});
if (stale.length) {
  throw new Error(
    `vercel.json has ${stale.length} shared-asset rewrite(s) that no longer point at a duplicate. ` +
      `Remove them:\n${JSON.stringify(stale, null, 2)}`,
  );
}

// First match wins, so a rule placed after the locale rewrite would never be
// reached for a localized URL.
const misordered = expected.filter((rule) => localeRuleIndex !== -1 && ruleIndex.get(key(rule)) > localeRuleIndex);
if (misordered.length) {
  throw new Error(
    `vercel.json lists ${misordered.length} shared-asset rewrite(s) after the locale static rewrite, which ` +
      `matches first. Move them above it:\n${JSON.stringify(misordered, null, 2)}`,
  );
}

let removed = 0;
let bytes = 0;
for (const [, ...duplicates] of groups) {
  for (const duplicate of duplicates) {
    const abs = path.join(BUILD_DIR, duplicate);
    bytes += fs.statSync(abs).size;
    fs.unlinkSync(abs);
    removed += 1;
  }
}

console.log(
  `Removed ${removed} duplicated app assets shared between utility apps (${(bytes / 1024 / 1024).toFixed(1)} MB).`,
);
