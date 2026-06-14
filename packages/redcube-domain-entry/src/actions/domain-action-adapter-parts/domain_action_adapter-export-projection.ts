// @ts-nocheck

import {
  buildFamilySchedulerReplacementProjection,
  buildOplGenericPrimitiveConsumptionProjection,
  buildOplStabilityReadModelConsumptionProjection,
  buildPrivatizedFunctionalModuleAuditProjection,
  buildOplSubstrateAdapterExportProjection,
  buildVisualPackCompilerHandoffProjection,
} from '../guarded-domain-actions.js';
import {
  listDomainActionAdapterBlockedActions,
  listDomainActionAdapterGuardedActions,
  domainActionAdapterGuardedActionSet,
} from './guarded-action-catalog.js';
import { RUNTIME_WATCH_BOUNDARY } from '../run-review-ref-projection.js';
import { buildDomainActionAdapterOwnerBoundary } from './owner-boundary.js';
import { buildTemporalAutonomyReadinessProjection } from './temporal-autonomy-readiness.js';
import { buildVisualTransitionEvaluatorProjection } from './visual-transition-evaluator.js';

export const DOMAIN_ACTION_ADAPTER_ID = 'redcube_domain_action_adapter_adapter.v1';
export const DOMAIN_ID = 'redcube_ai';
const OPL_RUNTIME_OWNER = 'configured_family_runtime_provider';
const OPL_PROVIDER_TRANSPORT = 'opl_family_runtime_provider';

function buildRouteStageHandoffBoundary(manifest) {
  return {
    surface_kind: 'rca_route_stage_handoff_boundary',
    version: 'rca-route-stage-handoff-boundary.v1',
    domain_id: DOMAIN_ID,
    route_is_stage: false,
    route_semantics_owner: DOMAIN_ID,
    domain_truth_owner: DOMAIN_ID,
    stage_graph_owner: 'one-person-lab',
    stage_lifecycle_owner: 'one-person-lab',
    runtime_transition_owner: 'one-person-lab',
    queue_attempt_owner: 'one-person-lab',
    opl_hydrates_route_refs_to_queue_and_stage_attempts: true,
    rca_owns_inter_route_scheduler: false,
    stage_graph_ref: '/family_stage_control_plane',
    route_stage_projection_ref: '/stage_control_projection/route_stage_projection',
    visual_transition_spec_ref: '/visual_transition_spec',
    visual_stage_descriptor_scope: (
      manifest.family_scheduler_replacement?.visual_stage_descriptor_scope
      || 'opl_stage_execution_plan_route_handler_refs_only'
    ),
    route_semantics: (
      'RCA routes express visual-deliverable next-step and route-back semantics; '
      + 'OPL transports them as refs into stage attempts.'
    ),
    allowed_handoff_refs: [
      'deliverable_id',
      'route_id',
      'family_id',
      'stage_id',
      'route_stage_refs',
      'visual_transition_spec_ref',
      'review_export_receipt_ref',
      'artifact_authority_receipt_ref',
      'typed_blocker_refs',
      'human_gate_schema_ref',
      'no_forbidden_write_ref',
    ],
    forbidden_payload_classes: [
      'visual_truth_body',
      'artifact_body',
      'visual_memory_body',
      'review_verdict_body',
      'export_verdict_body',
      'generic_runtime_state',
      'generic_attempt_ledger_record',
      'generic_runner_decision',
      'runtime_queue_state',
    ],
    authority_boundary: {
      rca_owner_receipt_required: true,
      opl_can_write_visual_truth: false,
      opl_can_store_artifact_blob: false,
      opl_can_write_visual_memory_body: false,
      opl_can_declare_visual_ready: false,
      opl_can_declare_exportable: false,
      opl_can_declare_handoffable: false,
      rca_implements_generic_route_scheduler: false,
      rca_implements_generic_stage_attempt_graph: false,
    },
    forbidden_claims: [
      'route_is_stage',
      'rca_owned_generic_route_scheduler',
      'rca_owned_generic_stage_attempt_graph',
      'opl_provider_completion_is_visual_ready',
      'opl_stage_attempt_completion_is_exportable',
      'opl_stage_attempt_completion_is_handoffable',
    ],
  };
}

export function buildDomainActionAdapterProjection({ workspaceRoot, manifest }) {
  const sessionSurface = manifest.product_entry_shell?.session || {};
  const familySchedulerReplacement = manifest.family_scheduler_replacement || buildFamilySchedulerReplacementProjection();
  const oplGenericPrimitiveConsumption = (
    manifest.opl_generic_primitive_consumption
    || buildOplGenericPrimitiveConsumptionProjection()
  );
  const oplStabilityReadModelConsumption = (
    manifest.opl_stability_read_model_consumption
    || buildOplStabilityReadModelConsumptionProjection()
  );
  const privatizedFunctionalModuleAudit = (
    manifest.privatized_functional_module_audit
    || buildPrivatizedFunctionalModuleAuditProjection({
      familySchedulerReplacement,
      oplGenericPrimitiveConsumption,
      oplStabilityReadModelConsumption,
    })
  );
  const oplSubstrateAdapterExport = (
    manifest.opl_substrate_adapter_export
    || buildOplSubstrateAdapterExportProjection()
  );
  const visualPackCompilerHandoff = (
    manifest.visual_pack_compiler_handoff
    || buildVisualPackCompilerHandoffProjection()
  );
  const visualTransitionEvaluator = (
    manifest.visual_transition_evaluator
    || buildVisualTransitionEvaluatorProjection({
      visualTransitionSpec: manifest.visual_transition_spec,
    })
  );
  const routeStageHandoffBoundary = (
    manifest.route_stage_handoff_boundary || buildRouteStageHandoffBoundary(manifest)
  );
  const rcaEfficiencyHandoffProjection = (
    manifest.rca_efficiency_handoff_projection
    || manifest.operator_evidence_readiness_projection?.rca_efficiency_handoff_projection
    || {}
  );
  const goalWorkflowAgentLabSuite = (
    manifest.goal_workflow_agent_lab_suite
    || manifest.operator_evidence_readiness_projection?.goal_workflow_agent_lab_suite
    || {}
  );
  const pptThreeRouteAgentLabSuite = (
    manifest.ppt_three_route_agent_lab_suite
    || manifest.operator_evidence_readiness_projection?.ppt_three_route_agent_lab_suite
    || {}
  );
  const productionEvidenceTailWorkOrder = (
    manifest.operator_evidence_readiness_projection?.production_evidence_tail_workorder || {}
  );
  const temporalAutonomyReadiness = (
    manifest.temporal_autonomy_readiness
    || buildTemporalAutonomyReadinessProjection({
      familySchedulerReplacement,
      oplGenericPrimitiveConsumption,
      oplStabilityReadModelConsumption,
      standardDomainAgentSkeleton: manifest.standard_domain_agent_skeleton,
      runtimeInventory: manifest.runtime_inventory,
      taskLifecycle: manifest.task_lifecycle,
      domainActionAdapterGuardedActionIds: listDomainActionAdapterGuardedActions().map((entry) => entry.action),
    })
  );
  return {
    ok: true,
    surface_kind: 'domain_action_adapter_export',
    adapter_id: DOMAIN_ACTION_ADAPTER_ID,
    version: 'v1',
    domain_id: DOMAIN_ID,
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    runtime_framework: {
      runtime_owner: OPL_RUNTIME_OWNER,
      provider_transport_owner: OPL_PROVIDER_TRANSPORT,
      managed_by: 'opl_runtime_manager',
      queue_owner: 'opl',
      online_wakeup_owner: OPL_PROVIDER_TRANSPORT,
      family_scheduler_replacement: familySchedulerReplacement,
      default_executor_policy: {
        selected_by: 'codex_or_domain_selected_executor',
        domain_default_executor_owner: manifest.opl_provider_runtime_contract?.executor_owner || 'codex_cli',
        executor_truth_owner: DOMAIN_ID,
      },
      rca_thin_surface_policy: {
        projection_scope: familySchedulerReplacement.projection_scope || 'consumer_projection_and_visual_domain_authority_refs_only',
        visual_stage_descriptor_scope: familySchedulerReplacement.visual_stage_descriptor_scope,
        generic_surfaces_owner: 'opl',
        opl_generic_primitive_consumption: oplGenericPrimitiveConsumption,
        opl_stability_read_model_consumption: oplStabilityReadModelConsumption,
        privatized_functional_module_audit: privatizedFunctionalModuleAudit,
        opl_substrate_adapter_export: oplSubstrateAdapterExport,
        visual_pack_compiler_handoff: visualPackCompilerHandoff,
        route_stage_handoff_boundary: routeStageHandoffBoundary,
        rca_is_functional_harness_owner: false,
        rca_is_generic_runtime_owner: false,
        rca_is_generic_scheduler_owner: false,
        rca_is_generic_daemon_owner: false,
        rca_is_generic_lifecycle_owner: false,
        rca_is_generic_queue_owner: false,
        rca_is_stage_attempt_orchestrator_owner: false,
        rca_is_generic_attempt_ledger_owner: false,
        rca_is_typed_closeout_transport_owner: false,
        rca_is_generic_runner_owner: false,
        rca_is_generic_transition_runner_owner: false,
        rca_is_generic_workbench_owner: false,
        rca_is_memory_transport_owner: false,
        rca_is_memory_refs_only_writeback_chain_owner: false,
        rca_is_artifact_lifecycle_owner: false,
        rca_is_review_repair_transport_owner: false,
        rca_is_restart_dead_letter_repair_human_gate_state_chain_owner: false,
        rca_is_native_helper_generic_envelope_owner: false,
      },
    },
    owner_boundary: buildDomainActionAdapterOwnerBoundary(),
    mapped_surfaces: {
      product_entry_session: {
        command: sessionSurface.command || 'opl_generated:product_session',
        command_template: sessionSurface.command_template || 'opl_generated:product_session --entry-session-id <entry-session-id>',
        ref: '/opl_generated_public_wrappers/wrappers/session',
        owner: 'one-person-lab',
        generic_session_shell_owner: 'opl',
        domain_snapshot_owner: DOMAIN_ID,
        rca_role: 'entry_session_domain_snapshot_refs_only_adapter',
        repo_local_default_wrapper_retired: true,
        repo_local_command_available: false,
        refs_only: true,
        implements_generic_workbench: false,
      },
      runtime_watch: {
        command: 'opl_generated:runtime_watch',
        api_surface: 'runtimeWatch',
        owner: 'one-person-lab',
        rca_direct_read_model_owner: DOMAIN_ID,
        repo_local_default_wrapper_retired: true,
        repo_local_command_available: false,
        read_only: true,
        projection_mode: 'runtime_watch_refs_only',
        owner_boundary: RUNTIME_WATCH_BOUNDARY,
        refs_only: true,
        domain_action_adapter_dispatch_allowed: false,
        dispatch_owner: 'one-person-lab',
        dispatch_surface: 'opl_status_workbench_runtime_read_model',
        retired_domain_action_adapter_dispatch_ref: 'retired_domain_action_adapter.runtime_watch_dispatch_tombstone',
        retained_rca_surface: 'runtimeWatch direct review/progress read model',
        generic_supervisor_owner: 'opl',
        generic_status_workbench_owner: 'opl',
        generic_session_shell_owner: 'opl',
        compatibility_alias_allowed: false,
        no_resurrection_gate: RUNTIME_WATCH_BOUNDARY.no_resurrection_gate,
        declares_visual_ready: false,
        declares_exportable: false,
        declares_handoffable: false,
        declares_production_soak_complete: false,
      },
      review_projection: {
        review_state_ref: '/review_state',
        publication_projection_ref: '/publication_projection',
        operator_handoff_ref: '/operator_handoff',
        owner: DOMAIN_ID,
        writable_by_domain_action_adapter: false,
        transport_owner: 'opl',
        rca_retained_authority: [
          'review_export_verdict',
          'repair_decision',
          'visual_quality_facts',
        ],
      },
      operator_handoff: {
        source_refs: [
          '/product_entry_session',
          '/runtime_loop_closure',
          '/review_state',
          '/publication_projection',
        ],
        owner: DOMAIN_ID,
        writable_by_domain_action_adapter: false,
      },
      standard_domain_agent_skeleton: {
        ref: '/standard_domain_agent_skeleton',
        owner: DOMAIN_ID,
        mapping_model: manifest.standard_domain_agent_skeleton?.mapping_model || 'manifest_descriptor_mapping_only',
        repo_source_layout_audit_ref: '/standard_domain_agent_skeleton/repo_source_boundary/audit_surface',
        repo_source_layout_audit_status: manifest.standard_domain_agent_skeleton?.repo_source_boundary?.audit_surface?.status || 'unknown',
      },
      artifact_locator_contract: {
        ref: '/artifact_locator_contract',
        owner: DOMAIN_ID,
        locator_model: manifest.artifact_locator_contract?.locator_model || 'opl_stage_folder_contract_refs_only',
        writable_by_domain_action_adapter: false,
        lifecycle_transport_owner: 'opl',
        rca_retained_authority: ['artifact_authority'],
      },
      receipt_refs: {
        ref: '/domain_action_adapter_receipt_refs',
        owner: DOMAIN_ID,
        writable_by_domain_action_adapter: false,
        forbidden_receipt_fields: manifest.domain_action_adapter_receipt_refs?.forbidden_receipt_fields || [],
      },
      workspace_receipt_inventory_projection: {
        ref: '/workspace_receipt_inventory_projection',
        owner: DOMAIN_ID,
        consumer: 'opl_app_operator',
        status: manifest.workspace_receipt_inventory_projection?.status || 'unknown',
        projection_id: manifest.workspace_receipt_inventory_projection?.projection_id || 'rca.workspace_receipt_inventory.v1',
        receipt_root_model: manifest.workspace_receipt_inventory_projection?.receipt_root_model || '<workspace-root>/.redcube/runtime/receipts/',
        receipt_counts: manifest.workspace_receipt_inventory_projection?.receipt_counts || {},
        gap_projection: manifest.workspace_receipt_inventory_projection?.gap_projection || {},
        scaleout_projection: manifest.workspace_receipt_inventory_projection?.scaleout_projection || {},
        selected_artifact_producing_visual_route: (
          manifest.workspace_receipt_inventory_projection?.selected_artifact_producing_visual_route || {}
        ),
        actual_workspace_receipt_refs: (
          manifest.workspace_receipt_inventory_projection?.actual_workspace_receipt_refs || {}
        ),
        writable_by_domain_action_adapter: false,
        read_only: true,
        refs_only: true,
        implements_opl_artifact_gallery: false,
        implements_opl_workbench: false,
        opl_can_write_receipt_instance: false,
        opl_can_write_visual_truth: false,
        opl_can_store_artifact_blob: false,
        opl_can_claim_production_soak_complete: false,
      },
      visual_pattern_memory_writeback: {
        descriptor_ref: '/domain_memory_descriptor_locator',
        proposal_generator_ref: '/domain_memory_descriptor_locator/writeback_proposal_generator',
        accept_reject_command_ref: '/domain_memory_descriptor_locator/accept_reject_command',
        writeback_receipt_locator_ref: '/domain_memory_descriptor_locator/writeback_receipt_locator',
        operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
        runtime_receipt_instances_ref: '/controlled_memory_apply_proof/runtime_receipt_instances',
        owner: DOMAIN_ID,
        transport_owner: 'opl',
        writable_by_domain_action_adapter: false,
        controlled_apply_proof_ref: '/controlled_memory_apply_proof',
        opl_can_generate_memory_content: false,
        opl_can_accept_or_reject: false,
        opl_can_write_receipt_instance: false,
        opl_can_write_visual_truth: false,
        opl_can_write_artifact_blob: false,
        rca_retained_authority: ['visual_memory_body'],
      },
      native_helper_implementation: {
        ref: '/native_ppt_operator_ux',
        owner: DOMAIN_ID,
        generic_envelope_owner: 'opl',
        helper_catalog_ref: 'contracts/runtime-program/python-native-helper-catalog.json',
        implementation_owner: DOMAIN_ID,
        package_module_only: true,
        writable_by_domain_action_adapter: false,
      },
      controlled_visual_stage_attempt: {
        ref: '/controlled_visual_stage_attempt',
        owner: DOMAIN_ID,
        controlled_memory_apply_proof_ref: '/controlled_memory_apply_proof',
        apply_proof_state: manifest.controlled_visual_stage_attempt?.apply_proof_state || null,
        opl_consumes_descriptor_refs: true,
        opl_consumes_quality_refs: true,
        opl_holds_visual_or_export_verdict: false,
        direct_and_opl_share_descriptor_refs: true,
        direct_and_opl_share_domain_action_adapter_refs: true,
        direct_and_opl_share_quality_refs: true,
      },
      controlled_soak_no_regression_attempt: {
        ref: '/controlled_soak_no_regression_attempt',
        owner: DOMAIN_ID,
        state: manifest.controlled_soak_no_regression_attempt?.state || 'deferred_typed_blocker',
        source_contract: (
          manifest.controlled_soak_no_regression_attempt
            ?.deferred_blocker
            ?.source_contract || 'rca.temporal_controlled_visual_stage_long_soak.v1'
        ),
        required_return_shapes: manifest.controlled_soak_no_regression_attempt
          ?.deferred_blocker
          ?.required_return_shapes || [
            'domain_owner_receipt_ref',
            'typed_blocker',
            'no_regression_evidence_ref',
        ],
        evidence_action: 'emit_no_regression_evidence',
        long_soak_evidence_action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
        evidence_surface_kind: 'no_regression_evidence',
        long_soak_evidence_surface_kind: 'temporal_controlled_visual_stage_long_soak_evidence',
        writable_by_domain_action_adapter: true,
        production_visual_stage_long_soak_complete_claimed: false,
      },
      temporal_autonomy_readiness: {
        ref: '/temporal_autonomy_readiness',
        owner: DOMAIN_ID,
        provider_owner: temporalAutonomyReadiness.provider_owner,
        provider_kind_required_for_production: temporalAutonomyReadiness.provider_kind_required_for_production,
        status: temporalAutonomyReadiness.status,
        can_be_opl_temporal_hosted: temporalAutonomyReadiness.can_be_opl_temporal_hosted,
        default_opl_temporal_hosted_autonomy_enabled: temporalAutonomyReadiness.default_opl_temporal_hosted_autonomy_enabled,
        task_start_handoff_is_persistent_opl_temporal_scheduling: temporalAutonomyReadiness.task_start_handoff_is_persistent_opl_temporal_scheduling,
        codex_app_outer_loop_required_after_task_start: temporalAutonomyReadiness.codex_app_outer_loop_required_after_task_start,
        long_time_autonomy_claimed: temporalAutonomyReadiness.long_time_autonomy_claimed,
        production_visual_stage_long_soak_complete: temporalAutonomyReadiness.production_visual_stage_long_soak_complete,
        capability_gates: temporalAutonomyReadiness.capability_gates,
        typed_blockers: temporalAutonomyReadiness.typed_blockers,
        authority_boundary: temporalAutonomyReadiness.authority_boundary,
        writable_by_domain_action_adapter: false,
        refs_only: true,
      },
      owner_receipt_contract: {
        ref: '/domain_owner_receipt_contract',
        owner: DOMAIN_ID,
        allowed_return_shapes: manifest.domain_owner_receipt_contract?.allowed_return_shapes || [],
        writable_by_domain_action_adapter: true,
        guarded_action: 'emit_domain_owner_receipt',
        receipt_root_model: '<workspace-root>/.redcube/runtime/receipts/domain-owner/<receipt-id>.json',
      },
      external_work_order_owner_closeout: {
        ref: '/domain_owner_receipt_contract/external_work_order_owner_closeout',
        owner: DOMAIN_ID,
        action: 'emit_external_work_order_owner_closeout',
        allowed_return_shapes: (
          manifest.domain_owner_receipt_contract
            ?.external_work_order_owner_closeout
            ?.allowed_return_shapes || ['no_regression_evidence', 'typed_blocker']
        ),
        refs_only: true,
        writable_by_domain_action_adapter: true,
        guarded_action: 'emit_external_work_order_owner_closeout',
        runtime_locator_model: 'workspace-runtime-ref:external-work-order-owner-closeout:<work-order-id>',
        writes_visual_truth: false,
        writes_artifact_body: false,
        writes_memory_body: false,
        writes_review_export_verdict: false,
        authorizes_quality_or_export: false,
      },
      no_regression_owner_receipt_opl_consumption_proof: {
        ref: '/no_regression_owner_receipt_opl_consumption_proof',
        owner: DOMAIN_ID,
        status: manifest.no_regression_owner_receipt_opl_consumption_proof?.status || 'unknown',
        proof_model: manifest.no_regression_owner_receipt_opl_consumption_proof?.proof_model || null,
        guarded_actions: manifest.no_regression_owner_receipt_opl_consumption_proof?.guarded_actions || [],
        opl_consumption_policy: manifest.no_regression_owner_receipt_opl_consumption_proof?.opl_consumption_policy || {},
        writable_by_domain_action_adapter: true,
      },
      production_evidence_scaleout_refs: manifest.operator_evidence_readiness_projection?.production_evidence_scaleout_refs || {},
      opl_expected_receipt_monitor_freshness_handoff: (
        manifest.operator_evidence_readiness_projection?.opl_expected_receipt_monitor_freshness_handoff || {}
      ),
      production_evidence_tail_workorder: productionEvidenceTailWorkOrder,
      rca_efficiency_handoff_projection: rcaEfficiencyHandoffProjection,
      goal_workflow_agent_lab_suite: goalWorkflowAgentLabSuite,
      ppt_three_route_agent_lab_suite: pptThreeRouteAgentLabSuite,
      lifecycle_guarded_apply: {
        ref: '/lifecycle_guarded_apply_proof',
        owner: DOMAIN_ID,
        operations: (manifest.lifecycle_guarded_apply_proof?.operations || []).map((operation) => operation.operation),
        opl_can_apply_domain_artifact_mutation: false,
        domain_receipt_required: true,
        writable_by_domain_action_adapter: false,
        guarded_action: 'apply_visual_workspace_lifecycle',
        receipt_root_model: '<workspace-root>/.redcube/runtime/receipts/lifecycle/<operation>/<receipt-id>.json',
      },
      visual_transition_spec: {
        ref: '/visual_transition_spec',
        owner: DOMAIN_ID,
        spec_id: manifest.visual_transition_spec?.spec_id || 'rca.visual_transition_spec.v1',
        status: manifest.visual_transition_spec?.status || 'contract_landed_thin_evaluator_landed_runner_owned_by_opl',
        transition_count: manifest.visual_transition_spec?.transition_table?.length || 0,
        oracle_fixture_id: manifest.visual_transition_spec?.oracle_fixture?.fixture_id || null,
        evaluator_ref: '/visual_transition_evaluator',
        family_transition_spec_descriptor_ref: '/visual_transition_spec/family_transition_spec_descriptor',
        opl_can_execute_transition_spec: true,
        opl_can_declare_visual_ready: false,
        opl_can_declare_exportable: false,
        writable_by_domain_action_adapter: false,
      },
      visual_transition_evaluator: visualTransitionEvaluator,
      visual_pack_compiler_handoff: visualPackCompilerHandoff,
      route_stage_handoff_boundary: routeStageHandoffBoundary,
      family_scheduler_replacement: familySchedulerReplacement,
      opl_generic_primitive_consumption: oplGenericPrimitiveConsumption,
      opl_stability_read_model_consumption: oplStabilityReadModelConsumption,
      privatized_functional_module_audit: privatizedFunctionalModuleAudit,
      opl_substrate_adapter_export: oplSubstrateAdapterExport,
    },
    guarded_actions: listDomainActionAdapterGuardedActions(),
    blocked_actions: listDomainActionAdapterBlockedActions(),
    source_manifest_refs: {
      manifest_kind: manifest.manifest_kind,
      manifest_version: manifest.manifest_version,
      product_entry_manifest_ref: '/product_entry_manifest',
      opl_family_lifecycle_adapter_ref: '/opl_family_lifecycle_adapter',
      family_action_catalog_ref: '/family_action_catalog',
      standard_domain_agent_skeleton_ref: '/standard_domain_agent_skeleton',
      artifact_locator_contract_ref: '/artifact_locator_contract',
      domain_memory_descriptor_locator_ref: '/domain_memory_descriptor_locator',
      domain_action_adapter_receipt_refs_ref: '/domain_action_adapter_receipt_refs',
      workspace_receipt_inventory_projection_ref: '/workspace_receipt_inventory_projection',
      controlled_visual_stage_attempt_ref: '/controlled_visual_stage_attempt',
      controlled_memory_apply_proof_ref: '/controlled_memory_apply_proof',
      controlled_soak_no_regression_attempt_ref: '/controlled_soak_no_regression_attempt',
      domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      external_work_order_owner_closeout_ref: '/domain_owner_receipt_contract/external_work_order_owner_closeout',
      no_regression_owner_receipt_opl_consumption_proof_ref: '/no_regression_owner_receipt_opl_consumption_proof',
      lifecycle_guarded_apply_proof_ref: '/lifecycle_guarded_apply_proof',
      visual_transition_spec_ref: '/visual_transition_spec',
      visual_transition_evaluator_ref: '/visual_transition_evaluator',
      visual_pack_compiler_handoff_ref: '/visual_pack_compiler_handoff',
      route_stage_handoff_boundary_ref: '/route_stage_handoff_boundary',
      family_scheduler_replacement_ref: '/family_scheduler_replacement',
      opl_generic_primitive_consumption_ref: '/opl_generic_primitive_consumption',
      opl_stability_read_model_consumption_ref: '/opl_stability_read_model_consumption',
      production_evidence_scaleout_refs_ref: '/operator_evidence_readiness_projection/production_evidence_scaleout_refs',
      opl_expected_receipt_monitor_freshness_handoff_ref: '/operator_evidence_readiness_projection/opl_expected_receipt_monitor_freshness_handoff',
      production_evidence_tail_workorder_ref: '/operator_evidence_readiness_projection/production_evidence_tail_workorder',
      rca_efficiency_handoff_projection_ref: '/rca_efficiency_handoff_projection',
      goal_workflow_agent_lab_suite_ref: '/goal_workflow_agent_lab_suite',
      ppt_three_route_agent_lab_suite_ref: '/ppt_three_route_agent_lab_suite',
      temporal_autonomy_readiness_ref: '/temporal_autonomy_readiness',
      privatized_functional_module_audit_ref: '/privatized_functional_module_audit',
      opl_substrate_adapter_export_ref: '/opl_substrate_adapter_export',
    },
    runtime_residue_retirement: manifest.runtime_residue_retirement,
    summary: {
      runtime_owner: OPL_RUNTIME_OWNER,
      provider_transport_owner: OPL_PROVIDER_TRANSPORT,
      control_plane_owner: 'opl',
      generic_session_shell_owner: 'opl',
      generic_workbench_owner: 'opl',
      default_supervision_owner: 'opl',
      domain_truth_owner: DOMAIN_ID,
      guarded_action_count: domainActionAdapterGuardedActionSet().size,
    },
  };
}
