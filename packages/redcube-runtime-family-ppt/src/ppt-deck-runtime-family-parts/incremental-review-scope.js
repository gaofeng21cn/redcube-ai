function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueSlideIds(values) {
  return [...new Set(safeArray(values).map((slideId) => safeText(slideId)).filter(Boolean))];
}

function nativePptRepairTargetSlideIds(renderArtifact) {
  return uniqueSlideIds([
    ...safeArray(renderArtifact?.unit_repair_scope?.target_slide_ids),
    ...safeArray(renderArtifact?.native_ppt_repair_log?.target_slide_ids),
  ]);
}

function targetedHtmlRevisionSlideIds(renderArtifact) {
  return uniqueSlideIds([
    ...safeArray(renderArtifact?.render_execution?.freshly_rendered_slide_ids),
    ...safeArray(renderArtifact?.targeted_rerun?.target_slide_ids),
  ]);
}

export function collectIncrementalDirectorReviewTargetSlideIds({
  renderArtifact,
  priorReviewArtifact,
  currentVisualStage,
  pageFixRoute,
}) {
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
}) {
  if (safeText(renderArtifact?.route) === 'repair_pptx_native') {
    if (safeArray(priorReviewArtifact?.slide_reviews).length === 0) return [];
    return nativePptRepairTargetSlideIds(renderArtifact);
  }
  if (safeText(renderArtifact?.route) !== safeText(pageFixRoute)) return [];
  if (safeText(renderArtifact?.render_execution?.mode) !== 'targeted_revision_only') return [];
  if (safeArray(priorReviewArtifact?.slide_reviews).length === 0) return [];
  return targetedHtmlRevisionSlideIds(renderArtifact);
}
