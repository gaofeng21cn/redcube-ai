import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';

import { runDeliverableRoute } from './deliverable-routes.js';
import { appendManagedEvent } from './managed-event-log.js';
import {
  createManagedRun,
  loadManagedEscalationRecord,
  loadManagedRun,
  loadManagedProgressProjection,
  loadManagedRuntimeSupervision,
  managedEscalationLatestFile,
  managedProgressLatestFile,
  managedPromptAuditFile,
  managedRunFilePath,
  managedResultFile,
  saveManagedEscalationRecord,
  runtimeSupervisionLatestFile,
  saveLatestManagedProgressProjection,
  saveManagedEscalationLatest,
  saveManagedProgressProjection,
  saveManagedRuntimeSupervision,
  saveManagedRun,
  saveRuntimeSupervisionLatest,
} from './managed-run-store.js';

const STAGE_LABELS = Object.freeze({
  research: '资料补齐',
  storyline: '主线故事',
  detailed_outline: '详细大纲',
  single_note_plan: '单篇结构',
  slide_blueprint: '页面蓝图',
  poster_blueprint: '海报蓝图',
  visual_direction: '视觉方向',
  render_html: '版面生成',
  visual_director_review: '导演复核',
  screenshot_review: '截图质检',
  publish_copy: '发布文案',
  export_bundle: '交付打包',
  export_pptx: '最终导出',
});

const STAGE_RETRY_LIMIT = 1;

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueList(items) {
  return [...new Set(safeArray(items).map((item) => safeText(item)).filter(Boolean))];
}

function stageLabel(stageId) {
  return STAGE_LABELS[stageId] || stageId;
}

function formatClock(iso) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function loadHydratedContract({ workspaceRoot, topicId, deliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const deliverable = readJson(deliverablePaths.deliverableFile);
  const contractRef = safeText(
    deliverable?.hydrated_contract_ref,
    'contracts/hydrated-deliverable.json',
  );
  return {
    deliverablePaths,
    deliverable,
    contract: readJson(path.join(deliverablePaths.deliverableDir, contractRef)),
    contractFile: path.join(deliverablePaths.deliverableDir, contractRef),
  };
}

function stageArtifactPath(contract, deliverablePaths, stageId) {
  const stage = safeArray(contract?.stage_sequence?.stages).find((item) => item?.stage_id === stageId);
  return path.join(
    deliverablePaths.artifactsDir,
    safeText(stage?.output_artifact, `${stageId}.json`),
  );
}

function collectExistingArtifacts(deliverablePaths) {
  if (!existsSync(deliverablePaths.artifactsDir)) {
    return [];
  }
  return readdirSync(deliverablePaths.artifactsDir)
    .filter(Boolean)
    .map((entry) => path.join(deliverablePaths.artifactsDir, entry));
}

function buildEffectivePrompt({
  contract,
  stageContract,
  userIntent,
  upstreamStageOutputs,
  existingArtifacts,
}) {
  return [
    `用户意图: ${safeText(userIntent, safeText(contract.goal))}`,
    `交付目标: ${safeText(contract.title)} / ${safeText(contract.goal)}`,
    `交付合同: overlay=${safeText(contract.overlay)}, profile=${safeText(contract.profile_id)}, kind=${safeText(contract.deliverable_kind)}`,
    `当前阶段: ${stageLabel(stageContract.stage_id)}`,
    `上游阶段输出: ${upstreamStageOutputs.length > 0 ? upstreamStageOutputs.map((item) => `${stageLabel(item.stage_id)}=${item.exists ? 'ready' : 'missing'}`).join(', ') : 'none'}`,
    `已有产物: ${existingArtifacts.length > 0 ? existingArtifacts.map((file) => path.basename(file)).join(', ') : 'none'}`,
    `阶段策略: prompt_file=${safeText(stageContract.prompt_file)}, output_artifact=${safeText(stageContract.output_artifact)}, requires=${safeArray(stageContract.requires_stages).join(', ') || 'none'}`,
    '执行要求: 输出当前阶段正式 artifact，并给出能支持下一步决策的结构化结果。',
  ].join('\n');
}

function buildPromptAudit({
  managedRun,
  contract,
  contractFile,
  deliverablePaths,
  stageContract,
  attempt,
}) {
  const upstreamStageOutputs = safeArray(stageContract?.requires_stages).map((stageId) => {
    const ref = stageArtifactPath(contract, deliverablePaths, stageId);
    return {
      stage_id: stageId,
      ref,
      exists: existsSync(ref),
    };
  });
  const existingArtifacts = collectExistingArtifacts(deliverablePaths);
  return {
    schema_version: 1,
    managed_run_id: managedRun.managed_run_id,
    stage_id: stageContract.stage_id,
    attempt,
    generated_at: new Date().toISOString(),
    model: 'codex_native_host_agent',
    tool_policy: 'managed_control_plane_audit_v1',
    input: {
      user_intent: {
        request: safeText(managedRun.user_intent?.request),
      },
      deliverable_contract: {
        overlay: safeText(contract.overlay),
        profile_id: safeText(contract.profile_id),
        deliverable_kind: safeText(contract.deliverable_kind),
        title: safeText(contract.title),
        goal: safeText(contract.goal),
      },
      upstream_stage_outputs: upstreamStageOutputs,
      existing_artifacts: existingArtifacts,
      route_strategy: {
        stage_id: stageContract.stage_id,
        prompt_file: safeText(stageContract.prompt_file),
        output_artifact: safeText(stageContract.output_artifact),
        requires_stages: safeArray(stageContract.requires_stages),
      },
    },
    effective_prompt: buildEffectivePrompt({
      contract,
      stageContract,
      userIntent: managedRun.user_intent?.request,
      upstreamStageOutputs,
      existingArtifacts,
    }),
    input_refs: uniqueList([
      deliverablePaths.deliverableFile,
      contractFile,
      ...upstreamStageOutputs.filter((item) => item.exists).map((item) => item.ref),
      ...existingArtifacts,
    ]),
    output_refs: [],
  };
}

function loadManagedStageSequence(workspaceRoot, managedRun) {
  try {
    const { contract } = loadHydratedContract({
      workspaceRoot,
      topicId: managedRun.topic_id,
      deliverableId: managedRun.deliverable_id,
    });
    return safeArray(contract?.stage_sequence?.stages)
      .map((stage) => safeText(stage?.stage_id))
      .filter(Boolean);
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

function buildRuntimeLivenessAudit({ status, reasonCode, checkedAt = new Date().toISOString() }) {
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
    .filter((stageResult) => stageResult?.status === 'completed' || stageResult?.status === 'stopped_after_stage');
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

function persistManagedState(workspaceRoot, managedRun) {
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

function loadPersistedManagedState(workspaceRoot, managedRunId) {
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

function pushManagedEvent(workspaceRoot, managedRun, { kind, stageId = null, summary }) {
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

function nextStageId(stages, currentStageId) {
  const index = stages.findIndex((stage) => stage?.stage_id === currentStageId);
  if (index < 0) return null;
  return stages[index + 1]?.stage_id || null;
}

function buildStageIngestion({
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
  const nextStage = nextStageId(stages, stageId);

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
    if (errorCode === 'compatibility_adapter_route_unsupported'
      && safeText(managedRun.active_adapter, 'host_agent') !== 'host_agent') {
      return {
        schema_version: 1,
        managed_run_id: managedRun.managed_run_id,
        stage_id: stageId,
        attempt,
        route_run_id: safeText(routeResult?.run?.run_id) || null,
        status: 'failed',
        summary: `${stageLabel(stageId)}当前 compatibility adapter 不支持，系统切回主执行器继续推进。`,
        artifacts: artifactRefs,
        decision: 'switch_to_primary_adapter',
        next_action: `retry_${stageId}`,
        blocking_reason: blockingReason,
        controller_decision: {
          decision: 'switch_to_primary_adapter',
          reason_code: 'compatibility_adapter_route_unsupported',
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
  managedRun.route_runs = [
    ...safeArray(managedRun.route_runs).filter((item) => !(item.stage_id === routeRunLink.stage_id && item.attempt === routeRunLink.attempt)),
    routeRunLink,
  ];

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

  if (stageResult.decision === 'switch_to_primary_adapter') {
    const previousAdapter = safeText(managedRun.active_adapter, 'host_agent');
    managedRun.status = 'running';
    managedRun.adapter_switches = [
      ...safeArray(managedRun.adapter_switches),
      {
        at: new Date().toISOString(),
        from_adapter: previousAdapter,
        to_adapter: 'host_agent',
        reason_code: safeText(stageResult.controller_decision?.reason_code, 'compatibility_adapter_route_unsupported'),
        stage_id: stageResult.stage_id,
      },
    ];
    managedRun.active_adapter = 'host_agent';
    managedRun.current_blockers = [];
    managedRun.runtime_health_status = 'recovering';
    managedRun.parking_reason_code = null;
    managedRun.requires_human_confirmation = false;
    managedRun.requires_external_secret = false;
    managedRun.next_system_action = `系统已切换到主执行器，将继续重试${stageLabel(stageResult.stage_id)}。`;
    managedRun.needs_user_decision = false;
    pushManagedEvent(workspaceRoot, managedRun, {
      kind: 'adapter_switched',
      stageId: stageResult.stage_id,
      summary: stageResult.summary,
    });
    return { done: false, ok: true, retry: true };
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

export async function runManagedDeliverable({
  workspaceRoot,
  overlay,
  topicId,
  deliverableId,
  adapter = 'host_agent',
  userIntent = '',
  stopAfterStage = '',
  mode = 'draft_new',
  baselineDeliverableId = '',
}) {
  const { deliverablePaths, contract, contractFile } = loadHydratedContract({
    workspaceRoot,
    topicId,
    deliverableId,
  });
  const stages = safeArray(contract?.stage_sequence?.stages);
  const managedRun = createManagedRun({
    workspaceRoot,
    overlay,
    topicId,
    deliverableId,
    mode: safeText(stopAfterStage) ? 'stop_after_stage' : 'auto_to_terminal',
    stopAfterStage: safeText(stopAfterStage) || null,
    userIntent: safeText(userIntent) || safeText(contract.goal),
    adapter,
  });

  pushManagedEvent(workspaceRoot, managedRun, {
    kind: 'managed_started',
    summary: `已接管整条交付链路，准备从${stageLabel(stages[0]?.stage_id || '首阶段')}开始。`,
  });
  let managedState = persistManagedState(workspaceRoot, managedRun);

  for (let stageIndex = 0; stageIndex < stages.length; ) {
    const stageContract = stages[stageIndex];
    const stageId = safeText(stageContract?.stage_id);
    const attempt = safeArray(managedRun.route_runs).filter((item) => item.stage_id === stageId).length + 1;
    managedRun.current_stage = stageId;
    managedRun.worker_running = true;
    managedRun.active_run_id = `run-${randomUUID()}`;
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
    managedState = persistManagedState(workspaceRoot, managedRun);

    const routeResult = await runDeliverableRoute({
      workspaceRoot,
      overlay,
      topicId,
      deliverableId,
      route: stageId,
      runId: managedRun.active_run_id,
      adapter: managedRun.active_adapter,
      mode,
      baselineDeliverableId,
      managedRunId: managedRun.managed_run_id,
    });
    managedRun.worker_running = false;
    managedRun.active_run_id = null;
    managedRun.runtime_liveness_audit = buildRuntimeLivenessAudit({
      status: 'none',
      reasonCode: routeResult?.ok ? 'stage_execution_finished' : 'stage_execution_failed',
    });
    managedRun.runtime_health_status = 'degraded';
    promptAudit.output_refs = uniqueList([
      routeResult?.artifactFile,
      ...safeArray(routeResult?.run?.artifact_refs),
    ]);
    writeJson(promptAuditRef, promptAudit);

    const stageResult = buildStageIngestion({
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
      route_run_id: safeText(routeResult?.run?.run_id) || null,
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
    managedState = persistManagedState(workspaceRoot, managedRun);

    if (applied.retry === true) {
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
  if (managedRun.status === 'running' && managedRun.worker_running !== true) {
    managedRun.runtime_liveness_audit = buildRuntimeLivenessAudit({
      status: 'none',
      reasonCode: 'supervisor_tick_detected_non_live_runtime',
    });
    managedRun.runtime_health_status = 'degraded';
    managedRun.next_system_action = safeText(
      managedRun.next_system_action,
      '等待下一次 supervisor tick 或重新进入托管执行。',
    );
  }
  const state = persistManagedState(workspaceRoot, managedRun);
  return {
    ok: true,
    managed_run: managedRun,
    progress_projection: state.projection,
    runtime_supervision: state.runtimeSupervision,
    escalation_record: state.escalationRecord,
  };
}
