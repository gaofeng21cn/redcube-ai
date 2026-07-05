// @ts-nocheck

import {
  buildStageExpectedReceiptPayloadSummary,
  buildStageReplayHumanGateBlockerSummary,
} from '../operator-evidence-payload-summaries.js';
import {
  RCA_OPERATOR_EVIDENCE_READINESS_PROJECTION_REF,
  RCA_PRODUCTION_EVIDENCE_SCALEOUT_REFS_REF,
  RCA_PRODUCTION_EVIDENCE_TAIL_WORKORDER_REF,
  RCA_REAL_NO_REGRESSION_EVIDENCE_CADENCE,
} from './evidence-constants.js';

export function buildOplExpectedReceiptMonitorFreshnessHandoff({
  familyStageControlPlane,
  productionEvidenceScaleoutRefs,
  workspaceReceiptInventoryProjection,
}) {
  const ownerReceiptRefs = productionEvidenceScaleoutRefs.owner_receipt_refs || {};
  const workspaceReceiptRefs = productionEvidenceScaleoutRefs.workspace_receipt_scaleout_refs || {};
  const memoryReuseRefs = productionEvidenceScaleoutRefs.visual_memory_body_reuse_refs || {};
  const noRegressionRefs = productionEvidenceScaleoutRefs.repeated_no_regression_evidence_refs || {};
  const workspaceScaleout = workspaceReceiptInventoryProjection?.scaleout_projection || {};
  return {
    surface_kind: 'rca_opl_expected_receipt_monitor_freshness_handoff',
    owner: 'redcube_ai',
    consumer: 'one_person_lab',
    status: 'body_free_refs_ready_for_opl_workorder',
    handoff_scope: 'opl_expected_receipt_and_monitor_freshness_backfill',
    evidence_model: 'refs_only_no_visual_truth_artifact_blob_memory_body_or_review_verdict_body',
    evidence_receipt_fixture_ref: productionEvidenceScaleoutRefs.evidence_receipt_fixture_ref,
    source_projection_refs: {
      operator_evidence_readiness_projection_ref: RCA_OPERATOR_EVIDENCE_READINESS_PROJECTION_REF,
      production_evidence_scaleout_refs_ref: RCA_PRODUCTION_EVIDENCE_SCALEOUT_REFS_REF,
      workspace_receipt_inventory_projection_ref: '/workspace_receipt_inventory_projection',
      domain_handler_export_ref: '/product_entry_shell/domain_handler',
    },
    body_free_owner_receipt_ref: {
      expected_receipt_slot: 'artifact_producing_owner_receipt',
      receipt_ref: ownerReceiptRefs.receipt_ref || 'rca-owner-receipt:visual-stage:<receipt-id>',
      contract_ref: ownerReceiptRefs.contract_ref || '/domain_owner_receipt_contract',
      artifact_locator_ref: ownerReceiptRefs.artifact_locator_ref || '/artifact_locator_contract',
      review_export_gate_ref: ownerReceiptRefs.review_export_gate_ref || '/review_state',
      payload_body_included: false,
      visual_readiness_claimed: false,
      export_readiness_claimed: false,
    },
    body_free_workspace_receipt_ref: {
      expected_receipt_slot: 'workspace_receipt',
      workspace_receipt_inventory_ref: workspaceReceiptRefs.workspace_receipt_inventory_ref || '/workspace_receipt_inventory_projection',
      workspace_receipt_proof_action: 'emit_workspace_receipt_proof',
      workspace_receipt_proof_ref_model: workspaceReceiptRefs.workspace_receipt_proof_ref_model || 'rca-workspace-receipt-proof:visual-stage:<proof-id>',
      runtime_locator_ref_model: workspaceReceiptRefs.runtime_locator_ref_model || 'workspace-runtime-ref:receipt-proof:<proof-id>',
      observed_workspace_count: workspaceScaleout.observed_workspace_count || 0,
      observed_receipt_count: workspaceScaleout.observed_receipt_count || 0,
      receipt_kind_coverage_ready: workspaceScaleout.receipt_kind_coverage_ready === true,
      workspace_receipt_scaleout_claimed: false,
    },
    body_free_visual_memory_reuse_ref: {
      expected_receipt_slot: 'visual_memory_reuse_ref',
      memory_locator_ref: memoryReuseRefs.memory_locator_ref || '/domain_memory_descriptor_locator/memory_locator',
      consumed_memory_ref: memoryReuseRefs.consumed_memory_ref || 'rca-memory:visual-pattern:<memory-id>',
      memory_content_body_ref: memoryReuseRefs.memory_content_body_ref || 'rca-memory-content-ref:visual-pattern:<memory-id>',
      memory_body_projected_to_opl: false,
      payload_body_included: false,
    },
    body_free_repeated_no_regression_refs: {
      expected_receipt_slot: 'repeated_no_regression_evidence',
      generator_action: 'emit_no_regression_evidence',
      evidence_refs: noRegressionRefs.evidence_refs || [],
      deliverable_family_refs: noRegressionRefs.deliverable_family_refs || [],
      evidence_cadence: noRegressionRefs.evidence_cadence || RCA_REAL_NO_REGRESSION_EVIDENCE_CADENCE,
      repeated_no_regression_claimed_as_soak: false,
    },
    monitor_freshness_backfill_refs: {
      monitor_surface_ref: '/workspace_receipt_inventory_projection',
      monitor_status: workspaceReceiptInventoryProjection?.status || 'unknown',
      freshness_ref_group: 'workspace_receipt_inventory_and_no_regression_refs',
      observed_workspace_count_ref: '/workspace_receipt_inventory_projection/scaleout_projection/observed_workspace_count',
      observed_receipt_count_ref: '/workspace_receipt_inventory_projection/scaleout_projection/observed_receipt_count',
      no_regression_evidence_refs_ref: `${RCA_PRODUCTION_EVIDENCE_SCALEOUT_REFS_REF}/repeated_no_regression_evidence_refs/evidence_refs`,
      monitor_freshness_payload_body_required: false,
      production_soak_claimed: false,
    },
    production_tail_typed_blocker_refs: {
      status: 'linked_not_stage_handoff_payload',
      blocker_refs: productionEvidenceScaleoutRefs.typed_blocker_refs || [],
      blocker_owner: 'redcube_ai',
      payload_body_included: false,
      blocks_stage_expected_receipt_or_monitor_refs: false,
      production_tail_workorder_ref: RCA_PRODUCTION_EVIDENCE_TAIL_WORKORDER_REF,
    },
    stage_expected_receipt_payload_summary: buildStageExpectedReceiptPayloadSummary({
      familyStageControlPlane,
      productionEvidenceScaleoutRefs,
      workspaceReceiptInventoryProjection,
    }),
    stage_replay_human_gate_blocker_summary: buildStageReplayHumanGateBlockerSummary(),
    opl_payload_policy: {
      payload_kind: 'stage_production_evidence_receipt_record_body_free_refs',
      payload_body_required: false,
      payload_body_allowed: false,
      allowed_payload_ref_groups: [
        'body_free_owner_receipt_ref',
        'body_free_workspace_receipt_ref',
        'body_free_visual_memory_reuse_ref',
        'body_free_repeated_no_regression_refs',
      ],
      forbidden_payload_classes: [
        'visual truth body',
        'review or export verdict body',
        'artifact blob',
        'generic runtime state',
        'memory body',
        'retired managed runtime compatibility alias negative guard field',
      ],
    },
    authority_boundary: {
      opl_can_store_handoff_refs: true,
      opl_can_record_expected_receipt_refs: true,
      opl_can_record_monitor_freshness_refs: true,
      opl_can_write_rca_visual_truth: false,
      opl_can_store_artifact_payload: false,
      opl_can_store_memory_body: false,
      opl_can_authorize_review_export_verdict: false,
      opl_can_claim_visual_stage_soak_complete: false,
    },
  };
}
