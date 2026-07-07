type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

interface NativePptRepairScopeDeps {
  collectSlidesNeedingTargetedRevision(slides: JsonRecord[]): JsonRecord[];
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function createNativePptRepairScopeParts({
  collectSlidesNeedingTargetedRevision,
  safeArray,
  safeText,
}: NativePptRepairScopeDeps) {
  function repairFeedbackFromReview(reviewArtifact: JsonRecord | null): JsonRecord[] {
    return collectSlidesNeedingTargetedRevision(safeArray(reviewArtifact?.slide_reviews))
      .map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        title: safeText(slide?.title),
        issues: safeArray(slide?.issues),
        mechanical_issues: safeArray(slide?.mechanical_issues),
        visual_findings: safeArray(slide?.ai_review?.visual_findings),
        recommended_fix: safeText(slide?.ai_review?.recommended_fix),
        source_review_stage: 'screenshot_review',
      }))
      .filter((slide) => slide.slide_id);
  }

  function repairFeedbackFromDirectorReview(reviewArtifact: JsonRecord | null): JsonRecord[] {
    const review = reviewArtifact?.visual_director_review || {};
    const preflight = review?.deterministic_preflight || {};
    const findings = safeArray(preflight?.findings).map((finding) => safeText(finding)).filter(Boolean);
    return safeArray(review?.weak_pages)
      .map((slideId) => safeText(slideId))
      .filter(Boolean)
      .map((slideId) => {
        const slideFindings = findings.filter((finding) => finding.includes(slideId));
        return {
          slide_id: slideId,
          title: '',
          issues: slideFindings,
          mechanical_issues: [
            ...(slideFindings.some((finding) => /slot fill/i.test(finding)) ? ['native_slot_fill_failed'] : []),
            ...(slideFindings.some((finding) => /content depth/i.test(finding)) ? ['native_content_depth_failed'] : []),
            ...(slideFindings.some((finding) => /overlap|occlusion/i.test(finding)) ? ['occlusion_detected'] : []),
            ...(slideFindings.some((finding) => /overflow|fit/i.test(finding)) ? ['block_content_overflow_detected'] : []),
          ],
          visual_findings: slideFindings,
          recommended_fix: safeText(review?.review_summary),
          source_review_stage: 'visual_director_review',
        };
      });
  }

  function buildUnitRepairScope({
    route,
    blueprintArtifact,
    repairFeedback,
  }: {
    route: NativePptRoute;
    blueprintArtifact: JsonRecord | null;
    repairFeedback: JsonRecord[];
  }) {
    const allSlideIds = safeArray(blueprintArtifact?.slide_blueprint?.slides)
      .map((slide) => safeText(slide?.slide_id))
      .filter(Boolean);
    const targetSlideIds = route === 'repair_pptx_native'
      ? [...new Set(safeArray(repairFeedback).map((slide) => safeText(slide?.slide_id)).filter(Boolean))]
      : allSlideIds;
    const targetSet = new Set(targetSlideIds);
    return {
      family: 'ppt_deck',
      route,
      scope: route === 'repair_pptx_native' ? 'page' : 'deck',
      target_slide_ids: targetSlideIds,
      preserved_slide_ids: allSlideIds.filter((slideId) => !targetSet.has(slideId)),
      source_review_stage: route === 'repair_pptx_native' ? 'screenshot_review' : null,
      input_boundary: route === 'repair_pptx_native'
        ? 'blocked_slide_review_feedback_plus_prior_native_shape_manifest'
        : 'slide_blueprint_plus_visual_direction',
      output_boundary: 'editable_shape_plan_plus_shape_manifest',
      screenshot_review_reuse: route === 'repair_pptx_native',
    };
  }

  return {
    buildUnitRepairScope,
    repairFeedbackFromDirectorReview,
    repairFeedbackFromReview,
  };
}
