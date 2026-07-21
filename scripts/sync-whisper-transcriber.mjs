// Publishes the Whisper Transcriber static artifact into
// static/utility-apps/whisper-transcriber/.
//
// The transcriber lives in its own repository (YurMil/ws-speech-text) because
// it carries Transformers.js and ONNX Runtime Web, which must never enter the
// Docusaurus bundle. This script takes a bundle produced there, audits it, and
// republishes it atomically.
//
// Usage:
//   npm run sync:whisper-transcriber
//       build the sibling checkout and publish it
//   WHISPER_TRANSCRIBER_DIR=/path/to/ws-speech-text npm run sync:whisper-transcriber
//       build a checkout somewhere else
//   npm run sync:whisper-transcriber -- --skip-build
//       reuse an existing dist/
//   npm run sync:whisper-transcriber -- --archive dist.zip --sha256 <hex>
//       publish a release archive, refusing it unless the checksum matches.
//       This is the path CI uses; see .github/workflows/sync-whisper-transcriber.yml.

import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SOURCE_DIR = path.resolve(
  SITE_ROOT,
  '..',
  'cadautoscript-apps',
  'ws-speech-text',
);
const SOURCE_DIR = path.resolve(process.env.WHISPER_TRANSCRIBER_DIR || DEFAULT_SOURCE_DIR);
const TARGET_DIR = path.join(SITE_ROOT, 'static', 'utility-apps', 'whisper-transcriber');
const STAGING_DIR = `${TARGET_DIR}.staging`;

const ALLOWED_EXTENSIONS = new Set(['.js', '.css', '.wasm', '.json', '.html', '.mjs']);
// Development leftovers that must never reach production.
const FORBIDDEN_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/,
  /\/@vite\//,
  /sourceMappingURL/i,
];

function readFlag(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const skipBuild = process.argv.includes('--skip-build');
const archivePath = readFlag('--archive');
const expectedSha256 = readFlag('--sha256');

let scratchDir = null;

function fail(message) {
  throw new Error(message);
}

function assertExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    fail(`Missing ${label}: ${targetPath}`);
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(' ')}`);
  }
}

/** Walks dist/, rejecting symlinks, traversal and unexpected file types. */
function collectFiles(rootDir) {
  const files = [];

  const walk = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, {withFileTypes: true})) {
      const absolute = path.join(currentDir, entry.name);
      const relative = path.relative(rootDir, absolute).split(path.sep).join('/');

      if (entry.isSymbolicLink()) {
        fail(`Refusing to publish symlink: ${relative}`);
      }
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        fail(`Refusing to publish path outside dist: ${relative}`);
      }
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!entry.isFile()) {
        fail(`Refusing to publish non-regular file: ${relative}`);
      }

      const extension = path.extname(entry.name).toLowerCase();
      // Source maps (.map) are excluded by omission — they must not ship.
      if (!ALLOWED_EXTENSIONS.has(extension)) {
        fail(`Unexpected file type in dist: ${relative}`);
      }
      files.push(relative);
    }
  };

  walk(rootDir);
  return files.sort();
}

/**
 * The entry document must reference only packaged, relative assets — an
 * absolute or remote script tag would silently break the same-origin iframe
 * contract the utility shell relies on.
 */
function auditEntryHtml(html, packagedAssets) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(html)) {
      fail(`Entry HTML contains a development reference (${pattern}).`);
    }
  }

  const referenced = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  for (const reference of referenced) {
    if (!reference.startsWith('./')) {
      fail(`Entry HTML must reference assets relatively, found: ${reference}`);
    }
    const normalized = reference.replace(/^\.\//, '');
    if (!packagedAssets.includes(normalized)) {
      fail(`Entry HTML references an unpackaged asset: ${reference}`);
    }
  }

  if (referenced.length === 0) {
    fail('Entry HTML references no assets — the build is probably empty.');
  }
}

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

/** vite.config.ts emits build-info.json alongside the bundle. */
function readBuildInfo(distDir) {
  const infoPath = path.join(distDir, 'build-info.json');
  assertExists(infoPath, 'ws-speech-text dist/build-info.json');
  const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  if (!info.buildId || !info.version || !info.buildTime) {
    fail('build-info.json is missing version, buildId or buildTime.');
  }
  if (info.buildId === 'unversioned') {
    fail('Refusing to publish an artifact built outside a git checkout.');
  }
  return info;
}

/**
 * Unpacks a release archive after verifying its checksum. The digest is checked
 * before anything is extracted, so a tampered or truncated download never
 * reaches the filesystem walk.
 */
function extractArchive(archive) {
  assertExists(archive, 'release archive');

  const actual = sha256(archive);
  if (!expectedSha256) {
    fail('--archive requires --sha256 <hex>; refusing to publish an unverified archive.');
  }
  if (actual !== expectedSha256.trim().toLowerCase()) {
    fail(`Archive checksum mismatch.\n  expected ${expectedSha256}\n  actual   ${actual}`);
  }
  console.log(`[whisper-transcriber] Archive checksum verified: ${actual}`);

  scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whisper-transcriber-'));
  // bsdtar reads zip archives and is present on Windows, macOS and the runners.
  run('tar', ['-xf', path.resolve(archive), '-C', scratchDir]);

  // Accept both a flat archive and one that wraps the files in dist/.
  const nested = path.join(scratchDir, 'dist');
  return fs.existsSync(path.join(nested, 'index.html')) ? nested : scratchDir;
}

/** Produces the directory whose contents should be published. */
function resolveDistDir() {
  if (archivePath) {
    return extractArchive(archivePath);
  }

  assertExists(SOURCE_DIR, 'ws-speech-text source directory');
  assertExists(path.join(SOURCE_DIR, 'package.json'), 'ws-speech-text package.json');

  if (skipBuild) {
    console.log('[whisper-transcriber] --skip-build: reusing existing dist/');
  } else {
    console.log(`[whisper-transcriber] Building bundle from ${SOURCE_DIR}`);
    run('pnpm', ['install', '--frozen-lockfile'], SOURCE_DIR);
    run('pnpm', ['build'], SOURCE_DIR);
  }

  return path.join(SOURCE_DIR, 'dist');
}

function main() {
  const distDir = resolveDistDir();
  assertExists(distDir, 'transcriber dist directory');
  assertExists(path.join(distDir, 'index.html'), 'transcriber dist/index.html');

  const files = collectFiles(distDir);
  const assets = files.filter((file) => file !== 'index.html');
  const entryHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  auditEntryHtml(entryHtml, assets);

  const {version, buildId, buildTime} = readBuildInfo(distDir);

  // Stage first, then swap, so a failed sync never leaves a half-published app.
  fs.rmSync(STAGING_DIR, {recursive: true, force: true});
  fs.mkdirSync(STAGING_DIR, {recursive: true});

  const checksums = {};
  let totalBytes = 0;
  for (const relative of assets) {
    const source = path.join(distDir, relative);
    const destination = path.join(STAGING_DIR, relative);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.copyFileSync(source, destination);
    checksums[relative] = sha256(source);
    totalBytes += fs.statSync(source).size;
  }

  // The utility shell always loads app.html (see UtilityShellPage). index.html
  // is published alongside it so the directory URL also serves the app —
  // trailing-slash hosting rewrites `/app.html` to `/app/`, which would break
  // the relative asset paths.
  for (const entryName of ['app.html', 'index.html']) {
    fs.writeFileSync(path.join(STAGING_DIR, entryName), entryHtml);
    checksums[entryName] = createHash('sha256').update(entryHtml).digest('hex');
    totalBytes += Buffer.byteLength(entryHtml);
  }

  const manifest = {
    name: 'whisper-transcriber',
    version,
    buildId,
    // Taken from the source build, not from now(), so republishing the same
    // artifact is a no-op and CI can tell whether anything actually changed.
    buildTime,
    entry: 'app.html',
    assets,
    checksums,
  };
  fs.writeFileSync(
    path.join(STAGING_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  fs.rmSync(TARGET_DIR, {recursive: true, force: true});
  fs.renameSync(STAGING_DIR, TARGET_DIR);

  console.log(
    `[whisper-transcriber] Published ${Object.keys(checksums).length} files to ${TARGET_DIR}`,
  );
  console.log(`[whisper-transcriber] version=${version} buildId=${buildId} bytes=${totalBytes}`);
}

try {
  main();
} catch (error) {
  fs.rmSync(STAGING_DIR, {recursive: true, force: true});
  console.error(`[whisper-transcriber] ${error.message}`);
  process.exitCode = 1;
} finally {
  if (scratchDir) {
    fs.rmSync(scratchDir, {recursive: true, force: true});
  }
}
