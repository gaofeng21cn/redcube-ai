import { safeText } from './core-helpers.js';

type JsonRecord = Record<string, any>;

interface IncrementalDirectorReviewTargetInput {
  renderArtifact: JsonRecord | null | undefined;
  priorReviewArtifact: JsonRecord | null | undefined;
  currentVisualStage: unknown;
  pageFixRoute: unknown;
}

interface IncrementalScreenshotReviewTargetInput {
  renderArtifact: JsonRecord | null | undefined;
  priorReviewArtifact: JsonRecord | null | undefined;
  pageFixRoute: unknown;
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function uniqueSlideIds(values: unknown): string[] {
  return [...new Set(safeArray(values).map((slideId) => safeText(slideId)).filter(Boolean))];
}

function nativePptRepairTargetSlideIds(renderArtifact: JsonRecord | null | undefined): string[] {
  return uniqueSlideIds([
    ...safeArray(renderArtifact?.unit_repair_scope?.target_slide_ids),
    ...safeArray(renderArtifact?.native_ppt_repair_log?.target_slide_ids),
  ]);
}

function targetedHtmlRevisionSlideIds(renderArtifact: JsonRecord | null | undefined): string[] {
  return uniqueSlideIds([
    ...safeArray(renderArtifact?.render_execution?.freshly_rendered_slide_ids),
    ...safeArray(renderArtifact?.targeted_rerun?.target_slide_ids),
  ]);
}

function hasCurrentScreenshotReviewMechanicalShape(priorReviewArtifact: JsonRecord | null | undefined): boolean {
  const slideReviews = safeArray(priorReviewArtifact?.slide_reviews);
  if (slideReviews.length === 0) return false;
  if (typeof priorReviewArtifact?.checks?.page_number_consistency_ok !== 'boolean') return false;
  return slideReviews.every((rawSlide) => {
    const slide = rawSlide as JsonRecord;
    const checks = slide.checks as JsonRecord | undefined;
    const metrics = slide.metrics as JsonRecord | undefined;
    const pageNumberAudit = metrics?.page_number_audit;
    return (
      typeof checks?.page_number_consistency_ok === 'boolean'
      && pageNumberAudit !== null
      && typeof pageNumberAudit === 'object'
      && !Array.isArray(pageNumberAudit)
    );
  });
}

export function collectIncrementalDirectorReviewTargetSlideIds({
  renderArtifact,
  priorReviewArtifact,
  currentVisualStage,
  pageFixRoute,
}: IncrementalDirectorReviewTargetInput): string[] {
  if (!priorReviewArtifact?.visual_director_review) return [];
  if (safeText(currentVisualStage) === 'repair_pptx_native') return nativePptRepairTargetSlideIds(renderArtifact);
  if (safeText(currentVisualStage) !== safeText(pageFixRoute)) return [];
  if (safeText(renderArtifact?.render_execution?.mode) !== 'targeted_revision_only') return [];
  return targetedHtmlRevisionSlideIds(renderArtifact);
}

export function collectIncrementalScreenshotReviewTargetSlideIds({
  renderArtifact,
  priorReviewArtifact,
  pageFixRoute,
}: IncrementalScreenshotReviewTargetInput): string[] {
  if (!hasCurrentScreenshotReviewMechanicalShape(priorReviewArtifact)) return [];
  if (safeText(renderArtifact?.route) === 'repair_pptx_native') {
    return nativePptRepairTargetSlideIds(renderArtifact);
  }
  if (safeText(renderArtifact?.route) !== safeText(pageFixRoute)) return [];
  if (safeText(renderArtifact?.render_execution?.mode) !== 'targeted_revision_only') return [];
  return targetedHtmlRevisionSlideIds(renderArtifact);
}
