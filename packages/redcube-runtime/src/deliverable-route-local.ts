// @ts-nocheck
import path from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { getDeliverablePaths } from '@redcube/runtime-protocol';
import { persistReviewStatePatch } from '@redcube/governance';
import { CODEX_DEFAULT_ADAPTER } from '@redcube/runtime-protocol';
import { hydrateDeliverableContract } from '@redcube/overlay-core';
import { getDefaultOverlayRegistry } from '@redcube/overlay-registry';
import { resolveExecutorAdapter } from './executors.js';
import { loadSharedSourceTruth } from './shared-source-truth.js';
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
const REPEATED_BLOCK_FAIL_FAST_ROUTES = new Set([
  'render_html',
  'fix_html',
  'author_image_pages',
  'repair_image_pages',
  'visual_director_review',
  'screenshot_review',
]);
const REPEATED_BLOCK_FAIL_FAST_OVERLAYS = new Set(['ppt_deck', 'xiaohongshu']);
function routeStageDefinitions(contract) {
  return [
    ...(Array.isArray(contract?.stage_sequence?.stages) ? contract.stage_sequence.stages : []),
    ...(Array.isArray(contract?.stage_sequence?.alternate_stages) ? contract.stage_sequence.alternate_stages : []),
  ];
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

function safeText(value) {
  const text = String(value || '').trim();
  return text;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(value) {
  return [...new Set(safeArray(value).map((item) => safeText(item)).filter(Boolean))];
}

function fileContentHash(file) {
  const safeFile = safeText(file);
  if (!safeFile || !existsSync(safeFile)) return null;
  return createHash('sha256').update(readFileSync(safeFile)).digest('hex');
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
  return path.join(deliverablePaths.artifactsDir, String(stage?.output_artifact || `${stageId}.json`).trim());
}

function pptDraftViewFiles(deliverablePaths, deliverableId) {
  const safeDeliverableId = String(deliverableId || '').trim();
  if (!safeDeliverableId) return [];
  return [
    path.join(deliverablePaths.viewsDir, `${safeDeliverableId}.draft.html`),
    path.join(deliverablePaths.viewsDir, `${safeDeliverableId}.draft.slides.json`),
  ];
}

function routeCacheDependencyFiles({ overlay, route, deliverablePaths, contract, deliverableId }) {
  const files = routeRequiresArtifacts(contract, route)
    .map((stageId) => stageArtifactFile(deliverablePaths, contract, stageId));
  if (overlay === 'ppt_deck') {
    if (['render_html', 'fix_html', 'author_image_pages', 'repair_image_pages'].includes(route)) {
      files.push(
        stageArtifactFile(deliverablePaths, contract, 'visual_director_review'),
        stageArtifactFile(deliverablePaths, contract, 'screenshot_review'),
        path.join(deliverablePaths.viewsDir, 'operator', '幻灯片', '当前返修要求.md'),
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
        ...pptDraftViewFiles(deliverablePaths, deliverableId),
      );
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
  if (overlay === 'xiaohongshu' && ['author_image_pages', 'repair_image_pages', 'render_html', 'fix_html'].includes(route)) {
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
  executionShape,
  hermesProfile,
  executorRouting,
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
    route_user_intent: safeText(userIntent),
    required_artifacts: routeRequiresArtifacts(contract, route),
    mode,
    baselineDeliverableId,
    adapter,
    executionShape: safeText(executionShape),
    hermesProfile: safeText(hermesProfile),
    executorRouting: executorRouting || null,
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

function attachRouteCache(artifact, routeCacheKey) {
  const artifactWithBlockingSignature = attachBlockingSignature(artifact);
  return {
    ...artifactWithBlockingSignature,
    route_cache: {
      cache_status: 'miss',
      cache_key: routeCacheKey,
      input_hash: routeCacheKey,
      contract: 'redcube_route_stage_cache.v1',
      reuse_policy: 'reuse_only_when_inputs_match_and_artifact_is_non_blocking',
    },
  };
}

function failFastEnabledForRoute({ overlay, route }) {
  return REPEATED_BLOCK_FAIL_FAST_OVERLAYS.has(overlay)
    && REPEATED_BLOCK_FAIL_FAST_ROUTES.has(route);
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
  return {
    ...priorArtifact,
    status: 'failed',
    failure_kind: 'repeated_block_without_input_change',
    route,
    overlay,
    topic_id: topicId,
    deliverable_id: deliverableId,
    target_slide_ids: targetSlideIds,
    blocking_reasons: blockingReasons,
    repeated_block_fail_fast: {
      schema_version: 1,
      failure_kind: 'repeated_block_without_input_change',
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
      recommended_action: 'change_input_or_route_to_page_local_fix',
      quality_gate_policy: 'fail_fast_does_not_turn_blocked_into_pass',
    },
    route_cache: {
      ...(priorArtifact.route_cache || {}),
      cache_status: 'blocked_fail_fast',
      cache_key: routeCacheKey,
      input_hash: routeCacheKey,
      reused_from_artifact_file: artifactFile,
    },
  };
}

function readRepeatedBlockFailFastArtifact({
  artifactFile,
  routeCacheKey,
  requiredArtifactFiles,
  overlay,
  route,
  topicId,
  deliverableId,
}) {
  if (!failFastEnabledForRoute({ overlay, route })) return null;
  if (!existsSync(artifactFile)) return null;
  const priorArtifact = JSON.parse(readFileSync(artifactFile, 'utf-8'));
  if (priorArtifact?.status !== 'block' && priorArtifact?.status !== 'failed') return null;
  if (priorArtifact?.route_cache?.cache_key !== routeCacheKey) return null;
  if (dependencyBecameNewerThanArtifact({ artifactFile, requiredArtifactFiles })) return null;
  return buildRepeatedBlockFailFastArtifact({
    artifactFile,
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
  executionShape = undefined,
  hermesProfile = null,
  executorRouting = null,
  mode = 'draft_new',
  baselineDeliverableId = '',
}) {
  const { safeRoute } = validateDeliverableRouteInput({
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    route,
  });
  const executor = resolveExecutorAdapter({
    adapter,
    executionShape,
    hermesProfile,
    executorRouting,
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
  const artifactFile = path.join(
    deliverablePaths.artifactsDir,
    String(stageContract.output_artifact || `${safeRoute}.json`).trim(),
  );
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
    executionShape: executor.execution_shape,
    hermesProfile: executor.hermes_profile,
    executorRouting,
    requiredArtifactFiles,
  });

  const cachedArtifact = readCachedRouteArtifact({
    artifactFile,
    routeCacheKey,
    requiredArtifactFiles,
  });
  if (cachedArtifact) {
    writeFileSync(artifactFile, JSON.stringify(cachedArtifact, null, 2), 'utf-8');
    return {
      ok: true,
      route: safeRoute,
      overlay,
      topic_id: topicId,
      deliverable_id: deliverableId,
      artifact: cachedArtifact,
      artifact_file: artifactFile,
      artifact_refs: Array.from(new Set([
        artifactFile,
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
    routeCacheKey,
    requiredArtifactFiles,
    overlay,
    route: safeRoute,
    topicId,
    deliverableId,
  });
  if (repeatedBlockArtifact) {
    writeFileSync(artifactFile, JSON.stringify(repeatedBlockArtifact, null, 2), 'utf-8');
    const error = new Error(`Route ${safeRoute} fail-fast: repeated block without input change`);
    error.code = 'repeated_block_without_input_change';
    error.failure_kind = 'repeated_block_without_input_change';
    error.target_slide_ids = repeatedBlockArtifact.repeated_block_fail_fast.target_slide_ids;
    error.blocking_reasons = repeatedBlockArtifact.repeated_block_fail_fast.blocking_reasons;
    error.recommended_action = repeatedBlockArtifact.repeated_block_fail_fast.recommended_action;
    error.artifact_file = artifactFile;
    throw error;
  }

  const artifact = attachRouteCache(await executor.runRoute({
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
    executionShape,
    hermesProfile,
    executorRouting,
  }), routeCacheKey);

  mkdirSync(deliverablePaths.artifactsDir, { recursive: true });
  writeFileSync(artifactFile, JSON.stringify(artifact, null, 2), 'utf-8');

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
    error.code = 'quality_blocked';
    error.failure_kind = 'quality_blocked';
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
