// @ts-nocheck

import {
  buildOwnerPayloadItemSummaries,
  buildStageExpectedReceiptPayloadSummary,
} from './operator-evidence-payload-summaries.js';

const RCA_EFFICIENCY_WORK_ORDER_ID = 'oma_developer_patch_work_order_5a1b68cacbd4';

const RCA_EFFICIENCY_TARGET_VERIFICATION_REFS = Object.freeze([
  'target_runtime_consumption_verification_receipt',
  'target_workspace_environment_consumption_receipt',
  'workspace-runtime-ref:review-export:<run-id>',
  'workspace-runtime-ref:export-result:<run-id>',
  'target-verification:redcube-ai/product-manifest-read',
  'target-verification:redcube-ai/domain-handler-export-read',
  'target-verification:redcube-ai/typecheck',
  'target-verification:redcube-ai/test-fast',
  'target-verification:redcube-ai/targeted-efficiency-tests',
]);

const RCA_EFFICIENCY_PATCH_TRACEABILITY_MATRIX = Object.freeze([
  Object.freeze({
    proposed_change_ref: 'target_agent_owner_receipt_contract_ref:target_agent/live-acceptance',
    target_surface: 'target_agent_owner_receipt_contract_ref',
    target_repo_refs: [
      'contracts/owner_receipt_contract.json',
      'redcube product manifest#/domain_owner_receipt_contract',
    ],
    verifies_ref: 'target-owner-receipt-or-typed-blocker:redcube_ai/oma_developer_patch_work_order_5a1b68cacbd4',
    refs_only: true,
    writes_target_domain_truth: false,
    writes_memory_body: false,
    writes_artifact_body: false,
    authorizes_quality_or_export: false,
  }),
  Object.freeze({
    proposed_change_ref: 'target_agent_owner_route_ref:target_agent/owner-receipt-projection',
    target_surface: 'target_agent_owner_route_ref',
    target_repo_refs: [
      'redcube product manifest#/owner_route',
      'redcube domain-handler export#/source_manifest_refs/rca_efficiency_handoff_projection_ref',
    ],
    verifies_ref: 'target-runtime-read-model-consumption:redcube_ai/oma_developer_patch_work_order_5a1b68cacbd4/source-patch',
    refs_only: true,
    writes_target_domain_truth: false,
    writes_memory_body: false,
    writes_artifact_body: false,
    authorizes_quality_or_export: false,
  }),
  Object.freeze({
    proposed_change_ref: 'target_agent_production_acceptance_contract_ref:target_agent/production_acceptance',
    target_surface: 'target_agent_production_acceptance_contract_ref',
    target_repo_refs: [
      'contracts/production_acceptance/rca-production-acceptance.json',
      'contracts/production_acceptance/rca-efficiency-handoff-projection.json',
    ],
    verifies_ref: 'workspace-runtime-ref:review-export:<run-id>',
    refs_only: true,
    writes_target_domain_truth: false,
    writes_memory_body: false,
    writes_artifact_body: false,
    authorizes_quality_or_export: false,
  }),
  Object.freeze({
    proposed_change_ref: 'target_agent_quality_gate_ref:target_agent/export-owner',
    target_surface: 'target_agent_quality_gate_ref',
    target_repo_refs: [
      'agent/quality_gates/review_export_memory.md',
      'agent/quality_gates/artifact_authority.md',
      'prompts/ppt_deck/repair_image_pages.md',
    ],
    verifies_ref: 'workspace-runtime-ref:export-result:<run-id>',
    refs_only: true,
    writes_target_domain_truth: false,
    writes_memory_body: false,
    writes_artifact_body: false,
    authorizes_quality_or_export: false,
  }),
  Object.freeze({
    proposed_change_ref: 'target_agent_regression_suite_ref:target_agent/owner-boundary',
    target_surface: 'target_agent_regression_suite_ref',
    target_repo_refs: [
      'tests/rca-efficiency-handoff-projection.test.ts',
      'tests/product-entry-cases/evidence-scaleout-surfaces.test.ts',
    ],
    verifies_ref: 'target-verification:redcube-ai/targeted-efficiency-tests',
    refs_only: true,
    writes_target_domain_truth: false,
    writes_memory_body: false,
    writes_artifact_body: false,
    authorizes_quality_or_export: false,
  }),
]);

const RCA_PRODUCTION_EVIDENCE_TYPED_BLOCKER_REFS = Object.freeze([
  'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
  'rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending',
  'rca-typed-blocker:no-regression:cross-family-production-scaleout-pending',
]);

const RCA_PRODUCTION_EVIDENCE_TAIL_WORKORDER_ID = 'rca.production_evidence_tail_workorder.v1';

const RCA_OWNER_PAYLOAD_REQUIRED_RETURN_SHAPES = Object.freeze([
  'domain_owner_receipt_ref',
  'no_regression_evidence_ref',
  'owner_chain_ref',
  'typed_blocker_ref',
]);

const RCA_OWNER_PAYLOAD_PATH_POLICY =
  'operator_must_choose_success_refs_path_or_domain_owned_typed_blocker_path_empty_template_blocks';

function uniqueRefs(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim().length > 0))];
}

export function buildProductionEvidenceScaleoutRefs({
  standardDomainAgentSkeleton,
  workspaceReceiptInventoryProjection,
}) {
  const receiptContract = standardDomainAgentSkeleton.domain_owner_receipt_contract || {};
  const memoryApplyProof = standardDomainAgentSkeleton.controlled_memory_apply_proof || {};
  const noRegressionProof = standardDomainAgentSkeleton.no_regression_owner_receipt_opl_consumption_proof || {};
  const physicalSkeleton = standardDomainAgentSkeleton.physical_skeleton_follow_through || {};
  const actualWorkspaceReceiptRefs =
    workspaceReceiptInventoryProjection?.actual_workspace_receipt_refs?.artifact_producing_owner_receipt_refs || [];
  const domainOwnerReceiptRefs = uniqueRefs([
    'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
    ...actualWorkspaceReceiptRefs,
  ]);
  const noRegressionEvidenceRefs = uniqueRefs([
    'rca-no-regression:visual-stage:transition-hosted-no-regression',
    'rca-no-regression:visual-stage:workspace-receipt-scaleout-no-regression',
  ]);
  const ownerChainRefs = uniqueRefs([
    'contracts/production_acceptance/rca-evidence-receipt-fixture.json',
    '/domain_owner_receipt_contract',
    '/artifact_locator_contract',
    '/workspace_receipt_inventory_projection',
    '/operator_evidence_readiness_projection/production_evidence_scaleout_refs',
    '/controlled_memory_apply_proof',
    '/no_regression_owner_receipt_opl_consumption_proof',
    'workspace-runtime-ref:review-export:transition-run',
    ...domainOwnerReceiptRefs,
    ...noRegressionEvidenceRefs,
    ...(workspaceReceiptInventoryProjection?.actual_workspace_receipt_refs?.memory_lifecycle_receipt_refs || []),
  ]);
  const acceptedPayloadPaths = {
    success_refs_path: {
      required_any_operator_payload_refs: [
        'domain_owner_receipt_refs',
        'no_regression_evidence_refs',
        'owner_chain_refs',
      ],
      typed_blocker_refs_must_be_absent: true,
      closes_owner_chain: false,
      closes_domain_ready: false,
      closes_production_ready: false,
    },
    typed_blocker_path: {
      required_operator_payload_refs: ['typed_blocker_refs'],
      success_claimed: false,
      closes_owner_chain: false,
      closes_domain_ready: false,
      closes_production_ready: false,
    },
  };
  return {
    surface_kind: 'rca_visual_production_evidence_scaleout_refs',
    owner: 'redcube_ai',
    status: 'refs_landed_scaleout_runtime_evidence_pending',
    evidence_model: 'refs_only_no_visual_truth_artifact_blob_or_memory_body',
    evidence_receipt_fixture_ref: 'contracts/production_acceptance/rca-evidence-receipt-fixture.json',
    selected_artifact_producing_visual_route: {
      deliverable_family: 'ppt_deck',
      route_id: 'ppt_deck.image_first.artifact_producing.v1',
      route_ref: '/ppt_deck_visual_route_truth',
      route_kind: 'image_first_ppt_artifact_route',
      stage_sequence_refs: [
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'export_pptx',
      ],
      produces_artifact_refs: true,
      selected_for_evidence_scaleout: true,
      html_or_native_route_selected: false,
      visual_verdict_owner: 'redcube_ai',
      artifact_authority_owner: 'redcube_ai',
    },
    owner_receipt_refs: {
      status: 'artifact_producing_owner_receipt_ref_closed',
      contract_ref: '/domain_owner_receipt_contract',
      receipt_ref: 'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
      actual_workspace_receipt_refs: workspaceReceiptInventoryProjection?.actual_workspace_receipt_refs?.artifact_producing_owner_receipt_refs || [],
      actual_workspace_receipt_refs_visible: (
        workspaceReceiptInventoryProjection?.actual_workspace_receipt_refs?.required_owner_receipt_visible === true
      ),
      allowed_return_shapes: receiptContract.allowed_return_shapes || [],
      opl_can_store_receipt_refs: receiptContract.opl_consumption_policy?.opl_can_store_receipt_refs === true,
      visual_readiness_claimed: false,
      export_readiness_claimed: false,
    },
    domain_owner_receipt_refs: domainOwnerReceiptRefs,
    typed_blocker_refs: [...RCA_PRODUCTION_EVIDENCE_TYPED_BLOCKER_REFS],
    owner_chain_refs: ownerChainRefs,
    no_regression_evidence_refs: noRegressionEvidenceRefs,
    domain_receipt_refs: domainOwnerReceiptRefs,
    no_regression_refs: noRegressionEvidenceRefs,
    required_return_shapes: [...RCA_OWNER_PAYLOAD_REQUIRED_RETURN_SHAPES],
    payload_path_policy: RCA_OWNER_PAYLOAD_PATH_POLICY,
    accepted_payload_paths: acceptedPayloadPaths,
    legacy_payload_field_aliases: {
      domain_receipt_refs: 'domain_owner_receipt_refs',
      no_regression_refs: 'no_regression_evidence_refs',
    },
    owner_payload_item_summary: buildOwnerPayloadItemSummaries({
      domainOwnerReceiptRefs,
      noRegressionEvidenceRefs,
      ownerChainRefs,
      typedBlockerRefs: [...RCA_PRODUCTION_EVIDENCE_TYPED_BLOCKER_REFS],
    }),
    workspace_receipt_scaleout_refs: {
      status: workspaceReceiptInventoryProjection?.scaleout_projection?.status || 'workspace_receipt_scaleout_ref_model_pending',
      workspace_receipt_inventory_ref: '/workspace_receipt_inventory_projection',
      workspace_receipt_proof_action: 'emit_workspace_receipt_proof',
      workspace_receipt_proof_ref_model: 'rca-workspace-receipt-proof:visual-stage:<proof-id>',
      runtime_locator_ref_model: 'workspace-runtime-ref:receipt-proof:<proof-id>',
      required_workspace_count_for_scaleout: 2,
      observed_workspace_count: workspaceReceiptInventoryProjection?.scaleout_projection?.observed_workspace_count || 0,
      observed_receipt_count: workspaceReceiptInventoryProjection?.scaleout_projection?.observed_receipt_count || 0,
      receipt_kind_coverage_ready: workspaceReceiptInventoryProjection?.scaleout_projection?.receipt_kind_coverage_ready === true,
      actual_workspace_receipt_refs: workspaceReceiptInventoryProjection?.actual_workspace_receipt_refs || null,
      workspace_receipt_scaleout_claimed: false,
      emits_owner_receipt_ref: true,
      emits_memory_receipt_refs: true,
      emits_no_regression_evidence_ref: true,
      declares_production_soak_complete: false,
    },
    visual_memory_body_reuse_refs: {
      status: 'body_external_reuse_ref_landed',
      memory_locator_ref: '/domain_memory_descriptor_locator/memory_locator',
      controlled_apply_proof_ref: '/controlled_memory_apply_proof',
      consumed_memory_ref: memoryApplyProof.consumed_visual_pattern_memory_refs?.[0]?.memory_ref || 'rca-memory:visual-pattern:<memory-id>',
      memory_content_body_ref: memoryApplyProof.consumed_visual_pattern_memory_refs?.[0]?.content_ref || 'rca-memory-content-ref:visual-pattern:<memory-id>',
      runtime_receipt_instances_ref: '/controlled_memory_apply_proof/runtime_receipt_instances',
      body_owner: 'redcube_ai',
      projected_body_to_opl: false,
      contains_memory_body: false,
      reuse_ref_scope: 'visual_pattern_memory_locator_and_content_ref_only',
    },
    repeated_no_regression_evidence_refs: {
      status: 'repeated_refs_available_not_production_soak',
      generator_action: 'emit_no_regression_evidence',
      proof_contract_ref: '/no_regression_owner_receipt_opl_consumption_proof',
      proof_status: noRegressionProof.status || 'unknown',
      evidence_refs: noRegressionEvidenceRefs,
      deliverable_family_refs: [
        'ppt_deck',
        'xiaohongshu',
      ],
      evidence_cadence: 'repeated_family_refs_only',
      required_minimum_evidence_ref_count: 2,
      repeated_no_regression_claimed_as_soak: false,
    },
    review_export_verdict_refs: {
      status: 'review_export_refs_routed_through_artifact_producing_route',
      route_id: 'ppt_deck.image_first.artifact_producing.v1',
      review_export_gate_ref: 'workspace-runtime-ref:review-export:transition-run',
      actual_workspace_review_export_ref_model: 'workspace-runtime-ref:review-export:<run-id>',
      verdict_body_projected_to_opl: false,
      declares_visual_ready: false,
      declares_exportable: false,
      declares_handoffable: false,
    },
    naming_tombstone_follow_through_refs: {
      status: 'tombstone_follow_through_refs_landed_no_compatibility_alias',
      active_caller_compatibility_alias_restored: false,
      tombstone_refs: physicalSkeleton.tombstone_refs || [],
      retained_provenance_refs: [
        'contracts/runtime-program/managed-product-entry-hardening.json',
        'human_doc:retired_managed_product_entry_contract_tombstone',
      ],
      forbidden_active_occurrence_classes: [
        'compatibility_alias',
        'default_runtime_owner',
        'public_action_key',
        'domain_action_adapter_template',
      ],
    },
    authority_boundary: {
      opl_can_store_projection_refs: true,
      opl_can_write_rca_visual_truth: false,
      opl_can_store_artifact_blob: false,
      opl_can_store_memory_body: false,
      opl_can_authorize_review_export_verdict: false,
      opl_can_claim_production_soak_complete: false,
    },
  };
}

export function buildProductionEvidenceTailWorkOrder({
  productionEvidenceScaleoutRefs,
  oplExpectedReceiptMonitorFreshnessHandoff,
  workspaceReceiptInventoryProjection,
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
      operator_evidence_readiness_projection_ref: '/operator_evidence_readiness_projection',
      production_evidence_scaleout_refs_ref: '/operator_evidence_readiness_projection/production_evidence_scaleout_refs',
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
      evidence_cadence: noRegressionRefs.evidence_cadence || 'repeated_family_refs_only',
      repeated_no_regression_claimed_as_soak: false,
    },
    monitor_freshness_backfill_refs: {
      monitor_surface_ref: '/workspace_receipt_inventory_projection',
      monitor_status: workspaceReceiptInventoryProjection?.status || 'unknown',
      freshness_ref_group: 'workspace_receipt_inventory_and_no_regression_refs',
      observed_workspace_count_ref: '/workspace_receipt_inventory_projection/scaleout_projection/observed_workspace_count',
      observed_receipt_count_ref: '/workspace_receipt_inventory_projection/scaleout_projection/observed_receipt_count',
      no_regression_evidence_refs_ref: '/operator_evidence_readiness_projection/production_evidence_scaleout_refs/repeated_no_regression_evidence_refs/evidence_refs',
      monitor_freshness_payload_body_required: false,
      production_soak_claimed: false,
    },
    production_tail_typed_blocker_refs: {
      status: 'linked_not_stage_handoff_payload',
      blocker_refs: productionEvidenceScaleoutRefs.typed_blocker_refs || [],
      blocker_owner: 'redcube_ai',
      payload_body_included: false,
      blocks_stage_expected_receipt_or_monitor_refs: false,
      production_tail_workorder_ref: '/operator_evidence_readiness_projection/production_evidence_tail_workorder',
    },
    stage_expected_receipt_payload_summary: buildStageExpectedReceiptPayloadSummary({
      familyStageControlPlane,
      productionEvidenceScaleoutRefs,
      workspaceReceiptInventoryProjection,
    }),
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

export function buildRcaEfficiencyHandoffProjection({ productionEvidenceScaleoutRefs } = {}) {
  const reviewExportRefs = productionEvidenceScaleoutRefs?.review_export_verdict_refs || {};
  const ownerReceiptRefs = productionEvidenceScaleoutRefs?.owner_receipt_refs || {};
  const memoryReuseRefs = productionEvidenceScaleoutRefs?.visual_memory_body_reuse_refs || {};
  return {
    surface_kind: 'rca_efficiency_handoff_projection',
    projection_id: 'rca.efficiency_handoff_projection.v1',
    owner: 'redcube_ai',
    consumer: 'opl_agent_lab',
    status: 'refs_only_standard_suite_input_ready',
    projection_model: 'derived_from_existing_runtime_review_export_refs_only',
    refs_only: true,
    read_only: true,
    source_work_order_ref: RCA_EFFICIENCY_WORK_ORDER_ID,
    agent_lab_suite_input: {
      suite_kind: 'standard',
      suite_id: 'redcube-ai.efficiency-observability.standard.v1',
      domain_id: 'redcube-ai',
      domain_specific_suite_kind_required: false,
      compatible_agent_lab_contract_ref: 'opl agent-lab suite-input#/standard',
      input_mode: 'refs_only_handoff',
      claims_visual_ready: false,
      claims_exportable: false,
      claims_handoffable: false,
      claims_production_soak_complete: false,
    },
    target_agent_owner_surface_refs: {
      owner_route_ref: 'redcube product manifest#/owner_route',
      owner_receipt_contract_ref: 'redcube product manifest#/domain_owner_receipt_contract',
      external_work_order_owner_closeout_ref: 'redcube product manifest#/domain_owner_receipt_contract/external_work_order_owner_closeout',
      external_work_order_owner_closeout_action: 'emit_external_work_order_owner_closeout',
      production_acceptance_contract_ref: 'contracts/production_acceptance/rca-production-acceptance.json',
      quality_gate_refs: [
        'agent/quality_gates/review_export_memory.md',
        'agent/quality_gates/artifact_authority.md',
      ],
      regression_suite_refs: [
        'tests/rca-efficiency-handoff-projection.test.ts',
        'tests/product-entry-cases/evidence-scaleout-surfaces.test.ts',
      ],
      owner: 'redcube_ai',
      refs_only: true,
    },
    target_runtime_consumption_refs: [
      'redcube product manifest#/rca_efficiency_handoff_projection',
      'redcube product manifest#/operator_evidence_readiness_projection/rca_efficiency_handoff_projection',
      'redcube domain-handler export#/mapped_surfaces/rca_efficiency_handoff_projection',
      'redcube domain-handler export#/source_manifest_refs/rca_efficiency_handoff_projection_ref',
      'redcube domain-handler export#/mapped_surfaces/external_work_order_owner_closeout',
      'redcube domain-handler export#/source_manifest_refs/external_work_order_owner_closeout_ref',
    ],
    efficiency_signal_refs: {
      duration_refs: [
        'workspace-runtime-ref:route-summary:<run-id>#/elapsed_ms',
        'opl_generated:product_session#/runtime_loop_closure/elapsed_ms',
      ],
      cost_refs: [
        'workspace-runtime-ref:route-summary:<run-id>#/cost_summary',
        'opl_generated:product_session#/runtime_loop_closure/cost_summary',
      ],
      cache_refs: [
        'workspace-runtime-ref:route-summary:<run-id>#/cache_status',
        'redcube product manifest#/ppt_deck_visual_route_truth/cache_status',
        'workspace-runtime-ref:source-pack-reuse:<run-id>#/cache_status',
        'workspace-runtime-ref:prompt-static-prefix-cache:<run-id>#/cache_status',
        'workspace-runtime-ref:export-preview-cache:<run-id>#/cache_status',
      ],
      reuse_refs: [
        'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/reused_slide_ids',
        'workspace-runtime-ref:route-artifact:<run-id>#/review_execution/reused_slide_ids',
        'workspace-runtime-ref:source-pack-reuse:<run-id>#/reused_source_pack_ref',
        'workspace-runtime-ref:prompt-static-prefix-cache:<run-id>#/prefix_hash',
        'workspace-runtime-ref:repair-image-pages:<run-id>#/preserved_slide_hashes',
        'workspace-runtime-ref:export-preview-cache:<run-id>#/preview_artifact_hash',
      ],
      render_execution_refs: [
        'workspace-runtime-ref:route-artifact:<run-id>#/render_execution',
        'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/codex_batch_runtime',
        'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/page_local_batch_runtime',
        'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/parallel_batch_sizing',
      ],
      export_result_refs: [
        reviewExportRefs.actual_workspace_review_export_ref_model || 'workspace-runtime-ref:review-export:<run-id>',
        'workspace-runtime-ref:export-result:<run-id>',
        'workspace-runtime-ref:export-preview-cache:<run-id>',
      ],
      repair_scope_refs: [
        'workspace-runtime-ref:repair-image-pages:<run-id>#/blocked_slide_ids',
        'workspace-runtime-ref:repair-image-pages:<run-id>#/freshly_rendered_slide_ids',
        'workspace-runtime-ref:repair-image-pages:<run-id>#/reused_slide_ids',
      ],
    },
    efficiency_fields: {
      cache_status: {
        source_ref: 'workspace-runtime-ref:route-summary:<run-id>#/cache_status',
        body_included: false,
      },
      elapsed_ms: {
        source_ref: 'workspace-runtime-ref:route-summary:<run-id>#/elapsed_ms',
        body_included: false,
      },
      render_execution: {
        source_ref: 'workspace-runtime-ref:route-artifact:<run-id>#/render_execution',
        body_included: false,
      },
      reused_slide_ids: {
        source_ref: 'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/reused_slide_ids',
        body_included: false,
      },
      cost_summary: {
        source_ref: 'workspace-runtime-ref:route-summary:<run-id>#/cost_summary',
        body_included: false,
      },
      screenshot_review_gate: {
        source_ref: 'workspace-runtime-ref:screenshot_review:<run-id>',
        body_included: false,
      },
      export_result: {
        source_ref: 'workspace-runtime-ref:export-result:<run-id>',
        body_included: false,
      },
      source_pack_reuse: {
        source_ref: 'workspace-runtime-ref:source-pack-reuse:<run-id>',
        body_included: false,
      },
      prompt_static_prefix_cache: {
        source_ref: 'workspace-runtime-ref:prompt-static-prefix-cache:<run-id>',
        body_included: false,
      },
      page_local_batch_runtime: {
        source_ref: 'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/page_local_batch_runtime',
        body_included: false,
      },
      blocked_page_only_repair: {
        source_ref: 'workspace-runtime-ref:repair-image-pages:<run-id>',
        body_included: false,
      },
      export_preview_cache: {
        source_ref: 'workspace-runtime-ref:export-preview-cache:<run-id>',
        body_included: false,
      },
    },
    patch_traceability_matrix: RCA_EFFICIENCY_PATCH_TRACEABILITY_MATRIX.map((entry) => ({ ...entry })),
    target_verification_refs: [...RCA_EFFICIENCY_TARGET_VERIFICATION_REFS],
    quality_floor_refs: {
      review_export_gate_refs: [
        reviewExportRefs.review_export_gate_ref || 'workspace-runtime-ref:review-export:transition-run',
        reviewExportRefs.actual_workspace_review_export_ref_model || 'workspace-runtime-ref:review-export:<run-id>',
        'agent/quality_gates/review_export_memory.md',
      ],
      screenshot_review_gate_refs: [
        'agent/quality_gates/screenshot_review.md',
        'workspace-runtime-ref:screenshot_review:<run-id>',
      ],
      visual_memory_authority_refs: [
        'redcube product manifest#/domain_memory_descriptor_locator/memory_locator',
        'redcube product manifest#/controlled_memory_apply_proof/runtime_receipt_instances',
      ],
      owner_receipt_refs: [
        ownerReceiptRefs.receipt_ref || 'rca-owner-receipt:visual-stage:<receipt-id>',
        'contracts/owner_receipt_contract.json#/receipt_cases/0',
      ],
      export_authority_refs: [
        'agent/quality_gates/artifact_authority.md',
        'contracts/artifact_locator_contract.json',
      ],
      blocked_page_only_repair_refs: [
        'workspace-runtime-ref:repair-image-pages:<run-id>#/blocked_slide_ids',
        'workspace-runtime-ref:repair-image-pages:<run-id>#/preserved_slide_hashes',
        'prompts/ppt_deck/repair_image_pages.md',
      ],
      export_preview_cache_gate_refs: [
        'workspace-runtime-ref:export-preview-cache:<run-id>',
        'workspace-runtime-ref:export-result:<run-id>',
      ],
    },
    optimization_policy: {
      efficiency_improves_observability_only: true,
      orchestration_only: true,
      quality_gates_may_be_lowered: false,
      screenshot_review_required: true,
      export_gate_required: true,
      source_pack_reuse_allowed: true,
      prompt_static_prefix_cache_allowed: true,
      page_local_parallel_or_batch_sizing_telemetry_allowed: true,
      blocked_page_only_repair_required_for_repair_route: true,
      export_preview_cache_allowed: true,
      visual_ready_claim_allowed: false,
    },
    authority_boundary: {
      no_forbidden_write: true,
      opl_agent_lab_can_store_suite_input_refs: true,
      opl_agent_lab_can_compare_efficiency_refs: true,
      opl_agent_lab_can_write_rca_visual_truth: false,
      opl_agent_lab_can_write_artifact_blob: false,
      opl_agent_lab_can_write_memory_body: false,
      opl_agent_lab_can_authorize_quality_verdict: false,
      opl_agent_lab_can_authorize_exportable: false,
      opl_agent_lab_can_claim_visual_ready: false,
      rca_quality_floor_owner: 'redcube_ai',
      rca_export_authority_owner: 'redcube_ai',
    },
  };
}
