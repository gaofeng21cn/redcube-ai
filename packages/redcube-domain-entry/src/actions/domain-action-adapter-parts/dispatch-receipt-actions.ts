// @ts-nocheck
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';

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

function objectRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function uniqueStrings(value) {
  return [...new Set(optionalArray(value).map((entry) => safeText(entry)).filter(Boolean))];
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((entry) => stableJson(entry)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256Json(value) {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

function refHashMetadata(value) {
  return optionalArray(value)
    .map((entry) => ({
      ref: safeText(entry?.ref || entry?.uri),
      sha256: safeText(entry?.sha256),
    }))
    .filter((entry) => entry.ref && entry.sha256)
    .sort((left, right) => left.ref.localeCompare(right.ref));
}

function reviewRefHashMetadata(reviewReceipt) {
  const refs = optionalArray(reviewReceipt?.reviewed_artifact_refs)
    .map((entry) => safeText(entry));
  const hashes = optionalArray(reviewReceipt?.reviewed_artifact_hashes)
    .map((entry) => safeText(entry));
  if (refs.length === 0 || refs.length !== hashes.length || refs.some((ref) => !ref) || hashes.some((hash) => !hash)) return [];
  return refs.map((ref, index) => ({ ref, sha256: hashes[index] }))
    .sort((left, right) => left.ref.localeCompare(right.ref));
}

function exactArtifactRefMetadata(identityReceipt) {
  return optionalArray(identityReceipt?.exact_artifact_ref_metadata)
    .map((entry) => {
      const ref = safeText(entry?.ref || entry?.uri);
      const sha256 = safeText(entry?.sha256);
      const sizeBytes = typeof entry?.size_bytes === 'number' ? entry.size_bytes : Number.NaN;
      return {
        ref,
        sha256,
        ...(Number.isInteger(sizeBytes) && sizeBytes >= 0 ? { size_bytes: sizeBytes } : {}),
      };
    })
    .filter((entry) => entry.ref && entry.sha256);
}

function currentArtifactIdentityReasons(metadata) {
  const reasons = [];
  for (const entry of metadata) {
    if (!existsSync(entry.ref) || !statSync(entry.ref).isFile()) {
      reasons.push(`artifact_ref_missing:${entry.ref}`);
      continue;
    }
    const currentBody = readFileSync(entry.ref);
    const currentHash = createHash('sha256').update(currentBody).digest('hex');
    if (currentHash !== entry.sha256) reasons.push(`artifact_hash_changed:${entry.ref}`);
    if (Number.isInteger(entry.size_bytes) && currentBody.length !== entry.size_bytes) {
      reasons.push(`artifact_size_changed:${entry.ref}`);
    }
  }
  return reasons;
}

function buildOwnerReceiptQualityDebt({ id, workspaceRoot, reasons }) {
  return {
    ok: false,
    surface_kind: 'domain_owner_receipt_quality_debt',
    return_shape: 'quality_debt',
    owner: DOMAIN_ID,
    receipt_id: id,
    receipt_issued: false,
    quality_debt: {
      status: 'recorded_non_blocking',
      reasons: [...new Set(reasons)].sort(),
      blocks_stage_transition: false,
      blocks_quality_export_publication_or_ready_claims: true,
      next_stage_may_start: true,
    },
    workspace_locator: { workspace_root: workspaceRoot },
    next_required_owner_action: 'continue_with_artifact_and_supply_fresh_review_evidence_before_ready_claim',
  };
}

function validateFormalStageReviewBinding(task) {
  const reviewReceipt = objectRecord(taskValue(task, 'formal_review_receipt', 'formalReviewReceipt'));
  const identityReceipt = objectRecord(taskValue(task, 'artifact_identity_receipt', 'artifactIdentityReceipt'));
  const requested = Boolean(reviewReceipt || identityReceipt);
  if (!requested) return { requested: false, passed: false, identityMismatch: false, reasons: [], binding: null };

  const reasons = [];
  const identityMismatchReasons = [];
  const rawIdentityMetadata = optionalArray(identityReceipt?.exact_artifact_ref_metadata);
  const exactIdentityMetadata = exactArtifactRefMetadata(identityReceipt);
  const identityMetadata = refHashMetadata(identityReceipt?.exact_artifact_ref_metadata);
  const reviewMetadata = reviewRefHashMetadata(reviewReceipt);
  const reviewExportRef = safeText(taskValue(task, 'review_export_ref', 'reviewExportRef'));
  const artifactLocatorRef = safeText(taskValue(task, 'artifact_locator_ref', 'artifactLocatorRef'));

  if (safeText(reviewReceipt?.surface_kind) !== 'opl_stage_review_receipt'
    || safeText(reviewReceipt?.version) !== 'stage-review-receipt.v1') {
    reasons.push('formal_review_receipt_shape_invalid');
  }
  for (const field of [
    'stage_run_id',
    'quality_cycle_id',
    'producer_attempt_ref',
    'reviewer_attempt_ref',
  ]) {
    if (!safeText(reviewReceipt?.[field])) reasons.push(`formal_review_${field}_missing`);
  }
  if (uniqueStrings(reviewReceipt?.rubric_refs).length === 0) reasons.push('formal_review_rubric_refs_missing');
  if (reviewMetadata.length === 0) reasons.push('formal_review_artifact_identity_incomplete');
  if (safeText(reviewReceipt?.verdict) !== 'pass') reasons.push('formal_review_not_passed');
  if (reviewReceipt?.no_context_inheritance !== true) reasons.push('formal_review_context_isolation_missing');
  const producerSessionRef = safeText(reviewReceipt?.producer_session_ref);
  const reviewerSessionRef = safeText(reviewReceipt?.reviewer_session_ref);
  if (!producerSessionRef || !reviewerSessionRef) reasons.push('formal_review_session_lineage_missing');
  if (producerSessionRef && reviewerSessionRef && producerSessionRef === reviewerSessionRef) {
    reasons.push('formal_review_session_identity_reused');
  }
  if (safeText(identityReceipt?.surface_kind) !== 'artifact_identity_receipt'
    || identityReceipt?.hash_metadata_complete !== true
    || identityMetadata.length === 0) {
    reasons.push('artifact_identity_receipt_incomplete');
  }
  if (rawIdentityMetadata.length !== exactIdentityMetadata.length
    || exactIdentityMetadata.some((entry) => !Number.isInteger(entry.size_bytes))) {
    reasons.push('artifact_identity_size_metadata_incomplete');
  }
  const identityReceiptRef = safeText(identityReceipt?.receipt_ref);
  if (artifactLocatorRef && identityReceiptRef && artifactLocatorRef !== identityReceiptRef) {
    identityMismatchReasons.push('artifact_locator_ref_does_not_match_identity_receipt');
  }
  const attemptRef = safeText(taskValue(task, 'attempt_ref', 'attemptRef'));
  const reviewerAttemptRef = safeText(reviewReceipt?.reviewer_attempt_ref);
  if (attemptRef && reviewerAttemptRef && attemptRef !== reviewerAttemptRef) {
    identityMismatchReasons.push('attempt_ref_does_not_match_formal_reviewer_attempt');
  }
  if (identityMetadata.length > 0 && reviewMetadata.length > 0
    && JSON.stringify(identityMetadata) !== JSON.stringify(reviewMetadata)) {
    identityMismatchReasons.push('formal_review_hashes_do_not_match_candidate');
  }
  identityMismatchReasons.push(...currentArtifactIdentityReasons(exactIdentityMetadata));
  const passed = reasons.length === 0 && identityMismatchReasons.length === 0;
  return {
    requested: true,
    passed,
    identityMismatch: identityMismatchReasons.length > 0,
    reasons: [...new Set([...reasons, ...identityMismatchReasons])].sort(),
    binding: passed ? {
      status: 'validated',
      formal_review_receipt_ref: reviewExportRef,
      formal_review_receipt_sha256: sha256Json(reviewReceipt),
      formal_review_receipt: reviewReceipt,
      artifact_identity_receipt_ref: identityReceiptRef,
      exact_artifact_ref_metadata: exactIdentityMetadata,
      exact_artifact_hashes_current: true,
      ready_claim_scope: 'package_and_handoff',
    } : null,
  };
}

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
    return buildOwnerReceiptQualityDebt({
      id,
      workspaceRoot,
      reasons: missing.map((field) => `missing_required_ref:${field}`),
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
  const formalStageReviewBinding = validateFormalStageReviewBinding(task);
  if (formalStageReviewBinding.requested && !formalStageReviewBinding.passed) {
    if (formalStageReviewBinding.identityMismatch) {
      return buildTypedBlocker({
        blockerKind: 'stale_or_mismatched_stage_identity',
        blockerId: id,
        sourceContract: 'rca.domain_owner_receipt.v1',
        nextRequiredOwnerAction: 'regenerate_candidate_identity_and_run_fresh_formal_review',
        workspaceRoot,
        details: {
          identity_mismatch_reasons: formalStageReviewBinding.reasons,
        },
      });
    }
    return buildOwnerReceiptQualityDebt({
      id,
      workspaceRoot,
      reasons: formalStageReviewBinding.reasons,
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
    formal_stage_review_binding: formalStageReviewBinding.binding,
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
      formal_stage_review_binding_validated: formalStageReviewBinding.passed,
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
