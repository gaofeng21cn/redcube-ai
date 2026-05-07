// @ts-nocheck
import { pushManagedEvent } from '../managed-run-surfaces.js';
import { safeArray, safeText, stageLabel } from '../managed-run-shared.js';

export function applyStageIngestion({
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
