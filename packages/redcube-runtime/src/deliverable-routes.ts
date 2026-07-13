// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import {
  CODEX_DEFAULT_ADAPTER,
  getDeliverablePaths,
} from '@redcube/runtime-protocol';

import { readCodexCliContract } from './executors/codex-caller.js';
import { runCandidateRaceRoute } from './candidate-racing.js';
import {
  executeDeliverableRouteLocally,
  refreshStageFolderRouteArtifact,
  validateDeliverableRouteInput,
} from './deliverable-route-local.js';
import { resolveExecutorAdapter } from './executors/index.js';
import {
  completeRouteExecutionRef,
  failRouteExecutionRef,
  startRouteExecutionRef,
} from './route-execution-refs.js';
import {
  admitStageArtifactForProgress,
  isHardStopArtifact,
} from './progress-first.js';

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

function buildCodexRuntimeDescriptor(codexContract) {
  return {
    owner: 'codex_cli',
    adapter_surface: 'opl_codex_executor',
    model_selection: codexContract.model_selection,
    reasoning_selection: codexContract.reasoning_selection,
    sandbox: codexContract.sandbox,
    command: [...codexContract.command],
  };
}

function safeIndexText(index, ...keys) {
  for (const key of keys) {
    const text = String(index?.[key] || '').trim();
    if (text) return text;
  }
  return '';
}

function routeArtifactAttemptId(index) {
  return safeIndexText(
    index,
    'stage_attempt_ref',
    'stageAttemptRef',
    'attempt_lease_ref',
    'attemptLeaseRef',
    'lease_ref',
    'leaseRef',
    'attempt_receipt_ref',
    'attemptReceiptRef',
    'closeout_receipt_ref',
    'closeoutReceiptRef',
  );
}

function buildOplRouteAttemptIdentityBlocker({ safeRoute, overlay, topicId, deliverableId, runId, reasons }) {
  const blockerRef = `rca-typed-blocker:route-execution-owner:${overlay}:${safeRoute}:${deliverableId}:identity-mismatch`;
  return {
    ok: false,
    surface_kind: 'typed_blocker',
    return_shape: 'typed_blocker',
    blocker_ref: blockerRef,
    blocker_kind: 'stale_or_mismatched_stage_identity',
    owner: 'redcube_ai',
    route: safeRoute,
    overlay,
    topic_id: topicId,
    deliverable_id: deliverableId,
    run: {
      run_id: String(runId || '').trim() || null,
      route: safeRoute,
      overlay,
      topic_id: topicId,
      deliverable_id: deliverableId,
      status: 'typed_blocker',
      current_stage: safeRoute,
      error_kind: 'typed_blocker',
      error: {
        code: 'stale_or_mismatched_stage_identity',
        message: 'RCA route execution received explicit provider identity evidence that conflicts with the OPL-owned attempt boundary.',
        failure_kind: 'stale_or_mismatched_stage_identity',
        hard_stop_kind: 'stale_or_mismatched_stage_identity',
        blocking_reasons: reasons,
        recommended_action: 'resubmit_with_current_opl_attempt_identity',
      },
      cross_provider_attempt_index: null,
      route_execution_owner_boundary: {
        owner: 'opl',
        rca_role: 'visual_route_handler_and_artifact_authority',
        default_execution_owner: 'opl_stage_attempt',
        repo_local_route_runner_default_allowed: false,
      },
    },
    events: [],
    error: {
      code: 'stale_or_mismatched_stage_identity',
      message: 'RCA route execution received explicit provider identity evidence that conflicts with the OPL-owned attempt boundary.',
      failure_kind: 'stale_or_mismatched_stage_identity',
      hard_stop_kind: 'stale_or_mismatched_stage_identity',
      blocking_reasons: reasons,
      recommended_action: 'resubmit_with_current_opl_attempt_identity',
      blocker_ref: blockerRef,
      blocker_kind: 'stale_or_mismatched_stage_identity',
    },
    typed_blocker: {
      surface_kind: 'typed_blocker',
      return_shape: 'typed_blocker',
      blocker_ref: blockerRef,
      blocker_kind: 'stale_or_mismatched_stage_identity',
      owner: 'redcube_ai',
      next_required_owner_action: 'resubmit_with_current_opl_attempt_identity',
      identity_mismatch_reasons: reasons,
      forbidden_default_owner: 'redcube_ai_repo_local_route_runner',
    },
    artifact: null,
    artifactFile: undefined,
    cache_status: 'miss',
  };
}

function normalizeOplRouteAttemptIndex({ crossProviderAttemptIndex, safeRoute, overlay, topicId, deliverableId, runId }) {
  const index = crossProviderAttemptIndex && typeof crossProviderAttemptIndex === 'object' && !Array.isArray(crossProviderAttemptIndex)
    ? crossProviderAttemptIndex
    : null;
  const missing = [];
  if (!index) {
    missing.push('cross_provider_attempt_index');
    return {
      ok: true,
      index: {
        surface_kind: 'route_execution_transport_context',
        version: 'route-execution-transport-context.v1',
        status: 'missing_quality_debt',
        owner: 'one-person-lab',
        domain_adapter_owner: 'redcube_ai',
        missing_refs: missing,
        blocks_stage_transition: false,
        blocks_runtime_currentness_claim: true,
        next_stage_may_start: true,
        route_selection_owner: 'codex_cli',
        route_selection_owner_scope: 'intra_stage_domain_route_only',
        cross_stage_decision_owner: 'stage_run_decisive_codex_attempt',
        route_execution_grants_stage_transition_authority: false,
        rca_does_not_own_provider_attempt_ledger: true,
        can_claim_current_without_provider_ledger: false,
        repo_local_route_runner_default_allowed: false,
        execution_owner: 'codex_cli_direct_domain_handler',
        rca_execution_role: 'visual_route_handler_and_artifact_authority',
      },
    };
  }

  const providerAttemptOwner = safeIndexText(index, 'provider_attempt_owner', 'providerAttemptOwner');
  const owner = safeIndexText(index, 'owner');
  const providerAttemptRef = safeIndexText(index, 'provider_attempt_ref', 'providerAttemptRef', 'opl_provider_attempt_ref', 'oplProviderAttemptRef');
  const providerAttemptLedgerRef = safeIndexText(index, 'provider_attempt_ledger_ref', 'providerAttemptLedgerRef', 'opl_provider_attempt_ledger_ref', 'oplProviderAttemptLedgerRef');
  const stageAttemptRef = safeIndexText(index, 'stage_attempt_ref', 'stageAttemptRef', 'opl_stage_attempt_ref', 'oplStageAttemptRef');
  const attemptLeaseRef = safeIndexText(index, 'attempt_lease_ref', 'attemptLeaseRef', 'lease_ref', 'leaseRef', 'provider_attempt_lease_ref', 'providerAttemptLeaseRef');
  const attemptReceiptRef = safeIndexText(index, 'attempt_receipt_ref', 'attemptReceiptRef', 'closeout_receipt_ref', 'closeoutReceiptRef');
  const localSessionRef = safeIndexText(index, 'local_session_ref', 'localSessionRef');
  const attemptRole = safeIndexText(index, 'attempt_role', 'attemptRole');
  const noContextInheritance = index.no_context_inheritance ?? index.noContextInheritance;
  const producerSessionRef = safeIndexText(index, 'producer_session_ref', 'producerSessionRef');
  const qualityRoundValue = index.quality_round_index ?? index.qualityRoundIndex;
  const qualityRoundIndex = qualityRoundValue === undefined || qualityRoundValue === null || qualityRoundValue === ''
    ? null
    : Number(qualityRoundValue);
  const declaredOwner = providerAttemptOwner || owner;
  const identityMismatches = [];

  if (!declaredOwner) missing.push('provider_attempt_owner');
  if (declaredOwner && declaredOwner !== 'one-person-lab') {
    identityMismatches.push('provider_attempt_owner_mismatch');
  }
  if (!providerAttemptRef) missing.push('provider_attempt_ref');
  if (!providerAttemptLedgerRef) missing.push('provider_attempt_ledger_ref');
  if (!stageAttemptRef && !attemptLeaseRef && !attemptReceiptRef) {
    missing.push('opl_stage_attempt_or_lease_or_receipt_ref');
  }
  if (!attemptRole) missing.push('attempt_role');
  if (!Number.isInteger(qualityRoundIndex)) missing.push('quality_round_index');
  if (noContextInheritance !== true) missing.push('no_context_inheritance');
  if (['reviewer', 're_reviewer'].includes(attemptRole) && !producerSessionRef) missing.push('producer_session_ref');
  if (providerAttemptRef && (
    providerAttemptRef === localSessionRef
    || providerAttemptRef.startsWith('route-run:')
    || providerAttemptRef.startsWith('product-entry-session:')
  )) {
    identityMismatches.push('provider_attempt_ref_mismatch');
  }
  if (providerAttemptLedgerRef && (
    providerAttemptLedgerRef === localSessionRef
    || providerAttemptLedgerRef === providerAttemptRef
    || providerAttemptLedgerRef.startsWith('route-run:')
    || providerAttemptLedgerRef.startsWith('product-entry-session:')
  )) {
    identityMismatches.push('provider_attempt_ledger_ref_mismatch');
  }

  if (identityMismatches.length > 0) {
    return {
      ok: false,
      blocker: buildOplRouteAttemptIdentityBlocker({
        safeRoute,
        overlay,
        topicId,
        deliverableId,
        runId,
        reasons: Array.from(new Set(identityMismatches)).sort(),
      }),
    };
  }

  const missingRefs = Array.from(new Set(missing)).sort();
  const transportMetadataCurrent = missingRefs.length === 0;

  return {
    ok: true,
    index: {
      ...index,
      surface_kind: 'cross_provider_attempt_index',
      version: safeIndexText(index, 'version') || 'cross-provider-attempt-index.v1',
      status: transportMetadataCurrent ? 'current' : 'missing_quality_debt',
      owner: declaredOwner || null,
      provider_attempt_owner: declaredOwner || null,
      domain_adapter_owner: 'redcube_ai',
      ...(providerAttemptRef ? { provider_attempt_ref: providerAttemptRef } : {}),
      ...(providerAttemptLedgerRef ? { provider_attempt_ledger_ref: providerAttemptLedgerRef } : {}),
      ...(stageAttemptRef ? { stage_attempt_ref: stageAttemptRef } : {}),
      ...(attemptLeaseRef ? { attempt_lease_ref: attemptLeaseRef } : {}),
      ...(attemptReceiptRef ? { attempt_receipt_ref: attemptReceiptRef } : {}),
      attempt_role: attemptRole || null,
      quality_round_index: Number.isInteger(qualityRoundIndex) ? qualityRoundIndex : null,
      no_context_inheritance: noContextInheritance === true,
      ...(producerSessionRef ? { producer_session_ref: producerSessionRef } : {}),
      missing_refs: missingRefs,
      blocks_stage_transition: false,
      blocks_runtime_currentness_claim: !transportMetadataCurrent,
      next_stage_may_start: true,
      attempt_metadata_validation_owner: 'one-person-lab',
      rca_role_round_or_context_gate_applied: false,
      missing_attempt_metadata_policy: 'record_quality_debt_and_continue',
      local_session_ref_is_not_provider_attempt_ref: true,
      rca_does_not_own_provider_attempt_ledger: true,
      can_claim_current_without_provider_ledger: false,
      repo_local_route_runner_default_allowed: false,
      execution_owner: transportMetadataCurrent ? 'opl_stage_attempt' : 'codex_cli_direct_domain_handler',
      rca_execution_role: 'visual_route_handler_and_artifact_authority',
    },
  };
}

function parseRouteRequest(request) {
  const {
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    route,
    runId = null,
    adapter = CODEX_DEFAULT_ADAPTER,
    userIntent = '',
    mode = 'draft_new',
    baselineDeliverableId = '',
    candidateCount = 1,
    crossProviderAttemptIndex = request.cross_provider_attempt_index || null,
  } = request;
  const safeRoute = requireSafeSegment('route', route);
  validateDeliverableRouteInput({
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    route: safeRoute,
  });
  return {
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    runId,
    adapter,
    userIntent,
    mode,
    baselineDeliverableId,
    candidateCount,
    crossProviderAttemptIndex,
    safeRoute,
  };
}

function resolveRouteExecutor({ request, adapter }) {
  const requestedBackends = [
    request.executorBackend,
    request.executor_backend,
    request.oplDefaultExecutorBackend,
    request.opl_default_executor_backend,
  ].map((value) => String(value || '').trim()).filter(Boolean);
  const unsupportedBackend = requestedBackends.find((value) => value !== CODEX_DEFAULT_ADAPTER);
  if (unsupportedBackend) {
    throw new Error(`Unsupported executor backend: ${unsupportedBackend}`);
  }
  const resolved = resolveExecutorAdapter({ adapter });
  return {
    ...resolved,
    codex_cli_runtime: buildCodexRuntimeDescriptor(readCodexCliContract()),
  };
}

function buildRouteStartedEvent({ executor, safeRoute, overlay, deliverableId }) {
  return {
    type: 'codex_route_started',
    route: safeRoute,
    overlay,
    deliverable_id: deliverableId,
    ...(executor.codex_cli_runtime
      ? {
          codex_cli_runtime: executor.codex_cli_runtime,
        }
      : {}),
  };
}

function patchArtifactExecutionModel(artifactFile, executor) {
  const artifact = JSON.parse(readFileSync(artifactFile, 'utf-8'));
  artifact.execution_model = {
    ...(artifact.execution_model || {}),
    ...(executor?.codex_cli_runtime
      ? {
          codex_cli_runtime: executor.codex_cli_runtime,
        }
      : {}),
  };
  writeFileSync(artifactFile, JSON.stringify(artifact, null, 2), 'utf-8');
}

function candidateCountForRoute({ route, candidateCount }) {
  const count = Number(candidateCount || 0);
  if (Number.isInteger(count) && count > 0) return count;
  return route === 'visual_direction' && process.env.REDCUBE_VISUAL_DIRECTION_CANDIDATES
    ? Math.max(1, Number(process.env.REDCUBE_VISUAL_DIRECTION_CANDIDATES) || 1)
    : 1;
}

function compactArray(value) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean))).sort()
    : [];
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sumNumber(values) {
  const total = values.reduce((sum, value) => (
    typeof value === 'number' && Number.isFinite(value) ? sum + value : sum
  ), 0);
  return total > 0 ? total : null;
}

function normalizeGenerationChildCalls(generationRuntime = {}) {
  return Array.isArray(generationRuntime?.child_calls)
    ? generationRuntime.child_calls.filter((call) => call && typeof call === 'object')
    : [];
}

function runtimeMetric(generationRuntime, childCalls, key) {
  const direct = numberOrNull(generationRuntime?.[key]);
  if (direct != null) return direct;
  return sumNumber(childCalls.map((call) => call?.[key]));
}

function blockedChecksFromArtifact(artifact = {}) {
  return compactArray([
    ...compactArray(artifact?.blocking_reasons),
    ...compactArray(artifact?.review_state_patch?.blocking_reasons),
    ...compactArray(artifact?.review_state_patch?.pending_reviews),
    ...Object.entries(artifact?.checks || {})
      .filter(([, value]) => value === false)
      .map(([key]) => key),
  ]);
}

function isQualityDebtArtifact(artifact = {}) {
  return String(artifact?.status || '').trim() === 'completed_with_quality_debt'
    || artifact?.progress_first?.quality_debt_recorded === true
    || artifact?.quality_debt?.status === 'recorded_non_blocking';
}

function generationRuntimeFromArtifact(artifact = {}) {
  return artifact?.creative_execution?.generation_runtime
    || artifact?.review_execution?.generation_runtime
    || artifact?.render_execution?.generation_runtime
    || artifact?.html_bundle?.render_execution?.generation_runtime
    || artifact?.generation_runtime
    || null;
}

function buildRoutePromptTelemetry(routeResult = {}) {
  const artifact = routeResult?.artifact || {};
  const generationRuntime = generationRuntimeFromArtifact(artifact) || {};
  const childCalls = normalizeGenerationChildCalls(generationRuntime);
  const reviewExecution = artifact?.review_execution || {};
  const renderExecution = artifact?.render_execution || artifact?.html_bundle?.render_execution || {};
  const targetedRerun = artifact?.targeted_rerun || {};
  const slideScope = {
    ...(generationRuntime?.slide_scope || {}),
    target_slide_ids: compactArray([
      ...compactArray(generationRuntime?.slide_scope?.target_slide_ids),
      ...compactArray(generationRuntime?.target_slide_scope?.target_slide_ids),
      ...compactArray(reviewExecution?.target_slide_ids),
      ...compactArray(renderExecution?.targeted_slide_ids),
      ...compactArray(targetedRerun?.target_slide_ids),
    ]),
    reviewed_slide_ids: compactArray([
      ...compactArray(generationRuntime?.slide_scope?.reviewed_slide_ids),
      ...compactArray(reviewExecution?.reviewed_slide_ids),
    ]),
    reused_slide_ids: compactArray([
      ...compactArray(generationRuntime?.slide_scope?.reused_slide_ids),
      ...compactArray(reviewExecution?.reused_slide_ids),
      ...compactArray(renderExecution?.reused_slide_ids),
      ...compactArray(targetedRerun?.reused_slide_ids),
    ]),
  };
  slideScope.slide_ids = compactArray([
    ...compactArray(generationRuntime?.slide_scope?.slide_ids),
    ...slideScope.target_slide_ids,
    ...slideScope.reviewed_slide_ids,
    ...slideScope.reused_slide_ids,
  ]);

  return {
    prompt_pack_file: String(generationRuntime?.prompt_pack_file || artifact?.prompt_pack?.relative_path || '').trim() || null,
    prompt_files: compactArray(generationRuntime?.prompt_files),
    prompt_bytes: runtimeMetric(generationRuntime, childCalls, 'prompt_bytes'),
    context_bytes: runtimeMetric(generationRuntime, childCalls, 'context_bytes'),
    prompt_tokens: runtimeMetric(generationRuntime, childCalls, 'prompt_tokens'),
    completion_tokens: runtimeMetric(generationRuntime, childCalls, 'completion_tokens'),
    total_tokens: runtimeMetric(generationRuntime, childCalls, 'total_tokens'),
    estimated_prompt_tokens: runtimeMetric(generationRuntime, childCalls, 'estimated_prompt_tokens'),
    provider_usage: generationRuntime?.provider_usage || generationRuntime?.usage || null,
    cached_tokens: numberOrNull(generationRuntime?.cached_tokens),
    cache_hit: generationRuntime?.cache_hit === true ? true : null,
    child_calls: childCalls,
    review_scope: String(reviewExecution?.review_scope || generationRuntime?.review_scope || '').trim() || null,
    cache_status: routeResult?.cache_status || artifact?.route_cache?.cache_status || artifact?.mechanical_cache?.cache_status || null,
    blocked_checks: blockedChecksFromArtifact(artifact),
    slide_scope: slideScope,
    target_slide_scope: {
      target_slide_ids: slideScope.target_slide_ids,
    },
  };
}

function materializeRouteResult({
  raced,
  executor,
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  safeRoute,
  runId,
  crossProviderAttemptIndex,
}) {
  const routeResult = raced.artifact;
  routeResult.artifact = admitStageArtifactForProgress({
    ...(routeResult.artifact || {}),
    candidate_race: raced.race,
  }, { route: safeRoute });
  if (routeResult.cache_status === 'hit') {
    routeResult.artifact_refs = Array.from(new Set([
      ...(Array.isArray(routeResult.artifact_refs) ? routeResult.artifact_refs : []),
    ]));
    return routeResult;
  }
  writeFileSync(routeResult.artifact_file, JSON.stringify(routeResult.artifact, null, 2), 'utf-8');
  routeResult.artifact_refs = Array.from(new Set([
    ...(Array.isArray(routeResult.artifact_refs) ? routeResult.artifact_refs : []),
  ]));
  patchArtifactExecutionModel(routeResult.artifact_file, executor);
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const patchedArtifact = JSON.parse(readFileSync(routeResult.artifact_file, 'utf-8'));
  patchedArtifact.stage_quality_attempt = {
    attempt_role: safeIndexText(crossProviderAttemptIndex, 'attempt_role', 'attemptRole'),
    quality_round_index: Number(crossProviderAttemptIndex?.quality_round_index ?? crossProviderAttemptIndex?.qualityRoundIndex ?? 0),
    parent_attempt_ref: safeIndexText(crossProviderAttemptIndex, 'parent_attempt_ref', 'parentAttemptRef') || null,
    producer_attempt_ref: safeIndexText(crossProviderAttemptIndex, 'producer_attempt_ref', 'producerAttemptRef') || null,
    producer_session_ref: safeIndexText(crossProviderAttemptIndex, 'producer_session_ref', 'producerSessionRef') || null,
    no_context_inheritance: crossProviderAttemptIndex?.no_context_inheritance === true || crossProviderAttemptIndex?.noContextInheritance === true,
    context_manifest_ref: safeIndexText(crossProviderAttemptIndex, 'context_manifest_ref', 'contextManifestRef') || null,
  };
  writeFileSync(routeResult.artifact_file, JSON.stringify(patchedArtifact, null, 2), 'utf-8');
  const stageAttemptId = safeIndexText(
    crossProviderAttemptIndex,
    'stage_attempt_ref',
    'stageAttemptRef',
    'opl_stage_attempt_ref',
    'oplStageAttemptRef',
  )
    || safeIndexText(crossProviderAttemptIndex, 'attempt_lease_ref', 'attemptLeaseRef', 'lease_ref', 'leaseRef')
    || safeIndexText(crossProviderAttemptIndex, 'attempt_receipt_ref', 'attemptReceiptRef', 'closeout_receipt_ref', 'closeoutReceiptRef')
    || safeText(runId);
  const stageFolderRefs = refreshStageFolderRouteArtifact({
    deliverablePaths,
    overlay,
    topicId,
    deliverableId,
    route: safeRoute,
    attemptId: stageAttemptId,
    artifactFile: routeResult.artifact_file,
    artifact: patchedArtifact,
    oplRouteAttemptIndex: crossProviderAttemptIndex,
  });
  routeResult.artifact = patchedArtifact;
  routeResult.artifact_refs = Array.from(new Set([
    ...(Array.isArray(routeResult.artifact_refs) ? routeResult.artifact_refs : []),
    ...(Array.isArray(stageFolderRefs?.artifact_refs) ? stageFolderRefs.artifact_refs : []),
  ]));
  return routeResult;
}

async function executeRouteCandidateRace({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  safeRoute,
  userIntent,
  mode,
  baselineDeliverableId,
  candidateCount,
  executor,
  crossProviderAttemptIndex,
  runId,
}) {
  const routeCandidateCount = candidateCountForRoute({ route: safeRoute, candidateCount });
  const raced = await runCandidateRaceRoute({
    family: overlay,
    route: safeRoute,
    candidateCount: routeCandidateCount,
    qualityGate: 'structured_contract_validation',
    runCandidate: async () => executeDeliverableRouteLocally({
      workspaceRoot,
      overlay,
      topicId,
      deliverableId,
      route: safeRoute,
      adapter: executor.adapter,
      userIntent,
      mode,
      baselineDeliverableId,
      oplRouteAttemptIndex: crossProviderAttemptIndex,
      runId,
    }),
    scoreCandidate: (candidate) => Number(candidate?.artifact?.visual_direction?.rhythm_curve?.length || 1),
  });
  return materializeRouteResult({
    raced,
    executor,
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    safeRoute,
    runId,
    crossProviderAttemptIndex,
  });
}

function buildCompletedRouteResponse({
  workspaceRoot,
  run,
  safeRoute,
  overlay,
  deliverableId,
  routeResult,
  executor,
  crossProviderAttemptIndex = null,
  startedEvent = null,
}) {
  const transportQualityDebt = crossProviderAttemptIndex?.status === 'missing_quality_debt';
  const routeRunStatus = isQualityDebtArtifact(routeResult.artifact) || transportQualityDebt
    ? 'completed_with_quality_debt'
    : 'completed';
  const completedRun = completeRouteExecutionRef({
    runId: run.run_id,
    run,
    currentStage: safeRoute,
    stageResults: [{
      stage: safeRoute,
      status: routeResult.cache_status === 'hit' ? 'cached' : routeRunStatus,
    }],
    artifactRefs: routeResult.artifact_refs,
    executor,
    telemetry: buildRoutePromptTelemetry(routeResult),
    status: routeRunStatus,
    errorKind: null,
    crossProviderAttemptIndex,
  });

  const completedEvent = {
    type: routeRunStatus === 'completed_with_quality_debt'
      ? 'run_completed_with_quality_debt'
      : 'run_completed',
    route: safeRoute,
    overlay,
    deliverable_id: deliverableId,
    profile_id: routeResult.artifact?.contract?.profile_id || null,
    artifact_file: routeResult.artifact_file,
    cache_status: routeResult.cache_status || 'miss',
  };

  return {
    ok: true,
    run: completedRun,
    events: [startedEvent, completedEvent].filter(Boolean),
    artifactFile: routeResult.artifact_file,
    artifact: routeResult.artifact,
    cache_status: routeResult.cache_status || 'miss',
    ...(transportQualityDebt ? {
      quality_debt: {
        code: 'opl_stage_attempt_transport_context_missing',
        missing_refs: crossProviderAttemptIndex.missing_refs,
        blocks_stage_transition: false,
        blocks_runtime_currentness_claim: true,
        next_stage_may_start: true,
      },
    } : {}),
  };
}

function normalizeRouteFailure(error) {
  const failureMessage = String(
    error instanceof Error ? error.message : error,
  ).trim() || 'Codex route execution failed';
  const failure = new Error(failureMessage);
  failure.code = error?.code || null;
  failure.failure_kind = error?.failure_kind || error?.failureKind || null;
  failure.hard_stop_kind = error?.hard_stop_kind || null;
  failure.target_slide_ids = Array.isArray(error?.target_slide_ids) ? error.target_slide_ids : [];
  failure.blocking_reasons = Array.isArray(error?.blocking_reasons) ? error.blocking_reasons : [];
  failure.recommended_action = String(error?.recommended_action || '').trim() || null;
  failure.artifact_file = String(error?.artifact_file || '').trim() || null;
  failure.artifact_refs = Array.isArray(error?.artifact_refs) ? error.artifact_refs : [];
  failure.stall_lineage = error?.stall_lineage || null;
  failure.requiresHumanConfirmation = error?.requiresHumanConfirmation === true;
  failure.requiresExternalSecret = error?.requiresExternalSecret === true;
  const failureKind = String(failure.failure_kind || failure.code || '').trim();
  const qualityBlocked = !failure.hard_stop_kind && failureKind === 'quality_blocked';
  if (qualityBlocked) {
    failure.code = failure.code || 'quality_blocked';
    failure.failure_kind = 'quality_blocked';
  }
  return {
    failure,
    qualityBlocked,
  };
}

function failedArtifactForError(error, failure) {
  if (failure.artifact_file && existsSync(failure.artifact_file)) {
    try {
      return JSON.parse(readFileSync(failure.artifact_file, 'utf-8'));
    } catch {
      return null;
    }
  }
  return error?.artifact || null;
}

function buildFailedRouteResponse({
  workspaceRoot,
  run,
  safeRoute,
  overlay,
  deliverableId,
  error,
  executor,
  crossProviderAttemptIndex = null,
  startedEvent = null,
}) {
  const { failure, qualityBlocked } = normalizeRouteFailure(error);
  const failedArtifact = failedArtifactForError(error, failure);
  const failureIsHardStop = isHardStopArtifact({
    ...failure,
    hard_stop_kind: failure.hard_stop_kind,
  })
    || Boolean(failure.hard_stop_kind)
    || failure.requiresHumanConfirmation
    || failure.requiresExternalSecret
    || ['EACCES', 'EPERM'].includes(String(failure.code || ''));
  const admittedArtifact = failureIsHardStop
    ? null
    : admitStageArtifactForProgress(
        failedArtifact || {
          status: 'failed',
          error: failure.message,
          error_kind: failure.code,
          route: safeRoute,
          diagnostic_refs: failure.artifact_refs,
        },
        { route: safeRoute },
      );
  const recoverableArtifactObserved = Boolean(
    admittedArtifact && !failureIsHardStop,
  );
  if (recoverableArtifactObserved && admittedArtifact) {
    const progressArtifact = {
      ...admittedArtifact,
      status: 'completed_with_quality_debt',
      progress_first: {
        ...(admittedArtifact.progress_first || {}),
        transition_rule: 'any_diagnostic_or_partial_artifact_advances',
        artifact_available: Boolean(failedArtifact),
        diagnostic_available: !failedArtifact,
        advance_allowed: true,
        next_stage_may_start: true,
        route_back_selection_owner: 'codex_cli',
        route_back_may_target_any_declared_stage: true,
      },
      quality_debt: {
        ...(admittedArtifact.quality_debt || {}),
        status: 'recorded_non_blocking',
        reasons: admittedArtifact.quality_debt?.reasons || [failure.message],
        blocks_stage_transition: false,
        blocks_visual_ready_claim: true,
        blocks_export_ready_claim: true,
      },
    };
    if (failure.artifact_file) {
      writeFileSync(failure.artifact_file, `${JSON.stringify(progressArtifact, null, 2)}\n`, 'utf-8');
    }
    return buildCompletedRouteResponse({
      workspaceRoot,
      run,
      safeRoute,
      overlay,
      deliverableId,
      routeResult: {
        ok: true,
        artifact: progressArtifact,
        artifact_file: failure.artifact_file,
        artifact_refs: [...new Set([
          failure.artifact_file,
          ...failure.artifact_refs,
          ...(Array.isArray(progressArtifact.artifact_refs) ? progressArtifact.artifact_refs : []),
        ].filter(Boolean))],
        cache_status: progressArtifact?.route_cache?.cache_status || 'quality_debt_recovered',
      },
      executor,
      crossProviderAttemptIndex,
      startedEvent,
    });
  }
  const failedRun = failRouteExecutionRef({
    run,
    currentStage: safeRoute,
    error: failure,
    executor,
    errorKind: qualityBlocked ? 'quality_blocked' : 'execution_error',
    status: qualityBlocked ? 'quality_blocked' : 'failed',
    telemetry: failedArtifact
      ? buildRoutePromptTelemetry({
          artifact: failedArtifact,
          cache_status: failedArtifact?.route_cache?.cache_status || 'miss',
        })
      : {},
  });

  const failedEvent = {
    type: qualityBlocked ? 'run_quality_blocked' : 'run_failed',
    route: safeRoute,
    overlay,
    deliverable_id: deliverableId,
    error: failedRun.error,
  };

  const includeFailedArtifact = Boolean(failedArtifact);
  return {
    ok: false,
    run: failedRun,
    events: [startedEvent, failedEvent].filter(Boolean),
    error: failedRun.error,
    artifact: includeFailedArtifact ? failedArtifact : null,
    artifactFile: includeFailedArtifact ? (failure.artifact_file || null) : undefined,
  };
}

export async function runDeliverableRoute(request) {
  const routeRequest = parseRouteRequest(request);
  const {
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  runId = null,
  adapter = CODEX_DEFAULT_ADAPTER, userIntent = '',
  mode = 'draft_new',
  baselineDeliverableId = '',
  candidateCount = 1,
  crossProviderAttemptIndex = null,
    safeRoute,
  } = routeRequest;
  const executor = resolveRouteExecutor({
    request,
    adapter,
  });
  const effectiveCrossProviderAttemptIndex = crossProviderAttemptIndex && typeof crossProviderAttemptIndex === 'object'
    ? crossProviderAttemptIndex
    : null;
  const normalizedRouteAttempt = normalizeOplRouteAttemptIndex({
    crossProviderAttemptIndex: effectiveCrossProviderAttemptIndex,
    safeRoute,
    overlay,
    topicId,
    deliverableId,
    runId,
  });
  if (normalizedRouteAttempt.ok !== true) {
    return normalizedRouteAttempt.blocker;
  }

  const run = startRouteExecutionRef({
    runId: String(runId || '').trim() || null,
    route: safeRoute,
    overlay,
    target: deliverableId,
    topicId,
    deliverableId,
    baselineDeliverableId,
    executor,
    crossProviderAttemptIndex: normalizedRouteAttempt.index,
  });

  const startedEvent = buildRouteStartedEvent({
    executor,
    safeRoute,
    overlay,
    deliverableId,
  });

  try {
    const routeResult = await executeRouteCandidateRace({
      workspaceRoot,
      overlay,
      topicId,
      deliverableId,
      safeRoute,
      userIntent,
      mode,
      baselineDeliverableId,
      candidateCount,
      executor,
      crossProviderAttemptIndex: normalizedRouteAttempt.index,
      runId: routeArtifactAttemptId(normalizedRouteAttempt.index),
    });
    return buildCompletedRouteResponse({
      workspaceRoot,
      run,
      safeRoute,
      overlay,
      deliverableId,
      routeResult,
      executor,
      crossProviderAttemptIndex: normalizedRouteAttempt.index,
      startedEvent,
    });
  } catch (error) {
    return buildFailedRouteResponse({
      workspaceRoot,
      run,
      safeRoute,
      overlay,
      deliverableId,
      error,
      executor,
      crossProviderAttemptIndex: normalizedRouteAttempt.index,
      startedEvent,
    });
  }
}
