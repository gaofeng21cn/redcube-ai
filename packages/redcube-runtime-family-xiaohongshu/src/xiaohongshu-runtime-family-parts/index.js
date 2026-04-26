import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import {
  generateStructuredArtifactBatchViaCodexCli,
  generateStructuredArtifactViaCodexCli,
} from '@redcube/codex-cli-client';
import {
  buildSourceTruthConsumptionSummary,
  getDeliverablePaths,
  resolvePythonNativeHelper,
  runRedCubePythonHelper,
} from '@redcube/runtime-protocol';
import {
  CODEX_DEFAULT_ADAPTER,
  HERMES_NATIVE_PROOF_ADAPTER,
  buildCodexExecutionModel,
  buildHermesNativeProofExecutionModel,
  generateStructuredArtifactViaHermesNativeProof,
} from '@redcube/hermes-substrate';
import { compareFailuresAndDensity, summarizeRelativeQuality } from '@redcube/reference-os';
import { getReviewState, isBaselineApprovedState } from '@redcube/governance';

import * as shared from './shared.js';
import * as support from './support.js';
import { createXiaohongshuAuthoringParts } from './authoring.js';
import { createXiaohongshuRenderParts } from './render.js';
import { createXiaohongshuReviewParts } from './review.js';
import { createXiaohongshuDeliveryParts } from './delivery.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../../..');
const PYTHON_REVIEW = resolvePythonNativeHelper(REPO_ROOT, 'ppt_deck_review');
const CANVAS = { ratio: '3:4', width: 448, height: 597 };

const LIFECYCLE_STAGE_BY_ROUTE = Object.freeze({
  research: 'source_readiness',
  storyline: 'story_architecture',
  single_note_plan: 'story_architecture',
  visual_direction: 'visual_authorship',
  render_html: 'visual_authorship',
  fix_html: 'visual_authorship',
  visual_director_review: 'review_overlay',
  screenshot_review: 'review_overlay',
  publish_copy: 'delivery_packaging',
  export_bundle: 'delivery_packaging',
});

const ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE = Object.freeze({
  research: 'source_readiness',
  storyline: 'story_architecture',
  single_note_plan: 'story_architecture',
  visual_direction: 'visual_authorship',
  fix_html: 'visual_authorship',
});

const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());
const HERMES_NATIVE_PROOF_EXECUTION_MODEL = Object.freeze(buildHermesNativeProofExecutionModel());
const CREATIVE_MATERIALIZED_FROM = 'codex_cli_json_output';

function executionModelForAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
  return adapter === HERMES_NATIVE_PROOF_ADAPTER
    ? HERMES_NATIVE_PROOF_EXECUTION_MODEL
    : CODEX_EXECUTION_MODEL;
}

function creativeOwner(generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
  if (shared.safeText(generationRuntime?.creative_owner)) {
    return shared.safeText(generationRuntime.creative_owner);
  }
  return adapter === HERMES_NATIVE_PROOF_ADAPTER ? HERMES_NATIVE_PROOF_ADAPTER : 'host_agent';
}

function primarySurface(generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
  if (shared.safeText(generationRuntime?.primary_surface)) {
    return shared.safeText(generationRuntime.primary_surface);
  }
  return adapter === HERMES_NATIVE_PROOF_ADAPTER
    ? 'hermes_native_full_agent_loop'
    : 'codex_native_host_agent';
}

async function generateStructuredArtifact({
  adapter = CODEX_DEFAULT_ADAPTER,
  ...input
}) {
  if (adapter === HERMES_NATIVE_PROOF_ADAPTER) {
    return generateStructuredArtifactViaHermesNativeProof(input);
  }
  return generateStructuredArtifactViaCodexCli(input);
}

async function generateStructuredArtifactBatch({
  adapter = CODEX_DEFAULT_ADAPTER,
  ...input
}) {
  if (adapter === HERMES_NATIVE_PROOF_ADAPTER) {
    const data = [];
    for (const stage of shared.safeArray(input.stages)) {
      const stageInput = typeof stage === 'function'
        ? {
            ...await stage({ previousResults: data, stage_id: stage.stage_id }),
            stage_id: stage.stage_id,
          }
        : stage;
      const result = await generateStructuredArtifactViaHermesNativeProof(stageInput);
      data.push({
        stage_id: stageInput.stage_id,
        data: result.data,
        generationRuntime: result.generationRuntime,
      });
    }
    return {
      data,
      batchRuntime: {
        owner: shared.safeText(data[0]?.generationRuntime?.owner),
        session_pool: {
          reuse_supported: false,
          reuse_claimed: false,
          reuse_status: 'hermes_native_sequential_batch_fallback',
          invocation_count: data.length,
        },
      },
    };
  }
  return generateStructuredArtifactBatchViaCodexCli(input);
}

function runtimeCreativeSource(contractAsset, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
  return {
    owner: creativeOwner(generationRuntime, adapter),
    primary_surface: primarySurface(generationRuntime, adapter),
    stage_owner: primarySurface(generationRuntime, adapter),
    adapter,
    supporting_contract: shared.safeText(contractAsset, 'prompt_pack_seed'),
  };
}

function creativeExecution(route, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
  return {
    owner: creativeOwner(generationRuntime, adapter),
    primary_surface: primarySurface(generationRuntime, adapter),
    lifecycle_stage: LIFECYCLE_STAGE_BY_ROUTE[route] || null,
    ownership_model: 'director_first',
    ...(generationRuntime
      ? {
          generation_runtime: generationRuntime,
        }
      : {}),
  };
}

function creativeSourceStamp({
  route,
  lifecycleStage,
  authoredSurface,
  materializedFrom = 'prompt_pack_seed',
  generationRuntime = null,
  adapter = CODEX_DEFAULT_ADAPTER,
}) {
  return {
    ...runtimeCreativeSource(materializedFrom, generationRuntime, adapter),
    route,
    lifecycle_stage: lifecycleStage,
    authored_surface: authoredSurface,
    materialized_from: materializedFrom,
  };
}

function reviewAuthorship(overlay, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
  return {
    overlay,
    primary_surface: primarySurface(generationRuntime, adapter),
    contract_asset: 'prompt_pack_seed',
  };
}

function attachCommon(route, contract, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
  return {
    overlay: contract.overlay,
    route,
    profile_id: contract.profile_id,
    produced_at: new Date().toISOString(),
    lifecycle_stage: LIFECYCLE_STAGE_BY_ROUTE[route] || null,
    execution_model: generationRuntime?.execution_model || executionModelForAdapter(adapter),
    prompt_pack: support.promptMeta(contract, route),
  };
}

function ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const contract = shared.readJson(path.join(deliverablePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
  const required = shared.safeArray(contract?.stage_requirements?.[route]?.requires_artifacts);
  const missing = required.filter((stageId) => !shared.readStageArtifact(contract, deliverablePaths, stageId));
  if (missing.length > 0) {
    throw new Error(`Route ${route} requires completed stage artifacts: ${missing.join(', ')}`);
  }
  if (route === 'publish_copy' || route === 'export_bundle') {
    const reviewArtifact = shared.readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    if (!reviewArtifact || reviewArtifact.status !== 'pass') {
      throw new Error(`Route ${route} requires screenshot_review to pass before export`);
    }
  }
  const currentHtmlStage = shared.currentHtmlStageId(contract, deliverablePaths);
  const currentHtmlMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, currentHtmlStage));
  if (route === shared.PAGE_FIX_ROUTE) {
    const screenshotReviewMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
    if (screenshotReviewMtimeMs < currentHtmlMtimeMs) {
      throw new Error('Route fix_html requires screenshot_review based on the current HTML; rerun screenshot_review first');
    }
  }
  if (route === 'screenshot_review') {
    const directorReviewArtifact = shared.readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    if (!directorReviewArtifact || directorReviewArtifact.status !== 'pass') {
      throw new Error('Route screenshot_review requires visual_director_review to pass before audit');
    }
    const directorReviewMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, 'visual_director_review'));
    if (directorReviewMtimeMs < currentHtmlMtimeMs) {
      throw new Error('Route screenshot_review requires visual_director_review to be rerun after the latest HTML changes');
    }
  }
  if (route === 'screenshot_review' && mode === 'optimize_existing' && !shared.safeText(baselineDeliverableId)) {
    throw new Error('screenshot_review requires baselineDeliverableId in optimize_existing mode');
  }
  if (route === 'screenshot_review' && mode === 'optimize_existing' && shared.safeText(baselineDeliverableId)) {
    const baselineState = getReviewState({
      workspaceRoot,
      topicId,
      deliverableId: baselineDeliverableId,
    }).state;
    if (!isBaselineApprovedState(baselineState)) {
      throw new Error(`Baseline deliverable is not approved: ${baselineDeliverableId}`);
    }
  }
  if (route === 'publish_copy' || route === 'export_bundle') {
    const screenshotReviewMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
    if (screenshotReviewMtimeMs < currentHtmlMtimeMs) {
      throw new Error(`Route ${route} requires screenshot_review to be rerun after the latest HTML changes`);
    }
  }
  if (route === 'export_bundle') {
    const publishCopyMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, 'publish_copy'));
    const screenshotReviewMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
    if (publishCopyMtimeMs < screenshotReviewMtimeMs) {
      throw new Error('Route export_bundle requires publish_copy to be rerun after the latest screenshot_review');
    }
  }
  return { deliverablePaths, contract };
}

function syncCurrentCandidateHtmlFromStageArtifact(contract, deliverablePaths) {
  const currentArtifact = shared.readCurrentHtmlArtifact(contract, deliverablePaths);
  const candidateHtmlFile = shared.safeText(currentArtifact?.html_bundle?.html_file);
  if (!candidateHtmlFile) return [];
  return shared.syncCandidateHtml(shared.getDeliverableViewSurfacePaths(deliverablePaths), candidateHtmlFile);
}

function runPython(helper, args) {
  return runRedCubePythonHelper(helper, args, {
    fileExists: existsSync,
    missingMessagePrefix: 'Missing python helper',
    failureMessagePrefix: 'python helper failed',
  }).payload;
}

function computeBaselineReview(workspaceRoot, topicId, baselineDeliverableId, slideReviews) {
  const baselinePaths = getDeliverablePaths(workspaceRoot, topicId, baselineDeliverableId);
  const baselineContract = shared.readJson(path.join(baselinePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
  const baselineArtifact = shared.readStageArtifact(baselineContract, baselinePaths, 'screenshot_review');
  if (!baselineArtifact) {
    throw new Error(`Baseline screenshot review artifact missing: ${baselineDeliverableId}`);
  }
  const currentFailures = slideReviews.filter((slide) => shared.safeArray(slide.issues).length > 0).length;
  const baselineFailures = shared.safeArray(baselineArtifact.slide_reviews).filter((slide) => shared.safeArray(slide.issues).length > 0).length;
  const currentDensity = slideReviews.reduce(
    (sum, slide) => sum + Number(slide.metrics?.occupied_ratio || 0),
    0,
  ) / Math.max(slideReviews.length, 1);
  const baselineDensity = shared.safeArray(baselineArtifact.slide_reviews).reduce(
    (sum, slide) => sum + Number(slide.metrics?.occupied_ratio || 0),
    0,
  ) / Math.max(shared.safeArray(baselineArtifact.slide_reviews).length, 1);
  const relativeQuality = compareFailuresAndDensity({
    currentFailures,
    baselineFailures,
    currentDensity,
    baselineDensity,
    densityTolerance: 0.2,
    densityDigits: 4,
    densityLabel: '平均占用率',
  });
  const passed = relativeQuality.verdict !== 'degraded';
  return {
    baseline_deliverable_id: baselineDeliverableId,
    current_failed_slides: currentFailures,
    baseline_failed_slides: baselineFailures,
    current_average_density: Number(currentDensity.toFixed(4)),
    baseline_average_density: Number(baselineDensity.toFixed(4)),
    baseline_comparison_passed: passed,
    relative_quality: relativeQuality,
    summary: summarizeRelativeQuality(relativeQuality),
  };
}

const runtimeDeps = {
  ...shared,
  ...support,
  CANVAS,
  CODEX_DEFAULT_ADAPTER,
  CREATIVE_MATERIALIZED_FROM,
  PYTHON_REVIEW,
  attachCommon,
  buildSourceTruthConsumptionSummary,
  computeBaselineReview,
  creativeExecution,
  creativeSourceStamp,
  generateStructuredArtifact,
  generateStructuredArtifactBatch,
  getDeliverablePaths,
  primarySurface,
  reviewAuthorship,
  runPython,
  syncCurrentCandidateHtmlFromStageArtifact,
};

const authoringParts = createXiaohongshuAuthoringParts(runtimeDeps);
const renderParts = createXiaohongshuRenderParts(runtimeDeps);
const reviewParts = createXiaohongshuReviewParts(runtimeDeps);
const deliveryParts = createXiaohongshuDeliveryParts(runtimeDeps);

export function canRunXiaohongshu(contract) {
  return contract?.deliverable_kind === 'xiaohongshu_note';
}

export async function runXiaohongshuRoute({
  workspaceRoot,
  topicId,
  deliverableId,
  route,
  contract,
  mode = 'draft_new',
  baselineDeliverableId = '',
  adapter = CODEX_DEFAULT_ADAPTER,
}) {
  const { deliverablePaths } = ensurePrerequisites({
    workspaceRoot,
    topicId,
    deliverableId,
    route,
    mode,
    baselineDeliverableId,
  });
  const stageContract = shared.safeArray(contract?.stage_sequence?.stages).find((stage) => stage?.stage_id === route) || null;
  const sourceTruthConsumptionRole = ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE[route] || '';
  const payload = await (async () => {
    switch (route) {
      case 'research':
        return authoringParts.buildResearch(contract, adapter);
      case 'storyline':
        return authoringParts.buildStoryline(workspaceRoot, contract, deliverablePaths, adapter);
      case 'single_note_plan':
        return authoringParts.buildSingleNotePlan(workspaceRoot, contract, deliverablePaths, adapter);
      case 'visual_direction':
        return authoringParts.buildVisualDirection(
          workspaceRoot,
          contract,
          deliverablePaths,
          mode,
          baselineDeliverableId,
          adapter,
        );
      case 'render_html':
        return renderParts.buildRenderHtml(workspaceRoot, contract, deliverablePaths, adapter);
      case 'fix_html':
        return renderParts.buildFixHtml(workspaceRoot, contract, deliverablePaths, adapter);
      case 'visual_director_review':
        return reviewParts.buildDirectorReview(workspaceRoot, contract, deliverablePaths, adapter);
      case 'screenshot_review':
        return reviewParts.buildScreenshotReview(
          workspaceRoot,
          topicId,
          contract,
          deliverablePaths,
          mode,
          baselineDeliverableId,
          adapter,
        );
      case 'publish_copy':
        return deliveryParts.buildPublishCopy(workspaceRoot, contract, deliverablePaths, adapter);
      case 'export_bundle':
        return deliveryParts.buildExportBundle(workspaceRoot, topicId, contract, deliverablePaths, adapter);
      default:
        throw new Error(`Unsupported xiaohongshu route: ${route}`);
    }
  })();
  return {
    overlay: contract.overlay,
    route,
    topic_id: topicId,
    deliverable_id: deliverableId,
    contract,
    stage_contract: stageContract,
    ...payload,
    ...(sourceTruthConsumptionRole
      ? {
          source_truth_consumption: buildSourceTruthConsumptionSummary(contract.shared_source_truth, {
            consumptionRole: sourceTruthConsumptionRole,
            defaultSourceLabels: support.sourceLabels(contract),
          }),
        }
      : {}),
  };
}
