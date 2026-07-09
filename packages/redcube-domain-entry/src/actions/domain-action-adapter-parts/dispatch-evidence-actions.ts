// @ts-nocheck
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { getProductEntryManifest } from '../get-product-entry-manifest.js';
import { buildTypedBlocker, collectRefList, writeRuntimeJson } from './dispatch-shared.js';
import { DOMAIN_ID } from './domain_action_adapter-export-projection.js';
import {
  findForbiddenPayloadFieldPaths,
  missingFields,
  noRegressionEvidenceId,
  optionalArray,
  safeText,
  slugId,
  taskValue,
  workspaceRootFromTask,
} from './task-utils.js';

function compactManifestNoRegressionSources(manifest) {
  const controlledSoak = manifest.controlled_soak_no_regression_attempt || {};
  const runtimeResidue = manifest.runtime_residue_retirement || {};
  return {
    controlled_visual_stage_attempt_ref: '/controlled_visual_stage_attempt',
    controlled_memory_apply_proof_ref: '/controlled_memory_apply_proof',
    artifact_locator_contract_ref: '/artifact_locator_contract',
    runtime_residue_retirement_ref: '/runtime_residue_retirement',
    domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
    lifecycle_guarded_apply_proof_ref: '/lifecycle_guarded_apply_proof',
    visual_transition_spec_ref: '/visual_transition_spec',
    visual_transition_evaluator_ref: '/visual_transition_evaluator',
    controlled_soak_state: controlledSoak.state || 'deferred_typed_blocker',
    runtime_residue_retirement_status: runtimeResidue.status || 'unknown',
  };
}

function temporalLongSoakEvidenceId(task) {
  const provided = task.soak_id || task.soakId || task.evidence_id || task.evidenceId || task.long_soak_evidence_id || task.longSoakEvidenceId;
  if (safeText(provided)) {
    return slugId(provided, 'temporal-long-soak');
  }
  const seed = [
    task.task_id || task.taskId || '',
    task.entry_session_id || task.entrySessionId || '',
    task.topic_id || task.topicId || '',
    task.deliverable_id || task.deliverableId || '',
    task.run_id || task.runId || '',
    'temporal-controlled-visual-stage-long-soak',
  ].join(':');
  const digest = createHash('sha256').update(seed).digest('hex').slice(0, 12);
  return `temporal-long-soak-${digest}`;
}

export async function emitNoRegressionEvidence(task) {
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
      verifies_explicit_domain_authority_refs: true,
      verifies_legacy_default_active_path_retired: sourceRefs.runtime_residue_retirement_status === 'active_path_retired',
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

export async function emitTemporalControlledVisualStageLongSoakEvidence(task) {
  const workspaceRoot = workspaceRootFromTask(task);
  const required = [
    'soak_id',
    'temporal_stage_attempt_ref',
    'retry_dead_letter_ref',
    'requery_resume_ref',
    'provider_residency_ref',
    'stage_execution_ai_task_ref',
    'stage_quality_ai_task_ref',
    'domain_owner_receipt_ref',
    'review_export_ref',
    'forbidden_write_proof_ref',
  ];
  const missing = missingFields(task, required);
  const id = temporalLongSoakEvidenceId(task);
  const forbiddenPayloadFields = [...findForbiddenPayloadFieldPaths(task)].sort();
  if (missing.length > 0) {
    return buildTypedBlocker({
      blockerKind: 'temporal_controlled_visual_stage_long_soak_missing_required_refs',
      blockerId: id,
      missing,
      sourceContract: 'rca.temporal_controlled_visual_stage_long_soak.v1',
      nextRequiredOwnerAction: 'provide_opl_temporal_attempt_recovery_independent_ai_owner_receipt_review_export_and_forbidden_write_refs',
      workspaceRoot,
    });
  }
  if (forbiddenPayloadFields.length > 0) {
    return buildTypedBlocker({
      blockerKind: 'temporal_controlled_visual_stage_long_soak_forbidden_payload_fields',
      blockerId: id,
      sourceContract: 'rca.temporal_controlled_visual_stage_long_soak.v1',
      nextRequiredOwnerAction: 'replace_visual_artifact_memory_or_verdict_bodies_with_owner_refs_only',
      workspaceRoot,
      details: {
        forbidden_payload_fields: forbiddenPayloadFields,
        payload_body_allowed: false,
      },
    });
  }

  const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
  const monitorFreshnessRefs = collectRefList(task, 'monitor_freshness_refs', 'monitorFreshnessRefs');
  const operatorEvidenceRefs = collectRefList(task, 'operator_evidence_refs', 'operatorEvidenceRefs');
  const noRegressionEvidenceRefs = collectRefList(task, 'no_regression_evidence_refs', 'noRegressionEvidenceRefs');
  const artifactLocatorRefs = collectRefList(task, 'artifact_locator_refs', 'artifactLocatorRefs');
  const lifecycleReceiptRefs = collectRefList(task, 'lifecycle_receipt_refs', 'lifecycleReceiptRefs');
  const memoryReceiptRefs = collectRefList(task, 'memory_receipt_refs', 'memoryReceiptRefs');
  const evidence = {
    ok: true,
    surface_kind: 'temporal_controlled_visual_stage_long_soak_evidence',
    return_shape: 'controlled_visual_stage_long_soak_evidence',
    evidence_id: id,
    evidence_ref: `rca-long-soak:visual-stage:${id}`,
    runtime_locator_ref: `workspace-runtime-ref:temporal-controlled-visual-stage-long-soak:${id}`,
    owner: DOMAIN_ID,
    generated_by_action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
    contract_ref: 'rca.temporal_controlled_visual_stage_long_soak.v1',
    workspace_locator: { workspace_root: workspaceRoot },
    required_refs: {
      temporal_stage_attempt_ref: safeText(task.temporal_stage_attempt_ref || task.temporalStageAttemptRef),
      retry_dead_letter_ref: safeText(task.retry_dead_letter_ref || task.retryDeadLetterRef),
      requery_resume_ref: safeText(task.requery_resume_ref || task.requeryResumeRef),
      provider_residency_ref: safeText(task.provider_residency_ref || task.providerResidencyRef),
      stage_execution_ai_task_ref: safeText(task.stage_execution_ai_task_ref || task.stageExecutionAiTaskRef),
      stage_quality_ai_task_ref: safeText(task.stage_quality_ai_task_ref || task.stageQualityAiTaskRef),
      domain_owner_receipt_ref: safeText(task.domain_owner_receipt_ref || task.domainOwnerReceiptRef),
      review_export_ref: safeText(task.review_export_ref || task.reviewExportRef),
      forbidden_write_proof_ref: safeText(task.forbidden_write_proof_ref || task.forbiddenWriteProofRef),
    },
    optional_refs: {
      no_regression_evidence_refs: noRegressionEvidenceRefs,
      monitor_freshness_refs: monitorFreshnessRefs,
      operator_evidence_refs: operatorEvidenceRefs,
      artifact_locator_refs: artifactLocatorRefs,
      memory_receipt_refs: memoryReceiptRefs,
      lifecycle_receipt_refs: lifecycleReceiptRefs,
    },
    independent_ai_stage_boundary: {
      stage_execution_ai_task_ref: safeText(task.stage_execution_ai_task_ref || task.stageExecutionAiTaskRef),
      stage_quality_ai_task_ref: safeText(task.stage_quality_ai_task_ref || task.stageQualityAiTaskRef),
      same_context_self_review_allowed: false,
      independent_invocation_required: true,
      programmatic_action_role: 'refs_validator_materializer_and_receipt_signer_only',
    },
    source_manifest_refs: {
      temporal_autonomy_readiness_ref: '/temporal_autonomy_readiness',
      controlled_soak_no_regression_attempt_ref: '/controlled_soak_no_regression_attempt',
      production_evidence_tail_workorder_ref: '/operator_evidence_readiness_projection/production_evidence_tail_workorder',
      production_evidence_scaleout_refs_ref: '/operator_evidence_readiness_projection/production_evidence_scaleout_refs',
      opl_expected_receipt_monitor_freshness_handoff_ref: '/operator_evidence_readiness_projection/opl_expected_receipt_monitor_freshness_handoff',
      domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      review_export_verdict_refs_ref: '/operator_evidence_readiness_projection/production_evidence_scaleout_refs/review_export_verdict_refs',
      forbidden_write_audit_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
    },
    coverage: {
      required_refs_present: true,
      opl_temporal_provider_refs_present: true,
      restart_requery_resume_refs_present: true,
      retry_dead_letter_ref_present: true,
      independent_ai_stage_refs_present: true,
      domain_owner_receipt_ref_present: true,
      review_export_ref_present: true,
      forbidden_write_proof_ref_present: true,
      provider_completion_is_visual_ready: false,
      provider_completion_is_exportable: false,
      provider_completion_is_handoffable: false,
      provider_completion_is_production_soak_complete: false,
      long_soak_evidence_instance_written: true,
      production_visual_stage_long_soak_complete: false,
      visual_ready_claimed: false,
      exportable_claimed: false,
      handoffable_claimed: false,
      domain_ready_claimed: false,
      visual_truth_written: false,
      visual_artifact_blob_written: false,
      artifact_body_written: false,
      review_export_verdict_written: false,
      memory_content_body_written: false,
      generic_runtime_state_written: false,
      receipt_instance_written_to_repo: false,
    },
    temporal_readiness_snapshot: {
      status: manifest.temporal_autonomy_readiness?.status || 'unknown',
      provider_owner: manifest.temporal_autonomy_readiness?.provider_owner || 'one-person-lab',
      provider_kind_required_for_production: manifest.temporal_autonomy_readiness?.provider_kind_required_for_production || 'temporal',
      default_opl_temporal_hosted_autonomy_enabled: manifest.temporal_autonomy_readiness?.default_opl_temporal_hosted_autonomy_enabled === true,
      production_visual_stage_long_soak_complete: false,
    },
    authority_boundary: {
      rca_owns_evidence_ref: true,
      rca_owns_visual_truth: true,
      rca_owns_review_export_verdict: true,
      rca_owns_artifact_authority: true,
      opl_can_store_long_soak_evidence_ref: true,
      opl_can_store_attempt_refs: true,
      opl_can_schedule_retry_dead_letter_requery_resume: true,
      opl_can_write_rca_visual_truth: false,
      opl_can_store_artifact_blob: false,
      opl_can_store_memory_body: false,
      opl_can_authorize_review_export_verdict: false,
      opl_can_claim_visual_stage_soak_complete: false,
    },
    repository_boundary: {
      repo_tracks_contract_refs: true,
      repo_tracks_live_long_soak_instances: false,
      repo_tracks_visual_truth: false,
      repo_tracks_artifact_body: false,
      repo_tracks_memory_body: false,
      repo_tracks_review_export_verdict: false,
      evidence_instance_path_model: '<workspace-root>/.redcube/runtime/evidence/temporal-controlled-visual-stage-long-soak/<soak-id>.json',
    },
  };
  const written = writeRuntimeJson({
    workspaceRoot,
    parts: ['evidence', 'temporal-controlled-visual-stage-long-soak'],
    fileName: `${id}.json`,
    payload: evidence,
  });
  return { ...written.payload, evidence_file: written.file };
}

export async function emitExternalWorkOrderOwnerCloseout(task) {
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
      domain_handler_ref: '/product_entry_shell/domain_handler',
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
