// @ts-nocheck
import { getProductEntryManifest } from '../get-product-entry-manifest.js';
import { buildTypedBlocker, writeRuntimeJson } from './dispatch-shared.js';
import { DOMAIN_ID } from './domain_action_adapter-export-projection.js';
import {
  findForbiddenPayloadFieldPaths,
  missingFields,
  optionalArray,
  receiptId,
  safeText,
  slugId,
  taskValue,
  workspaceRootFromTask,
} from './task-utils.js';

export async function emitDomainOwnerReceipt(task) {
  const workspaceRoot = workspaceRootFromTask(task);
  const required = [
    'attempt_ref',
    'artifact_locator_ref',
    'memory_receipt_ref',
    'lifecycle_receipt_ref',
    'review_export_ref',
    'forbidden_write_proof_ref',
  ];
  const missing = missingFields(task, required);
  const id = receiptId(task, 'domain_owner_receipt', 'domain-receipt');
  const forbiddenPayloadFields = [...findForbiddenPayloadFieldPaths(task)].sort();
  if (missing.length > 0) {
    return buildTypedBlocker({
      blockerKind: 'domain_owner_receipt_missing_required_refs',
      blockerId: id,
      missing,
      sourceContract: 'rca.domain_owner_receipt.v1',
      nextRequiredOwnerAction: 'provide_rca_owned_attempt_artifact_memory_lifecycle_review_and_forbidden_write_refs',
      workspaceRoot,
    });
  }
  if (forbiddenPayloadFields.length > 0) {
    return buildTypedBlocker({
      blockerKind: 'domain_owner_receipt_forbidden_payload_fields',
      blockerId: id,
      sourceContract: 'rca.domain_owner_receipt.v1',
      nextRequiredOwnerAction: 'replace_body_payloads_with_rca_owned_locator_or_receipt_refs',
      workspaceRoot,
      details: {
        forbidden_payload_fields: forbiddenPayloadFields,
        payload_body_allowed: false,
      },
    });
  }

  const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
  const receipt = {
    ok: true,
    surface_kind: 'domain_owner_receipt',
    return_shape: 'domain_receipt',
    receipt_id: id,
    receipt_ref: `rca-owner-receipt:visual-stage:${id}`,
    runtime_locator_ref: `workspace-runtime-ref:domain-owner-receipt:${id}`,
    owner: DOMAIN_ID,
    contract_ref: '/domain_owner_receipt_contract',
    generated_by_action: 'emit_domain_owner_receipt',
    workspace_locator: { workspace_root: workspaceRoot },
    required_refs: {
      attempt_ref: safeText(taskValue(task, 'attempt_ref', 'attemptRef')),
      artifact_locator_ref: safeText(taskValue(task, 'artifact_locator_ref', 'artifactLocatorRef')),
      memory_receipt_ref: safeText(taskValue(task, 'memory_receipt_ref', 'memoryReceiptRef')),
      lifecycle_receipt_ref: safeText(taskValue(task, 'lifecycle_receipt_ref', 'lifecycleReceiptRef')),
      review_export_ref: safeText(taskValue(task, 'review_export_ref', 'reviewExportRef')),
      forbidden_write_proof_ref: safeText(taskValue(task, 'forbidden_write_proof_ref', 'forbiddenWriteProofRef')),
    },
    artifact_delta: {
      artifact_refs: optionalArray(task.artifact_refs || task.artifactRefs),
      repair_target_refs: optionalArray(task.repair_target_refs || task.repairTargetRefs),
      export_proof_refs: optionalArray(task.export_proof_refs || task.exportProofRefs),
      handoff_packet_ref: safeText(task.handoff_packet_ref || task.handoffPacketRef),
      residual_risk_refs: optionalArray(task.residual_risk_refs || task.residualRiskRefs),
    },
    source_manifest_refs: {
      controlled_visual_stage_attempt_ref: '/controlled_visual_stage_attempt',
      artifact_locator_contract_ref: '/artifact_locator_contract',
      controlled_memory_apply_proof_ref: '/controlled_memory_apply_proof',
      lifecycle_guarded_apply_proof_ref: '/lifecycle_guarded_apply_proof',
      review_state_ref: '/review_state',
      publication_projection_ref: '/publication_projection',
      forbidden_write_audit_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
    },
    coverage: {
      domain_owner_receipt_shape: 'domain_receipt',
      visual_ready_claimed: false,
      exportable_claimed: false,
      handoffable_claimed: false,
      opl_completion_promoted_to_visual_ready: false,
      visual_artifact_blob_written: false,
      review_export_verdict_written: false,
      memory_content_body_written: false,
      receipt_instance_written_to_repo: false,
      required_refs_present: true,
    },
    authority_boundary: {
      rca_owns_receipt_ref: true,
      opl_can_store_receipt_ref: true,
      opl_can_store_visual_truth: false,
      opl_can_store_review_export_verdict: false,
      opl_can_store_canonical_artifact_blob: false,
      opl_can_mutate_domain_artifacts: false,
    },
    repository_boundary: {
      repo_tracks_contract_and_fixture_refs: true,
      repo_tracks_live_receipt_instances: false,
      repo_tracks_visual_truth: false,
      repo_tracks_review_export_verdict: false,
      repo_tracks_canonical_artifact_blob: false,
      receipt_instance_path_model: '<workspace-root>/.redcube/runtime/receipts/domain-owner/<receipt-id>.json',
    },
    contract_allowed_return_shapes: manifest.domain_owner_receipt_contract?.allowed_return_shapes || [],
  };
  const written = writeRuntimeJson({
    workspaceRoot,
    parts: ['receipts', 'domain-owner'],
    fileName: `${id}.json`,
    payload: receipt,
  });
  return { ...written.payload, receipt_file: written.file };
}

function normalizeMemoryDecision(task) {
  return safeText(task.decision || task.writeback_status || task.writebackStatus).toLowerCase();
}

export async function applyVisualMemoryWriteback(task) {
  const workspaceRoot = workspaceRootFromTask(task);
  const decision = normalizeMemoryDecision(task);
  const decisionOwner = safeText(task.decision_owner || task.decisionOwner);
  const idBase = `${slugId(task.proposal_id || task.proposalId, 'proposal')}-${decision || 'decision'}`;
  if (!['accepted', 'rejected'].includes(decision)) {
    return buildTypedBlocker({
      blockerKind: 'visual_memory_writeback_invalid_decision',
      blockerId: idBase,
      sourceContract: 'rca.visual_pattern_memory.accept_reject.v1',
      nextRequiredOwnerAction: 'provide_accepted_or_rejected_decision',
      workspaceRoot,
      details: { allowed_decisions: ['accepted', 'rejected'] },
    });
  }
  if (decisionOwner !== DOMAIN_ID) {
    return buildTypedBlocker({
      blockerKind: 'visual_memory_writeback_owner_required',
      blockerId: idBase,
      sourceContract: 'rca.visual_pattern_memory.accept_reject.v1',
      nextRequiredOwnerAction: 'route_memory_decision_to_rca_owner',
      workspaceRoot,
      details: {
        decision_owner: decisionOwner || null,
        required_decision_owner: DOMAIN_ID,
      },
    });
  }
  const required = [
    'proposal_id',
    'source_review_ref',
    'candidate_memory_ref',
  ];
  const missing = missingFields(task, required);
  if (missing.length > 0) {
    return buildTypedBlocker({
      blockerKind: 'visual_memory_writeback_missing_required_refs',
      blockerId: idBase,
      missing,
      sourceContract: 'rca.visual_pattern_memory.accept_reject.v1',
      nextRequiredOwnerAction: 'provide_locator_only_memory_writeback_refs',
      workspaceRoot,
    });
  }
  const proposalId = slugId(task.proposal_id || task.proposalId, 'proposal');
  const receiptIdValue = `${proposalId}-${decision}`;
  const candidateMemoryRef = safeText(task.candidate_memory_ref || task.candidateMemoryRef);
  const memoryLocatorRef = safeText(task.memory_locator_ref || task.memoryLocatorRef, candidateMemoryRef);
  const receipt = {
    ok: true,
    surface_kind: 'visual_pattern_memory_writeback_receipt',
    return_shape: 'domain_memory_receipt',
    receipt_id: receiptIdValue,
    receipt_ref: `rca-memory-receipt:visual-pattern:${receiptIdValue}`,
    runtime_locator_ref: `workspace-runtime-ref:memory-receipt:${receiptIdValue}`,
    owner: DOMAIN_ID,
    generated_by_action: 'apply_visual_memory_writeback',
    proposal_id: proposalId,
    proposal_ref: `rca-memory-proposal:visual-pattern:${proposalId}`,
    writeback_status: decision,
    source_review_ref: safeText(task.source_review_ref || task.sourceReviewRef),
    candidate_memory_ref: candidateMemoryRef,
    memory_locator_ref: memoryLocatorRef,
    memory_content_body_ref: safeText(
      task.memory_content_body_ref || task.memoryContentBodyRef,
      `rca-memory-content-ref:visual-pattern:${slugId(memoryLocatorRef, 'memory')}`,
    ),
    operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
    provenance_refs: optionalArray(task.provenance_refs || task.provenanceRefs),
    coverage: {
      memory_content_body_written_to_repo: false,
      visual_truth_written: false,
      review_export_verdict_written: false,
      canonical_artifact_blob_written: false,
      opl_decision_owner: false,
    },
    repository_boundary: {
      repo_tracks_generator_contract: true,
      repo_tracks_receipt_instance: false,
      repo_tracks_memory_content_body: false,
      repo_tracks_visual_or_export_artifacts: false,
      receipt_instance_path_model: '<workspace-root>/.redcube/runtime/receipts/memory/visual-pattern/<receipt-id>.json',
    },
    authority_boundary: {
      memory_content_owner: DOMAIN_ID,
      accept_reject_owner: DOMAIN_ID,
      opl_can_store_projection_ref: true,
      opl_can_store_memory_content: false,
      opl_can_issue_decision: false,
      opl_can_write_receipt_instance: false,
    },
  };
  const written = writeRuntimeJson({
    workspaceRoot,
    parts: ['receipts', 'memory', 'visual-pattern'],
    fileName: `${receiptIdValue}.json`,
    payload: receipt,
  });
  return { ...written.payload, receipt_file: written.file };
}

export async function applyVisualWorkspaceLifecycle(task) {
  const workspaceRoot = workspaceRootFromTask(task);
  const operation = safeText(task.operation).toLowerCase();
  const receiptBase = receiptId(task, 'lifecycle_receipt', `${operation || 'lifecycle'}-receipt`);
  if (!['cleanup', 'restore', 'retention'].includes(operation)) {
    return buildTypedBlocker({
      blockerKind: 'lifecycle_invalid_operation',
      blockerId: receiptBase,
      sourceContract: 'rca.lifecycle_guarded_apply_proof.v1',
      nextRequiredOwnerAction: 'choose_cleanup_restore_or_retention',
      workspaceRoot,
      details: { allowed_operations: ['cleanup', 'restore', 'retention'] },
    });
  }
  const required = ['domain_receipt_ref', 'artifact_locator_ref'];
  const missing = missingFields(task, required);
  if (missing.length > 0 || task.requested_artifact_mutation === true || task.requestedArtifactMutation === true) {
    return buildTypedBlocker({
      blockerKind: 'lifecycle_domain_receipt_required',
      blockerId: receiptBase,
      missing,
      sourceContract: 'rca.lifecycle_guarded_apply_proof.v1',
      nextRequiredOwnerAction: 'provide_domain_receipt_ref_before_any_artifact_mutation',
      workspaceRoot,
      details: {
        requested_artifact_mutation: Boolean(task.requested_artifact_mutation || task.requestedArtifactMutation),
        opl_can_apply_domain_artifact_mutation: false,
      },
    });
  }
  const receipt = {
    ok: true,
    surface_kind: 'visual_workspace_lifecycle_receipt',
    return_shape: 'lifecycle_receipt',
    operation,
    receipt_id: receiptBase,
    receipt_ref: `rca-lifecycle-receipt:${operation}:${receiptBase}`,
    runtime_locator_ref: `workspace-runtime-ref:lifecycle-receipt:${operation}:${receiptBase}`,
    owner: DOMAIN_ID,
    generated_by_action: 'apply_visual_workspace_lifecycle',
    workspace_locator: { workspace_root: workspaceRoot },
    domain_receipt_ref: safeText(task.domain_receipt_ref || task.domainReceiptRef),
    artifact_locator_ref: safeText(task.artifact_locator_ref || task.artifactLocatorRef),
    artifact_refs: optionalArray(task.artifact_refs || task.artifactRefs),
    retention_policy_ref: safeText(task.retention_policy_ref || task.retentionPolicyRef),
    restore_proof_ref: safeText(task.restore_proof_ref || task.restoreProofRef),
    artifact_mutation_applied: false,
    visual_truth_written: false,
    review_export_verdict_written: false,
    canonical_artifact_blob_written: false,
    repository_boundary: {
      repo_tracks_lifecycle_contract: true,
      repo_tracks_lifecycle_receipt_instances: false,
      repo_tracks_visual_or_export_artifacts: false,
      receipt_instance_path_model: '<workspace-root>/.redcube/runtime/receipts/lifecycle/<operation>/<receipt-id>.json',
    },
    authority_boundary: {
      opl_can_apply_opl_owned_locator_metadata: true,
      opl_can_request_domain_receipt: true,
      opl_can_delete_or_rewrite_domain_artifact: false,
      opl_can_store_artifact_blob: false,
      opl_can_store_review_export_verdict: false,
    },
  };
  const written = writeRuntimeJson({
    workspaceRoot,
    parts: ['receipts', 'lifecycle', operation],
    fileName: `${receiptBase}.json`,
    payload: receipt,
  });
  return { ...written.payload, receipt_file: written.file };
}
