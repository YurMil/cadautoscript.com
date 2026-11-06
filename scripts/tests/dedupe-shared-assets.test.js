const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {after, test} = require('node:test');

const {analyze, describe, fixRewrites, removeDuplicates, LOCALE_PREFIX} = require('../dedupe-shared-assets');

// Over the script's 1 MB threshold, so the files count as shared assets.
const PAYLOAD = Buffer.alloc(1024 * 1024 + 1, 7);
const OTHER = Buffer.alloc(1024 * 1024 + 1, 9);

const LOCALE_RULE = {source: '/:locale(ru|ua|de|es|et)/:asset((?:fonts|img)(?:/.*)?)', destination: '/:asset'};
const UNRELATED = {source: '/old', destination: '/new'};

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) fs.rmSync(dir, {recursive: true, force: true});
});

function tree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dedupe-assets-'));
  tempDirs.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), {recursive: true});
    fs.writeFileSync(abs, content);
  }
  return dir;
}

function rule(from, to) {
  return {source: `${LOCALE_PREFIX}/${from}`, destination: `/${to}`};
}

const STATIC = {
  'utility-apps/a/assets/rt.wasm': PAYLOAD,
  'utility-apps/b/assets/rt.wasm': PAYLOAD,
  'utility-apps/b/rt.wasm': PAYLOAD,
  'utility-apps/c/assets/other.wasm': OTHER,
};
const RULE_B = rule('utility-apps/b/assets/rt.wasm', 'utility-apps/a/assets/rt.wasm');
const RULE_B_ROOT = rule('utility-apps/b/rt.wasm', 'utility-apps/a/assets/rt.wasm');

test('reports missing, stale and misordered rules together', () => {
  const staticDir = tree(STATIC);
  const stale = rule('utility-apps/gone/rt.wasm', 'utility-apps/a/assets/rt.wasm');
  const analysis = analyze(staticDir, [UNRELATED, stale, LOCALE_RULE, RULE_B]);

  assert.deepEqual(analysis.missing.map((r) => r.source), [RULE_B_ROOT.source]);
  assert.deepEqual(analysis.misordered.map((r) => r.source), [RULE_B.source]);
  assert.deepEqual(analysis.stale, [stale]);
  assert.equal(describe(analysis).length, 3);
});

test('fixRewrites repairs the config and leaves other rules in place', () => {
  const staticDir = tree(STATIC);
  const stale = rule('utility-apps/gone/rt.wasm', 'utility-apps/a/assets/rt.wasm');
  const before = [UNRELATED, RULE_B, stale, LOCALE_RULE];

  const fixed = fixRewrites(before, analyze(staticDir, before));

  // New rule sits next to the existing one for the same copy, above the locale rule.
  assert.deepEqual(fixed, [UNRELATED, RULE_B, RULE_B_ROOT, LOCALE_RULE]);
  assert.deepEqual(describe(analyze(staticDir, fixed)), []);
  // Idempotent.
  assert.deepEqual(fixRewrites(fixed, analyze(staticDir, fixed)), fixed);
});

test('fixRewrites moves misordered rules above the locale rule', () => {
  const staticDir = tree(STATIC);
  const before = [LOCALE_RULE, RULE_B, RULE_B_ROOT];
  const fixed = fixRewrites(before, analyze(staticDir, before));

  assert.ok(fixed.indexOf(LOCALE_RULE) > fixed.findIndex((r) => r.source === RULE_B.source));
  assert.deepEqual(describe(analyze(staticDir, fixed)), []);
});

test('removeDuplicates keeps a copy whose rewrite is missing', () => {
  const staticDir = tree(STATIC);
  const buildDir = tree(STATIC);
  const analysis = analyze(staticDir, [RULE_B, LOCALE_RULE]);

  const result = removeDuplicates(buildDir, staticDir, analysis);

  assert.deepEqual({removed: result.removed, kept: result.kept}, {removed: 1, kept: 1});
  assert.equal(fs.existsSync(path.join(buildDir, 'utility-apps/b/assets/rt.wasm')), false);
  assert.equal(fs.existsSync(path.join(buildDir, 'utility-apps/b/rt.wasm')), true);
  // The canonical copy and unrelated files are never touched.
  assert.equal(fs.existsSync(path.join(buildDir, 'utility-apps/a/assets/rt.wasm')), true);
  assert.equal(fs.existsSync(path.join(buildDir, 'utility-apps/c/assets/other.wasm')), true);
});

test('a rule shadowed by an earlier stale rule for the same source keeps its copy', () => {
  // The canonical copy moved from b/assets to a/assets; the old rule for b/rt.wasm
  // still comes first and would send it to a copy that is about to be deleted.
  const staticDir = tree(STATIC);
  const buildDir = tree(STATIC);
  const oldRule = rule('utility-apps/b/rt.wasm', 'utility-apps/b/assets/rt.wasm');
  const rewrites = [oldRule, RULE_B_ROOT, RULE_B, LOCALE_RULE];
  const analysis = analyze(staticDir, rewrites);

  assert.deepEqual(analysis.stale, [oldRule]);
  assert.ok(analysis.unsafe.has(path.join('utility-apps', 'b', 'rt.wasm')));

  removeDuplicates(buildDir, staticDir, analysis);
  assert.equal(fs.existsSync(path.join(buildDir, 'utility-apps/b/rt.wasm')), true);

  // --fix drops the shadowing rule, after which the copy is safe to delete.
  const fixed = fixRewrites(rewrites, analysis);
  assert.deepEqual(fixed, [RULE_B_ROOT, RULE_B, LOCALE_RULE]);
  assert.equal(analyze(staticDir, fixed).unsafe.size, 0);
});
