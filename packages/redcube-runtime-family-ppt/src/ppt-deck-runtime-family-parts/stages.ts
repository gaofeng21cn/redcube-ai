// @ts-nocheck
import path from 'node:path';

import { createPptDeckImagePageStageParts } from './image-pages.js';
import { createPptDeckRenderStageParts } from './render.js';
import { createPptDeckNativePptStageParts } from './native-ppt.js';
import { createPptDeckExportStageParts } from './export.js';
import { createPptDeckDirectorReviewParts } from './stage-director-review.js';
import { createPptDeckScreenshotReviewParts } from './stage-screenshot-review.js';

export function createPptDeckStageParts(deps) {
  const {
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PAGE_FIX_ROUTE,
    PROMPT_PACK,
    PYTHON_EXPORT,
    PYTHON_NATIVE,
    PYTHON_REVIEW,
    RENDER_HTML_BATCH_SIZE,
    RENDER_REFERENCE_SLIDE_WINDOW,
    SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID = 'ppt_deck_screenshot_mechanics:v3:parent-surface-target-audit',
    SCREENSHOT_REVIEW_BATCH_SIZE,
    TARGETED_RENDER_HTML_BATCH_SIZE,
    aiFirstMechanicalCheckValue,
    attachCommon,
    buildAiFirstVisualSlideReview,
    buildAuthoringContext,
    buildRenderReviewMachineGate,
    buildDeckHtml,
    chunkArray,
    collectSlidesNeedingTargetedRevision,
    compareFailuresAndDensity,
    createReviewCapturePaths,
    creativeExecution,
    creativeSourceStamp,
    currentHtmlStageId,
    deriveProfileChecks,
    deriveScreenshotReviewRerunStage,
    directorReviewOutputContract,
    ensureDir,
    existsSync: mainExistsSync,
    extraChecks,
    generateStructuredArtifact,
    getDeliverablePaths,
    getDeliverableViewSurfacePaths,
    getReviewState,
    hasAiVisualBlock,
    hydrateRenderedSlideRootMetadata,
    isBaselineApprovedState,
    loadOperatorRevisionBrief,
    normalizeInlineText,
    normalizePptScreenshotAiSlideReviews,
    normalizeStringList,
    normalizeTypographyPlan,
    primarySurface,
    readCurrentHtmlArtifact: providedReadCurrentHtmlArtifact,
    readJson,
    readPromptPackText,
    readStageArtifact,
    renderHtmlOutputContract,
    renderHtmlSummaryOutputContract,
    requireText,
    resolvePromptPackAsset,
    safeArray,
    safeFileMtimeMs,
    safeText,
    screenshotReviewSlideBatchOutputContract,
    screenshotReviewSummaryOutputContract,
    seedDeliverableStableViews,
    stageArtifactPath,
    summarizeBlueprintSlides,
    summarizeRelativeQuality,
    validateRenderedReviewAnchors,
    validateRenderedSlideContent,
    writeJson,
    writeText,
  } = deps;

  const readCurrentHtmlArtifact = providedReadCurrentHtmlArtifact || ((contract, deliverablePaths) => (
    readStageArtifact(contract, deliverablePaths, currentHtmlStageId(contract, deliverablePaths))
  ));
  const renderParts = createPptDeckRenderStageParts({
    ...deps,
    readCurrentHtmlArtifact,
  });
  const imagePageParts = createPptDeckImagePageStageParts({
    ...deps,
  });
  const { loadPriorRenderedSlideHtmlMap } = renderParts;
  const nativePptParts = createPptDeckNativePptStageParts({
    ...deps,
    PYTHON_NATIVE,
    readCurrentHtmlArtifact,
  });
  const {
    buildNativePptArtifact,
    currentVisualStageId,
    imagePagesMechanicalReviewPayload,
    isImagePagesArtifact,
    isNativePptArtifact,
    nativeMechanicalReviewPayload,
    readCurrentVisualArtifact,
    summarizeImagePages,
    summarizeNativeSlides,
    visualArtifactMtimeMs,
  } = nativePptParts;
  const exportParts = createPptDeckExportStageParts({
    ...deps,
    PYTHON_EXPORT,
    PYTHON_NATIVE,
    isImagePagesArtifact,
    isNativePptArtifact,
    readCurrentVisualArtifact,
  });
  const {
    buildExportArtifact,
    hashReviewInput,
  } = exportParts;
  const { buildDirectorReview } = createPptDeckDirectorReviewParts({
    ...deps,
    currentVisualStageId,
    isImagePagesArtifact,
    isNativePptArtifact,
    loadPriorRenderedSlideHtmlMap,
    mainExistsSync,
    readCurrentVisualArtifact,
    summarizeImagePages,
    summarizeNativeSlides,
  });
  const { buildScreenshotReviewArtifact } = createPptDeckScreenshotReviewParts({
    ...deps,
    hashReviewInput,
    imagePagesMechanicalReviewPayload,
    isImagePagesArtifact,
    isNativePptArtifact,
    loadPriorRenderedSlideHtmlMap,
    mainExistsSync,
    nativeMechanicalReviewPayload,
    readCurrentVisualArtifact,
  });

  function reviewArtifactRerunFromStage(artifact) {
    const rerunPolicy = artifact?.review_state_patch?.rerun_policy || {};
    return safeText(artifact?.review_state_patch?.rerun_from_stage)
      || (
        safeText(rerunPolicy?.status) === 'rerun_required'
          ? safeText(rerunPolicy?.rerun_from_stage)
          : ''
      );
  }

  function reviewArtifactRequestsRoute(artifact, routeId) {
    return safeText(artifact?.status) === 'block'
      && reviewArtifactRerunFromStage(artifact) === routeId;
  }

  function ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId }) {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const contract = readJson(path.join(deliverablePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
    const missing = safeArray(deps.STAGE_REQUIREMENTS?.[route]?.requires_artifacts)
      .filter((stageId) => !readStageArtifact(contract, deliverablePaths, stageId));
    if (missing.length > 0) {
      throw new Error(`Route ${route} requires completed stage artifacts: ${missing.join(', ')}`);
    }
    if (route === 'screenshot_review' && mode === 'optimize_existing' && !safeText(baselineDeliverableId)) {
      throw new Error('screenshot_review requires baselineDeliverableId in optimize_existing mode');
    }
    if (route === 'screenshot_review' && mode === 'optimize_existing' && safeText(baselineDeliverableId)) {
      const baselineState = getReviewState({
        workspaceRoot,
        topicId,
        deliverableId: baselineDeliverableId,
      }).state;
      if (!isBaselineApprovedState(baselineState)) {
        throw new Error(`Baseline deliverable is not approved: ${baselineDeliverableId}`);
      }
    }
    const currentHtmlStage = currentHtmlStageId(contract, deliverablePaths);
    const currentHtmlMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, currentHtmlStage));
    const currentVisualStage = currentVisualStageId(contract, deliverablePaths);
    const currentVisualMtimeMs = visualArtifactMtimeMs(contract, deliverablePaths);
    if (route === PAGE_FIX_ROUTE) {
      const screenshotReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
      if (screenshotReviewMtimeMs < currentHtmlMtimeMs) {
        throw new Error('Route fix_html requires screenshot_review based on the current HTML; rerun screenshot_review first');
      }
    }
    if (route === 'repair_pptx_native') {
      const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
      const directorReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'visual_director_review'));
      const screenshotReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
      const authorMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'author_pptx_native'));
      const hasFreshScreenshotRepairRequest = screenshotReviewMtimeMs >= authorMtimeMs
        && reviewArtifactRequestsRoute(readStageArtifact(contract, deliverablePaths, 'screenshot_review'), 'repair_pptx_native');
      const hasFreshDirectorRepairRequest = directorReviewMtimeMs >= authorMtimeMs
        && reviewArtifactRequestsRoute(directorReviewArtifact, 'repair_pptx_native');
      if (!hasFreshScreenshotRepairRequest && !hasFreshDirectorRepairRequest) {
        throw new Error('Route repair_pptx_native requires visual_director_review or screenshot_review based on the current native PPTX and requesting repair_pptx_native; rerun visual_director_review or screenshot_review first');
      }
    }
    if (route === 'repair_image_pages') {
      const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
      const directorReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'visual_director_review'));
      const repairMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'repair_image_pages'));
      const screenshotReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
      const screenshotReviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
      const authorMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'author_image_pages'));
      const currentImageMtimeMs = Math.max(authorMtimeMs, repairMtimeMs);
      const hasFreshScreenshotRepairRequest = screenshotReviewMtimeMs >= currentImageMtimeMs
        && reviewArtifactRequestsRoute(screenshotReviewArtifact, 'repair_image_pages');
      const hasFreshDirectorRepairRequest = directorReviewMtimeMs >= currentImageMtimeMs
        && reviewArtifactRequestsRoute(directorReviewArtifact, 'repair_image_pages');
      if (!hasFreshScreenshotRepairRequest && !hasFreshDirectorRepairRequest) {
        throw new Error('Route repair_image_pages requires visual_director_review or screenshot_review based on the current image pages and requesting repair_image_pages; rerun visual_director_review or screenshot_review first');
      }
    }
    if (route === 'visual_director_review' && !currentVisualStage) {
      throw new Error('Route visual_director_review requires author_image_pages, render_html, or author_pptx_native before review');
    }
    if (route === 'screenshot_review') {
      const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
      const screenshotFeedbackOnlyRoute = reviewArtifactRequestsRoute(directorReviewArtifact, 'repair_pptx_native')
        ? 'repair_pptx_native'
        : '';
      if (!directorReviewArtifact || (directorReviewArtifact.status !== 'pass' && !screenshotFeedbackOnlyRoute)) {
        throw new Error('Route screenshot_review requires visual_director_review to pass before audit');
      }
      const directorReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'visual_director_review'));
      if (directorReviewMtimeMs < currentVisualMtimeMs) {
        throw new Error('Route screenshot_review requires visual_director_review to be rerun after the latest visual changes');
      }
    }
    if (route === 'export_pptx') {
      const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
      if (!reviewArtifact || reviewArtifact.status !== 'pass') {
        throw new Error('Route export_pptx requires screenshot_review to pass before export');
      }
      const screenshotReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
      if (screenshotReviewMtimeMs < currentVisualMtimeMs) {
        throw new Error('Route export_pptx requires screenshot_review to be rerun after the latest visual changes');
      }
    }
  }


  return {
    ...renderParts,
    ...imagePageParts,
    ...nativePptParts,
    buildDirectorReview,
    buildExportArtifact,
    buildScreenshotReviewArtifact,
    ensurePrerequisites,
  };
}
