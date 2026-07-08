// @ts-nocheck
import { getProductEntryManifest } from '../get-product-entry-manifest.js';
import { listDomainActionAdapterGuardedActionIds } from './guarded-action-catalog.js';
import { evaluateVisualTransition } from './visual-transition-evaluator.js';
import { emitWorkspaceReceiptProof as emitWorkspaceReceiptProofPack } from './workspace-receipt-proof.js';
import {
  buildDispatchEnvelope,
  buildTypedBlocker,
} from './dispatch-shared.js';
import {
  emitExternalWorkOrderOwnerCloseout,
  emitNoRegressionEvidence,
  emitTemporalControlledVisualStageLongSoakEvidence,
} from './dispatch-evidence-actions.js';
import {
  applyVisualMemoryWriteback,
  applyVisualWorkspaceLifecycle,
  emitDomainOwnerReceipt,
} from './dispatch-receipt-actions.js';
import {
  normalizeAction,
  readTaskPayload,
  requireField,
  workspaceRootFromTask,
} from './task-utils.js';

const GUARDED_ACTIONS = new Set(listDomainActionAdapterGuardedActionIds());

export async function dispatchDomainActionAdapter(request) {
  const task = readTaskPayload(request);
  const action = normalizeAction(task);
  if (!GUARDED_ACTIONS.has(action)) {
    throw new Error(`domain-handler action 不允许: ${action || '<empty>'}`);
  }

  let result;
  if (action === 'emit_no_regression_evidence') {
    result = await emitNoRegressionEvidence(task);
  } else if (action === 'emit_temporal_controlled_visual_stage_long_soak_evidence') {
    result = await emitTemporalControlledVisualStageLongSoakEvidence(task);
  } else if (action === 'emit_external_work_order_owner_closeout') {
    result = await emitExternalWorkOrderOwnerCloseout(task);
  } else if (action === 'emit_domain_owner_receipt') {
    result = await emitDomainOwnerReceipt(task);
  } else if (action === 'apply_visual_memory_writeback') {
    result = await applyVisualMemoryWriteback(task);
  } else if (action === 'apply_visual_workspace_lifecycle') {
    result = await applyVisualWorkspaceLifecycle(task);
  } else if (action === 'evaluate_visual_transition') {
    const workspaceRoot = workspaceRootFromTask(task);
    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    result = evaluateVisualTransition({
      task,
      workspaceRoot,
      visualTransitionSpec: manifest.visual_transition_spec,
      buildTypedBlocker,
    });
  } else if (action === 'emit_workspace_receipt_proof') {
    result = await emitWorkspaceReceiptProofPack({
      task,
      workspaceRoot: workspaceRootFromTask(task),
      buildTypedBlocker,
      applyVisualMemoryWriteback,
      applyVisualWorkspaceLifecycle,
      emitNoRegressionEvidence,
      emitDomainOwnerReceipt,
    });
  } else {
    result = {
      ok: true,
      surface_kind: 'notification_receipt',
      notification_id: requireField('notification_id', task.notification_id || task.notificationId),
      receipt_status: 'accepted',
      writes_domain_truth: false,
      summary: {
        notification_id: task.notification_id || task.notificationId,
        action: 'record_control_plane_receipt_only',
      },
    };
  }

  return buildDispatchEnvelope({ task, result, action });
}
