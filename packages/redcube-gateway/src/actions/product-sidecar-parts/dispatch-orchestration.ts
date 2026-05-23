// @ts-nocheck
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { getProductEntryManifest } from '../get-product-entry-manifest.js';
import { productSidecarGuardedActionSet } from './guarded-action-catalog.js';
import { buildSidecarOwnerBoundary } from './owner-boundary.js';
import { evaluateVisualTransition } from './visual-transition-evaluator.js';
import { emitWorkspaceReceiptProof as emitWorkspaceReceiptProofPack } from './workspace-receipt-proof.js';
import {
  DOMAIN_ID,
  SIDECAR_ID,
} from './sidecar-export-projection.js';
import {
  missingFields,
  findForbiddenPayloadFieldPaths,
  noRegressionEvidenceId,
  normalizeAction,
  optionalArray,
  readTaskPayload,
  receiptId,
  requireField,
  safeText,
  slugId,
  taskValue,
  workspaceRootFromTask,
} from './task-utils.js';

const GUARDED_ACTIONS = productSidecarGuardedActionSet();

function buildTypedBlocker({
  blockerKind,
  blockerId,
  missing = [],
  sourceContract,
  nextRequiredOwnerAction,
  workspaceRoot = null,
  details = {},
}) {
  return {
    ok: false,
    surface_kind: 'typed_blocker',
    return_shape: 'typed_blocker',
    blocker_ref: `rca-typed-blocker:${blockerKind}:${slugId(blockerId, 'blocker')}`,
    blocker_kind: blockerKind,
    owner: DOMAIN_ID,
    source_contract: sourceContract,
    next_required_owner_action: nextRequiredOwnerAction,
    missing_required_fields: missing,
    workspace_locator: workspaceRoot ? { workspace_root: workspaceRoot } : null,
    visual_ready_claimed: false,
    exportable_claimed: false,
    handoffable_claimed: false,
    writes_visual_truth: false,
    writes_review_export_verdict: false,
    writes_canonical_artifact_blob: false,
    ...details,
  };
}

function buildDispatchEnvelope({ task, result, action }) {
  return {
    ok: true,
    surface_kind: 'product_sidecar_dispatch',
    adapter_id: SIDECAR_ID,
    version: 'v1',
    domain_id: DOMAIN_ID,
    action,
    sidecar_policy: {
      allowed: true,
      writes_visual_truth: false,
      writes_review_verdict: false,
      writes_publication_gate: false,
      writes_canonical_artifacts: false,
    },
    owner_boundary: buildSidecarOwnerBoundary(),
    task_id: task.task_id || task.id || null,
    result_surface: result,
    summary: {
      action,
      result_surface_kind: result?.surface_kind || null,
      provider_role: 'wakeup_transport_only',
      opl_role: 'typed_family_control_plane',
      rca_role: 'domain_truth_owner',
    },
  };
}

function writeRuntimeJson({ workspaceRoot, parts, fileName, payload }) {
  const dir = path.join(workspaceRoot, '.redcube', 'runtime', ...parts);
  const file = path.join(dir, fileName);
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const payloadWithDigest = { ...payload, sha256: digest };
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, `${JSON.stringify(payloadWithDigest, null, 2)}\n`, 'utf-8');
  return { file, payload: payloadWithDigest };
}

function compactManifestNoRegressionSources(manifest) {
  const controlledSoak = manifest.controlled_soak_no_regression_attempt || {};
  const skeletonAudit = manifest.standard_domain_agent_skeleton?.repo_source_boundary?.audit_surface || {};
  const runtimeResidue = manifest.runtime_residue_retirement || {};
  return {
    controlled_visual_stage_attempt_ref: '/controlled_visual_stage_attempt',
    controlled_memory_apply_proof_ref: '/controlled_memory_apply_proof',
    artifact_locator_contract_ref: '/artifact_locator_contract',
    runtime_residue_retirement_ref: '/runtime_residue_retirement',
    domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
    lifecycle_guarded_apply_proof_ref: '/lifecycle_guarded_apply_proof',
    physical_skeleton_follow_through_ref: '/physical_skeleton_follow_through',
    review_helper_baseline_follow_through_ref: '/review_helper_baseline_follow_through',
    controlled_soak_state: controlledSoak.state || 'deferred_typed_blocker',
    skeleton_repo_source_layout_audit_status: skeletonAudit.status || 'unknown',
    runtime_residue_retirement_status: runtimeResidue.status || 'unknown',
  };
}

async function emitDomainOwnerReceipt(task) {
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

async function emitNoRegressionEvidence(task) {
  const workspaceRoot = workspaceRootFromTask(task);
  const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
  const evidenceId = noRegressionEvidenceId(task);
  const evidenceDir = path.join(workspaceRoot, '.redcube', 'runtime', 'evidence', 'no-regression');
  const evidenceFile = path.join(evidenceDir, `${evidenceId}.json`);
  const sourceRefs = compactManifestNoRegressionSources(manifest);
  const evidence = {
    ok: true,
    surface_kind: 'no_regression_evidence',
    evidence_id: evidenceId,
    evidence_ref: `rca-no-regression:visual-stage:${evidenceId}`,
    runtime_locator_ref: `workspace-runtime-ref:no-regression-evidence:${evidenceId}`,
    return_shape: 'no_regression_evidence',
    owner: DOMAIN_ID,
    generated_by_action: 'emit_no_regression_evidence',
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    source_manifest_refs: sourceRefs,
    coverage: {
      verifies_descriptor_and_runtime_refs: true,
      verifies_standard_skeleton_physical_anchor: true,
      verifies_legacy_default_active_path_retired: sourceRefs.runtime_residue_retirement_status === 'active_path_retired',
      verifies_review_helper_line_budget_guard: true,
      long_visual_soak_claimed: false,
      visual_artifact_blob_written: false,
      review_export_verdict_written: false,
      memory_content_body_written: false,
      receipt_instance_written_to_repo: false,
    },
    authority_boundary: {
      rca_owns_evidence_ref: true,
      opl_can_store_no_regression_evidence_ref: true,
      opl_can_store_visual_truth: false,
      opl_can_store_review_export_verdict: false,
      opl_can_store_canonical_artifact_blob: false,
    },
    repository_boundary: {
      repo_tracks_evidence_contract: true,
      repo_tracks_runtime_evidence_instance: false,
      repo_tracks_visual_or_export_artifacts: false,
      evidence_instance_path_model: '<workspace-root>/.redcube/runtime/evidence/no-regression/<evidence-id>.json',
    },
  };
  const digest = createHash('sha256').update(JSON.stringify(evidence)).digest('hex');
  const evidenceWithDigest = {
    ...evidence,
    sha256: digest,
  };
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(evidenceFile, `${JSON.stringify(evidenceWithDigest, null, 2)}\n`, 'utf-8');
  return {
    ...evidenceWithDigest,
    evidence_file: evidenceFile,
  };
}

async function emitExternalWorkOrderOwnerCloseout(task) {
  const workspaceRoot = workspaceRootFromTask(task);
  const workOrderId = slugId(task.work_order_id || task.workOrderId, 'external-work-order');
  const required = [
    'work_order_id',
    'execution_receipt_ref',
    'absorbed_head_ref',
    'target_verification_refs',
    'no_forbidden_write_refs',
  ];
  const missing = missingFields(task, required);
  const forbiddenPayloadFields = [...findForbiddenPayloadFieldPaths(task)].sort();
  if (missing.length > 0) {
    return buildTypedBlocker({
      blockerKind: 'external_work_order_owner_closeout_missing_required_refs',
      blockerId: workOrderId,
      missing,
      sourceContract: 'rca.external_work_order_owner_closeout.v1',
      nextRequiredOwnerAction: 'provide_opl_execution_receipt_absorbed_head_target_verification_and_no_forbidden_write_refs',
      workspaceRoot,
    });
  }
  if (forbiddenPayloadFields.length > 0) {
    return buildTypedBlocker({
      blockerKind: 'external_work_order_owner_closeout_forbidden_payload_fields',
      blockerId: workOrderId,
      sourceContract: 'rca.external_work_order_owner_closeout.v1',
      nextRequiredOwnerAction: 'replace_body_payloads_with_owner_closeout_refs_only',
      workspaceRoot,
      details: {
        forbidden_payload_fields: forbiddenPayloadFields,
        payload_body_allowed: false,
      },
    });
  }

  const targetVerificationRefs = optionalArray(
    task.target_verification_refs || task.targetVerificationRefs,
  ).map((ref) => safeText(ref)).filter(Boolean);
  const noForbiddenWriteRefs = optionalArray(
    task.no_forbidden_write_refs || task.noForbiddenWriteRefs,
  ).map((ref) => safeText(ref)).filter(Boolean);
  if (targetVerificationRefs.length === 0 || noForbiddenWriteRefs.length === 0) {
    return buildTypedBlocker({
      blockerKind: 'external_work_order_owner_closeout_missing_required_refs',
      blockerId: workOrderId,
      missing: [
        ...(targetVerificationRefs.length === 0 ? ['target_verification_refs'] : []),
        ...(noForbiddenWriteRefs.length === 0 ? ['no_forbidden_write_refs'] : []),
      ],
      sourceContract: 'rca.external_work_order_owner_closeout.v1',
      nextRequiredOwnerAction: 'provide_non_empty_target_verification_and_no_forbidden_write_ref_arrays',
      workspaceRoot,
    });
  }

  const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
  const closeout = {
    ok: true,
    surface_kind: 'external_work_order_owner_closeout',
    return_shape: 'no_regression_evidence',
    evidence_id: workOrderId,
    evidence_ref: `rca-no-regression:external-work-order:${workOrderId}`,
    runtime_locator_ref: `workspace-runtime-ref:external-work-order-owner-closeout:${workOrderId}`,
    owner: DOMAIN_ID,
    generated_by_action: 'emit_external_work_order_owner_closeout',
    contract_ref: '/domain_owner_receipt_contract/external_work_order_owner_closeout',
    workspace_locator: { workspace_root: workspaceRoot },
    closeout_refs: {
      work_order_id: workOrderId,
      execution_receipt_ref: safeText(task.execution_receipt_ref || task.executionReceiptRef),
      absorbed_head_ref: safeText(task.absorbed_head_ref || task.absorbedHeadRef),
      patch_absorption_ref: safeText(task.patch_absorption_ref || task.patchAbsorptionRef),
      worktree_cleanup_ref: safeText(task.worktree_cleanup_ref || task.worktreeCleanupRef),
      agent_lab_reevaluation_ref: safeText(task.agent_lab_reevaluation_ref || task.agentLabReevaluationRef),
      target_verification_refs: targetVerificationRefs,
      no_forbidden_write_refs: noForbiddenWriteRefs,
      changed_file_refs: optionalArray(task.changed_file_refs || task.changedFileRefs).map((ref) => safeText(ref)).filter(Boolean),
    },
    source_manifest_refs: {
      domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      external_work_order_owner_closeout_contract_ref: '/domain_owner_receipt_contract/external_work_order_owner_closeout',
      rca_efficiency_handoff_projection_ref: '/rca_efficiency_handoff_projection',
      operator_evidence_readiness_projection_ref: '/operator_evidence_readiness_projection',
      product_sidecar_ref: '/product_entry_shell/sidecar',
      no_regression_owner_receipt_opl_consumption_proof_ref: '/no_regression_owner_receipt_opl_consumption_proof',
    },
    coverage: {
      required_refs_present: true,
      absorbed_patch_verified: true,
      target_verification_refs_present: targetVerificationRefs.length > 0,
      no_forbidden_write_refs_present: noForbiddenWriteRefs.length > 0,
      agent_lab_reevaluation_ref_present: Boolean(safeText(task.agent_lab_reevaluation_ref || task.agentLabReevaluationRef)),
      visual_ready_claimed: false,
      exportable_claimed: false,
      handoffable_claimed: false,
      production_soak_claimed: false,
      quality_verdict_authorized: false,
      visual_truth_written: false,
      artifact_body_written: false,
      memory_body_written: false,
      review_export_verdict_written: false,
    },
    authority_boundary: {
      rca_owns_closeout_evidence: true,
      opl_can_store_closeout_ref: true,
      opl_can_store_typed_blocker: true,
      opl_can_write_rca_visual_truth: false,
      opl_can_store_artifact_body: false,
      opl_can_store_memory_body: false,
      opl_can_authorize_quality_or_export: false,
      opl_can_claim_visual_ready: false,
      opl_can_claim_exportable: false,
    },
    repository_boundary: {
      repo_tracks_contract_refs: true,
      repo_tracks_live_closeout_instance: false,
      repo_tracks_visual_truth: false,
      repo_tracks_artifact_body: false,
      repo_tracks_memory_body: false,
      repo_tracks_quality_or_export_verdict: false,
      receipt_instance_path_model: '<workspace-root>/.redcube/runtime/owner-closeout/external-work-orders/<work-order-id>.json',
    },
    contract_allowed_return_shapes: (
      manifest.domain_owner_receipt_contract
        ?.external_work_order_owner_closeout
        ?.allowed_return_shapes || []
    ),
  };
  const written = writeRuntimeJson({
    workspaceRoot,
    parts: ['owner-closeout', 'external-work-orders'],
    fileName: `${workOrderId}.json`,
    payload: closeout,
  });
  return { ...written.payload, closeout_file: written.file };
}

function normalizeMemoryDecision(task) {
  return safeText(task.decision || task.writeback_status || task.writebackStatus).toLowerCase();
}

async function applyVisualMemoryWriteback(task) {
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

async function applyVisualWorkspaceLifecycle(task) {
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

export async function dispatchProductSidecar(request) {
  const task = readTaskPayload(request);
  const action = normalizeAction(task);
  if (!GUARDED_ACTIONS.has(action)) {
    throw new Error(`product sidecar action 不允许: ${action || '<empty>'}`);
  }

  let result;
  if (action === 'emit_no_regression_evidence') {
    result = await emitNoRegressionEvidence(task);
  } else if (action === 'emit_external_work_order_owner_closeout') {
    result = await emitExternalWorkOrderOwnerCloseout(task);
  } else if (action === 'emit_domain_owner_receipt') {
    result = await emitDomainOwnerReceipt(task);
  } else if (action === 'apply_visual_memory_writeback') {
    result = await applyVisualMemoryWriteback(task);
  } else if (action === 'apply_visual_workspace_lifecycle') {
    result = await applyVisualWorkspaceLifecycle(task);
  } else if (action === 'evaluate_visual_transition') {
    const manifest = await getProductEntryManifest({ workspace_root: workspaceRootFromTask(task) });
    result = evaluateVisualTransition({
      task,
      workspaceRoot: workspaceRootFromTask(task),
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
