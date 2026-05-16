// @ts-nocheck

export function buildReturnedManifestProjection({
  actionMetadata,
  domainMemoryDescriptor,
  entryStatusSurface,
  familySchedulerReplacement,
  familyStageControlPlane,
  manifest,
  nativePptOperatorUx,
  oplGenericPrimitiveConsumption,
  oplStabilityReadModelConsumption,
  oplFamilyLifecycleAdapter,
  operatorLoopActions,
  productEntryShell,
  pptRoutePolicy,
  runtimeResidueRetirement,
  standardDomainAgentSkeleton,
  visualPatternMemoryWriteback,
}) {
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
    controlled_soak_no_regression_attempt: standardDomainAgentSkeleton.controlled_soak_no_regression_attempt,
    domain_owner_receipt_contract: standardDomainAgentSkeleton.domain_owner_receipt_contract,
    no_regression_owner_receipt_opl_consumption_proof: standardDomainAgentSkeleton.no_regression_owner_receipt_opl_consumption_proof,
    lifecycle_guarded_apply_proof: standardDomainAgentSkeleton.lifecycle_guarded_apply_proof,
    visual_transition_spec: standardDomainAgentSkeleton.visual_transition_spec,
    family_scheduler_replacement: familySchedulerReplacement,
    opl_generic_primitive_consumption: oplGenericPrimitiveConsumption || manifest.opl_generic_primitive_consumption,
    opl_stability_read_model_consumption: (
      oplStabilityReadModelConsumption
      || manifest.opl_stability_read_model_consumption
    ),
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
    },
  };
}
