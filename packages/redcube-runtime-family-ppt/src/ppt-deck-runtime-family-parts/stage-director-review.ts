// @ts-nocheck
import path from 'node:path';

import {
  collectIncrementalDirectorReviewTargetSlideIds,
} from './incremental-review-scope.js';
import { createPptDeckDirectorReviewPreflightParts } from './stage-director-review-preflight.js';
import { createPptDeckStageReviewScopeParts } from './stage-review-scope.js';

export function createPptDeckDirectorReviewParts(deps) {
  const {
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PAGE_FIX_ROUTE,
    PROMPT_PACK,
    attachCommon,
    buildAuthoringContext,
    creativeExecution,
    creativeSourceStamp,
    currentVisualStageId,
    directorReviewOutputContract,
    generateStructuredArtifact,
    isImagePagesArtifact,
    isNativePptArtifact,
    loadPriorRenderedSlideHtmlMap,
    mainExistsSync,
    normalizeInlineText,
    normalizeStringList,
    primarySurface,
    readCurrentVisualArtifact,
    readStageArtifact,
    requireText,
    safeArray,
    safeText,
    summarizeBlueprintSlides,
    summarizeImagePages,
    summarizeNativeSlides,
    writeText,
  } = deps;
  const {
    buildPageLocalVisualDirectionContext,
    filterSlideScopedArray,
    slideIdSet,
  } = createPptDeckStageReviewScopeParts({ safeArray, safeText });
  const {
    buildDirectorPreflightContext,
    buildDirectorReviewDecision,
    buildDirectorReviewStatePatch,
    directorHtmlPreflight,
    directorImagePagesPreflight,
    directorNativePptPreflight,
    writeDirectorReviewReport,
  } = createPptDeckDirectorReviewPreflightParts({
    filterSlideScopedArray,
    mainExistsSync,
    normalizeInlineText,
    normalizeStringList,
    requireText,
    safeArray,
    safeText,
    slideIdSet,
    summarizeImagePages,
    summarizeNativeSlides,
    writeText,
  });

  async function generateDirectorReviewDraft(contract, deliverablePaths, preflight, adapter = CODEX_DEFAULT_ADAPTER) {
    const renderArtifact = readCurrentVisualArtifact(contract, deliverablePaths);
    const currentVisualStage = currentVisualStageId(contract, deliverablePaths);
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const priorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const incrementalTargetSlideIds = collectIncrementalDirectorReviewTargetSlideIds({
      renderArtifact,
      priorReviewArtifact,
      currentVisualStage,
      pageFixRoute: PAGE_FIX_ROUTE,
    });
    const incrementalReview = incrementalTargetSlideIds.length > 0;
    const targetSlideIdSet = slideIdSet(incrementalTargetSlideIds);
    const renderedSlideHtmlById = loadPriorRenderedSlideHtmlMap(renderArtifact);
    const sourceSurfaceKind = isImagePagesArtifact(renderArtifact)
      ? 'image_pages'
      : isNativePptArtifact(renderArtifact) ? 'native_pptx' : 'html';
    const renderSummary = isImagePagesArtifact(renderArtifact)
      ? summarizeImagePages(renderArtifact).map((page) => ({
          slide_id: page.slide_id,
          title: page.title,
          layout_family: page.layout_family,
          peak_page: false,
          png_file: page.png_file,
          prompt_manifest_file: page.prompt_manifest_file,
          style_manifest_file: page.style_manifest_file,
          text_excerpt: `image-first page: PNG=${path.basename(page.png_file || '')}; prompt_manifest=${path.basename(page.prompt_manifest_file || '')}; style_manifest=${path.basename(page.style_manifest_file || '')}`,
        }))
      : isNativePptArtifact(renderArtifact)
      ? summarizeNativeSlides(renderArtifact).map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
          layout_variant: slide.layout_variant,
          expected_slot_count: slide.expected_slot_count,
          filled_slot_count: slide.filled_slot_count,
          peak_page: false,
          source_pptx: renderArtifact?.native_ppt_bundle?.pptx_file || null,
          shape_manifest_file: renderArtifact?.native_ppt_bundle?.shape_manifest_file || null,
          text_excerpt: `native editable PPTX: ${slide.shape_count} shapes, ${slide.text_box_count} text boxes`,
        }))
      : safeArray(renderArtifact?.html_bundle?.slides).map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
          peak_page: slide.director_contract?.peak_page,
          text_excerpt: normalizeInlineText(String(slide.content || '').replace(/<[^>]+>/g, ' '), 220),
          ...(incrementalReview
            ? { source_html: renderedSlideHtmlById.get(safeText(slide.slide_id)) || null }
            : {}),
        }));
    const reviewRenderSummary = incrementalReview
      ? renderSummary.filter((slide) => targetSlideIdSet.has(safeText(slide?.slide_id)))
      : renderSummary;
    const reviewedSlideIds = incrementalReview
      ? incrementalTargetSlideIds
      : renderSummary.map((slide) => safeText(slide?.slide_id)).filter(Boolean);
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route: 'visual_director_review',
      promptRelativePath: PROMPT_PACK.visual_director_review,
      context: {
        ...buildAuthoringContext(contract),
        review_scope: incrementalReview ? 'incremental_page_review' : 'full_deck_review',
        blueprint: {
          slides: incrementalReview
            ? filterSlideScopedArray(summarizeBlueprintSlides(blueprintArtifact), incrementalTargetSlideIds)
            : summarizeBlueprintSlides(blueprintArtifact),
        },
        visual_direction: incrementalReview
          ? buildPageLocalVisualDirectionContext(visualArtifact?.visual_direction || null, incrementalTargetSlideIds)
          : visualArtifact?.visual_direction || null,
        render_summary: reviewRenderSummary,
        director_preflight: incrementalReview
          ? buildDirectorPreflightContext(preflight, incrementalTargetSlideIds)
          : null,
        source_surface_kind: sourceSurfaceKind,
      },
      localFileInspection: sourceSurfaceKind === 'image_pages'
        ? renderSummary.map((page, index) => ({
            label: `${page.slide_id} ${safeText(page.title, `Slide ${index + 1}`)}`.trim(),
            path: page.png_file,
            media_type: 'image/png',
            purpose: `Review image-first PPT page ${page.slide_id}`,
          }))
        : undefined,
      outputContract: directorReviewOutputContract(),
    });
    return {
      data,
      generationRuntime,
      reviewScope: incrementalReview ? 'incremental_page_review' : 'full_deck_review',
      reviewedSlideIds,
      reusedSlideIds: incrementalReview
        ? renderSummary
            .map((slide) => safeText(slide?.slide_id))
            .filter((slideId) => slideId && !targetSlideIdSet.has(slideId))
        : [],
      priorReviewArtifact: incrementalReview ? priorReviewArtifact : null,
    };
  }

  async function buildDirectorReview(contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const renderArtifact = readCurrentVisualArtifact(contract, deliverablePaths);
    const sourceSurfaceKind = isImagePagesArtifact(renderArtifact)
      ? 'image_pages'
      : isNativePptArtifact(renderArtifact) ? 'native_pptx' : 'html';
    const preflight = isImagePagesArtifact(renderArtifact)
      ? directorImagePagesPreflight(renderArtifact)
      : isNativePptArtifact(renderArtifact)
      ? directorNativePptPreflight(renderArtifact)
      : directorHtmlPreflight(renderArtifact);
    const {
      data,
      generationRuntime,
      reviewScope,
      reviewedSlideIds,
      reusedSlideIds,
      priorReviewArtifact,
    } = await generateDirectorReviewDraft(contract, deliverablePaths, preflight, adapter);
    const priorReview = priorReviewArtifact?.visual_director_review || null;
    const incrementalReview = reviewScope === 'incremental_page_review';
    const decision = buildDirectorReviewDecision({
      data,
      preflight,
      priorReview,
      incrementalReview,
      reviewedSlideIds,
    });
    const status = decision.status;
    const rerunFromStage = sourceSurfaceKind === 'image_pages'
      ? 'repair_image_pages'
      : sourceSurfaceKind === 'native_pptx' ? 'repair_pptx_native' : 'render_html';
    const reviewFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉总监复盘.md`);
    const reviewOwner = primarySurface(generationRuntime, adapter);
    writeDirectorReviewReport(reviewFile, reviewOwner, decision);
    return {
      ...attachCommon('visual_director_review', contract, generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('visual_director_review', generationRuntime, adapter),
        overlay: 'visual_director_review',
        review_scope: reviewScope,
        reviewed_slide_ids: reviewedSlideIds,
        reused_slide_ids: reusedSlideIds,
      },
      review_overlay: 'visual_director_review',
      status,
      visual_director_review: {
        review_model: 'director_first_visual_judgement',
        director_intent_landed: decision.directorIntentLanded,
        anti_template_ok: decision.antiTemplateOk,
        peak_pages_landed: decision.peakPagesLanded,
        memory_hook_present: decision.memoryHookPresent,
        weak_pages: decision.weakPages,
        homogeneous_layout_risk: decision.homogeneousLayoutRisk,
        review_summary: decision.reviewSummary,
        deterministic_preflight: {
          gate_model: 'deterministic_ppt_director_review_preflight',
          anti_template_ok: preflight.antiTemplateOk,
          weak_pages: preflight.weakPages,
          findings: preflight.findings,
        },
        rewrite_action: safeText(data?.rewrite_action) || (status === 'pass'
          ? 'none'
          : sourceSurfaceKind === 'image_pages' ? 'repair_image_pages' : 'revise_render_html'),
        overlay_handoff: 'screenshot_review',
        creative_sources: {
          review_judgement: creativeSourceStamp({
            route: 'visual_director_review',
            lifecycleStage: 'review_overlay',
            authoredSurface: 'visual_director_review_decision',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
      artifact_refs: [reviewFile],
      review_state_patch: buildDirectorReviewStatePatch(
        status,
        decision,
        rerunFromStage,
      ),
    };
  }


  return {
    buildDirectorReview,
  };
}
