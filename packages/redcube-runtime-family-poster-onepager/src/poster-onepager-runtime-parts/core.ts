// @ts-nocheck
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildSourceTruthConsumptionSummary,
  getDeliverablePaths,
  resolvePythonNativeHelper,
} from '@redcube/runtime-protocol';
import { getReviewState, isBaselineApprovedState } from '@redcube/governance';
import { createPosterOnepagerAuthoringParts } from './authoring.js';
import { createPosterOnepagerScreenshotReviewParts } from './core-screenshot-review.js';
import { createPosterOnepagerCoreAssemblyHelpers } from './core-assembly-helpers.js';
import { createPosterOnepagerPromptSourceTruthHelpers } from './prompt-source-truth-helpers.js';
import { createPosterOnepagerReviewHelpers } from './review-helpers.js';
import {
  CODEX_DEFAULT_ADAPTER,
  createPosterOnepagerRouteReviewHelpers,
  generateStructuredArtifact,
  lifecycleStageForRoute,
} from './route-review-helpers.js';
import {
  ensureDir,
  getDeliverableViewSurfacePaths,
  normalizeInlineText,
  promoteStableView,
  readJson,
  readStageArtifact,
  runPython,
  safeArray,
  safeText,
  seedStableViewIfMissing,
  stageArtifactPath,
  writeJson,
  writeText,
} from './surface-helpers.js';

/**
 * @typedef {import('./types.js').PosterRuntimeRunRequest} PosterRuntimeRunRequest
 * @typedef {import('./types.js').PosterRuntimeRouteResult} PosterRuntimeRouteResult
 */

export function createPosterOnepagerRuntimeCore() {
  const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
  const REPO_ROOT = path.resolve(MODULE_DIR, '../../../..');
  const PYTHON_REVIEW = resolvePythonNativeHelper(REPO_ROOT, 'ppt_deck_review');
  const CANVAS = Object.freeze({ ratio: '4:5', width: 1080, height: 1350 });
  const BANNED_RENDER_TOKENS = Object.freeze(['renderSlide', 'layoutByType', 'cardsGrid', 'pageType']);
  const CREATIVE_MATERIALIZED_FROM = 'codex_cli_json_output';
  const MIN_REVIEW_QA_BLOCKS = 2;
  const MIN_REVIEW_PRIMARY_POINTS = 1;
  const HARD_SCREENSHOT_BLOCKING_ISSUES = new Set(['overflow_detected']);
  const TARGETED_SCREENSHOT_MECHANICAL_ISSUES = new Set([
    'overflow_detected',
    'occlusion_detected',
    'visual_density_out_of_range',
    'block_content_overflow_detected',
  ]);
  const ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE = Object.freeze({
    storyline: 'story_architecture',
    poster_blueprint: 'story_architecture',
    visual_direction: 'visual_authorship',
  });
  const {
    promptMeta,
    promptRoute,
    readPromptPackText,
    resolvePromptPackAsset,
    sourceLabels,
    sourceMaterialIds,
    sourceMaterials,
    sourceTruth,
    operatorMaterials,
  } = createPosterOnepagerPromptSourceTruthHelpers({ repoRoot: REPO_ROOT });
  
  function stageOrder(contract, stageId) {
    return safeArray(contract?.stage_sequence?.stages).findIndex((stage) => stage?.stage_id === stageId);
  }
  
  function rerunStageFromReviewSurface(contract, failedChecks, fallbackStage) {
    const rerunMap = contract?.review_surface?.rerun_from_stage || {};
    const candidates = safeArray(failedChecks)
      .map((checkId) => safeText(rerunMap?.[checkId], fallbackStage))
      .filter(Boolean);
    if (candidates.length === 0) return null;
    return candidates.reduce((earliest, candidate) => {
      if (!earliest) return candidate;
      const earliestOrder = stageOrder(contract, earliest);
      const candidateOrder = stageOrder(contract, candidate);
      if (candidateOrder === -1) return earliest;
      if (earliestOrder === -1 || candidateOrder < earliestOrder) return candidate;
      return earliest;
    }, null);
  }
  const {
    attachCommon,
    creativeExecution,
    creativeSourceStamp,
    primarySurface,
    reviewAuthorship,
  } = createPosterOnepagerRouteReviewHelpers({ promptMeta, safeText });
  
  const {
    requireText,
    normalizeStringList,
    normalizePosterScreenshotAiSlideReviews,
    hasAiVisualBlock,
    buildAiFirstVisualSlideReview,
    aiFirstMechanicalCheckValue,
    requireObjectArray,
  } = createPosterOnepagerReviewHelpers({
    safeText,
    safeArray,
    sourceTruth,
    sourceMaterials,
    hardScreenshotBlockingIssues: HARD_SCREENSHOT_BLOCKING_ISSUES,
    targetedScreenshotMechanicalIssues: TARGETED_SCREENSHOT_MECHANICAL_ISSUES,
  });
  
  const authoringParts = createPosterOnepagerAuthoringParts({
    BANNED_RENDER_TOKENS,
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    MIN_REVIEW_PRIMARY_POINTS,
    MIN_REVIEW_QA_BLOCKS,
    attachCommon,
    creativeExecution,
    creativeSourceStamp,
    generateStructuredArtifact,
    lifecycleStageForRoute,
    normalizeStringList,
    operatorMaterials,
    promptRoute,
    readStageArtifact,
    requireObjectArray,
    requireText,
    safeArray,
    safeText,
    sourceLabels,
    sourceMaterialIds,
    sourceMaterials,
    sourceTruth,
  });
  const {
    buildAuthoringContext,
    buildPosterBlueprintArtifact,
    buildPosterVisualDirectionArtifact,
    buildStoryline,
    buildHtml,
    directorReviewOutputContract,
    loadRenderedPosterSlideHtmlMap,
    renderHtmlOutputContract,
    screenshotReviewOutputContract,
    stripHtml,
    summarizePanels,
    hydrateRenderedSlideRootMetadata,
    validateRenderedPosterHtml,
    validateRenderedReviewAnchors: authoringValidateRenderedReviewAnchors,
  } = authoringParts;
  const {
    buildScreenshotReview,
  } = createPosterOnepagerScreenshotReviewParts({
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PYTHON_REVIEW,
    attachCommon,
    aiFirstMechanicalCheckValue,
    buildAiFirstVisualSlideReview,
    buildAuthoringContext,
    creativeExecution,
    creativeSourceStamp,
    ensureDir,
    generateStructuredArtifact,
    getDeliverableViewSurfacePaths,
    hasAiVisualBlock,
    loadRenderedPosterSlideHtmlMap,
    normalizePosterScreenshotAiSlideReviews,
    normalizeStringList,
    primarySurface,
    promoteStableView,
    promptRoute,
    readJson,
    readStageArtifact,
    requireText,
    rerunStageFromReviewSurface,
    reviewAuthorship,
    runPython,
    safeArray,
    safeText,
    screenshotReviewOutputContract,
    stageArtifactPath,
    summarizePanels,
    writeText,
  });

  function ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId }) {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const storedContract = readJson(path.join(deliverablePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
    const required = safeArray(storedContract?.stage_requirements?.[route]?.requires_artifacts);
    const missing = required.filter((stageId) => !readStageArtifact(storedContract, deliverablePaths, stageId));
    if (missing.length > 0) {
      throw new Error(`Route ${route} requires completed stage artifacts: ${missing.join(', ')}`);
    }
    if (route === 'screenshot_review') {
      const directorReview = readStageArtifact(storedContract, deliverablePaths, 'visual_director_review');
      if (!directorReview || directorReview.status !== 'pass') {
        throw new Error('Route screenshot_review requires visual_director_review to pass before audit');
      }
    }
    if (route === 'export_bundle') {
      const reviewArtifact = readStageArtifact(storedContract, deliverablePaths, 'screenshot_review');
      if (!reviewArtifact || reviewArtifact.status !== 'pass') {
        throw new Error('Route export_bundle requires screenshot_review to pass before export');
      }
    }
    if (route === 'screenshot_review' && mode === 'optimize_existing' && !safeText(baselineDeliverableId)) {
      throw new Error('screenshot_review requires baselineDeliverableId in optimize_existing mode');
    }
    if (route === 'screenshot_review' && mode === 'optimize_existing' && safeText(baselineDeliverableId)) {
      const baselineState = getReviewState({ workspaceRoot, topicId, deliverableId: baselineDeliverableId }).state;
      if (!isBaselineApprovedState(baselineState)) {
        throw new Error(`Baseline deliverable is not approved: ${baselineDeliverableId}`);
      }
    }
    return { deliverablePaths };
  }


  const {
    buildDirectorReview,
    buildExportBundle,
    buildRenderHtmlArtifact,
  } = createPosterOnepagerCoreAssemblyHelpers({
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    attachCommon,
    authoringValidateRenderedReviewAnchors,
    buildAuthoringContext,
    buildHtml,
    creativeExecution,
    creativeSourceStamp,
    directorReviewOutputContract,
    generateStructuredArtifact,
    getDeliverableViewSurfacePaths,
    hydrateRenderedSlideRootMetadata,
    lifecycleStageForRoute,
    normalizeInlineText,
    normalizeStringList,
    promptRoute,
    primarySurface,
    readPromptPackText,
    readStageArtifact,
    renderHtmlOutputContract,
    requireObjectArray,
    requireText,
    resolvePromptPackAsset,
    rerunStageFromReviewSurface,
    reviewAuthorship,
    safeArray,
    safeText,
    seedStableViewIfMissing,
    stripHtml,
    summarizePanels,
    validateRenderedPosterHtml,
    writeJson,
    writeText,
  });

  return {
    CODEX_DEFAULT_ADAPTER,
    ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE,
    buildDirectorReview,
    buildExportBundle,
    buildPosterBlueprintArtifact,
    buildPosterVisualDirectionArtifact,
    buildRenderHtmlArtifact,
    buildScreenshotReview,
    buildSourceTruthConsumptionSummary,
    buildStoryline,
    ensurePrerequisites,
    safeArray,
    sourceLabels,
  };
}
