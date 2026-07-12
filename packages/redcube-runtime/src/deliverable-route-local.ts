// @ts-nocheck
import { createHash } from 'node:crypto';
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import {
  canonicalStageForRoute,
  getDeliverablePaths,
  readStageFolderArtifact,
  stageFolderArtifactPath,
  stageFolderOutputPath,
  stageOrderForCanonicalStage,
  writeStageFolderArtifact,
} from '@redcube/runtime-protocol';
import { persistReviewStatePatch } from '@redcube/governance';
import { CODEX_DEFAULT_ADAPTER } from '@redcube/runtime-protocol';
import { hydrateDeliverableContract } from '@redcube/overlay-core';
import { getDefaultOverlayRegistry } from './default-registries.js';
import { resolveExecutorAdapter } from './executors/index.js';
import { loadSharedSourceTruth } from './shared-source-truth.js';
import { fileContentHash, helperOutputRefsForArtifact } from './stage-folder-helper-refs.js';
import {
  admitStageArtifactForProgress,
  authoringLaneForRoute,
  hasConsumableStageArtifact,
  lockedAuthoringLane,
  markQualityBudgetExhausted,
} from './progress-first.js';
import { safeText } from './runtime-utils.js';
import { runtimeCurrentnessReceipt } from './runtime-currentness.js';
function requireSafeSegment(name, value) {
  const text = String(value || '').trim();
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  if (/[\\/]/.test(text)) {
    throw new Error(`${name} 不能包含路径分隔符`);
  }
  if (text.includes('..')) {
    throw new Error(`${name} 不能包含父目录引用`);
  }
  return text;
}
function loadHydratedContract(deliverablePaths, storedDeliverable) {
  const contractRef = String(
    storedDeliverable?.hydrated_contract_ref || 'contracts/hydrated-deliverable.json',
  ).trim();
  const contractFile = path.join(deliverablePaths.deliverableDir, contractRef);
  return {
    contractFile,
    contract: JSON.parse(readFileSync(contractFile, 'utf-8')),
  };
}
const overlayRegistry = getDefaultOverlayRegistry();
const QUALITY_BUDGET_ROUTES = new Set([
  'render_html',
  'fix_html',
  'author_image_pages',
  'repair_image_pages',
  'visual_director_review',
  'screenshot_review',
]);
const QUALITY_BUDGET_OVERLAYS = new Set(['ppt_deck', 'xiaohongshu']);
function routeStageDefinitions(contract) {
  return [
    ...(Array.isArray(contract?.stage_sequence?.stages) ? contract.stage_sequence.stages : []),
    ...(Array.isArray(contract?.stage_sequence?.alternate_stages) ? contract.stage_sequence.alternate_stages : []),
  ];
}

function canonicalStageIdForRoute(route) {
  return canonicalStageForRoute(route);
}

function writeDeliverableSurfaceBundle({ deliverablePaths, hydratedContract, overlay }) {
  const overlayDefinition = overlayRegistry.getOverlay(overlay);
  if (typeof overlayDefinition?.buildSurfaceBundle !== 'function') {
    return;
  }
  for (const artifact of overlayDefinition.buildSurfaceBundle({ contract: hydratedContract })) {
    const targetFile = path.join(deliverablePaths.deliverableDir, artifact.relativePath);
    mkdirSync(path.dirname(targetFile), { recursive: true });
    writeFileSync(targetFile, JSON.stringify(artifact.content, null, 2), 'utf-8');
  }
}

function maybeRehydrateContractForRoute({
  deliverablePaths,
  storedDeliverable,
  overlay,
  topicId,
  deliverableId,
  route,
  baseContract,
}) {
  const hasRoute = routeStageDefinitions(baseContract).some((stage) => stage?.stage_id === route);
  if (hasRoute) return baseContract;

  const hydratedContract = hydrateDeliverableContract(overlayRegistry, {
    overlay,
    profileId: String(storedDeliverable?.profile_id || '').trim(),
    topicId,
    deliverableId,
    title: String(storedDeliverable?.title || '').trim(),
    goal: String(storedDeliverable?.goal || '').trim(),
  });
  const hydratedHasRoute = routeStageDefinitions(hydratedContract).some((stage) => stage?.stage_id === route);
  if (!hydratedHasRoute) {
    return baseContract;
  }
  writeDeliverableSurfaceBundle({ deliverablePaths, hydratedContract, overlay });
  return hydratedContract;
}

function loadRouteReadyContract({
  deliverablePaths,
  storedDeliverable,
  overlay,
  topicId,
  deliverableId,
  route,
  workspaceRoot,
}) {
  const { contract: storedContract } = loadHydratedContract(deliverablePaths, storedDeliverable);
  const routeReadyContract = maybeRehydrateContractForRoute({
    deliverablePaths,
    storedDeliverable,
    overlay,
    topicId,
    deliverableId,
    route,
    baseContract: storedContract,
  });
  return {
    ...routeReadyContract,
    shared_source_truth: loadSharedSourceTruth(workspaceRoot, topicId),
  };
}

function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function fileMtimeMs(file) {
  if (!file || !existsSync(file)) return 0;
  return Number(statSync(file).mtimeMs || 0);
}

function assertOplRouteAttemptBoundary(oplRouteAttemptIndex) {
  const index = oplRouteAttemptIndex && typeof oplRouteAttemptIndex === 'object' && !Array.isArray(oplRouteAttemptIndex)
    ? oplRouteAttemptIndex
    : null;
  const providerAttemptRef = safeText(index?.provider_attempt_ref || index?.providerAttemptRef);
  const providerAttemptLedgerRef = safeText(index?.provider_attempt_ledger_ref || index?.providerAttemptLedgerRef);
  const stageAttemptRef = safeText(index?.stage_attempt_ref || index?.stageAttemptRef || index?.opl_stage_attempt_ref || index?.oplStageAttemptRef);
  const attemptLeaseRef = safeText(index?.attempt_lease_ref || index?.attemptLeaseRef || index?.lease_ref || index?.leaseRef);
  const attemptReceiptRef = safeText(index?.attempt_receipt_ref || index?.attemptReceiptRef || index?.closeout_receipt_ref || index?.closeoutReceiptRef);
  if (
    safeText(index?.provider_attempt_owner || index?.providerAttemptOwner || index?.owner) === 'one-person-lab'
    && providerAttemptRef
    && providerAttemptLedgerRef
    && (stageAttemptRef || attemptLeaseRef || attemptReceiptRef)
  ) {
    return;
  }
  const error = new Error('RCA local deliverable route helper requires OPL-owned stage attempt, lease, or receipt evidence');
  error.code = 'missing_opl_stage_attempt';
  error.failure_kind = 'typed_blocker';
  error.blocking_reasons = ['opl_stage_attempt_or_lease_or_receipt_ref'];
  error.recommended_action = 'submit_route_to_opl_stage_attempt_or_record_domain_owned_typed_blocker';
  throw error;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(value) {
  return [...new Set(safeArray(value).map((item) => safeText(item)).filter(Boolean))];
}

function routeInputFingerprints(files) {
  return uniqueStrings(files).map((file) => ({
    file,
    sha256: fileContentHash(file),
  }));
}

function routeRequiresArtifacts(contract, route) {
  return (contract?.stage_requirements?.[route]?.requires_artifacts || [])
    .map((stageId) => String(stageId || '').trim())
    .filter(Boolean);
}

function stageArtifactFile(deliverablePaths, contract, stageId) {
  const stage = routeStageDefinitions(contract).find((item) => item?.stage_id === stageId);
  const canonicalStageId = canonicalStageIdForRoute(stageId);
  const loaded = readStageFolderArtifact({
    deliverablePaths,
    routeStageId: stageId,
    canonicalStageId,
  });
  if (loaded?.output_file && ['success', 'blocked'].includes(loaded.status)) {
    return loaded.output_file;
  }
  return stageFolderArtifactPath({
    deliverablePaths,
    domainId: 'redcube_ai',
    programId: deliverablePaths.programId,
    topicId: deliverablePaths.topicId,
    deliverableId: deliverablePaths.deliverableId,
    routeStageId: stageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
    outputName: String(stage?.output_artifact || `${stageId}.json`).trim(),
  });
}

function pptDraftViewFiles(deliverablePaths, deliverableId) {
  const safeDeliverableId = String(deliverableId || '').trim();
  if (!safeDeliverableId) return [];
  return [
    path.join(deliverablePaths.viewsDir, `${safeDeliverableId}.draft.html`),
    path.join(deliverablePaths.viewsDir, `${safeDeliverableId}.draft.slides.json`),
  ];
}

function pptOperatorRevisionFile(deliverablePaths) {
  return path.join(deliverablePaths.viewsDir, 'operator', '幻灯片', '当前返修要求.md');
}

function routeCacheDependencyFiles({ overlay, route, deliverablePaths, contract, deliverableId }) {
  const files = routeRequiresArtifacts(contract, route)
    .map((stageId) => stageArtifactFile(deliverablePaths, contract, stageId));
  const promptFile = safeText(contract?.prompt_pack?.routes?.[route]);
  if (promptFile) {
    files.push(path.resolve(promptFile));
  }
  if (overlay === 'ppt_deck') {
    if (['render_html', 'fix_html'].includes(route)) {
      files.push(pptOperatorRevisionFile(deliverablePaths));
    }
    if (['fix_html', 'repair_image_pages', 'repair_pptx_native'].includes(route)) {
      files.push(
        stageArtifactFile(deliverablePaths, contract, 'visual_director_review'),
        stageArtifactFile(deliverablePaths, contract, 'screenshot_review'),
      );
    }
    if (['visual_director_review', 'screenshot_review', 'export_pptx'].includes(route)) {
      files.push(
        stageArtifactFile(deliverablePaths, contract, 'render_html'),
        stageArtifactFile(deliverablePaths, contract, 'fix_html'),
        stageArtifactFile(deliverablePaths, contract, 'author_image_pages'),
        stageArtifactFile(deliverablePaths, contract, 'repair_image_pages'),
        stageArtifactFile(deliverablePaths, contract, 'author_pptx_native'),
        stageArtifactFile(deliverablePaths, contract, 'repair_pptx_native'),
      );
    }
    if (['visual_director_review', 'screenshot_review'].includes(route)) {
      files.push(...pptDraftViewFiles(deliverablePaths, deliverableId));
    }
  }
  if (overlay === 'xiaohongshu' && ['visual_director_review', 'screenshot_review', 'publish_copy', 'export_bundle'].includes(route)) {
    files.push(
      stageArtifactFile(deliverablePaths, contract, 'author_image_pages'),
      stageArtifactFile(deliverablePaths, contract, 'repair_image_pages'),
      stageArtifactFile(deliverablePaths, contract, 'render_html'),
      stageArtifactFile(deliverablePaths, contract, 'fix_html'),
    );
  }
  if (overlay === 'xiaohongshu' && ['repair_image_pages', 'fix_html'].includes(route)) {
    files.push(
      stageArtifactFile(deliverablePaths, contract, 'visual_director_review'),
      stageArtifactFile(deliverablePaths, contract, 'screenshot_review'),
    );
  }
  return Array.from(new Set(files));
}

function buildRouteCacheKey({
  overlay,
  route,
  topicId,
  deliverableId,
  contract,
  stageContract,
  userIntent,
  mode,
  baselineDeliverableId,
  adapter,
  requiredArtifactFiles = [],
}) {
  return createHash('sha256').update(stableJson({
    overlay,
    route,
    topicId,
    deliverableId,
    profile_id: contract?.profile_id || null,
    deliverable_kind: contract?.deliverable_kind || null,
    stage_contract: stageContract || null,
    shared_source_truth: contract?.shared_source_truth || null,
    prompt_pack: contract?.prompt_pack || null,
    review_surface: contract?.review_surface || null,
    delivery_contract: contract?.delivery_contract || null,
    delivery_request_constraints: contract?.delivery_request?.constraints || null,
    route_user_intent: safeText(userIntent),
    required_artifacts: routeRequiresArtifacts(contract, route),
    mode,
    baselineDeliverableId,
    adapter,
    input_fingerprints: routeInputFingerprints(requiredArtifactFiles),
  })).digest('hex');
}

function dependencyBecameNewerThanArtifact({ artifactFile, requiredArtifactFiles }) {
  const artifactMtimeMs = fileMtimeMs(artifactFile);
  if (artifactMtimeMs === 0) return true;
  return requiredArtifactFiles.some((file) => fileMtimeMs(file) > artifactMtimeMs);
}

function cacheHitArtifact({ artifactFile, artifact, routeCacheKey, requiredArtifactFiles }) {
  if (!artifact || artifact?.status === 'block' || artifact?.status === 'failed') return null;
  if (artifact?.route_cache?.cache_key !== routeCacheKey) return null;
  if (dependencyBecameNewerThanArtifact({ artifactFile, requiredArtifactFiles })) return null;
  return {
    ...artifact,
    route_cache: {
      ...(artifact.route_cache || {}),
      cache_status: 'hit',
      reused_from_artifact_file: artifactFile,
    },
  };
}

function collectFalseCheckIds(checks) {
  if (!checks || typeof checks !== 'object' || Array.isArray(checks)) return [];
  return Object.entries(checks)
    .filter(([, value]) => value === false)
    .map(([key]) => key);
}

function blockingSignatureForArtifact(artifact) {
  const slideReviews = safeArray(artifact?.slide_reviews);
  const blockedSlideReviews = slideReviews.filter((slide) => (
    safeText(slide?.status) === 'block'
    || safeArray(slide?.issues).length > 0
  ));
  const targetSlideIds = uniqueStrings([
    ...safeArray(artifact?.target_slide_ids),
    ...safeArray(artifact?.review_state_patch?.rerun_policy?.target_slide_ids),
    ...safeArray(artifact?.review_state_patch?.target_slide_ids),
    ...safeArray(artifact?.html_bundle?.repair_scope?.target_slide_ids),
    ...blockedSlideReviews.map((slide) => slide?.slide_id),
    ...safeArray(artifact?.ai_review?.weak_pages),
  ]);
  const blockedChecks = uniqueStrings([
    ...collectFalseCheckIds(artifact?.checks),
    ...safeArray(artifact?.issues),
    ...blockedSlideReviews.flatMap((slide) => safeArray(slide?.issues)),
  ]);
  const blockingReasons = uniqueStrings([
    ...safeArray(artifact?.blocking_reasons),
    ...safeArray(artifact?.review_state_patch?.blocking_reasons),
    ...safeArray(artifact?.review_state_patch?.rerun_policy?.blocking_reasons),
    ...blockedChecks,
  ]);
  return {
    target_slide_ids: targetSlideIds,
    blocked_checks: blockedChecks,
    blocking_reasons: blockingReasons.length > 0 ? blockingReasons : ['route_blocked'],
  };
}

function attachBlockingSignature(artifact) {
  if (!artifact || (artifact.status !== 'block' && artifact.status !== 'failed')) return artifact;
  return {
    ...artifact,
    blocking_signature: {
      contract: 'redcube_repeated_block_signature.v1',
      ...blockingSignatureForArtifact(artifact),
    },
  };
}

function readCachedRouteArtifact({ artifactFile, routeCacheKey, requiredArtifactFiles }) {
  if (!existsSync(artifactFile)) return null;
  return cacheHitArtifact({
    artifactFile,
    artifact: JSON.parse(readFileSync(artifactFile, 'utf-8')),
    routeCacheKey,
    requiredArtifactFiles,
  });
}

function readCachedStageFolderRouteArtifact({
  deliverablePaths,
  route,
  routeCacheKey,
  requiredArtifactFiles,
}) {
  const loaded = readStageFolderArtifact({
    deliverablePaths,
    routeStageId: route,
    canonicalStageId: canonicalStageIdForRoute(route),
  });
  if (loaded?.status !== 'success' || !loaded?.artifact) return null;
  const artifactFile = loaded.output_file;
  const cached = cacheHitArtifact({
    artifactFile,
    artifact: loaded.artifact,
    routeCacheKey,
    requiredArtifactFiles,
  });
  return cached ? {
    artifact: cached,
    artifact_file: loaded.output_file,
    artifact_refs: [loaded.output_file, loaded.manifest_file].filter(Boolean),
  } : null;
}

function refSegment(value, fallback) {
  return safeText(value, fallback).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
}

function ownerReceiptRefsForRoute({ artifact, overlay, route, deliverableId }) {
  if (['block', 'failed', 'completed_with_quality_debt'].includes(artifact?.status)) return [];
  const explicitRefs = uniqueStrings([
    ...safeArray(artifact?.owner_receipt_refs),
    ...safeArray(artifact?.receipt_refs),
  ]);
  if (explicitRefs.length > 0) return explicitRefs;
  return [`rca-owner-receipt:visual-stage:${refSegment(overlay, 'overlay')}:${refSegment(route, 'route')}:${refSegment(deliverableId, 'deliverable')}`];
}

function qualityDebtRefsForRoute({ artifact, overlay, route, deliverableId }) {
  if (artifact?.status !== 'completed_with_quality_debt') return [];
  const explicitRefs = uniqueStrings([
    ...safeArray(artifact?.quality_debt_refs),
    ...safeArray(artifact?.quality_debt?.debt_refs),
  ]);
  if (explicitRefs.length > 0) return explicitRefs;
  return [`rca-quality-debt:visual-stage:${refSegment(overlay, 'overlay')}:${refSegment(route, 'route')}:${refSegment(deliverableId, 'deliverable')}`];
}

function typedBlockerRefsForRoute({ artifact }) {
  if (artifact?.status !== 'block' && artifact?.status !== 'failed') return [];
  return uniqueStrings([
    ...safeArray(artifact?.typed_blocker_refs),
    ...safeArray(artifact?.blocker_refs),
    safeText(artifact?.blocker_ref),
  ]);
}

function reviewExportRefsForRoute(artifact) {
  return uniqueStrings([
    ...safeArray(artifact?.review_export_refs),
    ...safeArray(artifact?.review_refs),
    ...safeArray(artifact?.export_refs),
    safeText(artifact?.review_state_patch?.review_ref),
    safeText(artifact?.publish_bundle?.export_ref),
    safeText(artifact?.export_bundle?.export_ref),
  ]);
}

function attachRouteArtifactCloseoutRefs({ artifact, overlay, route, deliverableId }) {
  if (artifact?.status === 'block' || artifact?.status === 'failed') {
    return {
      ...artifact,
      owner_receipt_refs: [],
      typed_blocker_refs: uniqueStrings([
        ...safeArray(artifact?.typed_blocker_refs),
        ...safeArray(artifact?.blocker_refs),
        safeText(artifact?.blocker_ref),
      ]),
    };
  }
  return {
    ...artifact,
    owner_receipt_refs: ownerReceiptRefsForRoute({ artifact, overlay, route, deliverableId }),
    quality_debt_refs: qualityDebtRefsForRoute({ artifact, overlay, route, deliverableId }),
    typed_blocker_refs: [],
  };
}

export function refreshStageFolderRouteArtifact({
  deliverablePaths,
  overlay,
  topicId,
  deliverableId,
  route,
  attemptId,
  artifactFile,
  artifact,
  oplRouteAttemptIndex = null,
}) {
  const canonicalStageId = canonicalStageIdForRoute(route);
  return writeStageFolderArtifact({
    deliverablePaths,
    domainId: 'redcube_ai',
    programId: deliverablePaths.programId,
    topicId,
    deliverableId,
    routeStageId: route,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
    attemptId,
    artifactFile,
    outputName: path.basename(artifactFile),
    requiredOutputs: [path.basename(artifactFile)],
    ownerReceiptRefs: ownerReceiptRefsForRoute({ artifact, overlay, route, deliverableId }),
    qualityDebtRefs: qualityDebtRefsForRoute({ artifact, overlay, route, deliverableId }),
    typedBlockerRefs: typedBlockerRefsForRoute({ artifact }),
    blockingReasons: safeArray(artifact?.blocking_reasons),
    artifactRefs: safeArray(artifact?.artifact_refs),
    reviewExportRefs: reviewExportRefsForRoute(artifact),
    helperOutputRefs: helperOutputRefsForArtifact({ route, artifact }),
  });
}

function attachRouteCache(artifact, routeCacheKey, route) {
  const artifactWithBlockingSignature = attachBlockingSignature(artifact);
  const admittedArtifact = admitStageArtifactForProgress(artifactWithBlockingSignature, { route });
  return {
    ...admittedArtifact,
    route_cache: {
      cache_status: 'miss',
      cache_key: routeCacheKey,
      input_hash: routeCacheKey,
      contract: 'redcube_route_stage_cache.v1',
      reuse_policy: 'reuse_only_when_inputs_match_and_artifact_is_non_blocking',
    },
  };
}

function qualityBudgetEnabledForRoute({ overlay, route }) {
  return QUALITY_BUDGET_OVERLAYS.has(overlay)
    && QUALITY_BUDGET_ROUTES.has(route);
}

function buildRepeatedBlockFailFastArtifact({
  artifactFile,
  priorArtifact,
  routeCacheKey,
  route,
  overlay,
  topicId,
  deliverableId,
}) {
  const priorSignature = priorArtifact?.blocking_signature || blockingSignatureForArtifact(priorArtifact);
  const targetSlideIds = uniqueStrings(priorSignature?.target_slide_ids);
  const blockingReasons = uniqueStrings(priorSignature?.blocking_reasons);
  const blockedChecks = uniqueStrings(priorSignature?.blocked_checks);
  const repeatBudget = {
    max_repeats: 2,
    remaining_repeats: 0,
    budget_exhausted: true,
  };
  const stallLineage = {
    lineage_id: `repeated-block:${overlay}:${route}:${deliverableId}`,
    route,
    overlay,
    topic_id: topicId,
    deliverable_id: deliverableId,
    repeated_block_count: 2,
    repeat_budget: repeatBudget,
    target_slide_ids: targetSlideIds,
    blocking_reasons: blockingReasons,
    blocked_checks: blockedChecks,
  };
  return markQualityBudgetExhausted({
    ...priorArtifact,
    status: 'completed_with_quality_debt',
    failure_kind: null,
    typed_blocker_refs: [],
    blocker_ref: null,
    blocker_kind: null,
    route,
    overlay,
    topic_id: topicId,
    deliverable_id: deliverableId,
    target_slide_ids: targetSlideIds,
    blocking_reasons: blockingReasons,
    quality_budget_exhaustion: {
      schema_version: 1,
      status: 'exhausted_continue_with_best_artifact',
      route,
      overlay,
      target_slide_ids: targetSlideIds,
      blocking_reasons: blockingReasons,
      blocked_checks: blockedChecks,
      route_cache: {
        cache_key: routeCacheKey,
        input_hash: routeCacheKey,
        prior_artifact_file: artifactFile,
      },
      stall_lineage: stallLineage,
      repeat_budget: repeatBudget,
      recommended_action: 'continue_with_best_available_artifact',
      quality_gate_policy: 'retry_budget_improves_quality_and_never_blocks_transition',
    },
    stall_lineage: stallLineage,
    route_cache: {
      ...(priorArtifact.route_cache || {}),
      cache_status: 'quality_budget_exhausted',
      cache_key: routeCacheKey,
      input_hash: routeCacheKey,
      reused_from_artifact_file: artifactFile,
    },
  }, {
    route,
    attempts: repeatBudget.max_repeats,
  });
}

function readRepeatedBlockFailFastArtifact({
  artifactFile,
  deliverablePaths,
  routeCacheKey,
  requiredArtifactFiles,
  overlay,
  route,
  topicId,
  deliverableId,
}) {
  if (!qualityBudgetEnabledForRoute({ overlay, route })) return null;
  const loaded = readStageFolderArtifact({
    deliverablePaths,
    routeStageId: route,
    canonicalStageId: canonicalStageIdForRoute(route),
  });
  const priorArtifactFile = loaded?.artifact ? loaded.output_file : artifactFile;
  if (!existsSync(priorArtifactFile)) return null;
  const priorArtifact = loaded?.artifact || JSON.parse(readFileSync(priorArtifactFile, 'utf-8'));
  if (priorArtifact?.status !== 'block' && priorArtifact?.status !== 'failed') return null;
  if (priorArtifact?.route_cache?.cache_key !== routeCacheKey) return null;
  if (dependencyBecameNewerThanArtifact({ artifactFile: priorArtifactFile, requiredArtifactFiles })) return null;
  return buildRepeatedBlockFailFastArtifact({
    artifactFile: priorArtifactFile,
    priorArtifact,
    routeCacheKey,
    route,
    overlay,
    topicId,
    deliverableId,
  });
}

export function validateDeliverableRouteInput({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  route,
}) {
  const safeRoute = requireSafeSegment('route', route);
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const storedDeliverable = JSON.parse(
    readFileSync(deliverablePaths.deliverableFile, 'utf-8'),
  );

  if (storedDeliverable.overlay !== overlay) {
    throw new Error(
      `overlay mismatch: expected ${storedDeliverable.overlay}, got ${overlay}`,
    );
  }

  const contract = loadRouteReadyContract({
    deliverablePaths,
    storedDeliverable,
    overlay,
    topicId,
    deliverableId,
    route: safeRoute,
    workspaceRoot,
  });
  const requestedAuthoringLane = authoringLaneForRoute(safeRoute);
  const contractAuthoringLane = lockedAuthoringLane(contract);
  if (requestedAuthoringLane && contractAuthoringLane && requestedAuthoringLane !== contractAuthoringLane) {
    const error = new Error(
      `Route ${safeRoute} conflicts with authoring route lock ${contractAuthoringLane}; an explicit product-entry route selection is required to switch lanes`,
    );
    error.code = 'authoring_route_lock_mismatch';
    error.failure_kind = 'authority_boundary_violation';
    error.hard_stop_kind = 'authority_boundary_violation';
    throw error;
  }
  const stageContract = routeStageDefinitions(contract).find(
    (stage) => stage?.stage_id === safeRoute,
  ) || null;

  if (!stageContract) {
    throw new Error(`Route ${safeRoute} is not declared by hydrated deliverable contract`);
  }

  return {
    safeRoute,
  };
}

function objectRecord(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function attachRouteUserIntent(contract, userIntent) { const intent = safeText(userIntent); return intent ? { ...contract, user_intent: intent, userIntent: intent, delivery_request: { ...objectRecord(contract?.delivery_request), user_intent: intent, userIntent: intent }, route_request: { ...objectRecord(contract?.route_request), user_intent: intent } } : contract; }

export async function executeDeliverableRouteLocally({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  route,
  adapter = CODEX_DEFAULT_ADAPTER, userIntent = '',
  mode = 'draft_new',
  baselineDeliverableId = '',
  oplRouteAttemptIndex = null,
  runId = null,
}) {
  assertOplRouteAttemptBoundary(oplRouteAttemptIndex);
  const { safeRoute } = validateDeliverableRouteInput({
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    route,
  });
  const executor = resolveExecutorAdapter({
    adapter,
  });
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const storedDeliverable = JSON.parse(
    readFileSync(deliverablePaths.deliverableFile, 'utf-8'),
  );
  const contract = attachRouteUserIntent(loadRouteReadyContract({
    deliverablePaths,
    storedDeliverable,
    overlay,
    topicId,
    deliverableId,
    route: safeRoute,
    workspaceRoot,
  }), userIntent);
  const stageContract = routeStageDefinitions(contract).find(
    (stage) => stage?.stage_id === safeRoute,
  ) || null;
  const attemptId = safeText(oplRouteAttemptIndex?.stage_attempt_ref || oplRouteAttemptIndex?.stageAttemptRef)
    || safeText(oplRouteAttemptIndex?.attempt_lease_ref || oplRouteAttemptIndex?.attemptLeaseRef || oplRouteAttemptIndex?.lease_ref || oplRouteAttemptIndex?.leaseRef)
    || safeText(oplRouteAttemptIndex?.attempt_receipt_ref || oplRouteAttemptIndex?.attemptReceiptRef)
    || safeText(runId)
    || `attempt-${safeRoute}`;
  const canonicalStageId = canonicalStageIdForRoute(safeRoute);
  const artifactFile = stageFolderOutputPath({
    deliverablePaths,
    domainId: 'redcube_ai',
    programId: deliverablePaths.programId,
    topicId,
    deliverableId,
    routeStageId: safeRoute,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
    attemptId,
    outputName: String(stageContract.output_artifact || `${safeRoute}.json`).trim(),
  });
  const requiredArtifactFiles = routeCacheDependencyFiles({
    overlay,
    route: safeRoute,
    deliverablePaths,
    contract,
    deliverableId,
  });
  const routeCacheKey = buildRouteCacheKey({
    overlay,
    route: safeRoute,
    topicId,
    deliverableId,
    contract,
    stageContract,
    userIntent,
    mode,
    baselineDeliverableId,
    adapter: executor.adapter,
    requiredArtifactFiles,
  });

  const cachedStageArtifact = readCachedStageFolderRouteArtifact({
    deliverablePaths,
    route: safeRoute,
    routeCacheKey,
    requiredArtifactFiles,
  });
  const cachedArtifact = cachedStageArtifact?.artifact || readCachedRouteArtifact({
    artifactFile,
    routeCacheKey,
    requiredArtifactFiles,
  });
  if (cachedArtifact) {
    return {
      ok: true,
      route: safeRoute,
      overlay,
      topic_id: topicId,
      deliverable_id: deliverableId,
      artifact: cachedArtifact,
      artifact_file: cachedStageArtifact?.artifact_file || artifactFile,
      artifact_refs: Array.from(new Set([
        cachedStageArtifact?.artifact_file || artifactFile,
        ...(Array.isArray(cachedStageArtifact?.artifact_refs) ? cachedStageArtifact.artifact_refs : []),
        ...(Array.isArray(cachedArtifact?.artifact_refs) ? cachedArtifact.artifact_refs : []),
      ])),
      cache_status: 'hit',
      executor: {
        adapter: executor.adapter,
        primary: executor.primary,
        execution_surface: executor.execution_surface,
        creative_execution: executor.creative_execution,
        execution_model: executor.execution_model,
      },
    };
  }

  const repeatedBlockArtifact = readRepeatedBlockFailFastArtifact({
    artifactFile,
    deliverablePaths,
    routeCacheKey,
    requiredArtifactFiles,
    overlay,
    route: safeRoute,
    topicId,
    deliverableId,
  });
  if (repeatedBlockArtifact) {
    const closeoutArtifact = attachRouteArtifactCloseoutRefs({
      overlay,
      route: safeRoute,
      deliverableId,
      artifact: repeatedBlockArtifact,
    });
    mkdirSync(path.dirname(artifactFile), { recursive: true });
    writeFileSync(artifactFile, JSON.stringify(closeoutArtifact, null, 2), 'utf-8');
    const stageFolderRefs = refreshStageFolderRouteArtifact({
      deliverablePaths,
      overlay,
      topicId,
      deliverableId,
      route: safeRoute,
      attemptId,
      artifactFile,
      artifact: closeoutArtifact,
      oplRouteAttemptIndex,
    });
    return {
      ok: true,
      route: safeRoute,
      overlay,
      topic_id: topicId,
      deliverable_id: deliverableId,
      artifact: closeoutArtifact,
      artifact_file: artifactFile,
      artifact_refs: Array.from(new Set([
        artifactFile,
        ...(Array.isArray(stageFolderRefs?.artifact_refs) ? stageFolderRefs.artifact_refs : []),
      ])),
      cache_status: 'quality_budget_exhausted',
      executor: {
        adapter: executor.adapter,
        primary: executor.primary,
        execution_surface: executor.execution_surface,
        creative_execution: executor.creative_execution,
        execution_model: executor.execution_model,
      },
    };
  }

  const routeArtifact = attachRouteCache({
    ...await executor.runRoute({
    workspaceRoot,
    overlay,
    route: safeRoute,
    topicId,
    deliverableId,
    contract,
    stageContract,
    deliverablePaths,
    mode,
    baselineDeliverableId,
    }),
    runtime_currentness_receipt: runtimeCurrentnessReceipt(),
  }, routeCacheKey, safeRoute);
  const artifact = attachRouteArtifactCloseoutRefs({
    overlay,
    route: safeRoute,
    deliverableId,
    artifact: routeArtifact,
  });

  mkdirSync(path.dirname(artifactFile), { recursive: true });
  writeFileSync(artifactFile, JSON.stringify(artifact, null, 2), 'utf-8');
  const stageFolderRefs = refreshStageFolderRouteArtifact({
    deliverablePaths,
    overlay,
    topicId,
    deliverableId,
    route: safeRoute,
    attemptId,
    artifactFile,
    artifact,
    oplRouteAttemptIndex,
  });

  if (artifact?.review_state_patch) {
    persistReviewStatePatch({
      workspaceRoot,
      topicId,
      deliverableId,
      patch: {
        latest_review_artifact: artifactFile,
        ...artifact.review_state_patch,
      },
    });
  }

  if (artifact?.status === 'block' || artifact?.status === 'failed') {
    const missingConsumableArtifact = !hasConsumableStageArtifact(artifact);
    const hardStopKind = safeText(
      artifact?.hard_stop_kind
        || artifact?.error_kind
        || artifact?.failure_kind
        || artifact?.blocker_kind,
      missingConsumableArtifact ? 'missing_consumable_artifact' : 'route_failure',
    );
    const blockingReasons = uniqueStrings([
      ...safeArray(artifact?.blocking_reasons),
      ...safeArray(artifact?.review_state_patch?.blocking_reasons),
      ...safeArray(artifact?.review_state_patch?.pending_reviews),
      ...Object.entries(artifact?.checks || {})
        .filter(([, value]) => value === false)
        .map(([key]) => key),
    ]);
    const error = new Error(
      safeRoute === 'screenshot_review'
        ? `Route ${safeRoute} blocked: ${JSON.stringify(artifact?.checks || artifact?.issues || {})}`
        : `Route ${safeRoute} blocked`,
    );
    error.code = hardStopKind;
    error.failure_kind = hardStopKind;
    error.hard_stop_kind = hardStopKind;
    error.target_slide_ids = uniqueStrings([
      ...safeArray(artifact?.target_slide_ids),
      ...safeArray(artifact?.preflight_gate?.target_slide_ids),
      ...safeArray(artifact?.review_state_patch?.rerun_policy?.target_slide_ids),
      ...safeArray(artifact?.review_execution?.reviewed_slide_ids),
    ]);
    error.blocking_reasons = blockingReasons.length > 0 ? blockingReasons : ['quality_gate_blocked'];
    error.recommended_action = safeText(artifact?.review_state_patch?.rerun_from_stage)
      || safeText(artifact?.review_state_patch?.rerun_policy?.rerun_from_stage)
      || 'rerun_required';
    error.artifact_file = artifactFile;
    error.artifact = artifact;
    throw error;
  }

  return {
    ok: true,
    route: safeRoute,
    overlay,
    topic_id: topicId,
    deliverable_id: deliverableId,
    artifact,
    artifact_file: artifactFile,
    cache_status: 'miss',
    artifact_refs: Array.from(new Set([
      artifactFile,
      ...(Array.isArray(stageFolderRefs?.artifact_refs) ? stageFolderRefs.artifact_refs : []),
      ...(Array.isArray(artifact?.artifact_refs) ? artifact.artifact_refs : []),
    ])),
    executor: {
      adapter: executor.adapter,
      primary: executor.primary,
      execution_surface: executor.execution_surface,
      creative_execution: executor.creative_execution,
      execution_model: executor.execution_model,
    },
  };
}
