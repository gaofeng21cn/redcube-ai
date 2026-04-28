// @ts-nocheck
import { appendManagedEvent } from './managed-event-log.js';
import {
  loadManagedEscalationRecord,
  loadManagedProgressProjection,
  loadManagedRuntimeSupervision,
  managedEscalationLatestFile,
  managedProgressLatestFile,
  managedRunFilePath,
  runtimeSupervisionLatestFile,
  saveLatestManagedProgressProjection,
  saveManagedEscalationLatest,
  saveManagedEscalationRecord,
  saveManagedProgressProjection,
  saveManagedRun,
  saveManagedRuntimeSupervision,
  saveRuntimeSupervisionLatest,
} from './managed-run-store.js';
import { loadHydratedContract, shouldSkipAutoToTerminalStage } from './managed-run-contract.js';
import {
  formatClock,
  safeArray,
  safeText,
  stageLabel,
  uniqueList,
} from './managed-run-shared.js';

function loadManagedStageSequence(workspaceRoot, managedRun) {
  try {
    const { contract, deliverablePaths } = loadHydratedContract({
      workspaceRoot,
      topicId: managedRun.topic_id,
      deliverableId: managedRun.deliverable_id,
    });
    return safeArray(contract?.stage_sequence?.stages)
      .map((stage) => safeText(stage?.stage_id))
      .filter(Boolean)
      .filter((stageId) => !shouldSkipAutoToTerminalStage({
        contract,
        deliverablePaths,
        managedRun,
        stageId,
      }));
  } catch {
    return uniqueList(safeArray(managedRun.stage_results).map((stage) => stage?.stage_id));
  }
}

function healthLabel(healthStatus) {
  switch (safeText(healthStatus)) {
    case 'live':
      return '当前 runtime 健康状态：在线。';
    case 'recovering':
      return '当前 runtime 健康状态：恢复中。';
    case 'paused':
      return '当前 runtime 健康状态：已停车，等待明确继续信号。';
    case 'completed':
      return '当前 runtime 健康状态：已完成本次托管执行。';
    case 'escalated':
      return '当前 runtime 健康状态：已升级处理。';
    default:
      return '当前 runtime 健康状态：降级。';
  }
}

export function buildRuntimeLivenessAudit({ status, reasonCode, checkedAt = new Date().toISOString() }) {
  return {
    status: status === 'live' ? 'live' : 'none',
    checked_at: checkedAt,
    reason_code: safeText(reasonCode, 'runtime_state_recorded'),
  };
}

function buildContentStatus(managedRun) {
  if (managedRun.status === 'completed') return 'completed';
  if (managedRun.status === 'stopped_after_stage') return 'paused_for_user_request';
  if (managedRun.status === 'needs_user_decision') return 'blocked_requires_human';
  if (managedRun.status === 'escalated') return 'blocked_by_runtime';
  return 'running';
}

function buildManagedProgressProjection(workspaceRoot, managedRun) {
  const stageSequence = loadManagedStageSequence(workspaceRoot, managedRun);
  const completedStageResults = safeArray(managedRun.stage_results)
    .filter((stageResult) => (
      stageResult?.status === 'completed'
      || stageResult?.status === 'stopped_after_stage'
      || stageResult?.status === 'skipped'
    ));
  const completedStages = uniqueList(completedStageResults.map((stageResult) => stageResult.stage_id));
  const remainingStages = stageSequence.filter((stageId) => !completedStages.includes(stageId));
  const lastCompletedStageResult = completedStageResults.at(-1) || null;
  const reportedAt = new Date().toISOString();
  const currentBlockers = uniqueList(managedRun.current_blockers);
  const needsHumanIntervention = managedRun.status === 'stopped_after_stage'
    || managedRun.status === 'needs_user_decision'
    || managedRun.requires_human_confirmation === true
    || managedRun.requires_external_secret === true;
  const mainlineStage = safeText(managedRun.current_stage)
    ? stageLabel(managedRun.current_stage)
    : stageLabel(stageSequence[0] || '未开始');

  return {
    current_stage: managedRun.current_stage,
    latest_events: safeArray(managedRun.latest_events).slice(-12),
    current_blockers: currentBlockers,
    next_system_action: safeText(managedRun.next_system_action) || null,
    needs_user_decision: managedRun.needs_user_decision === true,
    final_artifact_refs: uniqueList(managedRun.final_artifact_refs),
    content_status: buildContentStatus(managedRun),
    completed_stages: completedStages,
    remaining_stages: remainingStages,
    last_completed_stage: lastCompletedStageResult?.stage_id || null,
    last_completed_at: lastCompletedStageResult?.recorded_at || null,
    human_report: {
      reported_at: reportedAt,
      recent_completion: lastCompletedStageResult
        ? `${formatClock(lastCompletedStageResult.recorded_at)} 完成了${stageLabel(lastCompletedStageResult.stage_id)}。`
        : `${formatClock(managedRun.started_at || reportedAt)} 开始托管执行。`,
      mainline_status: `当前主线推进到${mainlineStage}，距离最终交付还剩${remainingStages.length}步。`,
      runtime_health: healthLabel(managedRun.runtime_health_status),
      current_blockers: currentBlockers.length > 0
        ? `当前阻塞：${currentBlockers.join('；')}`
        : '当前阻塞：无。',
      next_system_action: `下一步系统准备做什么：${safeText(managedRun.next_system_action, '等待下一次 supervisor tick。')}`,
      needs_human_intervention: needsHumanIntervention,
    },
  };
}

function buildManagedEscalationRecord(workspaceRoot, managedRun) {
  const escalationStatus = managedRun.status === 'escalated' ? 'escalated' : 'none';
  const requiresHumanIntervention = managedRun.status === 'needs_user_decision';
  return {
    schema_version: 1,
    recorded_at: new Date().toISOString(),
    managed_run_id: managedRun.managed_run_id,
    escalation_status: escalationStatus,
    reason_code: escalationStatus === 'escalated'
      ? safeText(managedRun.parking_reason_code, 'runtime_supervision_required')
      : null,
    severity: escalationStatus === 'escalated' ? 'managed_runtime' : 'none',
    recommended_actions: escalationStatus === 'escalated'
      ? [safeText(managedRun.next_system_action, 'run_supervise_managed_run')]
      : [],
    evidence_refs: uniqueList([
      ...safeArray(managedRun.route_runs).map((run) => run?.result_ref),
      ...safeArray(managedRun.route_runs).map((run) => run?.prompt_audit_ref),
    ]),
    runtime_context_refs: {
      managed_run_path: managedRunFilePath({
        workspaceRoot,
        managedRunId: managedRun.managed_run_id,
      }),
    },
    requires_human_intervention: requiresHumanIntervention,
  };
}

function buildRuntimeSupervision(workspaceRoot, managedRun, projection) {
  const recordedAt = new Date().toISOString();
  const needsHumanIntervention = managedRun.status === 'stopped_after_stage'
    || managedRun.status === 'needs_user_decision'
    || managedRun.requires_human_confirmation === true
    || managedRun.requires_external_secret === true;
  const healthStatus = safeText(managedRun.runtime_health_status, 'degraded');

  return {
    schema_version: 1,
    recorded_at: recordedAt,
    managed_run_id: managedRun.managed_run_id,
    overlay: managedRun.overlay,
    topic_id: managedRun.topic_id,
    deliverable_id: managedRun.deliverable_id,
    health_status: healthStatus,
    runtime_liveness_audit: managedRun.runtime_liveness_audit,
    worker_running: managedRun.worker_running === true,
    active_run_id: managedRun.active_run_id || null,
    current_stage: managedRun.current_stage,
    content_status: projection.content_status,
    current_blockers: projection.current_blockers,
    runtime_owner: safeText(managedRun.runtime_bridge?.owner) || null,
    needs_human_intervention: needsHumanIntervention,
    summary: `${formatClock(recordedAt)} ${projection.human_report.mainline_status} ${projection.human_report.runtime_health}`,
    next_action: safeText(managedRun.next_system_action) || null,
    last_transition: healthStatus === 'completed'
      ? 'managed_run_completed'
      : healthStatus === 'paused'
        ? 'user_requested_pause'
        : healthStatus === 'live'
          ? 'stage_execution_started'
          : healthStatus === 'escalated'
            ? 'runtime_escalated'
            : 'runtime_state_recorded',
    recovery_attempt_count: healthStatus === 'recovering' ? 1 : 0,
    consecutive_failure_count: healthStatus === 'escalated' ? 1 : 0,
    refs: {
      managed_run_path: managedRunFilePath({
        workspaceRoot,
        managedRunId: managedRun.managed_run_id,
      }),
      progress_projection_path: managedProgressLatestFile(workspaceRoot),
      runtime_supervision_path: runtimeSupervisionLatestFile(workspaceRoot),
      escalation_record_path: managedEscalationLatestFile(workspaceRoot),
    },
  };
}

export function persistManagedState(workspaceRoot, managedRun) {
  saveManagedRun({ workspaceRoot, managedRun });
  const projection = buildManagedProgressProjection(workspaceRoot, managedRun);
  saveManagedProgressProjection({
    workspaceRoot,
    managedRunId: managedRun.managed_run_id,
    projection,
  });
  saveLatestManagedProgressProjection({
    workspaceRoot,
    projection,
  });
  const escalationRecord = buildManagedEscalationRecord(workspaceRoot, managedRun);
  saveManagedEscalationRecord({
    workspaceRoot,
    managedRunId: managedRun.managed_run_id,
    escalationRecord,
  });
  saveManagedEscalationLatest({
    workspaceRoot,
    escalationRecord,
  });
  const runtimeSupervision = buildRuntimeSupervision(workspaceRoot, managedRun, projection);
  saveManagedRuntimeSupervision({
    workspaceRoot,
    managedRunId: managedRun.managed_run_id,
    runtimeSupervision,
  });
  saveRuntimeSupervisionLatest({
    workspaceRoot,
    runtimeSupervision,
  });
  return {
    projection,
    runtimeSupervision,
    escalationRecord,
  };
}

export function loadPersistedManagedState(workspaceRoot, managedRunId) {
  const projection = loadManagedProgressProjection({ workspaceRoot, managedRunId });
  if (!projection) {
    throw new Error(`Managed progress projection missing for managed run: ${managedRunId}`);
  }
  const runtimeSupervision = loadManagedRuntimeSupervision({ workspaceRoot, managedRunId });
  if (!runtimeSupervision) {
    throw new Error(`Managed runtime supervision missing for managed run: ${managedRunId}`);
  }
  const escalationRecord = loadManagedEscalationRecord({ workspaceRoot, managedRunId });
  if (!escalationRecord) {
    throw new Error(`Managed escalation record missing for managed run: ${managedRunId}`);
  }
  return {
    projection,
    runtimeSupervision,
    escalationRecord,
  };
}

export function pushManagedEvent(workspaceRoot, managedRun, { kind, stageId = null, summary }) {
  const at = new Date().toISOString();
  const event = {
    at,
    stage_id: stageId,
    kind,
    summary: `${formatClock(at)} ${summary}`,
  };
  managedRun.latest_events = [...safeArray(managedRun.latest_events), event].slice(-20);
  appendManagedEvent(workspaceRoot, managedRun.managed_run_id, event);
}
