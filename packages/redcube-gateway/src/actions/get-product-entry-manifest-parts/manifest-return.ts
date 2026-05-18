// @ts-nocheck

export function buildOperatorEvidenceReadinessProjection({
  oplGenericPrimitiveConsumption,
  oplGeneratedInterfaceConsumption,
  oplStabilityReadModelConsumption,
  standardDomainAgentSkeleton,
  visualTransitionEvaluator,
  workspaceReceiptInventoryProjection,
}) {
  const receiptInventoryGapProjection = workspaceReceiptInventoryProjection?.gap_projection || {};
  const completedFunctionalStructureGapIds = [
    'opl_generated_surface_production_consumption',
    'repo_local_wrapper_active_caller_migration',
    'focused_hosted_attempt_real_path_cutover',
    'artifact_gallery_handoff_shell',
    'review_repair_transport',
    'opl_app_operator_drilldown',
    'workspace_source_lifecycle_receipt_shell',
  ];
  const remainingFunctionalStructureGapIds = [
    'production_live_soak_and_evidence',
    'legacy_physical_cleanup',
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
      functional_structure_gap_status: 'classification_closed_followthrough_gaps_open',
      functional_structure_gap_count: remainingFunctionalStructureGapIds.length,
      completed_functional_structure_gap_count: completedFunctionalStructureGapIds.length,
      completed_functional_structure_gap_ids: completedFunctionalStructureGapIds,
      remaining_gap_class: 'live_soak_evidence_and_physical_cleanup',
      remaining_functional_structure_gap_ids: remainingFunctionalStructureGapIds,
      remaining_evidence_gate_ids: [
        'real_artifact_producing_domain_owner_receipt',
        'opl_hosted_controlled_visual_stage_long_soak',
        'real_memory_lifecycle_receipt_instances',
        'cross_family_repeated_no_regression_evidence',
      ],
    },
    read_only: true,
    refs_only: true,
    writes_visual_truth: false,
    writes_artifact_blob: false,
    writes_memory_body: false,
    declares_production_soak_complete: false,
    declares_artifact_producing_owner_receipt: false,
    implements_opl_generic_runtime: false,
    implements_opl_workbench: false,
    implements_opl_observability: false,
    next_evidence_gaps: [
      {
        gap_id: 'real_artifact_producing_domain_owner_receipt',
        owner: 'redcube_ai',
        status: 'pending_runtime_evidence',
        required_evidence: 'A real RCA visual-stage attempt returns a domain owner receipt with artifact refs, review/export refs, memory/lifecycle receipt refs, and forbidden-write proof refs.',
        current_best_ref: '/domain_owner_receipt_contract',
      },
      {
        gap_id: 'opl_hosted_controlled_visual_stage_long_soak',
        owner: 'opl_provider_then_redcube_ai_receipt',
        status: 'pending_production_soak',
        required_evidence: 'A real OPL-hosted controlled visual-stage run repeatedly consumes RCA sidecar refs and receives RCA domain receipt, typed blocker, or no-regression evidence refs without writing RCA visual truth.',
        current_best_ref: '/controlled_soak_no_regression_attempt',
      },
      {
        gap_id: 'real_memory_lifecycle_receipt_instances',
        owner: 'redcube_ai',
        status: receiptInventoryGapProjection.status || 'pending_runtime_receipt_instances',
        required_evidence: 'Accepted/rejected memory writeback and cleanup/restore/retention lifecycle receipts exist in workspace runtime roots and remain refs-only for OPL.',
        current_best_ref: receiptInventoryGapProjection.current_best_ref || '/controlled_memory_apply_proof/runtime_receipt_instances',
        missing_receipt_kinds: receiptInventoryGapProjection.missing_receipt_kinds || [],
      },
      {
        gap_id: 'cross_family_repeated_no_regression_evidence',
        owner: 'redcube_ai',
        status: 'pending_repeated_runtime_evidence',
        required_evidence: 'Repeated no-regression evidence refs across at least two deliverable families without artifact blobs, memory bodies, or review/export verdict payloads in OPL state.',
        current_best_ref: '/no_regression_owner_receipt_opl_consumption_proof',
      },
    ],
    authority_boundary: {
      opl_app_can_show_next_gaps: true,
      opl_app_can_store_projection_refs: true,
      opl_app_can_write_rca_visual_truth: false,
      opl_app_can_store_artifact_blob: false,
      opl_app_can_declare_visual_ready: false,
      opl_app_can_declare_exportable: false,
      opl_app_can_claim_production_soak_complete: false,
    },
  };
}

export function buildReturnedManifestProjection({
  actionMetadata,
  domainMemoryDescriptor,
  entryStatusSurface,
  familySchedulerReplacement,
  familyStageControlPlane,
  manifest,
  nativePptOperatorUx,
  oplGenericPrimitiveConsumption,
  oplGeneratedInterfaceConsumption,
  oplStabilityReadModelConsumption,
  visualPackCompilerHandoff,
  privatizedFunctionalModuleAudit,
  oplSubstrateAdapterExport,
  oplFamilyLifecycleAdapter,
  operatorLoopActions,
  productEntryShell,
  pptRoutePolicy,
  runtimeResidueRetirement,
  standardDomainAgentSkeleton,
  visualTransitionEvaluator,
  visualPatternMemoryWriteback,
  workspaceReceiptInventoryProjection,
}) {
  const operatorEvidenceReadinessProjection = buildOperatorEvidenceReadinessProjection({
    oplGenericPrimitiveConsumption,
    oplGeneratedInterfaceConsumption,
    oplStabilityReadModelConsumption,
    standardDomainAgentSkeleton,
    visualTransitionEvaluator,
    workspaceReceiptInventoryProjection,
  });
  return {
    ...manifest,
    entry_status_surface: entryStatusSurface,
    status_surface: entryStatusSurface,
    product_entry_overview: {
      ...manifest.product_entry_overview,
      entry_status_command: productEntryShell.status.command,
    },
    native_ppt_operator_ux: nativePptOperatorUx,
    opl_family_lifecycle_adapter: oplFamilyLifecycleAdapter,
    ppt_deck_visual_route_truth: {
      surface_kind: 'ppt_deck_visual_route_truth',
      default_visual_route: pptRoutePolicy.default_visual_route,
      default_visual_policy: pptRoutePolicy.default_visual_policy,
      protected_stage_sequence: pptRoutePolicy.protected_stage_sequence,
      route_selection_policy: pptRoutePolicy.route_selection_policy,
      image_provider_diagnostics: nativePptOperatorUx.image_provider_diagnostics,
      image_first_proof_readiness: nativePptOperatorUx.image_first_proof_readiness,
      style_reference_summary: nativePptOperatorUx.style_reference_summary,
      cache_status: nativePptOperatorUx.cache_status,
      artifact_inventory: nativePptOperatorUx.artifact_inventory,
    },
    product_entry_shell: {
      ...manifest.product_entry_shell,
      sidecar: productEntryShell.sidecar,
      native_ppt_proof: productEntryShell.native_ppt_proof,
      image_ppt_proof: productEntryShell.image_ppt_proof,
    },
    operator_loop_actions: {
      ...manifest.operator_loop_actions,
      export_product_sidecar: {
        command: 'redcube product sidecar export',
        surface_kind: 'product_sidecar_export',
        summary: 'Export the RCA product sidecar adapter for OPL family runtime provider control-plane indexing.',
        requires: ['workspace_root'],
      },
      dispatch_product_sidecar: {
        command: 'redcube product sidecar dispatch',
        surface_kind: 'product_sidecar_dispatch',
        summary: 'Dispatch RCA-owned guarded sidecar actions only.',
        requires: ['task'],
      },
      run_native_ppt_proof: operatorLoopActions.run_native_ppt_proof,
      run_image_ppt_proof: operatorLoopActions.run_image_ppt_proof,
    },
    skill_catalog: {
      ...manifest.skill_catalog,
      supported_commands: actionMetadata.skill_commands.map((contract) => contract.command),
      command_contracts: actionMetadata.skill_commands.map((contract) => {
        const result = {
          action_id: contract.action_id,
          command_contract_id: contract.command_contract_id,
          command: contract.command,
          shell_key: contract.shell_key,
          target_surface_kind: contract.surface_kind,
          required_fields: contract.required_fields,
          effect: contract.effect,
          summary: contract.summary,
        };
        if (contract.public_skill_policy) {
          result.public_skill_policy = contract.public_skill_policy;
        }
        return result;
      }),
    },
    family_action_catalog: actionMetadata.family_action_catalog,
    family_action_catalog_parity: actionMetadata.parity,
    family_stage_control_plane: familyStageControlPlane,
    standard_domain_agent_skeleton: standardDomainAgentSkeleton,
    artifact_locator_contract: standardDomainAgentSkeleton.artifact_locator_contract,
    domain_memory_descriptor: domainMemoryDescriptor,
    domain_memory_descriptor_locator: standardDomainAgentSkeleton.domain_memory_descriptor_locator,
    visual_pattern_memory_writeback: visualPatternMemoryWriteback,
    product_sidecar_receipt_refs: standardDomainAgentSkeleton.product_sidecar_receipt_refs,
    controlled_visual_stage_attempt: standardDomainAgentSkeleton.controlled_visual_stage_attempt,
    controlled_memory_apply_proof: standardDomainAgentSkeleton.controlled_memory_apply_proof,
    workspace_receipt_inventory_projection: workspaceReceiptInventoryProjection,
    controlled_soak_no_regression_attempt: standardDomainAgentSkeleton.controlled_soak_no_regression_attempt,
    domain_owner_receipt_contract: standardDomainAgentSkeleton.domain_owner_receipt_contract,
    no_regression_owner_receipt_opl_consumption_proof: standardDomainAgentSkeleton.no_regression_owner_receipt_opl_consumption_proof,
    lifecycle_guarded_apply_proof: standardDomainAgentSkeleton.lifecycle_guarded_apply_proof,
    visual_transition_spec: standardDomainAgentSkeleton.visual_transition_spec,
    visual_transition_evaluator: visualTransitionEvaluator,
    visual_pack_compiler_handoff: (
      visualPackCompilerHandoff
      || manifest.visual_pack_compiler_handoff
    ),
    family_scheduler_replacement: familySchedulerReplacement,
    opl_generic_primitive_consumption: oplGenericPrimitiveConsumption || manifest.opl_generic_primitive_consumption,
    opl_generated_interface_consumption: (
      oplGeneratedInterfaceConsumption
      || manifest.opl_generated_interface_consumption
      || manifest.privatized_functional_module_audit?.opl_generated_interface_consumption
    ),
    opl_stability_read_model_consumption: (
      oplStabilityReadModelConsumption
      || manifest.opl_stability_read_model_consumption
    ),
    privatized_functional_module_audit: (
      privatizedFunctionalModuleAudit
      || manifest.privatized_functional_module_audit
    ),
    opl_substrate_adapter_export: (
      oplSubstrateAdapterExport
      || manifest.opl_substrate_adapter_export
    ),
    operator_evidence_readiness_projection: operatorEvidenceReadinessProjection,
    physical_skeleton_follow_through: standardDomainAgentSkeleton.physical_skeleton_follow_through,
    review_helper_baseline_follow_through: standardDomainAgentSkeleton.review_helper_baseline_follow_through,
    runtime_residue_retirement: runtimeResidueRetirement,
    action_metadata: {
      surface_kind: 'redcube_action_metadata_projection',
      product_entry: actionMetadata.product_entry,
      cli_commands: actionMetadata.cli_commands,
      mcp_tools: actionMetadata.mcp_tools,
      mcp_actions: actionMetadata.mcp_actions,
      skill_commands: actionMetadata.skill_commands,
      generated_interface_owner: actionMetadata.generated_interface_owner,
      domain_handler_owner: actionMetadata.domain_handler_owner,
      owner_model: actionMetadata.owner_model,
      repo_local_handler_targets: actionMetadata.repo_local_handler_targets,
    },
  };
}
