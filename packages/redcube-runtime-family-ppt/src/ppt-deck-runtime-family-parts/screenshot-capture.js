import { materializeScreenshotCaptureStore } from '@redcube/runtime-protocol';

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function captureMapFromManifest(manifest) {
  return new Map(
    safeArray(manifest?.slides)
      .map((slide) => [safeText(slide?.slide_id), slide])
      .filter(([slideId]) => slideId),
  );
}

function applyCapturePaths(slideReviews, captureBySlideId) {
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
}) {
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
