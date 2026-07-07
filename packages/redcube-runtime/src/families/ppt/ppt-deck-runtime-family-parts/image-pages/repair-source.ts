type JsonRecord = Record<string, any>;

interface ImagePageRepairSourceDeps {
  collectSlidesNeedingTargetedRevision(slides: JsonRecord[]): JsonRecord[];
  readStageArtifact(contract: JsonRecord, deliverablePaths: JsonRecord, stageId: string): JsonRecord | null;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function createImagePageRepairSourceParts({
  collectSlidesNeedingTargetedRevision,
  readStageArtifact,
  safeArray,
  safeText,
}: ImagePageRepairSourceDeps) {
  function repairFeedbackFromReview(reviewArtifact: JsonRecord | null): JsonRecord[] {
    const explicitBlockedSlideIds = new Set(
      safeArray(reviewArtifact?.blocked_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
    );
    const slideReviews = safeArray(reviewArtifact?.slide_reviews);
    const targetedSlides = explicitBlockedSlideIds.size > 0
      ? slideReviews.filter((slide) => explicitBlockedSlideIds.has(safeText(slide?.slide_id)))
      : collectSlidesNeedingTargetedRevision(slideReviews);
    const rerunFromStage = safeText(reviewArtifact?.review_state_patch?.rerun_from_stage)
      || (
        safeText(reviewArtifact?.review_state_patch?.rerun_policy?.status) === 'rerun_required'
          ? safeText(reviewArtifact?.review_state_patch?.rerun_policy?.rerun_from_stage)
          : ''
      );
    const reviewedSlideIds = new Set(
      safeArray(reviewArtifact?.review_execution?.reviewed_slide_ids)
        .map((slideId) => safeText(slideId))
        .filter(Boolean),
    );
    const fallbackSlides = targetedSlides.length > 0 || rerunFromStage !== 'repair_image_pages'
      ? []
      : slideReviews.filter((slide) => {
        const slideId = safeText(slide?.slide_id);
        return slideId && (reviewedSlideIds.size === 0 || reviewedSlideIds.has(slideId));
      });
    const directorWeakPages = safeArray(reviewArtifact?.visual_director_review?.weak_pages)
      .map((slideId) => safeText(slideId))
      .filter(Boolean);
    const directorFallbackSlideIds = slideReviews.length > 0 || rerunFromStage !== 'repair_image_pages'
      ? []
      : (directorWeakPages.length > 0 ? directorWeakPages : [...reviewedSlideIds]);
    const directorFallbackSlides = directorFallbackSlideIds.map((slideId) => ({
      slide_id: slideId,
      title: '',
      issues: safeArray(reviewArtifact?.review_state_patch?.blocking_reasons),
      mechanical_issues: [],
      ai_review: {
        visual_findings: [
          safeText(reviewArtifact?.visual_director_review?.review_summary),
        ].filter(Boolean),
        recommended_fix: safeText(
          reviewArtifact?.visual_director_review?.rewrite_action,
          'Regenerate the page so the visual director review blocking reasons are resolved.',
        ),
      },
    }));
    const feedbackSlides = targetedSlides.length > 0
      ? targetedSlides
      : (fallbackSlides.length > 0 ? fallbackSlides : directorFallbackSlides);
    return feedbackSlides
      .map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        title: safeText(slide?.title),
        issues: [
          ...safeArray(slide?.issues).map((issue) => safeText(issue)).filter(Boolean),
          ...safeArray(reviewArtifact?.review_state_patch?.blocking_reasons)
            .map((issue) => safeText(issue))
            .filter(Boolean),
        ],
        mechanical_issues: safeArray(slide?.mechanical_issues).map((issue) => safeText(issue)).filter(Boolean),
        visual_findings: safeArray(slide?.ai_review?.visual_findings).map((item) => safeText(item)).filter(Boolean),
        recommended_fix: safeText(
          slide?.ai_review?.recommended_fix,
          'Revise the page so the deck-level screenshot review blocking reasons are resolved.',
        ),
      }))
      .filter((slide) => slide.slide_id);
  }

  function repairReviewRerunFromStage(reviewArtifact: JsonRecord | null): string {
    return safeText(reviewArtifact?.review_state_patch?.rerun_from_stage)
      || (
        safeText(reviewArtifact?.review_state_patch?.rerun_policy?.status) === 'rerun_required'
          ? safeText(reviewArtifact?.review_state_patch?.rerun_policy?.rerun_from_stage)
          : ''
      );
  }

  function repairReviewSource(contract: JsonRecord, deliverablePaths: JsonRecord): {
    stageId: string;
    artifact: JsonRecord | null;
  } {
    for (const stageId of ['screenshot_review', 'visual_director_review']) {
      const artifact = readStageArtifact(contract, deliverablePaths, stageId);
      if (safeText(artifact?.status) === 'block'
        && repairReviewRerunFromStage(artifact) === 'repair_image_pages') {
        return { stageId, artifact };
      }
    }
    return {
      stageId: 'screenshot_review',
      artifact: readStageArtifact(contract, deliverablePaths, 'screenshot_review'),
    };
  }

  function priorImagePageArtifact(contract: JsonRecord, deliverablePaths: JsonRecord): JsonRecord | null {
    return readStageArtifact(contract, deliverablePaths, 'repair_image_pages')
      || readStageArtifact(contract, deliverablePaths, 'author_image_pages');
  }

  function imageSlidesById(artifact: JsonRecord | null): Map<string, JsonRecord> {
    const slides: JsonRecord[] = safeArray(artifact?.image_pages_bundle?.pages || artifact?.image_page_manifest?.slides)
      .map((slide: JsonRecord) => ({
        ...slide,
        image_file: safeText(slide?.image_file || slide?.png_file),
        png_file: safeText(slide?.png_file || slide?.image_file),
        hash: safeText(slide?.hash || slide?.sha256),
      }));
    return new Map(slides.map((slide) => [safeText(slide?.slide_id), slide]));
  }

  return {
    imageSlidesById,
    priorImagePageArtifact,
    repairFeedbackFromReview,
    repairReviewSource,
  };
}
