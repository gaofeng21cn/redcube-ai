// @ts-nocheck

import { buildOperatorEvidenceReadinessProjection } from './operator-evidence-readiness.js';
import { buildActionMetadataProjection, buildSkillCommandContracts } from './utils.js';

export function buildReturnedManifestProjection({
  actionMetadata,
  domainMemoryDescriptor,
  entryStatusSurface,
  familySchedulerReplacement,
  familyStageControlPlane,
  manifest,
  nativePptOperatorUx,
  oplProviderRuntimeContract,
  oplGenericPrimitiveConsumption,
  oplGeneratedInterfaceConsumption,
  oplStabilityReadModelConsumption,
  visualPackCompilerHandoff,
  privatizedFunctionalModuleAudit,
  oplSubstrateAdapterExport,
  oplFamilyLifecycleAdapter,
  operatorLoopActions,
  runtimeInventory,
  productEntryShell,
  pptRoutePolicy,
  taskLifecycle,
  persistencePolicy,
  lifecycleLedger,
  ownerRoute,
  runtimeResidueRetirement,
  domainAuthorityRefs,
  visualTransitionEvaluator,
  visualPatternMemoryWriteback,
  workspaceReceiptInventoryProjection,
  oplLedgerArtifactRegistration,
  temporalLongSoakEvidenceInventory,
  temporalAutonomyReadiness,
  temporalStageRunConsumptionPolicy,
}) {
  const operatorEvidenceReadinessProjection = buildOperatorEvidenceReadinessProjection({
    familyStageControlPlane,
    oplGenericPrimitiveConsumption,
    oplGeneratedInterfaceConsumption,
    oplStabilityReadModelConsumption,
    domainAuthorityRefs,
    visualTransitionEvaluator,
    workspaceReceiptInventoryProjection,
    temporalLongSoakEvidenceInventory,
    temporalAutonomyReadiness,
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
      native_ppt_proof: productEntryShell.native_ppt_proof,
      image_ppt_proof: productEntryShell.image_ppt_proof,
      domain_handler: productEntryShell.domain_handler,
    },
    operator_loop_actions: {
      ...manifest.operator_loop_actions,
      run_native_ppt_proof: operatorLoopActions.run_native_ppt_proof,
      run_image_ppt_proof: operatorLoopActions.run_image_ppt_proof,
    },
    opl_generated_public_wrappers: {
      surface_kind: 'opl_generated_public_wrapper_refs',
      owner: 'one-person-lab',
      domain_handler_owner: 'redcube_ai',
      repo_local_default_wrapper_retired: true,
      compatibility_alias_allowed: false,
      wrappers: {
        status: productEntryShell.status,
        session: productEntryShell.session,
      },
      domain_handler_target: productEntryShell.domain_handler,
    },
    skill_catalog: {
      ...manifest.skill_catalog,
      supported_commands: actionMetadata.skill_commands.map((contract) => contract.command),
      command_contracts: buildSkillCommandContracts(actionMetadata),
    },
    family_action_catalog: actionMetadata.family_action_catalog,
    family_action_catalog_parity: actionMetadata.parity,
    family_stage_control_plane: familyStageControlPlane,
    opl_provider_runtime_contract: (
      oplProviderRuntimeContract
      || manifest.opl_provider_runtime_contract
    ),
    runtime_inventory: runtimeInventory || manifest.runtime_inventory,
    task_lifecycle: taskLifecycle || manifest.task_lifecycle,
    persistence_policy: persistencePolicy || manifest.persistence_policy,
    lifecycle_ledger: lifecycleLedger || manifest.lifecycle_ledger,
    owner_route: ownerRoute || manifest.owner_route,
    artifact_locator_contract: domainAuthorityRefs.artifact_locator_contract,
    domain_memory_descriptor: domainMemoryDescriptor,
    domain_memory_descriptor_locator: domainAuthorityRefs.domain_memory_descriptor_locator,
    visual_pattern_memory_writeback: visualPatternMemoryWriteback,
    domain_action_adapter_receipt_refs: domainAuthorityRefs.domain_action_adapter_receipt_refs,
    controlled_visual_stage_attempt: domainAuthorityRefs.controlled_visual_stage_attempt,
    controlled_memory_apply_proof: domainAuthorityRefs.controlled_memory_apply_proof,
    workspace_receipt_inventory_projection: workspaceReceiptInventoryProjection,
    opl_ledger_artifact_registration: oplLedgerArtifactRegistration || manifest.opl_ledger_artifact_registration,
    temporal_controlled_visual_stage_long_soak_evidence_inventory: temporalLongSoakEvidenceInventory,
    temporal_autonomy_readiness: temporalAutonomyReadiness || manifest.temporal_autonomy_readiness,
    temporal_stage_run_consumption_policy: (
      temporalStageRunConsumptionPolicy
      || manifest.temporal_stage_run_consumption_policy
    ),
    controlled_soak_no_regression_attempt: domainAuthorityRefs.controlled_soak_no_regression_attempt,
    domain_owner_receipt_contract: domainAuthorityRefs.domain_owner_receipt_contract,
    no_regression_owner_receipt_opl_consumption_proof: domainAuthorityRefs.no_regression_owner_receipt_opl_consumption_proof,
    lifecycle_guarded_apply_proof: domainAuthorityRefs.lifecycle_guarded_apply_proof,
    visual_transition_spec: domainAuthorityRefs.visual_transition_spec,
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
    rca_efficiency_handoff_projection: operatorEvidenceReadinessProjection.rca_efficiency_handoff_projection,
    goal_workflow_agent_lab_suite: operatorEvidenceReadinessProjection.goal_workflow_agent_lab_suite,
    ppt_three_route_agent_lab_suite: operatorEvidenceReadinessProjection.ppt_three_route_agent_lab_suite,
    runtime_residue_retirement: runtimeResidueRetirement,
    action_metadata: buildActionMetadataProjection(actionMetadata),
  };
}
