// Publishes the Heat Input Master static artifact into
// static/utility-apps/heat-input-master/.
//
// Heat Input Master lives in its own repository
// (YurMil/Heat-Input-Master, working copy cadautoscript-apps/Heat-Input-Master)
// because it carries jsPDF, html2canvas and the XLSX writer, which must never
// enter the Docusaurus bundle. This script takes a bundle produced there,
// audits it, and republishes it atomically.
//
// Usage:
//   npm run sync:heat-input-master
//       build the sibling checkout and publish it
//   HEAT_INPUT_MASTER_DIR=/path/to/Heat-Input-Master npm run sync:heat-input-master
//       build a checkout somewhere else
//   npm run sync:heat-input-master -- --skip-build
//       reuse an existing dist/
//   npm run sync:heat-input-master -- --archive dist.zip --sha256 <hex>
//       publish a release archive, refusing it unless the checksum matches.
//       This is the path CI uses; see .github/workflows/sync-heat-input-master.yml.

import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import zlib from 'node:zlib';

const SLUG = 'heat-input-master';
const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SOURCE_DIR = path.resolve(
  SITE_ROOT,
  '..',
  'cadautoscript-apps',
  'Heat-Input-Master',
);
const SOURCE_DIR = path.resolve(process.env.HEAT_INPUT_MASTER_DIR || DEFAULT_SOURCE_DIR);
const TARGET_DIR = path.join(SITE_ROOT, 'static', 'utility-apps', SLUG);
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
  assertExists(infoPath, 'Heat-Input-Master dist/build-info.json');
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
  console.log(`[${SLUG}] Archive checksum verified: ${actual}`);

  scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), `${SLUG}-`));
  unzipTo(path.resolve(archive), scratchDir);

  // Accept both a flat archive and one that wraps the files in dist/.
  const nested = path.join(scratchDir, 'dist');
  return fs.existsSync(path.join(nested, 'index.html')) ? nested : scratchDir;
}

/**
 * Extracts a zip using Node alone.
 *
 * This used to shell out to `tar -xf`, which works on Windows and macOS —
 * where `tar` is bsdtar and reads zip — and fails on Linux, where it is GNU tar
 * and does not. Nothing about "call the system tar" was ever portable; it just
 * happened to match the machine it was written on. Doing it here removes the
 * dependency on which archiver a host has installed, and lets entry paths be
 * rejected before anything is written rather than after.
 *
 * Deliberately minimal: store and deflate, no zip64, no encryption. The
 * archives come from our own release workflow, and anything else should be
 * refused loudly rather than half-understood.
 */
function unzipTo(archiveFile, targetDir) {
  const buffer = fs.readFileSync(archiveFile);

  const EOCD_SIGNATURE = 0x06054b50;
  const CENTRAL_SIGNATURE = 0x02014b50;

  // The end-of-central-directory record sits at the tail, after an optional
  // comment, so it has to be found by scanning backwards.
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0 && i >= buffer.length - 66_000; i -= 1) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) fail('Archive is not a zip file (no end-of-central-directory record).');

  const entryCount = buffer.readUInt16LE(eocd + 10);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (entryCount === 0xffff || centralOffset === 0xffffffff) {
    fail('Zip64 archives are not supported.');
  }

  let cursor = centralOffset;
  let written = 0;

  for (let entry = 0; entry < entryCount; entry += 1) {
    if (buffer.readUInt32LE(cursor) !== CENTRAL_SIGNATURE) {
      fail(`Malformed zip: central directory entry ${entry} has a bad signature.`);
    }

    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength);

    cursor += 46 + nameLength + extraLength + commentLength;

    // Directory entries carry no data.
    if (name.endsWith('/')) continue;

    // Reject before writing, not after: an entry that escapes the target must
    // never touch the filesystem in the first place.
    const normalized = name.replace(/\\/g, '/');
    if (path.isAbsolute(normalized) || normalized.split('/').includes('..')) {
      fail(`Refusing to extract unsafe path from archive: ${name}`);
    }

    // The local header repeats the name and extra fields, and its extra field
    // length can differ from the central one — so the payload offset has to be
    // read from the local header rather than assumed.
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);

    let contents;
    if (method === 0) {
      contents = raw;
    } else if (method === 8) {
      contents = zlib.inflateRawSync(raw);
    } else {
      fail(`Unsupported zip compression method ${method} for ${name}.`);
    }

    const destination = path.join(targetDir, normalized);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, contents);
    written += 1;
  }

  if (written === 0) fail('Archive contained no files.');
  console.log(`[${SLUG}] Extracted ${written} files from the archive`);
}

/** Produces the directory whose contents should be published. */
function resolveDistDir() {
  if (archivePath) {
    return extractArchive(archivePath);
  }

  assertExists(SOURCE_DIR, 'Heat-Input-Master source directory');
  assertExists(path.join(SOURCE_DIR, 'package.json'), 'Heat-Input-Master package.json');

  if (skipBuild) {
    console.log(`[${SLUG}] --skip-build: reusing existing dist/`);
  } else {
    console.log(`[${SLUG}] Building bundle from ${SOURCE_DIR}`);
    run('npm', ['ci'], SOURCE_DIR);
    run('npm', ['run', 'build'], SOURCE_DIR);
  }

  return path.join(SOURCE_DIR, 'dist');
}

function main() {
  const distDir = resolveDistDir();
  assertExists(distDir, 'Heat Input Master dist directory');
  assertExists(path.join(distDir, 'index.html'), 'Heat Input Master dist/index.html');

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
    name: SLUG,
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
    `[${SLUG}] Published ${Object.keys(checksums).length} files to ${TARGET_DIR}`,
  );
  console.log(`[${SLUG}] version=${version} buildId=${buildId} bytes=${totalBytes}`);
}

try {
  main();
} catch (error) {
  fs.rmSync(STAGING_DIR, {recursive: true, force: true});
  console.error(`[${SLUG}] ${error.message}`);
  process.exitCode = 1;
} finally {
  if (scratchDir) {
    fs.rmSync(scratchDir, {recursive: true, force: true});
  }
}
