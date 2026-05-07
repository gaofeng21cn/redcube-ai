// @ts-nocheck
import { CODEX_DEFAULT_ADAPTER, HERMES_NATIVE_PROOF_ADAPTER } from '@redcube/hermes-substrate';

import { planManagedDeliverableDag } from './managed-dag-scheduler.js';
import { reconcileManagedRunLiveness } from './managed-run-liveness.js';
import { loadSharedSourceTruth } from './shared-source-truth.js';
import { createManagedRun, loadManagedRun } from './managed-run-store.js';
import {
  assertManagedOverlayMatchesContract,
  assertManagedStopAfterStageDeclared,
  loadHydratedContract,
} from './managed-run-contract.js';
import {
  buildRuntimeLivenessAudit,
  loadPersistedManagedState,
  persistManagedState,
  pushManagedEvent,
} from './managed-run-surfaces.js';
import { safeArray, safeText, stageLabel } from './managed-run-shared.js';
import {
  assertSupportedManagedAdapter,
  probeRequestedRuntime,
  runtimeBridgeFromProbe,
} from './managed-runtime-bridge.js';
import { executeManagedDagStages } from './managed-deliverable-parts/execution-orchestration.js';

export { buildManagedRepeatedReviewRerunDecision } from './managed-deliverable-parts/stage-decision.js';

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
