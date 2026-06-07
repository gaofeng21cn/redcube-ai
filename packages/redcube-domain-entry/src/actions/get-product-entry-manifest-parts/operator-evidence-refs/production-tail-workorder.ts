// @ts-nocheck

import {
  RCA_PRODUCTION_EVIDENCE_TAIL_WORKORDER_ID,
  RCA_PRODUCTION_EVIDENCE_TYPED_BLOCKER_REFS,
} from './evidence-constants.js';

export function buildProductionEvidenceTailWorkOrder({
  productionEvidenceScaleoutRefs,
  oplExpectedReceiptMonitorFreshnessHandoff,
  workspaceReceiptInventoryProjection,
  temporalLongSoakEvidenceInventory,
  temporalAutonomyReadiness,
} = {}) {
  const typedBlockerRefs = productionEvidenceScaleoutRefs?.typed_blocker_refs || [
    ...RCA_PRODUCTION_EVIDENCE_TYPED_BLOCKER_REFS,
  ];
  const sourceProjectionRefs = {
    operator_evidence_readiness_projection_ref: '/operator_evidence_readiness_projection',
    production_evidence_scaleout_refs_ref: '/operator_evidence_readiness_projection/production_evidence_scaleout_refs',
    opl_expected_receipt_monitor_freshness_handoff_ref: '/operator_evidence_readiness_projection/opl_expected_receipt_monitor_freshness_handoff',
    temporal_autonomy_readiness_ref: '/temporal_autonomy_readiness',
    temporal_long_soak_evidence_inventory_ref: '/temporal_controlled_visual_stage_long_soak_evidence_inventory',
    workspace_receipt_inventory_projection_ref: '/workspace_receipt_inventory_projection',
    remaining_evidence_gate_blockers_contract_ref: 'contracts/production_acceptance/rca-production-acceptance.json#/remaining_evidence_gate_blockers',
  };
  const commonForbiddenPayloadClasses = [
    'visual_truth_body',
    'review_export_verdict_body',
    'export_verdict_body',
    'artifact_blob',
    'artifact_body',
    'visual_memory_body',
    'memory_body',
    'generic_runtime_state',
    'generic_attempt_ledger_record',
    'runtime_queue_state',
  ];
  const commonClaimBoundary = {
    success_claims_allowed: false,
    payload_body_allowed: false,
    visual_readiness_claimed: false,
    export_readiness_claimed: false,
    handoff_readiness_claimed: false,
    domain_readiness_claimed: false,
    production_soak_complete_claimed: false,
  };
  return {
    surface_kind: 'rca_production_evidence_tail_workorder',
    workorder_id: RCA_PRODUCTION_EVIDENCE_TAIL_WORKORDER_ID,
    owner: 'redcube_ai',
    consumer: 'one_person_lab',
    status: 'open_typed_blocker_workorder',
    workorder_scope: 'production_evidence_tail_after_contract',
    refs_only: true,
    read_only: true,
    payload_body_required: false,
    payload_body_allowed: false,
    evidence_after_contract_required: true,
    source_projection_refs: sourceProjectionRefs,
    work_items: [
      {
        item_id: 'owner_chain_apply',
        sequence: 1,
        remaining_gap_id: 'owner_chain_apply_to_real_opl_attempt',
        status: 'pending_real_opl_attempt_receipt_or_typed_blocker',
        typed_blocker_ref: typedBlockerRefs[0],
        required_input_refs: [
          `${sourceProjectionRefs.production_evidence_scaleout_refs_ref}/owner_chain_refs`,
          `${sourceProjectionRefs.production_evidence_scaleout_refs_ref}/domain_owner_receipt_refs`,
          `${sourceProjectionRefs.opl_expected_receipt_monitor_freshness_handoff_ref}/body_free_owner_receipt_ref`,
          '/domain_owner_receipt_contract',
        ],
        expected_output_refs: [
          'workspace-runtime-ref:stage-attempt:<run-id>',
          'rca-owner-receipt:visual-stage:<receipt-id>',
          'rca-no-regression:visual-stage:<evidence-id>',
          typedBlockerRefs[0],
        ],
        next_verification_command_refs: [
          'command:npm run --silent build && node --experimental-strip-types --test tests/rca-production-acceptance.test.ts tests/product-entry-cases/evidence-scaleout-surfaces.test.ts',
        ],
        owner_boundary: {
          opl_owner: 'stage_attempt_transport_attempt_refs_and_monitor_freshness_refs',
          rca_owner: 'visual_truth_review_export_verdict_owner_receipt_and_typed_blocker',
          opl_can_store_attempt_refs: true,
          opl_can_write_rca_visual_truth: false,
          opl_can_authorize_review_export_verdict: false,
        },
        ...commonClaimBoundary,
      },
      {
        item_id: 'memory_lifecycle_receipt_scaleout',
        sequence: 2,
        remaining_gap_id: 'real_memory_lifecycle_receipt_instances',
        status: workspaceReceiptInventoryProjection?.gap_projection?.status || 'pending_runtime_receipt_instances',
        typed_blocker_ref: typedBlockerRefs[1],
        required_input_refs: [
          `${sourceProjectionRefs.production_evidence_scaleout_refs_ref}/visual_memory_body_reuse_refs`,
          `${sourceProjectionRefs.workspace_receipt_inventory_projection_ref}/actual_workspace_receipt_refs`,
          '/controlled_memory_apply_proof/runtime_receipt_instances',
          '/lifecycle_guarded_apply_proof',
        ],
        expected_output_refs: [
          'rca-memory-receipt:visual-pattern:<accepted-receipt-id>',
          'rca-memory-receipt:visual-pattern:<rejected-receipt-id>',
          'rca-lifecycle-receipt:cleanup:<receipt-id>',
          'rca-lifecycle-receipt:restore:<receipt-id>',
          'rca-lifecycle-receipt:retention:<receipt-id>',
          typedBlockerRefs[1],
        ],
        next_verification_command_refs: [
          'command:npm run --silent build && node --experimental-strip-types --test tests/product-entry-cases/runtime-and-domain_action_adapter-surfaces.test.ts',
        ],
        receipt_accounting_refs: {
          observed_receipt_count: workspaceReceiptInventoryProjection?.receipt_counts?.total || 0,
          required_memory_lifecycle_receipts_visible: (
            workspaceReceiptInventoryProjection?.coverage?.required_memory_lifecycle_receipts_visible === true
          ),
          body_free_visual_memory_reuse_ref: (
            oplExpectedReceiptMonitorFreshnessHandoff?.body_free_visual_memory_reuse_ref || {}
          ),
        },
        owner_boundary: {
          opl_owner: 'memory_transport_and_receipt_locator_refs',
          rca_owner: 'visual_memory_body_accept_reject_and_lifecycle_receipt_authority',
          opl_can_store_memory_receipt_refs: true,
          opl_can_store_memory_body: false,
          opl_can_accept_or_reject_visual_memory: false,
        },
        ...commonClaimBoundary,
      },
      {
        item_id: 'temporal_controlled_visual_stage_long_soak',
        sequence: 3,
        remaining_gap_id: 'opl_hosted_controlled_visual_stage_long_soak',
        status: 'pending_production_soak',
        typed_blocker_ref: typedBlockerRefs[0],
        required_input_refs: [
          sourceProjectionRefs.temporal_autonomy_readiness_ref,
          '/controlled_soak_no_regression_attempt',
          `${sourceProjectionRefs.opl_expected_receipt_monitor_freshness_handoff_ref}/monitor_freshness_backfill_refs`,
          `${sourceProjectionRefs.production_evidence_scaleout_refs_ref}/review_export_verdict_refs`,
        ],
        expected_output_refs: [
          'rca-long-soak:visual-stage:<soak-id>',
          'workspace-runtime-ref:temporal-controlled-visual-stage-long-soak:<soak-id>',
          'workspace-runtime-ref:temporal-stage-attempt:<run-id>',
          'workspace-runtime-ref:retry-dead-letter:<run-id>',
          'workspace-runtime-ref:requery-resume:<run-id>',
          'rca-owner-receipt:visual-stage:<receipt-id>',
          typedBlockerRefs[0],
        ],
        next_verification_command_refs: [
          'command:npm run --silent build && node --experimental-strip-types --test tests/product-entry-cases/temporal-autonomy-readiness.test.ts tests/product-entry-cases/evidence-scaleout-surfaces.test.ts',
        ],
        temporal_readiness_refs: {
          status: temporalAutonomyReadiness?.status || 'unknown',
          provider_kind_required_for_production: temporalAutonomyReadiness?.provider_kind_required_for_production || 'temporal',
          default_opl_temporal_hosted_autonomy_enabled: (
            temporalAutonomyReadiness?.default_opl_temporal_hosted_autonomy_enabled === true
          ),
          long_soak_evidence_action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
          long_soak_evidence_inventory_ref: '/temporal_controlled_visual_stage_long_soak_evidence_inventory',
          long_soak_evidence_ref_count: temporalLongSoakEvidenceInventory?.evidence_count || 0,
          latest_long_soak_evidence_ref: temporalLongSoakEvidenceInventory?.latest_evidence_ref || null,
          latest_long_soak_runtime_locator_ref: temporalLongSoakEvidenceInventory?.latest_runtime_locator_ref || null,
          long_soak_evidence_refs_visible: (
            temporalLongSoakEvidenceInventory?.coverage?.long_soak_evidence_refs_visible === true
          ),
          production_visual_stage_long_soak_complete: false,
        },
        owner_boundary: {
          opl_owner: 'temporal_provider_queue_retry_dead_letter_and_attempt_refs',
          rca_owner: 'visual_stage_domain_receipt_or_typed_blocker_return_shape',
          opl_can_schedule_wakeup_retry_dead_letter: true,
          provider_completion_is_visual_ready: false,
          provider_completion_is_production_soak_complete: false,
        },
        ...commonClaimBoundary,
      },
      {
        item_id: 'cross_family_repeated_no_regression',
        sequence: 4,
        remaining_gap_id: 'cross_family_repeated_no_regression_evidence',
        status: 'pending_repeated_runtime_evidence',
        typed_blocker_ref: typedBlockerRefs[2],
        required_input_refs: [
          `${sourceProjectionRefs.production_evidence_scaleout_refs_ref}/repeated_no_regression_evidence_refs`,
          '/no_regression_owner_receipt_opl_consumption_proof',
          `${sourceProjectionRefs.workspace_receipt_inventory_projection_ref}/scaleout_projection`,
        ],
        expected_output_refs: [
          'rca-no-regression:visual-stage:ppt_deck:<run-id>',
          'rca-no-regression:visual-stage:xiaohongshu:<run-id>',
          'workspace-runtime-ref:no-regression:<run-id>',
          typedBlockerRefs[2],
        ],
        next_verification_command_refs: [
          'command:npm run --silent build && node --experimental-strip-types --test tests/product-entry-cases/evidence-scaleout-surfaces.test.ts',
        ],
        no_regression_ref_accounting: {
          evidence_refs: productionEvidenceScaleoutRefs?.repeated_no_regression_evidence_refs?.evidence_refs || [],
          deliverable_family_refs: productionEvidenceScaleoutRefs?.repeated_no_regression_evidence_refs?.deliverable_family_refs || [],
          repeated_no_regression_claimed_as_soak: false,
        },
        owner_boundary: {
          opl_owner: 'cross_family_attempt_and_monitor_refs',
          rca_owner: 'domain_owned_no_regression_evidence_refs_and_blockers',
          opl_can_compare_no_regression_refs: true,
          opl_can_authorize_quality_or_export: false,
        },
        ...commonClaimBoundary,
      },
    ],
    forbidden_payload_classes: commonForbiddenPayloadClasses,
    authority_boundary: {
      opl_can_store_workorder_refs: true,
      opl_can_store_attempt_refs: true,
      opl_can_record_monitor_freshness_refs: true,
      opl_can_write_rca_visual_truth: false,
      opl_can_store_artifact_blob: false,
      opl_can_store_memory_body: false,
      opl_can_authorize_review_export_verdict: false,
      opl_can_claim_visual_stage_soak_complete: false,
      rca_owner_receipt_or_typed_blocker_required: true,
    },
    success_boundary: {
      ...commonClaimBoundary,
      owner_chain_closed_by_workorder: false,
    },
  };
}
