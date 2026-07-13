// @ts-nocheck
import path from 'node:path';
import { existsSync } from 'node:fs';

import {
  generateStructuredArtifactBatchViaCodexCli,
  generateStructuredArtifactViaCodexCli,
} from '../../../executors/codex-caller.js';
import {
  buildSourceTruthConsumptionSummary,
  getDeliverablePaths,
  resolvePythonNativeHelper,
  runRedCubePythonHelper,
} from '@redcube/runtime-protocol';
import {
  CODEX_DEFAULT_ADAPTER,
  buildCodexExecutionModel,
} from '@redcube/runtime-protocol';
import { compareFailuresAndDensity, summarizeRelativeQuality } from '../../../relative-quality.js';
import { admitStageArtifactForProgress } from '../../../progress-first.js';
import { getReviewState, isBaselineApprovedState } from '@redcube/governance';

import * as shared from './shared.js';
import * as support from './support.js';
import { createXiaohongshuAuthoringParts } from './authoring.js';
import { createXiaohongshuImagePageParts } from './image-pages.js';
import { createXiaohongshuRenderParts } from './render.js';
import { createXiaohongshuReviewParts } from './review.js';
import { createXiaohongshuDeliveryParts } from './delivery.js';

const MODULE_DIR = import.meta.dirname;
const REPO_ROOT = path.resolve(MODULE_DIR, '../../../../../..');
const PYTHON_REVIEW = resolvePythonNativeHelper(REPO_ROOT, 'ppt_deck_review');
const CANVAS = { ratio: '3:4', width: 1086, height: 1448 };

const LIFECYCLE_STAGE_BY_ROUTE = Object.freeze({
  research: 'source_readiness',
  storyline: 'story_architecture',
  single_note_plan: 'story_architecture',
  visual_direction: 'visual_authorship',
  author_image_pages: 'visual_authorship',
  repair_image_pages: 'visual_authorship',
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
  author_image_pages: 'visual_authorship',
  repair_image_pages: 'visual_authorship',
  fix_html: 'visual_authorship',
});

const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());
const CREATIVE_MATERIALIZED_FROM = 'codex_cli_json_output';

function uniqueStrings(value) {
  return [...new Set(shared.safeArray(value).map((entry) => shared.safeText(entry)).filter(Boolean))];
}

function refSegment(value, fallback) {
  return shared.safeText(value, fallback).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
}

function isBlockedCloseoutStatus(status) {
  return ['block', 'blocked', 'failed'].includes(shared.safeText(status).toLowerCase());
}

function routeCloseoutRefs({ route, deliverableId, payload }) {
  const safeRoute = refSegment(route, 'route');
  const safeDeliverableId = refSegment(deliverableId, 'deliverable');
  if (isBlockedCloseoutStatus(payload?.status)) {
    return {
      owner_receipt_refs: [],
      typed_blocker_refs: [],
      quality_debt_refs: [`rca-quality-debt:visual-stage:xiaohongshu:${safeRoute}:${safeDeliverableId}`],
    };
  }
  const explicitOwnerRefs = uniqueStrings([
    ...shared.safeArray(payload?.owner_receipt_refs),
    ...shared.safeArray(payload?.receipt_refs),
  ]);
  return {
    owner_receipt_refs: explicitOwnerRefs.length > 0
      ? explicitOwnerRefs
      : [`rca-owner-receipt:visual-stage:xiaohongshu:${safeRoute}:${safeDeliverableId}`],
    typed_blocker_refs: [],
  };
}

function executionModelForAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
  requireCodexAdapter(adapter);
  return CODEX_EXECUTION_MODEL;
}

function requireCodexAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
  const requested = shared.safeText(adapter, CODEX_DEFAULT_ADAPTER);
  if (requested !== CODEX_DEFAULT_ADAPTER) {
    throw new Error(`Unsupported executor adapter: ${requested}`);
  }
}

function creativeOwner(generationRuntime = null) {
  if (shared.safeText(generationRuntime?.creative_owner)) {
    return shared.safeText(generationRuntime.creative_owner);
  }
  return CODEX_DEFAULT_ADAPTER;
}

function primarySurface(generationRuntime = null) {
  if (shared.safeText(generationRuntime?.primary_surface)) {
    return shared.safeText(generationRuntime.primary_surface);
  }
  return 'codex_cli_runtime';
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
  ...input
}) {
  requireCodexAdapter(adapter);
  return generateStructuredArtifactBatchViaCodexCli(input);
}

function runtimeCreativeSource(contractAsset, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
  return {
    owner: creativeOwner(generationRuntime),
    primary_surface: primarySurface(generationRuntime),
    stage_owner: primarySurface(generationRuntime),
    adapter,
    supporting_contract: shared.safeText(contractAsset, 'stage_prompt_and_attached_output_contract'),
  };
}

function creativeExecution(route, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
  return {
    owner: creativeOwner(generationRuntime),
    primary_surface: primarySurface(generationRuntime),
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
  materializedFrom = 'codex_cli_json_output',
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
    primary_surface: primarySurface(generationRuntime),
    contract_asset: 'stage_prompt_and_attached_output_contract',
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
  const required = shared.safeArray(contract?.stage_requirements?.[route]?.input_stage_refs)
    .filter((stageId) => !(route === 'visual_director_review' && stageId === 'author_image_pages'));
  const findings = [];
  const missing = required.filter((stageId) => !shared.readStageArtifact(contract, deliverablePaths, stageId));
  if (missing.length > 0) {
    findings.push(`missing_upstream_artifacts:${missing.join(',')}`);
  }
  if (route === 'publish_copy' || route === 'export_bundle') {
    const reviewArtifact = shared.readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    if (!reviewArtifact) {
      findings.push('screenshot_review_artifact_missing');
    }
  }
  const currentHtmlStage = shared.currentHtmlStageId(contract, deliverablePaths);
  const currentHtmlMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, currentHtmlStage));
  const currentVisualStage = shared.currentVisualStageId(contract, deliverablePaths);
  const currentVisualMtimeMs = shared.visualArtifactMtimeMs(contract, deliverablePaths);
  if (route === shared.PAGE_FIX_ROUTE) {
    const screenshotReviewMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
    if (screenshotReviewMtimeMs < currentHtmlMtimeMs) {
      findings.push('screenshot_review_stale_for_current_html');
    }
  }
  if (route === shared.IMAGE_REPAIR_ROUTE) {
    const screenshotReviewMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
    const authorMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, shared.IMAGE_AUTHOR_ROUTE));
    if (screenshotReviewMtimeMs < authorMtimeMs) {
      findings.push('screenshot_review_stale_for_current_image_pages');
    }
  }
  if (route === 'visual_director_review' && !currentVisualStage) {
    findings.push('current_visual_artifact_missing');
  }
  if (route === 'screenshot_review') {
    const directorReviewArtifact = shared.readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    if (!directorReviewArtifact) {
      findings.push('visual_director_review_artifact_missing');
    }
    const directorReviewMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, 'visual_director_review'));
    if (directorReviewMtimeMs < currentVisualMtimeMs) {
      findings.push('visual_director_review_stale_for_current_visual');
    }
  }
  if (route === 'screenshot_review' && mode === 'optimize_existing' && !shared.safeText(baselineDeliverableId)) {
    findings.push('baseline_deliverable_id_missing');
  }
  if (route === 'screenshot_review' && mode === 'optimize_existing' && shared.safeText(baselineDeliverableId)) {
    const baselineState = getReviewState({
      workspaceRoot,
      topicId,
      deliverableId: baselineDeliverableId,
    }).state;
    if (!isBaselineApprovedState(baselineState)) {
      findings.push(`baseline_not_approved:${baselineDeliverableId}`);
    }
  }
  if (route === 'publish_copy' || route === 'export_bundle') {
    const screenshotReviewMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
    if (screenshotReviewMtimeMs < currentVisualMtimeMs) {
      findings.push('screenshot_review_stale_for_current_visual');
    }
  }
  if (route === 'export_bundle') {
    const publishCopyMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, 'publish_copy'));
    const screenshotReviewMtimeMs = shared.safeFileMtimeMs(shared.stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
    if (publishCopyMtimeMs < screenshotReviewMtimeMs) {
      findings.push('publish_copy_stale_for_current_screenshot_review');
    }
  }
  return { deliverablePaths, contract, findings };
}

function isZeroArtifactHardFailure(error) {
  if (error?.requiresHumanConfirmation === true || error?.requiresExternalSecret === true) return true;
  if (['EACCES', 'EPERM'].includes(shared.safeText(error?.code))) return true;
  return ['executor_unavailable', 'codex_cli_unavailable', 'codex_cli_execution_blocked', 'permission_or_credential_boundary', 'authority_boundary_violation', 'stale_or_mismatched_stage_identity']
    .includes(shared.safeText(error?.hard_stop_kind));
}

function degradedRouteArtifact(route, error, findings) {
  const reasons = uniqueStrings([
    ...shared.safeArray(findings),
    ...shared.safeArray(error?.artifact?.normalization_findings),
    shared.safeText(error?.message || error, 'stage_output_requires_normalization'),
  ]);
  return admitStageArtifactForProgress({
    ...(error?.artifact && typeof error.artifact === 'object' ? error.artifact : {}),
    status: 'completed_with_quality_debt',
    route,
    stage_attempt_diagnostic: {
      error_name: shared.safeText(error?.name, 'Error'),
      error_message: shared.safeText(error?.message || error),
      failure_kind: shared.safeText(error?.failure_kind, 'normalization_or_materialization_quality_debt'),
    },
    normalization_findings: reasons,
    quality_debt: {
      status: 'recorded_non_blocking',
      reasons,
      blocks_stage_transition: false,
      blocks_visual_ready_claim: true,
      blocks_export_ready_claim: true,
    },
  }, { route });
}

function syncCurrentCandidateHtmlFromStageArtifact(contract, deliverablePaths) {
  const currentArtifact = shared.readCurrentHtmlArtifact(contract, deliverablePaths);
  const candidateHtmlFile = shared.safeText(currentArtifact?.html_bundle?.html_file);
  if (!candidateHtmlFile) return [];
  return shared.syncCandidateHtml(shared.getDeliverableViewSurfacePaths(deliverablePaths), candidateHtmlFile);
}

function runPython(helper, args) {
  return runRedCubePythonHelper(helper, args, {
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
const imagePageParts = createXiaohongshuImagePageParts(runtimeDeps);
const renderParts = createXiaohongshuRenderParts(runtimeDeps);
const reviewParts = createXiaohongshuReviewParts(runtimeDeps);
const deliveryParts = createXiaohongshuDeliveryParts(runtimeDeps);

export async function runXiaohongshuRouteParts({
  workspaceRoot,
  topicId,
  deliverableId,
  route,
  contract,
  mode = 'draft_new',
  baselineDeliverableId = '',
  adapter = CODEX_DEFAULT_ADAPTER,
}) {
  const { deliverablePaths, findings } = ensurePrerequisites({
    workspaceRoot,
    topicId,
    deliverableId,
    route,
    mode,
    baselineDeliverableId,
  });
  const stageContract = shared.safeArray(contract?.stage_sequence?.stages).find((stage) => stage?.stage_id === route) || null;
  const sourceTruthConsumptionRole = ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE[route] || '';
  let payload;
  try {
    payload = await (async () => {
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
      case 'author_image_pages':
        return imagePageParts.buildImagePagesArtifact({
          deliverableId,
          contract,
          deliverablePaths,
          route: 'author_image_pages',
          adapter,
        });
      case 'repair_image_pages':
        return imagePageParts.buildImagePagesArtifact({
          deliverableId,
          contract,
          deliverablePaths,
          route: 'repair_image_pages',
          adapter,
        });
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
  } catch (error) {
    if (isZeroArtifactHardFailure(error)) throw error;
    payload = degradedRouteArtifact(route, error, findings);
  }
  if (shared.safeArray(findings).length > 0) {
    payload = admitStageArtifactForProgress({
      ...payload,
      status: 'completed_with_quality_debt',
      quality_debt: {
        ...(payload?.quality_debt || {}),
        status: 'recorded_non_blocking',
        reasons: uniqueStrings([
          ...shared.safeArray(payload?.quality_debt?.reasons),
          ...findings,
        ]),
        blocks_stage_transition: false,
        blocks_visual_ready_claim: true,
        blocks_export_ready_claim: true,
      },
    }, { route });
  }
  const closeoutRefs = routeCloseoutRefs({ route, deliverableId, payload });
  return {
    overlay: contract.overlay,
    route,
    topic_id: topicId,
    deliverable_id: deliverableId,
    contract,
    stage_contract: stageContract,
    ...payload,
    ...closeoutRefs,
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
