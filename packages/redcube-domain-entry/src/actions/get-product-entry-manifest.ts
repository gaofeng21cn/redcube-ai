// @ts-nocheck

import {
  buildFamilyProductEntryManifest,
  buildGeneratedProductEntryManifestCompanions,
  collectFamilyHumanGateIds,
} from 'opl-framework-shared/product-entry-companions';

import {
  buildRedCubeDomainEntryContract,
  buildRedCubeSharedHandoff,
  buildRedCubeUserInteractionContract,
} from './domain-entry-contract.js';
import { buildFamilyOrchestrationCompanion } from './family-orchestration-companion.js';
import { getProductPreflight } from './get-product-preflight.js';
import {
  buildRedCubeActionMetadata,
} from './family-action-catalog.js';
import { buildRedCubeFamilyStageControlPlane } from './family-stage-control-plane.js';
import {
  buildFamilyDomainMemoryDescriptor,
  buildRuntimeResidueRetirementAudit,
  buildRedCubeDomainAuthorityRefs,
  buildVisualPatternMemoryWritebackProjection,
} from './domain-authority-refs.js';
import {
  OPL_GENERATED_INTERFACE_CONSUMPTION,
} from './guarded-domain-actions.js';
import {
  listDomainActionAdapterForbiddenWrites,
  listDomainActionAdapterGuardedActionIds,
} from './domain-action-adapter-parts/guarded-action-catalog.js';
import {
  buildRouteEquivalenceContract,
  buildDeliverableFacadeContract,
} from './get-product-entry-manifest-parts/contracts.js';
import { buildManifestExtraPayload } from './get-product-entry-manifest-parts/extra-payload.js';
import {
  buildFormalEntryPolicy,
  buildManifestNotes,
  buildProductEntryStatusSection,
  buildSourceProvenanceSection,
  projectProductEntryPreflight,
} from './get-product-entry-manifest-parts/manifest-sections.js';
import { buildReturnedManifestProjection } from './get-product-entry-manifest-parts/manifest-return.js';
import { buildNativePptOperatorUx } from './get-product-entry-manifest-parts/native-ppt-operator-ux.js';
import { buildOplLedgerArtifactRegistrationContract } from './get-product-entry-manifest-parts/opl-ledger-artifact-registration.js';
import {
  DEFAULT_RUNTIME_OWNER,
  OPL_HOSTED_PRODUCT_ENTRY_CONTRACT_REF,
  SESSION_CONTINUITY_PROVENANCE_CONTRACT_REF,
  PRODUCT_ENTRY_CONTRACT_REF,
  PRODUCT_STATUS_COMMAND,
  PRODUCT_INVOKE_COMMAND,
  PRODUCT_MANIFEST_COMMAND,
  PRODUCT_SESSION_COMMAND,
  PRODUCT_START_COMMAND,
  SERVICE_SAFE_DOMAIN_ENTRY_CONTRACT_REF,
} from './get-product-entry-manifest-parts/policy.js';
import { buildProductEntryManifestShellProjections } from './get-product-entry-manifest-parts/shell-projections.js';
import {
  buildActionMetadataProjection,
  normalizeWorkspaceRoot,
  readCurrentProgramContract,
  safeText,
} from './get-product-entry-manifest-parts/utils.js';
import { buildWorkspaceReceiptInventoryProjection } from './get-product-entry-manifest-parts/workspace-receipt-inventory.js';
import { buildTemporalLongSoakEvidenceInventory } from './get-product-entry-manifest-parts/temporal-long-soak-evidence-inventory.js';
import { buildVisualTransitionEvaluatorProjection } from './domain-action-adapter-parts/visual-transition-evaluator.js';
import { buildRedCubeProductEntryDescriptor } from './get-product-entry-manifest-parts/entry-descriptor.js';

export async function getProductEntryManifest(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const productEntrySessionCommand = `${PRODUCT_SESSION_COMMAND} --entry-session-id <entry-session-id>`;
  const productEntryPreflight = await getProductPreflight({ workspace_root: workspaceRoot });
  const currentProgram = readCurrentProgramContract();
  const currentState = currentProgram.current_state || {};
  const activeMainline = currentState.active_mainline || {};
  const activeBaton = currentState.active_baton || {};
  const deliverableFacade = buildDeliverableFacadeContract();
  const nativePptOperatorUx = buildNativePptOperatorUx({
    workspaceRoot,
    productEntryPreflight,
    pptPolicy: deliverableFacade.family_route_policy.ppt_deck,
  });
  const pptRoutePolicy = deliverableFacade.family_route_policy.ppt_deck || {};
  const pptRouteSelection = nativePptOperatorUx.route_selection || {};
  const domainEntryContract = buildRedCubeDomainEntryContract({
    productManifestCommand: PRODUCT_MANIFEST_COMMAND,
    productStatusCommand: PRODUCT_STATUS_COMMAND,
    productStartCommand: PRODUCT_START_COMMAND,
    productInvokeCommand: PRODUCT_INVOKE_COMMAND,
    productSessionCommand: PRODUCT_SESSION_COMMAND,
    serviceSafeDomainEntryContractRef: SERVICE_SAFE_DOMAIN_ENTRY_CONTRACT_REF,
    productEntryContractRef: PRODUCT_ENTRY_CONTRACT_REF,
    oplHostedProductEntryContractRef: OPL_HOSTED_PRODUCT_ENTRY_CONTRACT_REF,
    sessionContinuityProvenanceContractRef: SESSION_CONTINUITY_PROVENANCE_CONTRACT_REF,
  });
  const userInteractionContract = buildRedCubeUserInteractionContract({
    productStatusCommand: PRODUCT_STATUS_COMMAND,
    productManifestCommand: PRODUCT_MANIFEST_COMMAND,
    oplHostedProductEntryContractRef: OPL_HOSTED_PRODUCT_ENTRY_CONTRACT_REF,
  });
  const familyOrchestration = buildFamilyOrchestrationCompanion({
    sessionLocatorField: 'entry_session_contract.entry_session_id',
    gateStatus: 'requested',
    reviewSurfaceRef: {
      ref_kind: 'json_pointer',
      ref: '/operator_loop_actions/continue_session',
      label: 'continue session surface',
    },
  });
  const humanGateIds = collectFamilyHumanGateIds(familyOrchestration);
  const productEntryDescriptor = buildRedCubeProductEntryDescriptor({
    humanGateIds,
    nativePptOperatorUx,
    productEntrySessionCommand,
  });
  const {
    product_entry_overview: productEntryOverview,
    product_entry_quickstart: productEntryQuickstart,
    product_entry_readiness: productEntryReadiness,
    product_entry_start: productEntryStart,
  } = buildGeneratedProductEntryManifestCompanions({
    entry_descriptor: productEntryDescriptor,
    family_orchestration: familyOrchestration,
  });
  const runtime = {
    runtime_owner: DEFAULT_RUNTIME_OWNER,
    product_session_surface_ref: 'opl_generated:product_session',
    stage_folder_locator_contract_ref: 'contracts/artifact_locator_contract.json',
  };
  const domainAuthorityRefs = buildRedCubeDomainAuthorityRefs({
    workspaceRoot,
    runtime,
  });
  const visualTransitionEvaluator = buildVisualTransitionEvaluatorProjection({
    visualTransitionSpec: domainAuthorityRefs.visual_transition_spec,
  });
  const domainMemoryDescriptor = buildFamilyDomainMemoryDescriptor({ domainMemoryDescriptorLocator: domainAuthorityRefs.domain_memory_descriptor_locator });
  const visualPatternMemoryWriteback = buildVisualPatternMemoryWritebackProjection({ domainAuthorityRefs });
  const workspaceReceiptInventoryProjection = buildWorkspaceReceiptInventoryProjection({
    workspaceRoot,
    workspaceReceiptScaleoutRoots: request?.workspace_receipt_scaleout_roots,
  });
  const temporalLongSoakEvidenceInventory = buildTemporalLongSoakEvidenceInventory({ workspaceRoot });
  const oplLedgerArtifactRegistration = buildOplLedgerArtifactRegistrationContract();
  const runtimeResidueRetirement = buildRuntimeResidueRetirementAudit({ runtime });
  const routeEquivalence = buildRouteEquivalenceContract({
    runtime,
    productEntrySessionCommand,
  });
  const oplFamilyLifecycleAdapter = {
    surface_kind: 'opl_generated_product_session_ref',
    owner: 'one-person-lab',
    ref: runtime.product_session_surface_ref,
    rca_role: 'domain_result_and_currentness_refs_provider',
  };
  const sourceProvenance = buildSourceProvenanceSection();
  const actionMetadata = buildRedCubeActionMetadata();
  const familyStageControlPlane = buildRedCubeFamilyStageControlPlane({
    familyActionCatalog: actionMetadata.family_action_catalog,
  });
  const {
    automation,
    entryStatusSurface,
    familySchedulerReplacement,
    lifecycleLedger,
    oplGenericPrimitiveConsumption,
    oplProviderRuntimeContract,
    oplStabilityReadModelConsumption,
    oplSubstrateAdapterExport,
    operatorLoopActions,
    operatorLoopSurface,
    ownerRoute,
    persistencePolicy,
    privatizedFunctionalModuleAudit,
    productEntryShell,
    runtimeInventory,
    skillCatalog,
    taskLifecycle,
    temporalAutonomyReadiness,
    temporalStageRunConsumptionPolicy,
    visualPackCompilerHandoff,
  } = buildProductEntryManifestShellProjections({
    actionMetadata,
    familyOrchestration,
    humanGateIds,
    nativePptOperatorUx,
    productEntryPreflight,
    productEntrySessionCommand,
    domainActionAdapterForbiddenWrites: listDomainActionAdapterForbiddenWrites(),
    domainActionAdapterGuardedActionIds: listDomainActionAdapterGuardedActionIds(),
    pptRoutePolicy,
    pptRouteSelection,
    runtime,
    domainAuthorityRefs,
    workspaceRoot,
  });

  const manifest = buildFamilyProductEntryManifest({
    manifest_kind: 'redcube_product_entry_manifest',
    target_domain_id: 'redcube_ai',
    formal_entry: buildFormalEntryPolicy(),
    workspace_locator: {
      workspace_surface_kind: 'redcube_workspace',
      workspace_root: workspaceRoot,
    },
    recommended_shell: 'direct',
    recommended_command: PRODUCT_INVOKE_COMMAND,
    product_entry_surface: entryStatusSurface,
    operator_loop_surface: operatorLoopSurface,
    operator_loop_actions: operatorLoopActions,
    repo_mainline: {
      program_id: safeText(activeMainline.id, 'redcube-runtime-program'),
      phase_id: safeText(currentState.phase_id, 'unknown_phase'),
      phase_label: safeText(currentState.phase_label, 'unknown phase'),
      active_baton_provenance_id: safeText(activeBaton.id, 'unknown_baton'),
      active_baton_role: 'session_continuity_provenance',
      active_baton_status: safeText(activeBaton.status, 'unknown'),
    },
    product_entry_status: buildProductEntryStatusSection(),
    runtime,
    opl_provider_runtime_contract: oplProviderRuntimeContract,
    runtime_inventory: runtimeInventory,
    task_lifecycle: taskLifecycle,
    persistence_policy: persistencePolicy,
    lifecycle_ledger: lifecycleLedger,
    owner_route: ownerRoute,
    family_action_catalog: actionMetadata.family_action_catalog,
    family_action_catalog_parity: actionMetadata.parity,
    family_stage_control_plane: familyStageControlPlane,
    artifact_locator_contract: domainAuthorityRefs.artifact_locator_contract,
    domain_memory_descriptor_locator: domainAuthorityRefs.domain_memory_descriptor_locator,
    visual_pattern_memory_writeback: visualPatternMemoryWriteback,
    domain_action_adapter_receipt_refs: domainAuthorityRefs.domain_action_adapter_receipt_refs,
    controlled_visual_stage_attempt: domainAuthorityRefs.controlled_visual_stage_attempt,
    controlled_memory_apply_proof: domainAuthorityRefs.controlled_memory_apply_proof,
    workspace_receipt_inventory_projection: workspaceReceiptInventoryProjection,
    opl_ledger_artifact_registration: oplLedgerArtifactRegistration,
    temporal_controlled_visual_stage_long_soak_evidence_inventory: temporalLongSoakEvidenceInventory,
    temporal_autonomy_readiness: temporalAutonomyReadiness,
    temporal_stage_run_consumption_policy: temporalStageRunConsumptionPolicy,
    controlled_soak_no_regression_attempt: domainAuthorityRefs.controlled_soak_no_regression_attempt,
    domain_owner_receipt_contract: domainAuthorityRefs.domain_owner_receipt_contract,
    no_regression_owner_receipt_opl_consumption_proof: domainAuthorityRefs.no_regression_owner_receipt_opl_consumption_proof,
    lifecycle_guarded_apply_proof: domainAuthorityRefs.lifecycle_guarded_apply_proof,
    visual_transition_spec: domainAuthorityRefs.visual_transition_spec,
    visual_transition_evaluator: visualTransitionEvaluator,
    family_scheduler_replacement: familySchedulerReplacement,
    opl_generic_primitive_consumption: oplGenericPrimitiveConsumption,
    opl_stability_read_model_consumption: oplStabilityReadModelConsumption,
    visual_pack_compiler_handoff: visualPackCompilerHandoff,
    opl_generated_interface_consumption: OPL_GENERATED_INTERFACE_CONSUMPTION,
    privatized_functional_module_audit: privatizedFunctionalModuleAudit,
    opl_substrate_adapter_export: oplSubstrateAdapterExport,
    runtime_residue_retirement: runtimeResidueRetirement,
    action_metadata: buildActionMetadataProjection(actionMetadata),
    skill_catalog: skillCatalog,
    automation,
    product_entry_shell: productEntryShell,
    shared_handoff: buildRedCubeSharedHandoff(),
    product_entry_start: productEntryStart,
    product_entry_overview: productEntryOverview,
    product_entry_preflight: projectProductEntryPreflight(productEntryPreflight),
    native_ppt_operator_ux: nativePptOperatorUx,
    opl_family_lifecycle_adapter: oplFamilyLifecycleAdapter,
    product_entry_readiness: productEntryReadiness,
    product_entry_quickstart: productEntryQuickstart,
    family_orchestration: familyOrchestration,
    notes: buildManifestNotes(),
    domain_entry_contract: domainEntryContract,
    user_interaction_contract: userInteractionContract,
    extra_payload: buildManifestExtraPayload({
      routeEquivalence,
      deliverableFacade,
      productEntryDescriptor,
      nativePptOperatorUx,
      productEntrySessionCommand,
      sourceProvenance,
    }),
  });
  return buildReturnedManifestProjection({
    actionMetadata,
    domainMemoryDescriptor,
    entryStatusSurface,
    familySchedulerReplacement,
    familyStageControlPlane,
    manifest,
    nativePptOperatorUx,
    oplProviderRuntimeContract,
    oplGenericPrimitiveConsumption,
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
  });
}
