// @ts-nocheck
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DOMAIN_ID = 'redcube_ai';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function slugId(value, fallback) {
  return safeText(value, fallback).replace(/[^A-Za-z0-9_.:-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
}

function taskValue(task, snake, camel = null) {
  return task?.[snake] ?? (camel ? task?.[camel] : undefined);
}

function missingRequiredRefs(task) {
  return [
    'attempt_ref',
    'artifact_locator_ref',
    'review_export_ref',
    'forbidden_write_proof_ref',
  ].filter((field) => !safeText(taskValue(task, field, field.replace(/_([a-z])/g, (_, char) => char.toUpperCase()))));
}

function proofId(task) {
  const provided = task.proof_id || task.proofId || task.receipt_proof_id || task.receiptProofId || task.id;
  if (safeText(provided)) {
    return slugId(provided, 'receipt-proof');
  }
  const seed = [
    task.task_id || task.taskId || '',
    task.entry_session_id || task.entrySessionId || '',
    task.topic_id || task.topicId || '',
    task.deliverable_id || task.deliverableId || '',
    task.run_id || task.runId || '',
    'workspace-receipt-proof',
  ].join(':');
  const digest = createHash('sha256').update(seed).digest('hex').slice(0, 12);
  return `receipt-proof-${digest}`;
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

export async function emitWorkspaceReceiptProof({
  task,
  workspaceRoot,
  buildTypedBlocker,
  applyVisualMemoryWriteback,
  applyVisualWorkspaceLifecycle,
  emitNoRegressionEvidence,
  emitDomainOwnerReceipt,
}) {
  const missing = missingRequiredRefs(task);
  const id = proofId(task);
  if (missing.length > 0) {
    return buildTypedBlocker({
      blockerKind: 'workspace_receipt_proof_missing_required_refs',
      blockerId: id,
      missing,
      sourceContract: 'rca.workspace_receipt_proof.v1',
      nextRequiredOwnerAction: 'provide_attempt_artifact_review_and_forbidden_write_refs_before_receipt_proof',
      workspaceRoot,
    });
  }

  const acceptedMemory = await applyVisualMemoryWriteback({
    ...task,
    proposal_id: task.accepted_proposal_id || task.acceptedProposalId || `${id}-accepted-memory`,
    decision: 'accepted',
    decision_owner: DOMAIN_ID,
    source_review_ref: task.accepted_source_review_ref || task.source_review_ref || task.sourceReviewRef || task.review_export_ref || task.reviewExportRef,
    candidate_memory_ref: task.accepted_candidate_memory_ref || task.candidate_memory_ref || task.candidateMemoryRef || `rca-memory:visual-pattern:${id}-accepted`,
    memory_locator_ref: task.accepted_memory_locator_ref || task.memory_locator_ref || task.memoryLocatorRef || `rca-memory:visual-pattern:${id}-accepted`,
    memory_content_body_ref: task.accepted_memory_content_body_ref || task.memory_content_body_ref || task.memoryContentBodyRef || `rca-memory-content-ref:visual-pattern:${id}-accepted`,
  });

  const rejectedMemory = await applyVisualMemoryWriteback({
    ...task,
    proposal_id: task.rejected_proposal_id || task.rejectedProposalId || `${id}-rejected-memory`,
    decision: 'rejected',
    decision_owner: DOMAIN_ID,
    source_review_ref: task.rejected_source_review_ref || task.source_review_ref || task.sourceReviewRef || task.review_export_ref || task.reviewExportRef,
    candidate_memory_ref: task.rejected_candidate_memory_ref || `rca-memory:visual-pattern:${id}-rejected`,
    memory_locator_ref: task.rejected_memory_locator_ref || `rca-memory:visual-pattern:${id}-rejected`,
    memory_content_body_ref: task.rejected_memory_content_body_ref || `rca-memory-content-ref:visual-pattern:${id}-rejected`,
  });

  const lifecycleReceipts = {};
  for (const operation of ['cleanup', 'restore', 'retention']) {
    lifecycleReceipts[operation] = await applyVisualWorkspaceLifecycle({
      ...task,
      operation,
      receipt_id: `${id}-${operation}`,
      domain_receipt_ref: task.seed_domain_receipt_ref || task.domain_receipt_ref || task.domainReceiptRef || `rca-owner-receipt:visual-stage:${id}-seed`,
      artifact_locator_ref: task.artifact_locator_ref || task.artifactLocatorRef,
      requested_artifact_mutation: false,
    });
  }

  const noRegressionEvidence = await emitNoRegressionEvidence({
    ...task,
    evidence_id: task.evidence_id || task.evidenceId || `${id}-no-regression`,
  });

  const domainReceipt = await emitDomainOwnerReceipt({
    ...task,
    receipt_id: task.domain_receipt_id || task.domainReceiptId || `${id}-domain-owner`,
    attempt_ref: task.attempt_ref || task.attemptRef,
    artifact_locator_ref: task.artifact_locator_ref || task.artifactLocatorRef,
    memory_receipt_ref: acceptedMemory.receipt_ref,
    lifecycle_receipt_ref: lifecycleReceipts.retention.receipt_ref,
    review_export_ref: task.review_export_ref || task.reviewExportRef,
    forbidden_write_proof_ref: task.forbidden_write_proof_ref || task.forbiddenWriteProofRef,
  });

  const proof = {
    ok: true,
    surface_kind: 'workspace_receipt_proof',
    return_shape: 'workspace_receipt_proof',
    proof_id: id,
    proof_ref: `rca-workspace-receipt-proof:visual-stage:${id}`,
    runtime_locator_ref: `workspace-runtime-ref:receipt-proof:${id}`,
    owner: DOMAIN_ID,
    generated_by_action: 'emit_workspace_receipt_proof',
    workspace_locator: { workspace_root: workspaceRoot },
    source_refs: {
      controlled_visual_stage_attempt_ref: '/controlled_visual_stage_attempt',
      controlled_memory_apply_proof_ref: '/controlled_memory_apply_proof',
      lifecycle_guarded_apply_proof_ref: '/lifecycle_guarded_apply_proof',
      domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      no_regression_owner_receipt_opl_consumption_proof_ref: '/no_regression_owner_receipt_opl_consumption_proof',
      opl_generic_primitive_consumption_ref: '/opl_generic_primitive_consumption',
      opl_stability_read_model_consumption_ref: '/opl_stability_read_model_consumption',
    },
    receipt_refs: {
      accepted_memory_receipt_ref: acceptedMemory.receipt_ref,
      rejected_memory_receipt_ref: rejectedMemory.receipt_ref,
      cleanup_lifecycle_receipt_ref: lifecycleReceipts.cleanup.receipt_ref,
      restore_lifecycle_receipt_ref: lifecycleReceipts.restore.receipt_ref,
      retention_lifecycle_receipt_ref: lifecycleReceipts.retention.receipt_ref,
      no_regression_evidence_ref: noRegressionEvidence.evidence_ref,
      domain_owner_receipt_ref: domainReceipt.receipt_ref,
    },
    runtime_files: {
      accepted_memory_receipt_file: acceptedMemory.receipt_file,
      rejected_memory_receipt_file: rejectedMemory.receipt_file,
      cleanup_lifecycle_receipt_file: lifecycleReceipts.cleanup.receipt_file,
      restore_lifecycle_receipt_file: lifecycleReceipts.restore.receipt_file,
      retention_lifecycle_receipt_file: lifecycleReceipts.retention.receipt_file,
      no_regression_evidence_file: noRegressionEvidence.evidence_file,
      domain_owner_receipt_file: domainReceipt.receipt_file,
    },
    coverage: {
      accepted_memory_receipt_written: acceptedMemory.surface_kind === 'visual_pattern_memory_writeback_receipt',
      rejected_memory_receipt_written: rejectedMemory.surface_kind === 'visual_pattern_memory_writeback_receipt',
      cleanup_lifecycle_receipt_written: lifecycleReceipts.cleanup.surface_kind === 'visual_workspace_lifecycle_receipt',
      restore_lifecycle_receipt_written: lifecycleReceipts.restore.surface_kind === 'visual_workspace_lifecycle_receipt',
      retention_lifecycle_receipt_written: lifecycleReceipts.retention.surface_kind === 'visual_workspace_lifecycle_receipt',
      no_regression_evidence_written: noRegressionEvidence.surface_kind === 'no_regression_evidence',
      domain_owner_receipt_written: domainReceipt.surface_kind === 'domain_owner_receipt',
      visual_ready_claimed: false,
      exportable_claimed: false,
      handoffable_claimed: false,
      production_soak_claimed: false,
      visual_artifact_blob_written: false,
      review_export_verdict_written: false,
      memory_content_body_written: false,
      generic_runtime_state_written: false,
      receipt_instances_written_to_repo: false,
    },
    authority_boundary: {
      rca_owns_receipt_proof: true,
      rca_owns_memory_accept_reject: true,
      rca_owns_domain_owner_receipt: true,
      opl_can_store_receipt_refs: true,
      opl_can_store_no_regression_evidence_ref: true,
      opl_can_store_visual_truth: false,
      opl_can_store_review_export_verdict: false,
      opl_can_store_canonical_artifact_blob: false,
      opl_can_write_visual_memory_body: false,
      opl_can_mutate_domain_artifacts: false,
    },
    repository_boundary: {
      repo_tracks_proof_contract: true,
      repo_tracks_live_receipt_instances: false,
      repo_tracks_runtime_evidence_instances: false,
      repo_tracks_visual_or_export_artifacts: false,
      proof_instance_path_model: '<workspace-root>/.redcube/runtime/proofs/workspace-receipts/<proof-id>.json',
    },
  };
  const written = writeRuntimeJson({
    workspaceRoot,
    parts: ['proofs', 'workspace-receipts'],
    fileName: `${id}.json`,
    payload: proof,
  });
  return { ...written.payload, proof_file: written.file };
}
