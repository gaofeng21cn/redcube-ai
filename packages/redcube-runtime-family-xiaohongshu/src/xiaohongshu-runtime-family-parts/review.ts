// @ts-nocheck
import path from 'node:path';

import { createXiaohongshuScreenshotReviewParts } from './screenshot-review.js';

export function createXiaohongshuReviewParts(deps) {
  const {
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PYTHON_REVIEW,
    attachCommon,
    aiFirstMechanicalCheckValue,
    buildAiFirstVisualSlideReview,
    buildAuthoringContext,
    computeBaselineReview,
    collectSlidesNeedingTargetedRevision,
    creativeExecution,
    creativeSourceStamp,
    deriveScreenshotReviewRerunStage,
    directorReviewOutputContract,
    ensureDir,
    generateStructuredArtifact,
    getDeliverablePaths,
    getDeliverableViewSurfacePaths,
    hasAiVisualBlock,
    hasAiVisualPass,
    loadPriorRenderedXhsSlideHtmlMap,
    markPublishBundleStaleAfterBlockedReview,
    normalizeStringList,
    normalizeXhsScreenshotAiSlideReviews,
    primarySurface,
    promoteStableHtml,
    promptRoute,
    readCurrentHtmlArtifact,
    readJson,
    readStageArtifact,
    requireText,
    reviewAuthorship,
    runPython,
    safeArray,
    safeText,
    screenshotReviewOutputContract,
    stageArtifactPath,
    stripHtml,
    summarizePlanSlides,
    syncCurrentCandidateHtmlFromStageArtifact,
    writeText,
  } = deps;
  const {
    buildScreenshotReview,
  } = createXiaohongshuScreenshotReviewParts({
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PYTHON_REVIEW,
    attachCommon,
    aiFirstMechanicalCheckValue,
    buildAiFirstVisualSlideReview,
    buildAuthoringContext,
    collectSlidesNeedingTargetedRevision,
    computeBaselineReview,
    creativeExecution,
    creativeSourceStamp,
    deriveScreenshotReviewRerunStage,
    ensureDir,
    generateStructuredArtifact,
    getDeliverablePaths,
    getDeliverableViewSurfacePaths,
    hasAiVisualBlock,
    hasAiVisualPass,
    loadPriorRenderedXhsSlideHtmlMap,
    markPublishBundleStaleAfterBlockedReview,
    normalizeStringList,
    normalizeXhsScreenshotAiSlideReviews,
    primarySurface,
    promoteStableHtml,
    promptRoute,
    readCurrentHtmlArtifact,
    readJson,
    readStageArtifact,
    requireText,
    reviewAuthorship,
    runPython,
    safeArray,
    safeText,
    screenshotReviewOutputContract,
    stageArtifactPath,
    summarizePlanSlides,
    syncCurrentCandidateHtmlFromStageArtifact,
    writeText,
  });

  function slideIdSet(slideIds) {
    return new Set(safeArray(slideIds).map((slideId) => safeText(slideId)).filter(Boolean));
  }

  function collectIncrementalDirectorReviewTargetSlideIds(renderArtifact, priorReviewArtifact) {
    if (safeText(renderArtifact?.route) !== 'fix_html') return [];
    if (!priorReviewArtifact?.visual_director_review) return [];
    return [...new Set([
      ...safeArray(renderArtifact?.unit_repair_scope?.target_slide_ids),
      ...safeArray(renderArtifact?.html_bundle?.repair_scope?.target_slide_ids),
    ].map((slideId) => safeText(slideId)).filter(Boolean))];
  }

  function filterSlideScopedArray(items, slideIds) {
    const targetIds = slideIdSet(slideIds);
    if (targetIds.size === 0) return safeArray(items);
    return safeArray(items).filter((item) => targetIds.has(safeText(item?.slide_id)));
  }

  async function generateDirectorReviewDraft(workspaceRoot, contract, deliverablePaths, incrementalTargetSlideIds = [], adapter = CODEX_DEFAULT_ADAPTER) {
    const research = readStageArtifact(contract, deliverablePaths, 'research');
    const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
    const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const render = readCurrentHtmlArtifact(contract, deliverablePaths);
    const incrementalReview = safeArray(incrementalTargetSlideIds).length > 0;
    const renderedSlides = incrementalReview
      ? filterSlideScopedArray(render?.html_bundle?.slides, incrementalTargetSlideIds)
      : safeArray(render?.html_bundle?.slides);
    return generateStructuredArtifact({
      adapter,
      family: 'xiaohongshu',
      route: 'visual_director_review',
      promptRelativePath: promptRoute(contract, 'visual_director_review'),
      context: {
        ...buildAuthoringContext({ workspaceRoot, contract, research }),
        storyline: storyline?.storyline || null,
        review_scope: incrementalReview ? 'incremental_page_review' : 'full_note_review',
        plan: {
          slides: incrementalReview
            ? filterSlideScopedArray(summarizePlanSlides(plan), incrementalTargetSlideIds)
            : summarizePlanSlides(plan),
        },
        visual_direction: visual?.visual_direction || null,
        render_summary: renderedSlides.map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
          peak_page: slide.director_contract?.peak_page,
          text_excerpt: stripHtml(slide.content).slice(0, 180),
        })),
      },
      outputContract: directorReviewOutputContract(),
    });
  }

  async function buildDirectorReview(workspaceRoot, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const candidateSurfaceRefs = syncCurrentCandidateHtmlFromStageArtifact(contract, deliverablePaths);
    const renderArtifact = readCurrentHtmlArtifact(contract, deliverablePaths);
    const priorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const incrementalTargetSlideIds = collectIncrementalDirectorReviewTargetSlideIds(renderArtifact, priorReviewArtifact);
    const incrementalReview = incrementalTargetSlideIds.length > 0;
    const { data, generationRuntime } = await generateDirectorReviewDraft(
      workspaceRoot,
      contract,
      deliverablePaths,
      incrementalTargetSlideIds,
      adapter,
    );
    const directorIntentLanded = Boolean(data?.director_intent_landed);
    const antiTemplateOk = Boolean(data?.anti_template_ok);
    const memoryHookPresent = Boolean(data?.memory_hook_present);
    const renderedSlides = safeArray(readCurrentHtmlArtifact(contract, deliverablePaths)?.html_bundle?.slides);
    const weakPages = normalizeStringList(data?.weak_pages, 'visual_director_review.weak_pages', {
      min: 0,
      max: renderedSlides.length,
    });
    const homogeneousLayoutRisk = Number(data?.homogeneous_layout_risk || 0);
    const reviewSummary = requireText(data?.review_summary, 'visual_director_review.review_summary');
    const status = directorIntentLanded && antiTemplateOk && memoryHookPresent ? 'pass' : 'block';
    const reviewFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉总监复盘.md`);
    const reviewOwner = primarySurface(generationRuntime, adapter);
    writeText(reviewFile, [
      '# 视觉总监复盘',
      '',
      `- review_owner: ${reviewOwner}`,
      `- director_intent_landed: ${directorIntentLanded}`,
      `- anti_template_ok: ${antiTemplateOk}`,
      `- memory_hook_present: ${memoryHookPresent}`,
      `- homogeneous_layout_risk: ${homogeneousLayoutRisk}`,
      `- weak_pages: ${weakPages.join(',') || 'none'}`,
      `- review_summary: ${reviewSummary}`,
    ].join('\n'));
    return {
      ...attachCommon('visual_director_review', contract, generationRuntime, adapter),
      review_overlay: 'visual_director_review',
      review_authorship: reviewAuthorship('visual_director_review', generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('visual_director_review', generationRuntime, adapter),
        overlay: 'visual_director_review',
        review_scope: incrementalReview ? 'incremental_page_review' : 'full_note_review',
        reviewed_slide_ids: incrementalReview
          ? incrementalTargetSlideIds
          : renderedSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
        reused_slide_ids: incrementalReview
          ? renderedSlides
              .map((slide) => safeText(slide?.slide_id))
              .filter((slideId) => slideId && !slideIdSet(incrementalTargetSlideIds).has(slideId))
          : [],
      },
      status,
      visual_director_review: {
        review_model: 'director_first_visual_judgement',
        director_intent_landed: directorIntentLanded,
        anti_template_ok: antiTemplateOk,
        memory_hook_present: memoryHookPresent,
        homogeneous_layout_risk: homogeneousLayoutRisk,
        weak_pages: weakPages,
        review_summary: reviewSummary,
        rewrite_action: status === 'pass' ? 'none' : safeText(data?.rewrite_action, 'revise_render_html'),
        creative_sources: {
          review_judgement: creativeSourceStamp({
            route: 'visual_director_review',
            lifecycleStage: 'review_overlay',
            authoredSurface: 'review_judgement',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
      artifact_refs: [...candidateSurfaceRefs, reviewFile],
      review_state_patch: {
        current_status: status === 'pass' ? 'director_review_passed' : 'blocked_for_revision',
        ready_for_export: false,
        latest_review_stage: 'visual_director_review',
        latest_checks: {
          director_intent_landed: directorIntentLanded,
          anti_template_ok: antiTemplateOk,
          memory_hook_present: memoryHookPresent,
        },
        pending_reviews: status === 'pass'
          ? []
          : Object.entries({
              director_intent_landed: directorIntentLanded,
              anti_template_ok: antiTemplateOk,
              memory_hook_present: memoryHookPresent,
            }).filter(([, value]) => value === false).map(([key]) => key),
        blocking_reasons: status === 'pass'
          ? []
          : Object.entries({
              director_intent_landed: directorIntentLanded,
              anti_template_ok: antiTemplateOk,
              memory_hook_present: memoryHookPresent,
            }).filter(([, value]) => value === false).map(([key]) => key),
        rerun_from_stage: status === 'pass' ? null : 'render_html',
        rerun_policy: {
          status: status === 'pass' ? 'idle' : 'rerun_required',
          rerun_from_stage: status === 'pass' ? null : 'render_html',
        },
      },
    };
  }

  return {
    buildDirectorReview,
    buildScreenshotReview,
  };
}
