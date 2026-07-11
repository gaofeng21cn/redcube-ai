// @ts-nocheck
import path from 'node:path';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import {
  buildSourceTruthConsumptionSummary,
  buildCodexExecutionModel,
  CODEX_DEFAULT_ADAPTER,
  getDeliverablePaths,
  resolveRedCubePythonCommand,
  resolvePythonNativeHelper,
} from '@redcube/runtime-protocol';
import {
  generateStructuredArtifactBatchViaCodexCli,
  generateStructuredArtifactViaCodexCli,
} from '../../../executors/codex-caller.js';
import { compareFailuresAndDensity, summarizeRelativeQuality } from '../../../relative-quality.js';
import { getReviewState, isBaselineApprovedState } from '@redcube/governance';
import {
  buildPptDetailedOutlineArtifact,
  buildPptSlideBlueprintArtifact,
  buildPptVisualDirectionArtifact,
} from '../ppt-structured-artifact-builders.js';
import { createPptDeckAuthoringParts } from './authoring.js';
import { createPptDeckStageParts } from './stages.js';
import { createPptDeckSurfaceParts } from './surface.js';
import { createPptDeckCoreHelpers } from './core-helpers.js';
import { createPptDeckProfilePresetParts } from './core-profile-presets.js';
import { createPptRenderReviewMachineGateBuilder } from './render-review-machine-gate.js';
import {
  ALLOWED_RECIPE_IDS,
  BANNED_RENDER_TOKENS,
  CANVAS,
  CREATIVE_MATERIALIZED_FROM,
  DEFAULT_TYPOGRAPHY_PLAN,
  HARD_SCREENSHOT_BLOCKING_ISSUES,
  MIN_REVIEW_PRIMARY_POINTS,
  MIN_REVIEW_QA_BLOCKS,
  PAGE_FIX_ROUTE,
  PPT_PAGE_LIBRARY,
  PROMPT_PACK,
  RENDER_HTML_BATCH_SIZE,
  RENDER_REFERENCE_SLIDE_WINDOW,
  ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE,
  SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID,
  SCREENSHOT_REVIEW_BATCH_SIZE,
  STAGE_REQUIREMENTS,
  TARGETED_RENDER_HTML_BATCH_SIZE,
  TARGETED_SCREENSHOT_MECHANICAL_ISSUES,
  TARGETED_SCREENSHOT_RERUN_CHECKS,
} from './core-constants.js';

/**
 * @typedef {{
 *   status?: string,
 *   artifact_refs?: string[],
 *   review_state_patch?: {
 *     current_status?: string,
 *     ready_for_export?: boolean,
 *     latest_review_stage?: string,
 *     pending_reviews?: string[],
 *     blocking_reasons?: string[],
 *     rerun_from_stage?: string | null,
 *     rerun_policy?: {
 *       status?: string,
 *       rerun_from_stage?: string | null,
 *     },
 *   },
 *   html_bundle?: {
 *     html_file?: string,
 *     page_count?: number,
 *   },
 *   export_bundle?: {
 *     pptx_file?: string,
 *     pdf_file?: string,
 *     page_count?: number,
 *   },
 * }} PptRouteArtifact
 */

export function createPptDeckRuntimeCore() {
  const MODULE_DIR = import.meta.dirname;
  const REPO_ROOT = path.resolve(MODULE_DIR, '../../../../../..');
  const PYTHON_REVIEW = resolvePythonNativeHelper(REPO_ROOT, 'ppt_deck_review');
  const PYTHON_EXPORT = resolvePythonNativeHelper(REPO_ROOT, 'ppt_deck_export');
  const PYTHON_NATIVE = resolvePythonNativeHelper(REPO_ROOT, 'ppt_deck_native');
  const NATIVE_PPT_ENGINE_CONTRACT = path.join(REPO_ROOT, 'contracts/runtime-program/ppt-native-python-engine-contract.json');

  const {
    safeText,
    safeArray,
    chunkArray,
    normalizeInlineText,
    escapeHtml,
    escapeHtmlAttribute,
    escapeTemplate,
    countMatches,
    upsertHtmlAttribute,
    hydrateRenderedSlideRootMetadata,
    validateRenderedReviewAnchors,
    buildDeckHtml,
    ensureDir,
    writeJson,
    writeText,
    readJson,
    safeFileMtimeMs,
    stageArtifactMtimeMs,
    formatTimestamp,
    stageArtifactPath,
    readStageArtifact,
    currentHtmlStageId,
    readCurrentHtmlArtifact,
    promptMeta,
    resolvePromptPackAsset,
    readPromptPackText,
    renderSeedValue,
    promptSeed,
    promptPackJsonSection,
    promptArtifact,
    isOperatorContextMaterial,
    sharedSourceTruth,
    sharedSourceReadinessPack,
    sharedSourceMaterials,
    sharedOperatorMaterials,
    audienceFacingMaterials,
    audienceFacingTextLines,
    extractAudienceFacingSnippet,
    sharedSourceMaterialIds,
    sharedSourceLabels,
    sharedSourceSnippet,
    sharedSourceInputMode,
    sharedSourceConfidence,
    sharedSourceSufficiencyStatus,
    sharedSourceDeepResearchState,
    sharedFactLibrarySummary,
    sharedSourceAudience,
    resolveSpeakerIdentity,
  } = createPptDeckCoreHelpers({
    REPO_ROOT,
    PROMPT_PACK,
    STAGE_REQUIREMENTS,
    MIN_REVIEW_QA_BLOCKS,
    MIN_REVIEW_PRIMARY_POINTS,
    PAGE_FIX_ROUTE,
  });

  const surfaceParts = createPptDeckSurfaceParts({
    ensureDir,
    existsSync,
    formatTimestamp,
    getDeliverablePaths,
    readCurrentHtmlArtifact,
    readJson,
    safeArray,
    safeFileMtimeMs,
    safeText,
    isOperatorContextMaterial,
    sharedSourceTruth,
    stageArtifactPath,
    writeJson,
    writeText,
  });
  const {
    appendArtifactRefs,
    attachRouteReviewReset,
    createReviewCapturePaths,
    getDeliverableViewSurfacePaths,
    loadOperatorRevisionBrief,
    seedDeliverableStableViews,
    syncPptCanonicalSurface,
  } = surfaceParts;
  const {
    deckPreset,
    deriveProfileChecks,
    extraChecks,
    pageBudget,
  } = createPptDeckProfilePresetParts({
    safeArray,
    safeText,
  });
  const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());

  function requireCodexAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    const requested = safeText(adapter, CODEX_DEFAULT_ADAPTER);
    if (requested !== CODEX_DEFAULT_ADAPTER) {
      throw new Error(`Unsupported executor adapter: ${requested}`);
    }
  }

  function executionModelForAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    requireCodexAdapter(adapter);
    return CODEX_EXECUTION_MODEL;
  }

  function creativeOwner(generationRuntime = null) {
    return safeText(generationRuntime?.creative_owner)
      || safeText(generationRuntime?.owner)
      || CODEX_DEFAULT_ADAPTER;
  }

  function primarySurface(generationRuntime = null) {
    return safeText(generationRuntime?.primary_surface)
      || safeText(generationRuntime?.adapter_surface)
      || 'codex_cli_runtime';
  }

  function runtimeCreativeSource(
    protectedSurface,
    artifactSource,
    generationRuntime = null,
  ) {
    return {
      owner: creativeOwner(generationRuntime),
      primary_surface: primarySurface(generationRuntime),
      stage_owner: primarySurface(generationRuntime),
      ownership_model: 'director_first',
      authored_surface: protectedSurface,
      materialized_from: artifactSource,
    };
  }

  function creativeSourceStamp({
    route,
    lifecycleStage,
    authoredSurface,
    materializedFrom = 'prompt_pack_seed',
    generationRuntime = null,
  }) {
    return {
      ...runtimeCreativeSource(authoredSurface, materializedFrom, generationRuntime),
      route,
      lifecycle_stage: lifecycleStage,
      authored_surface: authoredSurface,
      materialized_from: materializedFrom,
    };
  }

  function creativeExecution(routeOrLifecycleStage, generationRuntime = null) {
    return {
      owner: creativeOwner(generationRuntime),
      primary_surface: primarySurface(generationRuntime),
      lifecycle_stage: routeOrLifecycleStage,
      ownership_model: 'director_first',
      ...(generationRuntime ? { generation_runtime: generationRuntime } : {}),
    };
  }

  async function generateStructuredArtifact({
    adapter = CODEX_DEFAULT_ADAPTER,
    ...input
  }) {
    requireCodexAdapter(adapter);
    return generateStructuredArtifactViaCodexCli(input);
  }

  async function generateStructuredArtifactBatch({
    adapter = CODEX_DEFAULT_ADAPTER,
    stages = [],
    ...input
  }) {
    requireCodexAdapter(adapter);
    return generateStructuredArtifactBatchViaCodexCli({ stages, ...input });
  }
  
  function lifecycleStageForRoute(contract, route) {
    return contract?.lifecycle_model?.route_to_stage?.[route] || null;
  }
  
  function stageOrder(contract, stageId) {
    const stages = [
      ...safeArray(contract?.stage_sequence?.stages),
      ...safeArray(contract?.stage_sequence?.alternate_stages),
    ];
    return stages.findIndex((stage) => stage?.stage_id === stageId);
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
  
  function slideNeedsTargetedRevision(slide) {
    if (!slide || typeof slide !== 'object') return false;
    if (safeText(slide?.status) === 'block') return true;
    if (hasAiVisualBlock(slide?.ai_review)) return true;
    const mechanicalIssues = safeArray(slide?.mechanical_issues).length > 0
      ? safeArray(slide?.mechanical_issues)
      : safeArray(slide?.issues);
    if (mechanicalIssues.some((issue) => safeText(issue) === 'page_number_consistency_failed')) {
      return true;
    }
    const aiJudgement = normalizeAiVisualJudgement(slide?.ai_review?.judgement);
    const recommendedFix = safeText(slide?.ai_review?.recommended_fix).toLowerCase();
    if (
      safeText(slide?.status) === 'pass'
      && aiJudgement === 'pass'
      && (!recommendedFix || recommendedFix === 'none')
    ) {
      return false;
    }
    return mechanicalIssues.some((issue) => TARGETED_SCREENSHOT_MECHANICAL_ISSUES.has(safeText(issue)));
  }
  
  function collectSlidesNeedingTargetedRevision(slideReviews) {
    return safeArray(slideReviews)
      .filter((slide) => slideNeedsTargetedRevision(slide))
      .filter((slide) => safeText(slide?.slide_id));
  }
  
  function deriveScreenshotReviewRerunStage(contract, failedChecks, slideReviews) {
    const normalizedFailedChecks = safeArray(failedChecks).map((check) => safeText(check)).filter(Boolean);
    if (normalizedFailedChecks.length === 0) return null;
    const targetedSlides = collectSlidesNeedingTargetedRevision(slideReviews);
    const onlyPageLevelFailures = normalizedFailedChecks.every((check) => TARGETED_SCREENSHOT_RERUN_CHECKS.has(check));
    if (onlyPageLevelFailures && targetedSlides.length > 0) {
      return PAGE_FIX_ROUTE;
    }
    return rerunStageFromReviewSurface(contract, normalizedFailedChecks, 'render_html');
  }
  
  function reviewOverlayForRoute(contract, route) {
    return contract?.lifecycle_model?.review_overlay_routes?.[route] || null;
  }

  function refSegment(value, fallback) {
    return safeText(value, fallback).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
  }

  function routeOwnerReceiptRef(route, contract) {
    return `rca-owner-receipt:visual-stage:ppt_deck:${refSegment(route, 'route')}:${refSegment(contract?.deliverable_id, 'deliverable')}`;
  }

  function routeTypedBlockerRef(route, contract) {
    return `rca-typed-blocker:visual-stage:ppt_deck:${refSegment(route, 'route')}:${refSegment(contract?.deliverable_id, 'deliverable')}`;
  }
  
  function attachCommon(route, contract, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    return {
      route,
      overlay: contract.overlay,
      profile_id: contract.profile_id,
      produced_at: new Date().toISOString(),
      prompt_pack: promptMeta(route),
      lifecycle_stage: lifecycleStageForRoute(contract, route),
      review_overlay: reviewOverlayForRoute(contract, route),
      execution_model: generationRuntime?.execution_model || executionModelForAdapter(adapter),
      owner_receipt_refs: [routeOwnerReceiptRef(route, contract)],
      typed_blocker_refs: [routeTypedBlockerRef(route, contract)],
    };
  }
  
  function requireText(value, label) {
    const text = safeText(value);
    if (!text) {
      throw new Error(`Missing ${label} in upstream ppt generation output`);
    }
    return text;
  }
  
  function normalizeStringList(value, label, { min = 1, max = 6 } = {}) {
    const list = safeArray(value)
      .map((item) => safeText(item))
      .filter(Boolean)
      .slice(0, max);
    if (list.length < min) {
      throw new Error(`Missing ${label} in upstream ppt generation output`);
    }
    return list;
  }
  
  function normalizePptScreenshotAiSlideReviews(value, mechanicalSlideReviews) {
    const expectedSlideIds = new Set(mechanicalSlideReviews.map((slide) => slide.slide_id));
    const reviews = safeArray(value).map((item, index) => {
      const slideId = requireText(item?.slide_id, `screenshot_review.slide_reviews[${index}].slide_id`);
      if (!expectedSlideIds.has(slideId)) {
        throw new Error(`Unexpected screenshot_review.slide_reviews[${index}].slide_id: ${slideId}`);
      }
      const rawJudgement = safeText(item?.judgement, 'pass');
      const judgement = normalizeAiVisualJudgement(rawJudgement);
      if (!['pass', 'block'].includes(judgement)) {
        throw new Error(`Invalid screenshot_review.slide_reviews[${index}].judgement: ${rawJudgement}`);
      }
      return {
        slide_id: slideId,
        judgement,
        visual_findings: normalizeStringList(
          item?.visual_findings,
          `screenshot_review.slide_reviews[${index}].visual_findings`,
          { min: 1, max: 4 },
        ),
        recommended_fix: safeText(item?.recommended_fix, judgement === 'pass' ? 'none' : 'revise_render_html'),
      };
    });
    if (reviews.length !== mechanicalSlideReviews.length) {
      throw new Error('screenshot_review.slide_reviews 必须覆盖全部截图页');
    }
    const covered = new Set(reviews.map((item) => item.slide_id));
    for (const slideId of expectedSlideIds) {
      if (!covered.has(slideId)) {
        throw new Error(`Missing screenshot_review.slide_reviews entry for ${slideId}`);
      }
    }
    return reviews;
  }
  
  function hasAiVisualPass(aiReview) {
    return normalizeAiVisualJudgement(aiReview?.judgement) === 'pass';
  }
  
  function hasAiVisualBlock(aiReview) {
    return normalizeAiVisualJudgement(aiReview?.judgement) === 'block';
  }
  
  function normalizeAiVisualJudgement(value) {
    const raw = safeText(value, 'pass').toLowerCase();
    if (['block', 'revise', 'fail', 'failed', 'reject', 'rejected', 'needs_revision', 'needs_rewrite'].includes(raw)) {
      return 'block';
    }
    if (['pass', 'ok', 'approved', 'approve', 'weak', 'minor', 'advisory', 'warn', 'warning', 'soft_pass', 'pass_with_minor_watch', 'pass_with_warnings', 'minor_watch'].includes(raw)) {
      return 'pass';
    }
    return raw;
  }
  
  function buildAiFirstVisualSlideReview(slide, aiReview) {
    const mechanicalIssues = safeArray(slide?.issues);
    const hardMechanicalIssues = mechanicalIssues.filter((issue) => HARD_SCREENSHOT_BLOCKING_ISSUES.has(issue));
    const aiIssues = hasAiVisualBlock(aiReview) ? ['ai_visual_risk'] : [];
    return {
      ...slide,
      status: hardMechanicalIssues.length === 0 && aiIssues.length === 0 ? 'pass' : 'block',
      issues: [...hardMechanicalIssues, ...aiIssues],
      mechanical_issues: mechanicalIssues,
      ai_review: aiReview || null,
    };
  }
  
  function aiFirstMechanicalCheckValue(slideReviews, checkKey) {
    return safeArray(slideReviews).every((slide) => Boolean(slide?.checks?.[checkKey]));
  }

  const buildRenderReviewMachineGate = createPptRenderReviewMachineGateBuilder({ safeArray, safeText });
  
  function validateRenderedSlideContent(content, slideId) {
    const html = requireText(content, `render_html.slides[${slideId}].content_html`);
    if (!/data-slide-root=(["'])true\1/.test(html)) {
      throw new Error(`ppt render_html slide missing data-slide-root=true: ${slideId}`);
    }
    if (!new RegExp(`data-slide-id=(["'])${slideId}\\1`).test(html)) {
      throw new Error(`ppt render_html slide missing matching data-slide-id: ${slideId}`);
    }
    if (/<script\b/i.test(html)) {
      throw new Error(`ppt render_html slide contains forbidden script tag: ${slideId}`);
    }
    if (/<style\b/i.test(html)) {
      throw new Error(`ppt render_html slide contains forbidden style tag: ${slideId}`);
    }
    const visibleText = html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const leakedMarker = [
      /\bspeaker_notes\b/i,
      /\btransition_sentence\b/i,
      /\bpage_goal\b/i,
      /\bpage_objective\b/i,
      /\bvisual_anchor_tracks\b/i,
      /\bsource_id\b/i,
      /\bmaterial_id\b/i,
      /\bPaper\s*00[1-4]\b/i,
      /\b00[1-4]\b/,
      /\bSRC-(?:FILE|OP|BRIEF|KEYWORDS|AUG)?-?\d*\b/i,
      /\bMAT-\d+\b/i,
      /建议怎么讲|建议表达|来源口径|可发表表达|发表表达边界|待确认的写作口径|写作口径/,
      /讲稿\s*备忘录|讲者备注|演讲备注|讲稿备注|提醒讲者|怎么讲这一页/,
      /讲稿备忘录/,
      /内部管理编号/,
      /制作目标\s*[：:]/,
    ].find((pattern) => pattern.test(visibleText));
    if (leakedMarker) {
      throw new Error(`ppt render_html slide contains audience-visible authoring metadata: ${slideId}`);
    }
    return html;
  }
  
  const authoringParts = createPptDeckAuthoringParts({
    ALLOWED_RECIPE_IDS,
    CREATIVE_MATERIALIZED_FROM,
    DEFAULT_TYPOGRAPHY_PLAN,
    PROMPT_PACK,
    PPT_PAGE_LIBRARY,
    attachCommon,
    audienceFacingMaterials,
    audienceFacingTextLines,
    creativeExecution,
    deckPreset,
    extractAudienceFacingSnippet,
    generateStructuredArtifact,
    lifecycleStageForRoute,
    normalizeStringList,
    pageBudget,
    requireText,
    resolveSpeakerIdentity,
    runtimeCreativeSource,
    safeArray,
    safeText,
    sharedFactLibrarySummary,
    sharedOperatorMaterials,
    sharedSourceAudience,
    sharedSourceConfidence,
    sharedSourceDeepResearchState,
    sharedSourceInputMode,
    sharedSourceLabels,
    sharedSourceMaterialIds,
    sharedSourceSufficiencyStatus,
  });
  const stageParts = createPptDeckStageParts({
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PAGE_FIX_ROUTE,
    PROMPT_PACK,
    NATIVE_PPT_ENGINE_CONTRACT,
    PYTHON_EXPORT,
    PYTHON_NATIVE,
    PYTHON_REVIEW,
    RENDER_HTML_BATCH_SIZE,
    RENDER_REFERENCE_SLIDE_WINDOW,
    SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID,
    SCREENSHOT_REVIEW_BATCH_SIZE,
    STAGE_REQUIREMENTS,
    TARGETED_RENDER_HTML_BATCH_SIZE,
    aiFirstMechanicalCheckValue,
    attachCommon,
    buildAiFirstVisualSlideReview,
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
    ensureDir,
    existsSync,
    extraChecks,
    generateStructuredArtifact,
    generateStructuredArtifactBatch,
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
    primarySurface,
    readCurrentHtmlArtifact,
    readJson,
    readPromptPackText,
    readStageArtifact,
    requireText,
    resolvePromptPackAsset,
    resolveRedCubePythonCommand,
    safeArray,
    safeFileMtimeMs,
    safeText,
    seedDeliverableStableViews,
    stageArtifactMtimeMs,
    stageArtifactPath,
    summarizeRelativeQuality,
    validateRenderedReviewAnchors,
    validateRenderedSlideContent,
    writeJson,
    writeText,
    ...authoringParts,
  });

  return {
    CODEX_DEFAULT_ADAPTER,
    CANVAS,
    BANNED_RENDER_TOKENS,
    CREATIVE_MATERIALIZED_FROM,
    PAGE_FIX_ROUTE,
    ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE,
    appendArtifactRefs,
    attachCommon,
    attachRouteReviewReset,
    buildSourceTruthConsumptionSummary,
    getDeliverablePaths,
    lifecycleStageForRoute,
    readCurrentHtmlArtifact,
    readStageArtifact,
    safeArray,
    sharedSourceConfidence,
    sharedSourceLabels,
    syncPptCanonicalSurface,
    authoringParts,
    stageParts,
  };
}
