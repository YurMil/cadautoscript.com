const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');

const SITE_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE_DIR = path.resolve(SITE_ROOT, '..', 'Webstep-viewer');
const SOURCE_DIR = path.resolve(process.env.WEBSTEP_VIEWER_DIR || DEFAULT_SOURCE_DIR);
const SOURCE_DIST_DIR = path.join(SOURCE_DIR, 'dist');
const TARGET_DIR = path.join(SITE_ROOT, 'static', 'utility-apps', 'webstep-viewer');
const TARGET_ASSETS_DIR = path.join(TARGET_DIR, 'assets');

function assertExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Missing ${label}: ${targetPath}`);
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function copyFile(sourcePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), {recursive: true});
  fs.copyFileSync(sourcePath, targetPath);
}

function syncDirectory(sourceDir, targetDir) {
  fs.rmSync(targetDir, {recursive: true, force: true});
  fs.mkdirSync(targetDir, {recursive: true});
  fs.cpSync(sourceDir, targetDir, {recursive: true});
}

function main() {
  assertExists(SOURCE_DIR, 'Webstep-viewer source directory');
  assertExists(path.join(SOURCE_DIR, 'package.json'), 'Webstep-viewer package.json');

  console.log(`[webstep-viewer] Building embed bundle from ${SOURCE_DIR}`);
  run('npm', ['run', 'build', '--', '--base', './'], SOURCE_DIR);

  assertExists(SOURCE_DIST_DIR, 'Webstep-viewer dist directory');
  assertExists(path.join(SOURCE_DIST_DIR, 'index.html'), 'Webstep-viewer dist/index.html');
  assertExists(path.join(SOURCE_DIST_DIR, 'assets'), 'Webstep-viewer dist/assets');

  console.log(`[webstep-viewer] Syncing embed files to ${TARGET_DIR}`);
  syncDirectory(path.join(SOURCE_DIST_DIR, 'assets'), TARGET_ASSETS_DIR);
  copyFile(path.join(SOURCE_DIST_DIR, 'index.html'), path.join(TARGET_DIR, 'app.html'));

  const optionalFiles = ['occt-import-js.js', 'occt-import-js.wasm', 'sample.step'];
  for (const fileName of optionalFiles) {
    const sourcePath = path.join(SOURCE_DIST_DIR, fileName);
    if (fs.existsSync(sourcePath)) {
      copyFile(sourcePath, path.join(TARGET_DIR, fileName));
    }
  }

  // A rebuilt bundle can add, rename or drop a copy of a shared WebAssembly
  // runtime; keep the vercel.json rewrites for those in step.
  run(process.execPath, [path.join(__dirname, 'dedupe-shared-assets.js'), '--fix'], SITE_ROOT);

  console.log('[webstep-viewer] Embed bundle synced successfully.');
}

try {
  main();
} catch (error) {
  console.error(`[webstep-viewer] ${error.message}`);
  process.exit(1);
}
