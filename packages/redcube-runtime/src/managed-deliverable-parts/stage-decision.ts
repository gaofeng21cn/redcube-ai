// @ts-nocheck
import {
  loadRouteReviewRerunPolicy,
} from '../managed-run-contract.js';
import {
  STAGE_RETRY_LIMIT,
  safeArray,
  safeText,
  stageLabel,
  uniqueList,
} from '../managed-run-shared.js';

export function nextStageId(stages, currentStageId) {
  const index = stages.findIndex((stage) => stage?.stage_id === currentStageId);
  if (index < 0) return null;
  return stages[index + 1]?.stage_id || null;
}

function isRepairStage(stageId) {
  const id = safeText(stageId);
  return id === 'fix_html' || id.startsWith('repair_');
}

function reviewRerunStageAfterRepair(contract) {
  const reviewStageId = safeText(contract?.review_surface?.artifact_stage);
  if (!reviewStageId) {
    return null;
  }
  const reviewHardStop = safeArray(contract?.stage_sequence?.hard_stops)
    .find((entry) => safeText(entry?.stage_id) === reviewStageId);
  return safeText(reviewHardStop?.rerun_from_stage, reviewStageId) || null;
}

function normalizedSignatureList(value) {
  return uniqueList(value).sort();
}

function buildReviewRerunSignature({
  stageId,
  rerunFromStage,
  targetSlideIds = [],
  blockingReasons = [],
}) {
  return {
    review_stage_id: safeText(stageId),
    rerun_from_stage: safeText(rerunFromStage),
    target_slide_ids: normalizedSignatureList(targetSlideIds),
    blocking_reasons: normalizedSignatureList(blockingReasons),
  };
}

function stableSignatureKey(signature) {
  return JSON.stringify({
    review_stage_id: safeText(signature?.review_stage_id),
    rerun_from_stage: safeText(signature?.rerun_from_stage),
    target_slide_ids: normalizedSignatureList(signature?.target_slide_ids),
    blocking_reasons: normalizedSignatureList(signature?.blocking_reasons),
  });
}

export function buildManagedRepeatedReviewRerunDecision({
  managedRun,
  stageId,
  rerunFromStage,
  targetSlideIds = [],
  blockingReasons = [],
}) {
  const signature = buildReviewRerunSignature({
    stageId,
    rerunFromStage,
    targetSlideIds,
    blockingReasons,
  });
  const key = stableSignatureKey(signature);
  const priorCount = safeArray(managedRun?.stage_results)
    .filter((stageResult) => safeText(stageResult?.decision) === 'rerun_from_review_stage')
    .filter((stageResult) => stableSignatureKey(stageResult?.review_rerun_signature) === key)
    .length;
  return {
    signature,
    prior_count: priorCount,
    shouldEscalate: priorCount >= 1,
    reason_code: priorCount >= 1 ? 'repeated_review_rerun_without_progress' : null,
  };
}

export function buildSkippedStageResult({
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

export function buildStageIngestion({
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
    ? reviewRerunStageAfterRepair(contract)
    : managedRun?.mode === 'auto_to_terminal' && isRepairStage(stageId)
    ? reviewRerunStageAfterRepair(contract)
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
    if (errorCode === 'repeated_block_without_input_change') {
      return {
        schema_version: 1,
        managed_run_id: managedRun.managed_run_id,
        stage_id: stageId,
        attempt,
        route_run_id: safeText(routeResult?.run?.run_id) || null,
        status: 'failed',
        summary: `${stageLabel(stageId)}重复遇到相同阻断，系统已升级到 supervisor 监管面。`,
        artifacts: artifactRefs,
        decision: 'escalate_runtime',
        next_action: 'supervise_managed_run',
        blocking_reason: blockingReason,
        controller_decision: {
          decision: 'escalate_runtime',
          reason_code: 'repeated_block_without_input_change',
          requires_human_confirmation: false,
          requires_external_secret: false,
        },
        recorded_at: new Date().toISOString(),
      };
    }
    const reviewRerunPolicy = loadRouteReviewRerunPolicy({
      workspaceRoot,
      topicId,
      deliverableId,
      stageId,
    });
    if (reviewRerunPolicy) {
      const rerunDecision = buildManagedRepeatedReviewRerunDecision({
        managedRun,
        stageId,
        rerunFromStage: reviewRerunPolicy.rerunFromStage,
        targetSlideIds: routeResult?.run?.error?.target_slide_ids,
        blockingReasons: routeResult?.run?.error?.blocking_reasons?.length
          ? routeResult.run.error.blocking_reasons
          : [blockingReason],
      });
      if (rerunDecision.shouldEscalate) {
        return {
          schema_version: 1,
          managed_run_id: managedRun.managed_run_id,
          stage_id: stageId,
          attempt,
          route_run_id: safeText(routeResult?.run?.run_id) || null,
          status: 'failed',
          summary: `${stageLabel(stageId)}重复要求回到${stageLabel(reviewRerunPolicy.rerunFromStage)}但阻断签名未变化，系统已升级到 supervisor 监管面。`,
          artifacts: artifactRefs,
          decision: 'escalate_runtime',
          next_action: 'supervise_managed_run',
          blocking_reason: blockingReason,
          review_rerun_signature: rerunDecision.signature,
          repeated_review_rerun: {
            schema_version: 1,
            prior_count: rerunDecision.prior_count,
            reason_code: rerunDecision.reason_code,
          },
          controller_decision: {
            decision: 'escalate_runtime',
            reason_code: rerunDecision.reason_code,
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
        status: 'quality_blocked',
        summary: `${stageLabel(stageId)}要求回到${stageLabel(reviewRerunPolicy.rerunFromStage)}继续修复，系统已自动切回返修阶段。`,
        artifacts: artifactRefs,
        decision: 'rerun_from_review_stage',
        next_action: `run_${reviewRerunPolicy.rerunFromStage}`,
        blocking_reason: blockingReason,
        review_rerun_signature: rerunDecision.signature,
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
