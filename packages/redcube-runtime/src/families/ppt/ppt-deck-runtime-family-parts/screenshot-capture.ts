import { materializeScreenshotCaptureStore } from '@redcube/runtime-protocol';
import { safeText } from './core-helpers.js';

type JsonRecord = Record<string, any>;

interface PptScreenshotCaptureDeps {
  deliverablePaths: JsonRecord;
  reviewCapture: {
    captureId: string;
    screenshotsDir: string;
  };
  slideReviews: JsonRecord[];
  mechanicalSlideReviews: JsonRecord[];
  targetSlideIds?: unknown[];
  priorCaptureManifest?: JsonRecord | null;
  captureMode?: 'full' | 'delta';
}

function safeArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value : [];
}

function captureMapFromManifest(manifest: JsonRecord): Map<string, JsonRecord> {
  return new Map(
    safeArray(manifest?.slides)
      .map((slide): [string, JsonRecord] => [safeText(slide?.slide_id), slide])
      .filter(([slideId]) => Boolean(slideId)),
  );
}

function applyCapturePaths(slideReviews: unknown, captureBySlideId: Map<string, JsonRecord>): JsonRecord[] {
  return safeArray(slideReviews).map((slide) => {
    const capture = captureBySlideId.get(safeText(slide?.slide_id));
    return capture?.capture_path
      ? { ...slide, screenshot_file: capture.capture_path }
      : slide;
  });
}

export function materializePptScreenshotReviewCapture({
  deliverablePaths,
  reviewCapture,
  slideReviews,
  mechanicalSlideReviews,
  targetSlideIds = [],
  priorCaptureManifest = null,
  captureMode = 'full',
}: PptScreenshotCaptureDeps) {
  const normalizedCaptureMode = captureMode === 'delta' ? 'delta' : 'full';
  const targetIdSet = new Set(safeArray(targetSlideIds).map((slideId) => safeText(slideId)).filter(Boolean));
  const slidesToMaterialize = normalizedCaptureMode === 'delta' && targetIdSet.size > 0
    ? safeArray(slideReviews).filter((slide) => targetIdSet.has(safeText(slide?.slide_id)))
    : slideReviews;
  const captureManifest = materializeScreenshotCaptureStore({
    reportsDir: deliverablePaths.reportsDir,
    captureId: reviewCapture.captureId,
    screenshotsDir: reviewCapture.screenshotsDir,
    slideReviews: slidesToMaterialize,
    currentViewMode: 'hardlink',
    captureMode: normalizedCaptureMode,
  });
  const captureBySlideId = new Map([
    ...captureMapFromManifest(priorCaptureManifest || {}),
    ...captureMapFromManifest(captureManifest),
  ]);
  return {
    captureManifest,
    slideReviews: applyCapturePaths(slideReviews, captureBySlideId),
    mechanicalSlideReviews: applyCapturePaths(mechanicalSlideReviews, captureBySlideId),
  };
}
