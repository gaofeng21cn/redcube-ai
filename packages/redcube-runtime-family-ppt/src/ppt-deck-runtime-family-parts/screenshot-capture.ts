import { materializeScreenshotCaptureStore } from '@redcube/runtime-protocol';

type JsonRecord = Record<string, any>;

interface PptScreenshotCaptureDeps {
  deliverablePaths: JsonRecord;
  reviewCapture: {
    captureId: string;
    screenshotsDir: string;
  };
  slideReviews: JsonRecord[];
  mechanicalSlideReviews: JsonRecord[];
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
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
}: PptScreenshotCaptureDeps) {
  const captureManifest = materializeScreenshotCaptureStore({
    reportsDir: deliverablePaths.reportsDir,
    captureId: reviewCapture.captureId,
    screenshotsDir: reviewCapture.screenshotsDir,
    slideReviews,
    currentViewMode: 'hardlink',
  });
  const captureBySlideId = captureMapFromManifest(captureManifest);
  return {
    captureManifest,
    slideReviews: applyCapturePaths(slideReviews, captureBySlideId),
    mechanicalSlideReviews: applyCapturePaths(mechanicalSlideReviews, captureBySlideId),
  };
}
