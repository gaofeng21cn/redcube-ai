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

interface SlideReviewInput {
  slide_id?: unknown;
  screenshot_file?: unknown;
}

interface ScreenshotCaptureStoreInput {
  reportsDir?: unknown;
  captureId?: unknown;
  screenshotsDir?: unknown;
  slideReviews?: unknown;
  manifestFile?: unknown;
  currentViewMode?: unknown;
  generatedAt?: string;
}

interface PngDimensions {
  width: number;
  height: number;
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(file: string, data: unknown): void {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function sha256Buffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function readPngDimensions(buffer: Buffer): PngDimensions | null {
  if (buffer.length < 24) return null;
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') return null;
  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function imageExtension(file: string): string {
  const ext = path.extname(file).toLowerCase();
  if (['.png', '.jpg', '.jpeg'].includes(ext)) return ext;
  return '.png';
}

function storePathForHash(storeDir: string, sha256: string, ext: string): string {
  return path.join(storeDir, sha256.slice(0, 2), `${sha256}${ext}`);
}

function sameFile(left: string, right: string): boolean {
  if (!left || !right || !existsSync(left) || !existsSync(right)) return false;
  const leftStat = statSync(left);
  const rightStat = statSync(right);
  return leftStat.dev === rightStat.dev && leftStat.ino === rightStat.ino;
}

function materializeCurrentPath({
  storePath,
  currentPath,
  mode,
}: {
  storePath: string;
  currentPath: string;
  mode: string;
}): 'source' | 'linked' {
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
}: ScreenshotCaptureStoreInput = {}): Record<string, unknown> {
  const reportsRoot = safeText(reportsDir);
  const captureRoot = safeText(screenshotsDir);
  if (!reportsRoot) throw new Error('screenshot capture store requires reportsDir');
  if (!captureRoot) throw new Error('screenshot capture store requires screenshotsDir');
  const resolvedCaptureId = safeText(captureId, path.basename(captureRoot));
  const resolvedCurrentViewMode = safeText(currentViewMode, 'hardlink');
  const storeDir = ensureDir(path.join(reportsRoot, 'screenshots', '_store', 'sha256'));
  const outputManifestFile = safeText(manifestFile, path.join(captureRoot, 'capture-manifest.json'));
  const slides = safeArray(slideReviews).map((slide) => {
    const slideReview = slide as SlideReviewInput;
    const slideId = safeText(slideReview.slide_id);
    const sourcePath = safeText(slideReview.screenshot_file);
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
    const currentPath = resolvedCurrentViewMode === 'source'
      ? sourcePath
      : path.join(captureRoot, path.basename(sourcePath));
    const captureStatus = materializeCurrentPath({
      storePath,
      currentPath,
      mode: resolvedCurrentViewMode,
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
    current_view_mode: resolvedCurrentViewMode,
    slide_count: slides.length,
    slides,
  };
  writeJson(outputManifestFile, manifest);
  return manifest;
}
