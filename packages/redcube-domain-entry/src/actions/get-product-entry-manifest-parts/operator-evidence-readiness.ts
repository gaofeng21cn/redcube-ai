// @ts-nocheck

import {
  buildOplExpectedReceiptMonitorFreshnessHandoff,
  buildProductionEvidenceScaleoutRefs,
  buildProductionEvidenceTailWorkOrder,
  buildRcaEfficiencyHandoffProjection,
} from './operator-evidence-refs.js';
import { buildRcaGoalWorkflowAgentLabSuite } from './goal-workflow-agent-lab-suite.js';

export function buildOperatorEvidenceReadinessProjection({
  oplGenericPrimitiveConsumption,
  oplGeneratedInterfaceConsumption,
  oplStabilityReadModelConsumption,
  standardDomainAgentSkeleton,
  visualTransitionEvaluator,
  workspaceReceiptInventoryProjection,
  temporalAutonomyReadiness,
}) {
  const receiptInventoryGapProjection = workspaceReceiptInventoryProjection?.gap_projection || {};
  const productionEvidenceScaleoutRefs = buildProductionEvidenceScaleoutRefs({
    standardDomainAgentSkeleton,
    workspaceReceiptInventoryProjection,
  });
  const oplExpectedReceiptMonitorFreshnessHandoff = buildOplExpectedReceiptMonitorFreshnessHandoff({
    productionEvidenceScaleoutRefs,
    workspaceReceiptInventoryProjection,
  });
  const productionEvidenceTailWorkOrder = buildProductionEvidenceTailWorkOrder({
    productionEvidenceScaleoutRefs,
    oplExpectedReceiptMonitorFreshnessHandoff,
    workspaceReceiptInventoryProjection,
    temporalAutonomyReadiness,
  });
  const rcaEfficiencyHandoffProjection = buildRcaEfficiencyHandoffProjection({
    productionEvidenceScaleoutRefs,
  });
  const goalWorkflowAgentLabSuite = buildRcaGoalWorkflowAgentLabSuite();
  const completedFunctionalStructureGapIds = [
    'opl_generated_surface_production_consumption',
    'repo_local_wrapper_active_caller_migration',
    'focused_hosted_attempt_real_path_cutover',
    'artifact_gallery_handoff_shell',
    'review_repair_transport',
    'opl_app_operator_drilldown',
    'workspace_source_lifecycle_receipt_shell',
    'legacy_physical_cleanup',
  ];
  const remainingFunctionalStructureGapIds = [
  ];
  return {
    surface_kind: 'operator_evidence_readiness_projection',
    projection_id: 'rca.operator_evidence_readiness.v1',
    owner: 'redcube_ai',
    consumer: 'opl_app_operator',
    status: 'refs_only_operator_projection_landed',
    projection_model: 'derived_from_existing_manifest_source_refs_only',
    source_refs: [
      {
        source_id: 'no_regression_owner_receipt_opl_consumption_proof',
        ref: '/no_regression_owner_receipt_opl_consumption_proof',
        status: standardDomainAgentSkeleton.no_regression_owner_receipt_opl_consumption_proof?.status || 'unknown',
      },
      {
        source_id: 'domain_owner_receipt_contract',
        ref: '/domain_owner_receipt_contract',
        allowed_return_shapes: standardDomainAgentSkeleton.domain_owner_receipt_contract?.allowed_return_shapes || [],
      },
      {
        source_id: 'production_evidence_scaleout_refs',
        ref: '/operator_evidence_readiness_projection/production_evidence_scaleout_refs',
        status: productionEvidenceScaleoutRefs.status,
        evidence_receipt_fixture_ref: productionEvidenceScaleoutRefs.evidence_receipt_fixture_ref,
      },
      {
        source_id: 'opl_expected_receipt_monitor_freshness_handoff',
        ref: '/operator_evidence_readiness_projection/opl_expected_receipt_monitor_freshness_handoff',
        status: oplExpectedReceiptMonitorFreshnessHandoff.status,
        evidence_receipt_fixture_ref: oplExpectedReceiptMonitorFreshnessHandoff.evidence_receipt_fixture_ref,
      },
      {
        source_id: 'production_evidence_tail_workorder',
        ref: '/operator_evidence_readiness_projection/production_evidence_tail_workorder',
        status: productionEvidenceTailWorkOrder.status,
        workorder_id: productionEvidenceTailWorkOrder.workorder_id,
      },
      {
        source_id: 'goal_workflow_agent_lab_suite',
        ref: '/operator_evidence_readiness_projection/goal_workflow_agent_lab_suite',
        status: goalWorkflowAgentLabSuite.status,
        suite_id: goalWorkflowAgentLabSuite.suite_id,
        suite_ref: goalWorkflowAgentLabSuite.handoff_surface.agent_lab_suite_ref,
      },
      {
        source_id: 'controlled_memory_apply_runtime_receipt_refs',
        ref: '/controlled_memory_apply_proof/runtime_receipt_instances',
        instance_model: standardDomainAgentSkeleton.controlled_memory_apply_proof?.runtime_receipt_instances?.instance_model || 'runtime_locator_refs_only',
      },
      {
        source_id: 'lifecycle_guarded_apply_proof',
        ref: '/lifecycle_guarded_apply_proof',
        operations: (standardDomainAgentSkeleton.lifecycle_guarded_apply_proof?.operations || []).map((operation) => operation.operation),
      },
      {
        source_id: 'controlled_soak_no_regression_attempt',
        ref: '/controlled_soak_no_regression_attempt',
        state: standardDomainAgentSkeleton.controlled_soak_no_regression_attempt?.state || 'unknown',
      },
      {
        source_id: 'workspace_receipt_inventory_projection',
        ref: '/workspace_receipt_inventory_projection',
        status: workspaceReceiptInventoryProjection?.status || 'unknown',
        receipt_count: workspaceReceiptInventoryProjection?.receipt_counts?.total || 0,
        required_memory_lifecycle_receipts_visible: (
          workspaceReceiptInventoryProjection?.coverage?.required_memory_lifecycle_receipts_visible === true
        ),
      },
      {
        source_id: 'visual_transition_evaluator',
        ref: '/visual_transition_evaluator',
        status: visualTransitionEvaluator?.status || 'unknown',
        callable_action: visualTransitionEvaluator?.callable_action || 'evaluate_visual_transition',
      },
      {
        source_id: 'opl_generic_primitive_consumption',
        ref: '/opl_generic_primitive_consumption',
        status: oplGenericPrimitiveConsumption?.status || 'unknown',
        functional_harness_coverage_ref: '/opl_generic_primitive_consumption/functional_harness_consumer_coverage',
      },
      {
        source_id: 'opl_generated_interface_consumption',
        ref: '/opl_generated_interface_consumption',
        status: oplGeneratedInterfaceConsumption?.status || 'unknown',
        generated_interface_owner: oplGeneratedInterfaceConsumption?.generated_interface_owner || 'one-person-lab',
        domain_handler_owner: oplGeneratedInterfaceConsumption?.domain_handler_owner || 'redcube_ai',
      },
      {
        source_id: 'opl_stability_read_model_consumption',
        ref: '/opl_stability_read_model_consumption',
        status: oplStabilityReadModelConsumption?.status || 'unknown',
        observability_only: oplStabilityReadModelConsumption?.observability_only === true,
      },
    ],
    ready_for_operator_gap_projection: true,
    ready_for_opl_app_consumption: true,
    remaining_gap_classification: {
      functional_structure_gap_status: 'functional_structure_gaps_closed_evidence_gates_open',
      functional_structure_gap_count: remainingFunctionalStructureGapIds.length,
      completed_functional_structure_gap_count: completedFunctionalStructureGapIds.length,
      completed_functional_structure_gap_ids: completedFunctionalStructureGapIds,
      remaining_gap_class: 'none',
      remaining_functional_structure_gap_ids: remainingFunctionalStructureGapIds,
      evidence_gap_class: 'production_live_soak_evidence_only',
      remaining_evidence_gate_ids: [
        'opl_hosted_controlled_visual_stage_long_soak',
        'real_memory_lifecycle_receipt_instances',
        'cross_family_repeated_no_regression_evidence',
      ],
    },
    production_acceptance: {
      surface_kind: 'rca_domain_owned_visual_production_acceptance_evidence',
      status: 'closed_by_domain_owned_acceptance_receipt',
      contract_ref: 'contracts/production_acceptance/rca-production-acceptance.json',
      evidence_receipt_fixture_ref: 'contracts/production_acceptance/rca-evidence-receipt-fixture.json',
      receipt_ref: 'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
      receipt_chain_scope: 'rca_owned_refs_only_artifact_producing_receipt_chain',
      visual_ready_claimed: false,
      exportable_claimed: false,
      handoffable_claimed: false,
      domain_ready_claimed: false,
    },
    production_evidence_scaleout_refs: productionEvidenceScaleoutRefs,
    opl_expected_receipt_monitor_freshness_handoff: oplExpectedReceiptMonitorFreshnessHandoff,
    production_evidence_tail_workorder: productionEvidenceTailWorkOrder,
    rca_efficiency_handoff_projection: rcaEfficiencyHandoffProjection,
    goal_workflow_agent_lab_suite: goalWorkflowAgentLabSuite,
    read_only: true,
    refs_only: true,
    writes_visual_truth: false,
    writes_artifact_blob: false,
    writes_memory_body: false,
    declares_production_soak_complete: false,
    declares_artifact_producing_owner_receipt: true,
    declares_artifact_producing_owner_receipt_scope: 'refs_only_receipt_chain_closed_not_visual_ready',
    declares_visual_ready: false,
    declares_exportable: false,
    declares_handoffable: false,
    declares_domain_ready: false,
    implements_opl_generic_runtime: false,
    implements_opl_workbench: false,
    implements_opl_observability: false,
    next_evidence_gaps: [
      {
        gap_id: 'opl_hosted_controlled_visual_stage_long_soak',
        owner: 'opl_provider_then_redcube_ai_receipt',
        status: 'pending_production_soak',
        required_evidence: 'A real OPL-hosted controlled visual-stage run repeatedly consumes RCA domain_action_adapter refs and receives RCA domain receipt, typed blocker, or no-regression evidence refs without writing RCA visual truth.',
        current_best_ref: '/controlled_soak_no_regression_attempt',
        workorder_item_ref: '/operator_evidence_readiness_projection/production_evidence_tail_workorder/work_items/2',
      },
      {
        gap_id: 'real_memory_lifecycle_receipt_instances',
        owner: 'redcube_ai',
        status: receiptInventoryGapProjection.status || 'pending_runtime_receipt_instances',
        required_evidence: 'Accepted/rejected memory writeback and cleanup/restore/retention lifecycle receipts exist in workspace runtime roots and remain refs-only for OPL.',
        current_best_ref: receiptInventoryGapProjection.current_best_ref || '/controlled_memory_apply_proof/runtime_receipt_instances',
        missing_receipt_kinds: receiptInventoryGapProjection.missing_receipt_kinds || [],
        workorder_item_ref: '/operator_evidence_readiness_projection/production_evidence_tail_workorder/work_items/1',
      },
      {
        gap_id: 'cross_family_repeated_no_regression_evidence',
        owner: 'redcube_ai',
        status: 'pending_repeated_runtime_evidence',
        required_evidence: 'Repeated no-regression evidence refs across at least two deliverable families without artifact blobs, memory bodies, or review/export verdict payloads in OPL state.',
        current_best_ref: '/no_regression_owner_receipt_opl_consumption_proof',
        workorder_item_ref: '/operator_evidence_readiness_projection/production_evidence_tail_workorder/work_items/3',
      },
    ],
    authority_boundary: {
      opl_app_can_show_next_gaps: true,
      opl_app_can_store_projection_refs: true,
      opl_app_can_write_rca_visual_truth: false,
      opl_app_can_store_artifact_blob: false,
      opl_app_can_declare_visual_ready: false,
      opl_app_can_declare_exportable: false,
      opl_app_can_declare_handoffable: false,
      opl_app_can_declare_domain_ready: false,
      opl_app_can_claim_production_soak_complete: false,
    },
  };
}
