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
//
// Modes:
//   (none)   postbuild. Deletes a duplicate only when its rewrite is in place.
//            Config drift is reported but never fails the build: app bundles
//            are pushed to main by sync bots without a PR, and a missing rule
//            used to block every production deploy. Without its rule a copy
//            simply stays in the build, which costs bytes, not a broken URL.
//   --check  CI. Validates vercel.json against static/ and exits non-zero on
//            any drift. Needs no build.
//   --fix    Rewrites vercel.json so the check passes: adds missing rules,
//            drops stale ones, moves misordered ones above the locale rule.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STATIC_DIR = path.join(ROOT, 'static');
const BUILD_DIR = path.join(ROOT, 'build');
const VERCEL_JSON = path.join(ROOT, 'vercel.json');
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

function isSharedAssetRule(rule) {
  return SCAN_DIRS.some((dir) => rule.source.startsWith(`${LOCALE_PREFIX}/${dir}/`));
}

function isLocaleRule(rule) {
  return rule.source.includes(':asset((?:');
}

function duplicateGroups(staticDir) {
  const byHash = new Map();
  for (const scanDir of SCAN_DIRS) {
    const base = path.join(staticDir, scanDir);
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

/**
 * Compares the rewrites with what static/ needs. Every problem is reported at
 * once: a renamed asset makes one rule missing and another stale, and a build
 * takes minutes to get here.
 */
function analyze(staticDir, rewrites) {
  const localeRuleIndex = rewrites.findIndex(isLocaleRule);
  const ruleIndex = new Map(rewrites.map((rule, i) => [key(rule), i]));

  const groups = duplicateGroups(staticDir);
  const expected = [];
  for (const [canonical, ...duplicates] of groups) {
    for (const duplicate of duplicates) {
      expected.push({...expectedRule(duplicate, canonical), duplicate});
    }
  }

  const missing = expected.filter((rule) => !ruleIndex.has(key(rule)));
  // First match wins, so a rule placed after the locale rewrite would never be
  // reached for a localized URL.
  const misordered = expected.filter(
    (rule) => localeRuleIndex !== -1 && ruleIndex.get(key(rule)) > localeRuleIndex,
  );
  // A rule left behind after an app is rebuilt points at nothing and would
  // silently stop matching, whether its copy stopped being identical or the
  // rebuild renamed it away.
  const expectedKeys = new Set(expected.map(key));
  const stale = rewrites.filter((rule) => isSharedAssetRule(rule) && !expectedKeys.has(key(rule)));

  const unsafe = new Set([...missing, ...misordered].map((rule) => rule.duplicate));
  return {groups, expected, missing, misordered, stale, unsafe};
}

function toRule({source, destination}) {
  return {source, destination};
}

function describe({missing, misordered, stale}) {
  const problems = [];
  if (missing.length) {
    problems.push(
      `vercel.json is missing a rewrite for ${missing.length} duplicated asset(s):\n` +
        JSON.stringify(missing.map(toRule), null, 2),
    );
  }
  if (misordered.length) {
    problems.push(
      `vercel.json lists ${misordered.length} shared-asset rewrite(s) after the locale static rewrite, ` +
        `which matches first:\n${JSON.stringify(misordered.map(toRule), null, 2)}`,
    );
  }
  if (stale.length) {
    problems.push(
      `vercel.json has ${stale.length} shared-asset rewrite(s) that no longer point at a duplicate:\n` +
        JSON.stringify(stale, null, 2),
    );
  }
  return problems;
}

/**
 * Returns the rewrites with the drift repaired. Everything that is not a
 * shared-asset rule keeps its place. A new rule goes next to the rules that
 * already rewrite to the same copy, or else just above the locale rule, so the
 * file stays grouped by runtime and a hand-made fix lands in the same spot.
 */
function fixRewrites(rewrites, analysis) {
  const misorderedKeys = new Set(analysis.misordered.map(key));
  const staleKeys = new Set(analysis.stale.map(key));
  const result = rewrites.filter((rule) => !staleKeys.has(key(rule)) && !misorderedKeys.has(key(rule)));

  for (const rule of [...analysis.misordered, ...analysis.missing].map(toRule)) {
    if (result.some((existing) => key(existing) === key(rule))) continue;
    const localeIndex = result.findIndex(isLocaleRule);
    const limit = localeIndex === -1 ? result.length : localeIndex;
    let insertAt = limit;
    for (let i = 0; i < limit; i += 1) {
      if (isSharedAssetRule(result[i]) && result[i].destination === rule.destination) insertAt = i + 1;
    }
    result.splice(insertAt, 0, rule);
  }
  return result;
}

/** Deletes duplicate copies from build/, skipping any whose rewrite is not in place. */
function removeDuplicates(buildDir, staticDir, analysis) {
  let removed = 0;
  let bytes = 0;
  let kept = 0;
  for (const [, ...duplicates] of analysis.groups) {
    for (const duplicate of duplicates) {
      if (analysis.unsafe.has(duplicate)) {
        kept += 1;
        continue;
      }
      const copy = path.join(buildDir, duplicate);
      // Absent on a second run over the same build; a different size means the
      // build carries something other than the static file, so leave it alone
      // and let the filesystem keep winning over the rewrite.
      if (!fs.existsSync(copy)) continue;
      const {size} = fs.statSync(copy);
      if (size !== fs.statSync(path.join(staticDir, duplicate)).size) continue;
      fs.unlinkSync(copy);
      removed += 1;
      bytes += size;
    }
  }
  return {removed, bytes, kept};
}

function readVercelConfig() {
  return JSON.parse(fs.readFileSync(VERCEL_JSON, 'utf8'));
}

function main(argv) {
  const mode = argv.includes('--fix') ? 'fix' : argv.includes('--check') ? 'check' : 'build';
  const config = readVercelConfig();
  const analysis = analyze(STATIC_DIR, config.rewrites || []);
  const problems = describe(analysis);

  if (mode === 'fix') {
    if (!problems.length) {
      console.log('vercel.json shared-asset rewrites are up to date.');
      return 0;
    }
    config.rewrites = fixRewrites(config.rewrites || [], analysis);
    fs.writeFileSync(VERCEL_JSON, `${JSON.stringify(config, null, 2)}\n`);
    console.log(`Updated vercel.json:\n\n${problems.join('\n\n')}`);
    return 0;
  }

  if (mode === 'check') {
    if (!problems.length) {
      console.log(`vercel.json shared-asset rewrites match static/ (${analysis.expected.length} rule(s)).`);
      return 0;
    }
    console.error(`${problems.join('\n\n')}\n\nRun \`pnpm fix:assets\` and commit vercel.json.`);
    return 1;
  }

  if (problems.length) {
    console.warn(
      `WARNING: shared-asset rewrites are out of date; affected copies stay in the build.\n` +
        `${problems.join('\n\n')}\n\nRun \`pnpm fix:assets\` and commit vercel.json.`,
    );
  }
  const {removed, bytes, kept} = removeDuplicates(BUILD_DIR, STATIC_DIR, analysis);
  console.log(
    `Removed ${removed} duplicated app assets shared between utility apps (${(bytes / 1024 / 1024).toFixed(1)} MB)` +
      (kept ? `; kept ${kept} without a rewrite.` : '.'),
  );
  return 0;
}

module.exports = {analyze, describe, fixRewrites, removeDuplicates, LOCALE_PREFIX};

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
