// @ts-nocheck
import { CODEX_DEFAULT_ADAPTER, HERMES_NATIVE_PROOF_ADAPTER } from '@redcube/hermes-substrate';

import { runDeliverableRoute } from './deliverable-routes.js';
import { executeManagedDagLayers, planManagedDeliverableDag } from './managed-dag-scheduler.js';
import { reconcileManagedRunLiveness } from './managed-run-liveness.js';
import { loadSharedSourceTruth } from './shared-source-truth.js';
import {
  createManagedRun,
  loadManagedRun,
  managedPromptAuditFile,
  managedResultFile,
} from './managed-run-store.js';
import { buildPromptAudit } from './managed-prompt-audit.js';
import {
  assertManagedOverlayMatchesContract,
  assertManagedStopAfterStageDeclared,
  loadHydratedContract,
  loadRouteReviewRerunPolicy,
  shouldSkipManagedStage,
} from './managed-run-contract.js';
import {
  buildRuntimeLivenessAudit,
  loadPersistedManagedState,
  persistManagedState,
  pushManagedEvent,
} from './managed-run-surfaces.js';
import {
  STAGE_RETRY_LIMIT,
  safeArray,
  safeText,
  stageLabel,
  uniqueList,
  writeJson,
} from './managed-run-shared.js';
import {
  assertSupportedManagedAdapter,
  probeRequestedRuntime,
  runtimeBridgeFromProbe,
} from './managed-runtime-bridge.js';

function nextStageId(stages, currentStageId) {
  const index = stages.findIndex((stage) => stage?.stage_id === currentStageId);
  if (index < 0) return null;
  return stages[index + 1]?.stage_id || null;
}

function reviewRerunStageAfterFixHtml(contract) {
  const reviewStageId = safeText(contract?.review_surface?.artifact_stage);
  if (!reviewStageId) {
    return null;
  }
  const reviewHardStop = safeArray(contract?.stage_sequence?.hard_stops)
    .find((entry) => safeText(entry?.stage_id) === reviewStageId);
  return safeText(reviewHardStop?.rerun_from_stage, reviewStageId) || null;
}

function buildSkippedStageResult({
  managedRun,
  stageId,
  stages,
}) {
  const nextStage = nextStageId(stages, stageId);
  return {
    schema_version: 1,
    managed_run_id: managedRun.managed_run_id,
    stage_id: stageId,
    attempt: 0,
    route_run_id: null,
    status: 'skipped',
    summary: nextStage
      ? `${stageLabel(stageId)}当前不需要执行，系统直接继续推进到${stageLabel(nextStage)}。`
      : `${stageLabel(stageId)}当前不需要执行，系统直接完成托管主线。`,
    artifacts: [],
    decision: nextStage ? 'skip_stage' : 'complete_managed_run',
    next_action: nextStage ? `run_${nextStage}` : 'finalize_delivery',
    blocking_reason: null,
    controller_decision: {
      decision: 'skip_stage',
      reason_code: 'stage_not_required_for_current_review_state',
      requires_human_confirmation: false,
      requires_external_secret: false,
    },
    recorded_at: new Date().toISOString(),
  };
}

function buildStageIngestion({
  workspaceRoot,
  topicId,
  deliverableId,
  contract,
  managedRun,
  routeResult,
  stageId,
  attempt,
  stages,
}) {
  const artifactRefs = uniqueList([
    routeResult?.artifactFile,
    ...safeArray(routeResult?.run?.artifact_refs),
  ]);
  const forcedNextStage = managedRun?.mode === 'auto_to_terminal' && stageId === 'fix_html'
    ? reviewRerunStageAfterFixHtml(contract)
    : null;
  const nextStage = forcedNextStage || nextStageId(stages, stageId);

  if (routeResult?.ok !== true) {
    const errorCode = safeText(
      routeResult?.error?.code || routeResult?.run?.error?.code,
      'stage_execution_failed',
    );
    const requiresHumanConfirmation = routeResult?.error?.requires_human_confirmation === true
      || routeResult?.run?.error?.requires_human_confirmation === true;
    const requiresExternalSecret = routeResult?.error?.requires_external_secret === true
      || routeResult?.run?.error?.requires_external_secret === true;
    const blockingReason = safeText(
      routeResult?.error?.message || routeResult?.run?.error?.message || routeResult?.error,
      'route_execution_failed',
    );
    const reviewRerunPolicy = loadRouteReviewRerunPolicy({
      workspaceRoot,
      topicId,
      deliverableId,
      stageId,
    });
    if (reviewRerunPolicy) {
      return {
        schema_version: 1,
        managed_run_id: managedRun.managed_run_id,
        stage_id: stageId,
        attempt,
        route_run_id: safeText(routeResult?.run?.run_id) || null,
        status: 'quality_blocked',
        summary: `${stageLabel(stageId)}要求回到${stageLabel(reviewRerunPolicy.rerunFromStage)}继续修复，系统已自动切回返修阶段。`,
        artifacts: artifactRefs,
        decision: 'rerun_from_review_stage',
        next_action: `run_${reviewRerunPolicy.rerunFromStage}`,
        blocking_reason: blockingReason,
        controller_decision: {
          decision: 'rerun_from_review_stage',
          reason_code: 'review_rerun_required',
          requires_human_confirmation: false,
          requires_external_secret: false,
        },
        recorded_at: new Date().toISOString(),
      };
    }
    const shouldRetry = attempt <= STAGE_RETRY_LIMIT;
    if (shouldRetry) {
      return {
        schema_version: 1,
        managed_run_id: managedRun.managed_run_id,
        stage_id: stageId,
        attempt,
        route_run_id: safeText(routeResult?.run?.run_id) || null,
        status: 'failed',
        summary: `${stageLabel(stageId)}执行失败，系统将自动重试。`,
        artifacts: artifactRefs,
        decision: 'retry_same_stage',
        next_action: `retry_${stageId}`,
        blocking_reason: blockingReason,
        controller_decision: {
          decision: 'retry_same_stage',
          reason_code: errorCode,
          requires_human_confirmation: false,
          requires_external_secret: false,
        },
        recorded_at: new Date().toISOString(),
      };
    }
    return {
      schema_version: 1,
      managed_run_id: managedRun.managed_run_id,
      stage_id: stageId,
      attempt,
      route_run_id: safeText(routeResult?.run?.run_id) || null,
      status: 'failed',
      summary: requiresHumanConfirmation || requiresExternalSecret
        ? `${stageLabel(stageId)}需要人工确认后才能继续。`
        : `${stageLabel(stageId)}连续失败，系统已升级到 supervisor 监管面。`,
      artifacts: artifactRefs,
      decision: requiresHumanConfirmation || requiresExternalSecret
        ? 'require_human_confirmation'
        : 'escalate_runtime',
      next_action: requiresHumanConfirmation || requiresExternalSecret
        ? 'await_human_confirmation'
        : 'supervise_managed_run',
      blocking_reason: blockingReason,
      controller_decision: {
        decision: requiresHumanConfirmation || requiresExternalSecret
          ? 'require_human_confirmation'
          : 'escalate_runtime',
        reason_code: errorCode,
        requires_human_confirmation: requiresHumanConfirmation,
        requires_external_secret: requiresExternalSecret,
      },
      recorded_at: new Date().toISOString(),
    };
  }

  if (managedRun.mode === 'stop_after_stage' && managedRun.stop_after_stage === stageId) {
    return {
      schema_version: 1,
      managed_run_id: managedRun.managed_run_id,
      stage_id: stageId,
      attempt,
      route_run_id: safeText(routeResult?.run?.run_id) || null,
      status: 'stopped_after_stage',
      summary: `${stageLabel(stageId)}已完成，并按你的要求停在这里。`,
      artifacts: artifactRefs,
      decision: 'stop_after_stage',
      next_action: 'await_user_decision',
      blocking_reason: null,
      controller_decision: {
        decision: 'pause_for_user_request',
        reason_code: 'user_requested_stop_after_stage',
        requires_human_confirmation: true,
        requires_external_secret: false,
      },
      recorded_at: new Date().toISOString(),
    };
  }

  if (!nextStage) {
    return {
      schema_version: 1,
      managed_run_id: managedRun.managed_run_id,
      stage_id: stageId,
      attempt,
      route_run_id: safeText(routeResult?.run?.run_id) || null,
      status: 'completed',
      summary: `${stageLabel(stageId)}已完成，最终交付物已就绪。`,
      artifacts: artifactRefs,
      decision: 'complete_managed_run',
      next_action: 'finalize_delivery',
      blocking_reason: null,
      controller_decision: {
        decision: 'complete_managed_run',
        reason_code: 'managed_run_completed',
        requires_human_confirmation: false,
        requires_external_secret: false,
      },
      recorded_at: new Date().toISOString(),
    };
  }

  return {
    schema_version: 1,
    managed_run_id: managedRun.managed_run_id,
    stage_id: stageId,
    attempt,
    route_run_id: safeText(routeResult?.run?.run_id) || null,
    status: 'completed',
    summary: `${stageLabel(stageId)}已完成，系统继续推进到${stageLabel(nextStage)}。`,
    artifacts: artifactRefs,
    decision: 'advance_to_next_stage',
    next_action: `run_${nextStage}`,
    blocking_reason: null,
    controller_decision: {
      decision: 'advance_to_next_stage',
      reason_code: 'stage_completed',
      requires_human_confirmation: false,
      requires_external_secret: false,
    },
    recorded_at: new Date().toISOString(),
  };
}

function applyStageIngestion({
  workspaceRoot,
  managedRun,
  stageResult,
  routeRunLink,
}) {
  managedRun.current_stage = stageResult.stage_id;
  managedRun.stage_results = [...safeArray(managedRun.stage_results), stageResult];
  if (routeRunLink) {
    managedRun.route_runs = [
      ...safeArray(managedRun.route_runs).filter((item) => !(item.stage_id === routeRunLink.stage_id && item.attempt === routeRunLink.attempt)),
      routeRunLink,
    ];
  }

  if (stageResult.decision === 'skip_stage') {
    managedRun.status = 'running';
    managedRun.current_blockers = [];
    managedRun.runtime_health_status = 'degraded';
    managedRun.parking_reason_code = null;
    managedRun.requires_human_confirmation = false;
    managedRun.requires_external_secret = false;
    managedRun.next_system_action = `系统将继续执行${stageLabel(stageResult.next_action.replace(/^run_/, ''))}`;
    managedRun.needs_user_decision = false;
    pushManagedEvent(workspaceRoot, managedRun, {
      kind: 'stage_skipped',
      stageId: stageResult.stage_id,
      summary: stageResult.summary,
    });
    return { done: false, ok: true };
  }

  if (stageResult.decision === 'advance_to_next_stage') {
    managedRun.status = 'running';
    managedRun.current_blockers = [];
    managedRun.runtime_health_status = 'degraded';
    managedRun.parking_reason_code = null;
    managedRun.requires_human_confirmation = false;
    managedRun.requires_external_secret = false;
    managedRun.next_system_action = `系统将继续执行${stageLabel(stageResult.next_action.replace(/^run_/, ''))}`;
    managedRun.needs_user_decision = false;
    pushManagedEvent(workspaceRoot, managedRun, {
      kind: 'stage_completed',
      stageId: stageResult.stage_id,
      summary: stageResult.summary,
    });
    return { done: false, ok: true };
  }

  if (stageResult.decision === 'complete_managed_run') {
    managedRun.status = 'completed';
    managedRun.finished_at = new Date().toISOString();
    managedRun.current_blockers = [];
    managedRun.runtime_health_status = 'completed';
    managedRun.parking_reason_code = null;
    managedRun.requires_human_confirmation = false;
    managedRun.requires_external_secret = false;
    managedRun.next_system_action = '交付已完成，可直接查看最终产物。';
    managedRun.needs_user_decision = false;
    managedRun.final_artifact_refs = safeArray(stageResult.artifacts);
    pushManagedEvent(workspaceRoot, managedRun, {
      kind: 'managed_completed',
      stageId: stageResult.stage_id,
      summary: stageResult.summary,
    });
    return { done: true, ok: true };
  }

  if (stageResult.decision === 'stop_after_stage') {
    managedRun.status = 'stopped_after_stage';
    managedRun.finished_at = new Date().toISOString();
    managedRun.current_blockers = [];
    managedRun.runtime_health_status = 'paused';
    managedRun.parking_reason_code = 'user_requested_stop_after_stage';
    managedRun.requires_human_confirmation = true;
    managedRun.requires_external_secret = false;
    managedRun.next_system_action = '等待你决定是否继续执行下一阶段。';
    managedRun.needs_user_decision = true;
    managedRun.final_artifact_refs = [];
    pushManagedEvent(workspaceRoot, managedRun, {
      kind: 'managed_paused',
      stageId: stageResult.stage_id,
      summary: `${stageResult.summary} 下一步等待你的继续指令。`,
    });
    return { done: true, ok: true };
  }

  if (stageResult.decision === 'retry_same_stage') {
    managedRun.status = 'running';
    managedRun.current_blockers = [stageResult.blocking_reason].filter(Boolean);
    managedRun.runtime_health_status = 'recovering';
    managedRun.parking_reason_code = safeText(stageResult.controller_decision?.reason_code) || null;
    managedRun.requires_human_confirmation = false;
    managedRun.requires_external_secret = false;
    managedRun.next_system_action = `系统正在重试${stageLabel(stageResult.stage_id)}。`;
    managedRun.needs_user_decision = false;
    pushManagedEvent(workspaceRoot, managedRun, {
      kind: 'stage_retry_scheduled',
      stageId: stageResult.stage_id,
      summary: stageResult.summary,
    });
    return { done: false, ok: true, retry: true };
  }

  if (stageResult.decision === 'rerun_from_review_stage') {
    const targetStageId = safeText(stageResult.next_action).replace(/^run_/, '');
    managedRun.status = 'running';
    managedRun.current_blockers = [stageResult.blocking_reason].filter(Boolean);
    managedRun.runtime_health_status = 'recovering';
    managedRun.parking_reason_code = safeText(stageResult.controller_decision?.reason_code) || null;
    managedRun.requires_human_confirmation = false;
    managedRun.requires_external_secret = false;
    managedRun.next_system_action = `系统将回到${stageLabel(targetStageId)}继续修复。`;
    managedRun.needs_user_decision = false;
    pushManagedEvent(workspaceRoot, managedRun, {
      kind: 'stage_rerun_requested',
      stageId: stageResult.stage_id,
      summary: stageResult.summary,
    });
    return { done: false, ok: true, jumpToStageId: targetStageId };
  }

  managedRun.finished_at = new Date().toISOString();
  managedRun.current_blockers = [stageResult.blocking_reason].filter(Boolean);
  managedRun.parking_reason_code = safeText(stageResult.controller_decision?.reason_code) || null;
  managedRun.requires_human_confirmation = stageResult.controller_decision?.requires_human_confirmation === true;
  managedRun.requires_external_secret = stageResult.controller_decision?.requires_external_secret === true;
  managedRun.final_artifact_refs = [];

  if (stageResult.decision === 'require_human_confirmation') {
    managedRun.status = 'needs_user_decision';
    managedRun.runtime_health_status = 'paused';
    managedRun.next_system_action = '等待必要的人工确认或外部凭证。';
    managedRun.needs_user_decision = true;
    pushManagedEvent(workspaceRoot, managedRun, {
      kind: 'managed_waiting_human',
      stageId: stageResult.stage_id,
      summary: stageResult.summary,
    });
    return { done: true, ok: false };
  }

  managedRun.status = 'escalated';
  managedRun.runtime_health_status = 'escalated';
  managedRun.next_system_action = '等待 supervisor tick 刷新托管监管面并决定是否恢复。';
  managedRun.needs_user_decision = false;
  pushManagedEvent(workspaceRoot, managedRun, {
    kind: 'managed_escalated',
    stageId: stageResult.stage_id,
    summary: stageResult.summary,
  });
  return { done: true, ok: false };
}

async function executeManagedStageTask({
  workspaceRoot,
  contract,
  contractFile,
  deliverablePaths,
  managedRun,
  stageContract,
  stageId,
  stages,
  mode,
  baselineDeliverableId,
}) {
  if (shouldSkipManagedStage({
    contract,
    deliverablePaths,
    managedRun,
    stageId,
  })) {
    const skippedStageResult = buildSkippedStageResult({
      managedRun,
      stageId,
      stages,
    });
    const applied = applyStageIngestion({
      workspaceRoot,
      managedRun,
      stageResult: skippedStageResult,
      routeRunLink: null,
    });
    return { ok: applied.ok !== false, done: applied.done === true, applied, stageResult: skippedStageResult };
  }

  const attempt = safeArray(managedRun.route_runs).filter((item) => item.stage_id === stageId).length + 1;
  managedRun.current_stage = stageId;
  managedRun.worker_running = true;
  managedRun.active_run_id = null;
  managedRun.runtime_liveness_audit = buildRuntimeLivenessAudit({
    status: 'live',
    reasonCode: 'stage_execution_in_progress',
  });
  managedRun.runtime_health_status = 'live';

  const promptAudit = buildPromptAudit({
    managedRun,
    contract,
    contractFile,
    deliverablePaths,
    stageContract,
    attempt,
  });
  const promptAuditRef = managedPromptAuditFile({
    workspaceRoot,
    managedRunId: managedRun.managed_run_id,
    stageId,
    attempt,
  });
  writeJson(promptAuditRef, promptAudit);
  pushManagedEvent(workspaceRoot, managedRun, {
    kind: 'stage_started',
    stageId,
    summary: `开始执行${stageLabel(stageId)}。`,
  });
  persistManagedState(workspaceRoot, managedRun);

  let routeResult;
  try {
    routeResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: managedRun.overlay,
      topicId: managedRun.topic_id,
      deliverableId: managedRun.deliverable_id,
      route: stageId,
      adapter: managedRun.active_adapter,
      mode,
      baselineDeliverableId,
      managedRunId: managedRun.managed_run_id,
    });
  } catch (error) {
    routeResult = {
      ok: false,
      run: null,
      artifactFile: null,
      error: {
        code: error?.code || 'stage_execution_exception',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
  managedRun.worker_running = false;
  managedRun.active_run_id = null;
  const qualityBlocked = safeText(routeResult?.run?.status) === 'quality_blocked';
  managedRun.runtime_liveness_audit = buildRuntimeLivenessAudit({
    status: qualityBlocked ? 'live' : 'none',
    reasonCode: routeResult?.ok
      ? 'stage_execution_finished'
      : (qualityBlocked ? 'stage_quality_blocked' : 'stage_execution_failed'),
  });
  managedRun.runtime_health_status = routeResult?.ok || qualityBlocked ? 'degraded' : 'escalated';
  promptAudit.output_refs = uniqueList([
    routeResult?.artifactFile,
    ...safeArray(routeResult?.run?.artifact_refs),
  ]);
  writeJson(promptAuditRef, promptAudit);

  const stageResult = buildStageIngestion({
    workspaceRoot,
    topicId: managedRun.topic_id,
    deliverableId: managedRun.deliverable_id,
    contract,
    managedRun,
    routeResult,
    stageId,
    attempt,
    stages,
  });
  const resultRef = managedResultFile({
    workspaceRoot,
    managedRunId: managedRun.managed_run_id,
    stageId,
    attempt,
  });
  writeJson(resultRef, stageResult);

  const routeRunLink = {
    stage_id: stageId,
    attempt,
    route_run_id: safeText(routeResult?.run?.run_id) || `${managedRun.managed_run_id}:${stageId}:attempt-${attempt}`,
    status: routeResult?.run?.status || (routeResult?.ok ? 'completed' : 'failed'),
    prompt_audit_ref: promptAuditRef,
    result_ref: resultRef,
    started_at: routeResult?.run?.started_at || null,
    finished_at: routeResult?.run?.finished_at || null,
  };

  const applied = applyStageIngestion({
    workspaceRoot,
    managedRun,
    stageResult,
    routeRunLink,
  });
  return {
    ok: applied.ok !== false && applied.retry !== true && !safeText(applied.jumpToStageId),
    done: applied.done === true,
    applied,
    stageResult,
    routeResult,
  };
}

async function executeManagedSequentialStages({
  workspaceRoot,
  contract,
  contractFile,
  deliverablePaths,
  managedRun,
  stages,
  mode,
  baselineDeliverableId,
  startStageId = '',
}) {
  let managedState = persistManagedState(workspaceRoot, managedRun);
  let stageIndex = safeText(startStageId)
    ? stages.findIndex((stage) => safeText(stage?.stage_id) === safeText(startStageId))
    : 0;
  if (stageIndex < 0) {
    throw new Error(`Managed resume stage not declared by contract: ${startStageId}`);
  }
  for (; stageIndex < stages.length; ) {
    const stageContract = stages[stageIndex];
    const stageId = safeText(stageContract?.stage_id);
    const stageExecution = await executeManagedStageTask({
      workspaceRoot,
      contract,
      contractFile,
      deliverablePaths,
      managedRun,
      stageContract,
      stageId,
      stages,
      mode,
      baselineDeliverableId,
    });
    managedState = persistManagedState(workspaceRoot, managedRun);
    const { applied, stageResult } = stageExecution;

    if (applied.retry === true) {
      continue;
    }

    if (safeText(applied.jumpToStageId)) {
      const jumpIndex = stages.findIndex(
        (stage) => safeText(stage?.stage_id) === safeText(applied.jumpToStageId),
      );
      if (jumpIndex === -1) {
        throw new Error(`Managed rerun stage not declared by contract: ${applied.jumpToStageId}`);
      }
      stageIndex = jumpIndex;
      continue;
    }

    if (applied.done) {
      return {
        ok: applied.ok,
        managed_run: managedRun,
        progress_projection: managedState.projection,
        runtime_supervision: managedState.runtimeSupervision,
        escalation_record: managedState.escalationRecord,
      };
    }

    const scheduledStageId = safeText(stageResult.next_action).replace(/^run_/, '');
    if (scheduledStageId) {
      const scheduledIndex = stages.findIndex(
        (stage) => safeText(stage?.stage_id) === scheduledStageId,
      );
      if (scheduledIndex !== -1) {
        stageIndex = scheduledIndex;
        continue;
      }
    }

    stageIndex += 1;
  }

  managedRun.status = 'completed';
  managedRun.finished_at = new Date().toISOString();
  managedRun.runtime_health_status = 'completed';
  managedRun.next_system_action = '交付已完成，可直接查看最终产物。';
  managedRun.needs_user_decision = false;
  managedState = persistManagedState(workspaceRoot, managedRun);
  return {
    ok: true,
    managed_run: managedRun,
    progress_projection: managedState.projection,
    runtime_supervision: managedState.runtimeSupervision,
    escalation_record: managedState.escalationRecord,
  };
}

async function executeManagedDagStages({
  workspaceRoot,
  contract,
  contractFile,
  deliverablePaths,
  managedRun,
  stages,
  mode,
  baselineDeliverableId,
}) {
  const stagesById = new Map(stages.map((stage) => [safeText(stage?.stage_id), stage]));
  const dagExecution = await executeManagedDagLayers({
    plan: managedRun.execution_plan,
    executeTask: async (task) => {
      if (task.task_kind === 'source_pack') {
        return { ok: true, task_kind: 'source_pack', source_pack_id: task.source_pack_id };
      }
      if (task.task_kind !== 'deliverable_route') {
        return { ok: false, error: `Unsupported managed DAG task: ${task.task_kind}` };
      }
      const stageId = safeText(task.stage_id);
      const stageContract = stagesById.get(stageId);
      if (!stageContract) {
        return { ok: false, error: `Managed DAG stage not declared by contract: ${stageId}` };
      }
      return executeManagedStageTask({
        workspaceRoot,
        contract,
        contractFile,
        deliverablePaths,
        managedRun,
        stageContract,
        stageId,
        stages,
        mode,
        baselineDeliverableId,
      });
    },
  });
  managedRun.execution_result = dagExecution;
  const failedTaskResult = safeArray(dagExecution.layer_results)
    .flatMap((layerResult) => safeArray(layerResult.task_results))
    .find((taskResult) => taskResult.ok === false);
  const failedApplied = failedTaskResult?.result?.applied || null;
  if (failedApplied?.retry === true || safeText(failedApplied?.jumpToStageId)) {
    const resumeStageId = safeText(failedApplied?.jumpToStageId)
      || safeText(failedTaskResult?.result?.stageResult?.stage_id);
    const resumedDagExecution = {
      ...dagExecution,
      resumed_by_sequential_control_flow: {
        from_layer_index: dagExecution.failed_layer_index,
        resume_stage_id: resumeStageId,
        reason_code: failedApplied?.retry === true
          ? 'retry_same_stage_requires_serial_control_flow'
          : 'rerun_from_review_stage_requires_serial_control_flow',
      },
    };
    managedRun.execution_result = resumedDagExecution;
    const result = await executeManagedSequentialStages({
      workspaceRoot,
      contract,
      contractFile,
      deliverablePaths,
      managedRun,
      stages,
      mode,
      baselineDeliverableId,
      startStageId: resumeStageId,
    });
    result.managed_run.execution_result = resumedDagExecution;
    const managedState = persistManagedState(workspaceRoot, result.managed_run);
    return {
      ...result,
      progress_projection: managedState.projection,
      runtime_supervision: managedState.runtimeSupervision,
      escalation_record: managedState.escalationRecord,
    };
  }
  if (dagExecution.ok !== true) {
    const managedState = persistManagedState(workspaceRoot, managedRun);
    return {
      ok: false,
      managed_run: managedRun,
      progress_projection: managedState.projection,
      runtime_supervision: managedState.runtimeSupervision,
      escalation_record: managedState.escalationRecord,
    };
  }
  const managedState = persistManagedState(workspaceRoot, managedRun);
  return {
    ok: managedRun.status === 'completed' || managedRun.status === 'stopped_after_stage',
    managed_run: managedRun,
    progress_projection: managedState.projection,
    runtime_supervision: managedState.runtimeSupervision,
    escalation_record: managedState.escalationRecord,
  };
}

export async function runManagedDeliverable({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  adapter = CODEX_DEFAULT_ADAPTER,
  userIntent = '',
  stopAfterStage = '',
  mode = 'draft_new',
  baselineDeliverableId = '',
}) {
  const { deliverablePaths, contract: storedContract, contractFile } = loadHydratedContract({
    workspaceRoot,
    topicId,
    deliverableId,
  });
  const contract = { ...storedContract, shared_source_truth: loadSharedSourceTruth(workspaceRoot, topicId) };
  const requestedOverlay = safeText(overlay);
  const contractOverlay = safeText(contract?.overlay);
  const stages = safeArray(contract?.stage_sequence?.stages);
  const requestedStopAfterStage = safeText(stopAfterStage);
  const normalizedAdapter = assertSupportedManagedAdapter(adapter);
  assertManagedOverlayMatchesContract({
    requestedOverlay,
    contractOverlay,
  });
  assertManagedStopAfterStageDeclared({
    stopAfterStage: requestedStopAfterStage,
    stages,
  });
  const runtimeReady = await probeRequestedRuntime(normalizedAdapter, workspaceRoot);
  if (!runtimeReady.ok) {
    const error = new Error(
      `${normalizedAdapter === HERMES_NATIVE_PROOF_ADAPTER ? 'Hermes-native proof' : 'Codex CLI'} blocked: ${runtimeReady.blocking_reason || runtimeReady.error_kind || 'unknown'}`,
    );
    error.runtime_owner = runtimeReady.runtime_owner;
    error.probe = runtimeReady;
    throw error;
  }
  const managedRun = createManagedRun({
    workspaceRoot,
    overlay: contractOverlay,
    topicId,
    deliverableId,
    mode: requestedStopAfterStage ? 'stop_after_stage' : 'auto_to_terminal',
    stopAfterStage: requestedStopAfterStage || null,
    userIntent: safeText(userIntent) || safeText(contract.goal),
    adapter: normalizedAdapter,
  });
  managedRun.runtime_bridge = runtimeBridgeFromProbe(normalizedAdapter, runtimeReady);
  managedRun.execution_plan = planManagedDeliverableDag({
    sourcePackId: contract?.shared_source_truth?.source_readiness_pack?.pack_id
      || contract?.shared_source_truth?.source_brief?.topic_id
      || '',
    deliverables: [{
      overlay: contractOverlay,
      topicId,
      deliverableId,
      stages,
    }],
  });

  pushManagedEvent(workspaceRoot, managedRun, {
    kind: 'managed_started',
    summary: `已接管整条交付链路，准备从${stageLabel(stages[0]?.stage_id || '首阶段')}开始。`,
  });
  persistManagedState(workspaceRoot, managedRun);

  return executeManagedDagStages({
    workspaceRoot,
    contract,
    contractFile,
    deliverablePaths,
    managedRun,
    stages,
    mode,
    baselineDeliverableId,
  });
}

export async function getManagedRun({ workspaceRoot, managedRunId }) {
  const managedRun = loadManagedRun({ workspaceRoot, managedRunId });
  const state = loadPersistedManagedState(workspaceRoot, managedRunId);
  return {
    ok: true,
    managed_run: managedRun,
    progress_projection: state.projection,
    runtime_supervision: state.runtimeSupervision,
    escalation_record: state.escalationRecord,
  };
}

export async function superviseManagedRun({ workspaceRoot, managedRunId }) {
  const managedRun = loadManagedRun({ workspaceRoot, managedRunId });
  reconcileManagedRunLiveness({ workspaceRoot, managedRun, buildRuntimeLivenessAudit });
  const state = persistManagedState(workspaceRoot, managedRun);
  return {
    ok: true,
    managed_run: managedRun,
    progress_projection: state.projection,
    runtime_supervision: state.runtimeSupervision,
    escalation_record: state.escalationRecord,
  };
}
