// @ts-nocheck
import { runDeliverableRoute } from '../deliverable-routes.js';
import { executeManagedDagLayers } from '../managed-dag-scheduler.js';
import { managedPromptAuditFile, managedResultFile } from '../managed-run-store.js';
import { buildPromptAudit } from '../managed-prompt-audit.js';
import { shouldSkipManagedStage } from '../managed-run-contract.js';
import { buildRuntimeLivenessAudit, persistManagedState, pushManagedEvent } from '../managed-run-surfaces.js';
import { safeArray, safeText, stageLabel, uniqueList, writeJson } from '../managed-run-shared.js';
import { buildSkippedStageResult, buildStageIngestion } from './stage-decision.js';
import { applyStageIngestion } from './state-mutation.js';

export async function executeManagedStageTask({
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

export async function executeManagedSequentialStages({
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

export async function executeManagedDagStages({
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
