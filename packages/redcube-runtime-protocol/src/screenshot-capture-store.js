import crypto from 'node:crypto';
import path from 'node:path';
import {
  copyFileSync,
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function readPngDimensions(buffer) {
  if (buffer.length < 24) return null;
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') return null;
  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function imageExtension(file) {
  const ext = path.extname(file).toLowerCase();
  if (['.png', '.jpg', '.jpeg'].includes(ext)) return ext;
  return '.png';
}

function storePathForHash(storeDir, sha256, ext) {
  return path.join(storeDir, sha256.slice(0, 2), `${sha256}${ext}`);
}

function sameFile(left, right) {
  if (!left || !right || !existsSync(left) || !existsSync(right)) return false;
  const leftStat = statSync(left);
  const rightStat = statSync(right);
  return leftStat.dev === rightStat.dev && leftStat.ino === rightStat.ino;
}

function materializeCurrentPath({ storePath, currentPath, mode }) {
  if (mode === 'source') {
    return 'source';
  }
  ensureDir(path.dirname(currentPath));
  if (sameFile(storePath, currentPath)) {
    return 'linked';
  }
  rmSync(currentPath, { force: true });
  linkSync(storePath, currentPath);
  return 'linked';
}

export function materializeScreenshotCaptureStore({
  reportsDir,
  captureId,
  screenshotsDir,
  slideReviews,
  manifestFile = '',
  currentViewMode = 'hardlink',
  generatedAt = new Date().toISOString(),
} = {}) {
  const reportsRoot = safeText(reportsDir);
  const captureRoot = safeText(screenshotsDir);
  if (!reportsRoot) throw new Error('screenshot capture store requires reportsDir');
  if (!captureRoot) throw new Error('screenshot capture store requires screenshotsDir');
  const resolvedCaptureId = safeText(captureId, path.basename(captureRoot));
  const storeDir = ensureDir(path.join(reportsRoot, 'screenshots', '_store', 'sha256'));
  const outputManifestFile = safeText(manifestFile, path.join(captureRoot, 'capture-manifest.json'));
  const slides = safeArray(slideReviews).map((slide) => {
    const slideId = safeText(slide?.slide_id);
    const sourcePath = safeText(slide?.screenshot_file);
    if (!slideId) throw new Error('screenshot capture store requires slide_id for every slide');
    if (!sourcePath || !existsSync(sourcePath)) {
      throw new Error(`screenshot capture source missing for ${slideId}: ${sourcePath}`);
    }
    const sourceBuffer = readFileSync(sourcePath);
    const sha256 = sha256Buffer(sourceBuffer);
    const ext = imageExtension(sourcePath);
    const storePath = storePathForHash(storeDir, sha256, ext);
    const storeExists = existsSync(storePath);
    if (!storeExists) {
      ensureDir(path.dirname(storePath));
      copyFileSync(sourcePath, storePath);
    }
    const currentPath = currentViewMode === 'source'
      ? sourcePath
      : path.join(captureRoot, path.basename(sourcePath));
    const captureStatus = materializeCurrentPath({
      storePath,
      currentPath,
      mode: currentViewMode,
    });
    const currentStat = statSync(currentPath);
    return {
      slide_id: slideId,
      sha256,
      store_path: storePath,
      source_path: sourcePath,
      capture_path: currentPath,
      current_path: currentPath,
      store_status: storeExists ? 'reused' : 'copied',
      reused: storeExists,
      copied: !storeExists,
      capture_status: captureStatus,
      bytes: currentStat.size,
      mtime_ms: currentStat.mtimeMs,
      dimensions: readPngDimensions(sourceBuffer),
    };
  });
  const manifest = {
    schema_version: 1,
    capture_id: resolvedCaptureId,
    generated_at: generatedAt,
    reports_dir: reportsRoot,
    screenshots_dir: captureRoot,
    store_dir: storeDir,
    manifest_file: outputManifestFile,
    current_view_mode: currentViewMode,
    slide_count: slides.length,
    slides,
  };
  writeJson(outputManifestFile, manifest);
  return manifest;
}
