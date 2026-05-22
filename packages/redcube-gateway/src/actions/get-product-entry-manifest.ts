// @ts-nocheck
import path from 'node:path';

import { productEntrySessionDir } from '@redcube/runtime';
import {
  buildFamilyProductEntryManifest,
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
  buildOplFamilyLifecycleAdapterSurface,
  buildRuntimeLoopClosureManifestSurface,
} from './product-entry-continuity-surfaces.js';
import {
  buildRedCubeActionMetadata,
} from './family-action-catalog.js';
import { buildRedCubeFamilyStageControlPlane } from './family-stage-control-plane.js';
import {
  buildFamilyDomainMemoryDescriptor,
  buildRuntimeResidueRetirementAudit,
  buildStandardDomainAgentSkeleton,
  buildVisualPatternMemoryWritebackProjection,
} from './standard-domain-agent-skeleton.js';
import {
  OPL_GENERATED_INTERFACE_CONSUMPTION,
} from './product-sidecar-guarded-actions.js';
import {
  listProductSidecarForbiddenWrites,
  listProductSidecarGuardedActionIds,
} from './product-sidecar-parts/guarded-action-catalog.js';
import {
  buildRouteEquivalenceContract,
  buildDeliverableFacadeContract,
} from './get-product-entry-manifest-parts/contracts.js';
import { buildManifestExtraPayload } from './get-product-entry-manifest-parts/extra-payload.js';
import { buildReturnedManifestProjection } from './get-product-entry-manifest-parts/manifest-return.js';
import { buildNativePptOperatorUx } from './get-product-entry-manifest-parts/native-ppt-operator-ux.js';
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
import { normalizeWorkspaceRoot, readCurrentProgramContract, safeText } from './get-product-entry-manifest-parts/utils.js';
import { buildWorkspaceReceiptInventoryProjection } from './get-product-entry-manifest-parts/workspace-receipt-inventory.js';
import { buildVisualTransitionEvaluatorProjection } from './product-sidecar-parts/visual-transition-evaluator.js';
import { buildProductEntryManifestEntrySurfaces } from './get-product-entry-manifest-parts/entry-surfaces.js';

export async function getProductEntryManifest(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const sessionContinuityRoot = productEntrySessionDir();
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
  const {
    productEntryOverview,
    productEntryQuickstart,
    productEntryReadiness,
    productEntryStart,
  } = buildProductEntryManifestEntrySurfaces({
    familyOrchestration,
    humanGateIds,
    nativePptOperatorUx,
    productEntrySessionCommand,
    workspaceRoot,
  });
  const runtime = {
    runtime_owner: DEFAULT_RUNTIME_OWNER,
    runtime_state_root: path.dirname(sessionContinuityRoot),
    session_continuity_root: sessionContinuityRoot,
  };
  const standardDomainAgentSkeleton = buildStandardDomainAgentSkeleton({
    workspaceRoot,
    runtime,
    productEntrySessionCommand,
  });
  const visualTransitionEvaluator = buildVisualTransitionEvaluatorProjection({
    visualTransitionSpec: standardDomainAgentSkeleton.visual_transition_spec,
  });
  const domainMemoryDescriptor = buildFamilyDomainMemoryDescriptor({ domainMemoryDescriptorLocator: standardDomainAgentSkeleton.domain_memory_descriptor_locator });
  const visualPatternMemoryWriteback = buildVisualPatternMemoryWritebackProjection({ standardDomainAgentSkeleton });
  const workspaceReceiptInventoryProjection = buildWorkspaceReceiptInventoryProjection({ workspaceRoot });
  const runtimeResidueRetirement = buildRuntimeResidueRetirementAudit({ runtime });
  const routeEquivalence = buildRouteEquivalenceContract({
    runtime,
    productEntrySessionCommand,
  });
  const manifestRuntimeLoopClosure = buildRuntimeLoopClosureManifestSurface({
    runtimeOwner: runtime.runtime_owner,
  });
  const manifestReviewState = {
    surface_kind: 'review_state',
    owner: 'redcube_ai',
    status: 'runtime_projection_ref',
  };
  const manifestPublicationProjection = {
    surface_kind: 'publication_projection',
    owner: 'redcube_ai',
    status: 'runtime_projection_ref',
  };
  const oplFamilyLifecycleAdapter = buildOplFamilyLifecycleAdapterSurface({
    runtimeOwner: runtime.runtime_owner,
    runtimeLoopClosure: manifestRuntimeLoopClosure,
    reviewState: manifestReviewState,
    publicationProjection: manifestPublicationProjection,
    artifactLocatorContract: standardDomainAgentSkeleton.artifact_locator_contract,
    source: 'manifest',
    entryMode: 'manifest_projection',
    manifestProjection: true,
  });
  const sourceProvenance = {
    surface_kind: 'source_provenance',
    summary: (
      'RCA exposes visual-deliverable source provenance as OPL-indexable body-free refs only; '
      + 'source truth, visual route judgment, artifact authority, review/export verdicts, and memory bodies remain RCA-owned.'
    ),
    source_provenance_ref: {
      surface_kind: 'rca_visual_source_provenance',
      ref: 'docs/source/source_augmentation_executor_contract.md',
    },
    historical_fixture_ref: {
      surface_kind: 'rca_visual_source_fixture_ref',
      ref: 'tests/fixtures/ppt-image-first-benchmark/manifest.json',
    },
    explicit_archive_import_ref: {
      surface_kind: 'rca_explicit_source_intake_ref',
      command: `${PRODUCT_STATUS_COMMAND} --workspace-root <workspace-root>`,
    },
    parity_oracle_ref: {
      surface_kind: 'rca_visual_pack_parity_oracle_ref',
      ref: '/visual_pack_compiler_handoff',
    },
    authority_boundary: [
      'source_refs_do_not_contain_source_body',
      'opl_projection_reads_refs_only',
      'workspace_source_intake_shell_owner_is_one_person_lab',
      'visual_source_truth_owner_is_redcube_ai',
      'review_export_verdict_owner_is_redcube_ai',
      'artifact_authority_owner_is_redcube_ai',
      'no_runtime_workbench_ledger_or_scheduler_authority_transferred',
    ],
    capability_classification: 'source_provenance_only',
    recommended_audit_command: PRODUCT_MANIFEST_COMMAND,
  };
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
    visualPackCompilerHandoff,
  } = buildProductEntryManifestShellProjections({
    actionMetadata,
    familyOrchestration,
    humanGateIds,
    nativePptOperatorUx,
    productEntryPreflight,
    productEntrySessionCommand,
    productSidecarForbiddenWrites: listProductSidecarForbiddenWrites(),
    productSidecarGuardedActionIds: listProductSidecarGuardedActionIds(),
    pptRoutePolicy,
    pptRouteSelection,
    runtime,
    standardDomainAgentSkeleton,
    workspaceRoot,
  });

  const manifest = buildFamilyProductEntryManifest({
    manifest_kind: 'redcube_product_entry_manifest',
    target_domain_id: 'redcube_ai',
    formal_entry: {
      default: 'CLI',
      supported_protocols: ['MCP'],
      internal_surface: 'domain_entry_protocol_boundary',
      internal_surface_role: 'service_safe_domain_entry_and_protocol_adapter',
      retired_internal_surface_ids: ['gateway'],
      compatibility_alias_allowed: false,
    },
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
    product_entry_status: {
      summary: 'Repo-verified product-entry overview/intake surface 已 landed；direct invoke 默认 auto_to_terminal；`status` 是当前 product overview 命令，成熟终端用户前台壳仍未 landed。',
      next_focus: [
        '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry overview/intake service surface 之上。',
        '继续把 OPL-hosted stage runtime handoff 与同一 downstream product-entry contract 对齐。',
      ],
      remaining_gaps_count: 2,
    },
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
    standard_domain_agent_skeleton: standardDomainAgentSkeleton,
    artifact_locator_contract: standardDomainAgentSkeleton.artifact_locator_contract,
    domain_memory_descriptor_locator: standardDomainAgentSkeleton.domain_memory_descriptor_locator,
    visual_pattern_memory_writeback: visualPatternMemoryWriteback,
    product_sidecar_receipt_refs: standardDomainAgentSkeleton.product_sidecar_receipt_refs,
    controlled_visual_stage_attempt: standardDomainAgentSkeleton.controlled_visual_stage_attempt,
    controlled_memory_apply_proof: standardDomainAgentSkeleton.controlled_memory_apply_proof,
    workspace_receipt_inventory_projection: workspaceReceiptInventoryProjection,
    temporal_autonomy_readiness: temporalAutonomyReadiness,
    controlled_soak_no_regression_attempt: standardDomainAgentSkeleton.controlled_soak_no_regression_attempt,
    domain_owner_receipt_contract: standardDomainAgentSkeleton.domain_owner_receipt_contract,
    no_regression_owner_receipt_opl_consumption_proof: standardDomainAgentSkeleton.no_regression_owner_receipt_opl_consumption_proof,
    lifecycle_guarded_apply_proof: standardDomainAgentSkeleton.lifecycle_guarded_apply_proof,
    visual_transition_spec: standardDomainAgentSkeleton.visual_transition_spec,
    visual_transition_evaluator: visualTransitionEvaluator,
    family_scheduler_replacement: familySchedulerReplacement,
    opl_generic_primitive_consumption: oplGenericPrimitiveConsumption,
    opl_stability_read_model_consumption: oplStabilityReadModelConsumption,
    visual_pack_compiler_handoff: visualPackCompilerHandoff,
    opl_generated_interface_consumption: OPL_GENERATED_INTERFACE_CONSUMPTION,
    privatized_functional_module_audit: privatizedFunctionalModuleAudit,
    opl_substrate_adapter_export: oplSubstrateAdapterExport,
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
    skill_catalog: skillCatalog,
    automation,
    product_entry_shell: productEntryShell,
    shared_handoff: buildRedCubeSharedHandoff(),
    product_entry_start: productEntryStart,
    product_entry_overview: productEntryOverview,
    product_entry_preflight: {
      surface_kind: productEntryPreflight.surface_kind,
      summary: productEntryPreflight.summary,
      ready_to_try_now: productEntryPreflight.ready_to_try_now,
      recommended_check_command: productEntryPreflight.recommended_check_command,
      recommended_start_command: productEntryPreflight.recommended_start_command,
      blocking_check_ids: productEntryPreflight.blocking_check_ids,
      checks: productEntryPreflight.checks,
      runtime_loop_closure: productEntryPreflight.runtime_loop_closure,
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
	    product_entry_readiness: productEntryReadiness,
    product_entry_quickstart: productEntryQuickstart,
    family_orchestration: familyOrchestration,
    notes: [
      'This manifest freezes the current repo-verified RedCube product-entry overview/intake service surface; `status` is the current product overview command.',
      'OPL generated descriptors own CLI/MCP/Skill/product/status/session/workbench metadata; repo-local redcube CLI/MCP are RCA domain handler targets and direct diagnostic entries.',
      'The OPL-hosted handoff stays available as an internal integration contract instead of a first-read user entry shell.',
      'It does not claim that a mature end-user shell, RCA-owned generic runtime, or production visual-stage soak is already landed.',
    ],
    domain_entry_contract: domainEntryContract,
	    user_interaction_contract: userInteractionContract,
	    extra_payload: buildManifestExtraPayload({
      routeEquivalence,
      deliverableFacade,
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
    standardDomainAgentSkeleton,
    visualTransitionEvaluator,
    visualPatternMemoryWriteback,
    workspaceReceiptInventoryProjection,
    temporalAutonomyReadiness,
  });
		}
