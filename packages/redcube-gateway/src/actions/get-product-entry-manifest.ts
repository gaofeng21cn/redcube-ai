// @ts-nocheck
import path from 'node:path';

import { productEntrySessionDir } from '@redcube/runtime';
import {
  buildManagedRuntimeContract as buildOplProviderRuntimeContract,
} from 'opl-framework-shared/managed-runtime-contract';
import {
  buildCheckpointSummary,
  buildRuntimeInventory,
  buildTaskLifecycle,
} from 'opl-framework-shared/runtime-task-companions';
import {
  buildAutomationCatalog,
  buildAutomationDescriptor,
} from 'opl-framework-shared/automation-companions';
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
  buildOplRuntimeManagerRegistration,
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
  buildFamilySchedulerReplacementProjection,
  buildOplGenericPrimitiveConsumptionProjection,
  buildOplStabilityReadModelConsumptionProjection,
  OPL_GENERATED_INTERFACE_CONSUMPTION,
  buildPrivatizedFunctionalModuleAuditProjection,
  buildOplSubstrateAdapterExportProjection,
  buildVisualPackCompilerHandoffProjection,
  listProductSidecarForbiddenWrites,
  listProductSidecarGuardedActionIds,
} from './product-sidecar-guarded-actions.js';
import {
  OPL_FRAMEWORK_PROVIDER_RUNTIME_CONTRACT,
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
import { buildProductEntryManifestShellCatalog } from './get-product-entry-manifest-parts/shell-catalog.js';
import { normalizeWorkspaceRoot, readCurrentProgramContract, safeText } from './get-product-entry-manifest-parts/utils.js';
import { buildWorkspaceReceiptInventoryProjection } from './get-product-entry-manifest-parts/workspace-receipt-inventory.js';
import { buildVisualTransitionEvaluatorProjection } from './product-sidecar-parts/visual-transition-evaluator.js';
import { buildProductEntryManifestEntrySurfaces } from './get-product-entry-manifest-parts/entry-surfaces.js';
import { buildTemporalAutonomyReadinessProjection } from './product-sidecar-parts/temporal-autonomy-readiness.js';

export async function getProductEntryManifest(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const sessionStoreRoot = productEntrySessionDir();
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
    runtime_state_root: path.dirname(sessionStoreRoot),
    session_store_root: sessionStoreRoot,
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
  const oplProviderRuntimeContract = buildOplProviderRuntimeContract({
    runtime_owner: runtime.runtime_owner,
    domain_owner: 'redcube_ai',
    executor_owner: 'configured_by_opl_runtime_provider',
    supervision_status_surface: 'product_entry_session',
    attention_queue_surface: 'product_status',
    recovery_contract_surface: 'product_entry_session',
    contract: OPL_FRAMEWORK_PROVIDER_RUNTIME_CONTRACT,
  });
  const runtimeInventory = buildRuntimeInventory({
    summary: (
      'RedCube OPL provider runtime inventory follows the same session snapshot refs, OPL framework runtime contract, '
      + 'and product-entry preflight/runtime surfaces; RCA remains a domain handler and authority surface.'
    ),
    runtime_owner: runtime.runtime_owner,
    domain_owner: oplProviderRuntimeContract.domain_owner,
    executor_owner: oplProviderRuntimeContract.executor_owner,
    substrate: 'opl_provider_backed_stage_attempt_runtime',
    availability: productEntryPreflight.ready_to_try_now ? 'ready' : 'attention_needed',
    health_status: productEntryPreflight.ready_to_try_now ? 'healthy' : 'degraded',
    status_surface: {
      ref_kind: 'json_pointer',
      ref: '/product_entry_preflight',
      label: 'product_entry_preflight',
    },
    attention_surface: {
      ref_kind: 'json_pointer',
      ref: '/status_surface',
      label: 'product_status',
    },
    recovery_surface: {
      ref_kind: 'json_pointer',
      ref: '/operator_loop_actions/continue_session',
      label: 'continue_session_action',
    },
    workspace_binding: {
      workspace_root: workspaceRoot,
      runtime_state_root: runtime.runtime_state_root,
      session_store_root: runtime.session_store_root,
    },
    domain_projection: {
      opl_provider_runtime_contract_ref: oplProviderRuntimeContract.shared_contract_ref,
      session_locator_field: familyOrchestration.resume_contract.session_locator_field,
      checkpoint_locator_field: familyOrchestration.resume_contract.checkpoint_locator_field,
    },
  });
  const taskLifecycleCheckpoint = buildCheckpointSummary({
    status: 'operator_review_required',
    summary: 'Operator review gate remains active before each same-session continuation freeze point.',
    checkpoint_id: 'redcube_operator_review_gate',
    lineage_ref: {
      ref_kind: 'json_pointer',
      ref: '/family_orchestration/human_gates/0',
      label: 'operator_review_gate',
    },
    verification_ref: {
      ref_kind: 'json_pointer',
      ref: '/operator_loop_actions/continue_session',
      label: 'continue_session_action',
    },
  });
  const taskLifecycle = buildTaskLifecycle({
    task_kind: 'visual_deliverable_loop',
    task_id: 'redcube_opl_stage_execution_plan_loop',
    status: 'resumable',
    summary: 'Continue the same RedCube deliverable loop via entry_session_id and persisted continuation snapshot.',
    progress_surface: {
      surface_kind: 'product_entry_session',
      summary: 'Inspect current same-session progress for the active deliverable loop.',
      command: productEntrySessionCommand,
      step_id: 'inspect_current_progress',
      locator_fields: ['entry_session_id'],
    },
    resume_surface: {
      surface_kind: 'product_entry_session',
      summary: 'Resume the current deliverable loop in the same entry session.',
      command: productEntrySessionCommand,
      locator_fields: ['entry_session_id'],
    },
    checkpoint_summary: taskLifecycleCheckpoint,
    human_gate_ids: humanGateIds,
    domain_projection: {
      session_locator_field: familyOrchestration.resume_contract.session_locator_field,
      checkpoint_locator_field: familyOrchestration.resume_contract.checkpoint_locator_field,
      continuation_shell_key: 'session',
      continuation_surface_kind: 'product_entry_session',
    },
  });
  const temporalAutonomyReadiness = buildTemporalAutonomyReadinessProjection({
    familySchedulerReplacement: buildFamilySchedulerReplacementProjection(),
    oplGenericPrimitiveConsumption: buildOplGenericPrimitiveConsumptionProjection(),
    oplStabilityReadModelConsumption: buildOplStabilityReadModelConsumptionProjection(),
    standardDomainAgentSkeleton,
    runtimeInventory,
    taskLifecycle,
    productSidecarGuardedActionIds: listProductSidecarGuardedActionIds(),
  });
  const persistencePolicy = {
    surface_kind: 'family_persistence_policy',
    version: 'family-persistence-policy.v1',
    target_domain_id: 'redcube_ai',
    policy_id: 'redcube_product_entry_persistence_policy',
    summary: 'RedCube runtime contracts stay file-authoritative while product-entry manifests expose OPL family persistence discovery.',
    authority_surfaces: [
      {
        surface_id: 'redcube_runtime_program_contract',
        surface_role: 'runtime_contract_authority',
        storage_role: 'file_authority',
        owner: 'redcube_ai',
        ref: {
          ref_kind: 'repo_path',
          ref: 'contracts/runtime-program/current-program.json',
          label: 'current runtime program contract',
        },
        rebuild_from_refs: [
          {
            ref_kind: 'repo_path',
            ref: 'packages/redcube-gateway/src/actions/get-product-entry-manifest.ts',
            label: 'product-entry manifest builder',
          },
        ],
      },
    ],
    sidecar_indexes: [],
    projection_caches: [
      {
        surface_id: 'redcube_product_entry_manifest_projection',
        surface_role: 'product_entry_manifest_read_model',
        storage_role: 'projection_cache',
        owner: 'redcube_ai',
        ref: {
          ref_kind: 'json_pointer',
          ref: '/product_entry_overview',
          label: 'product-entry overview projection',
        },
        rebuild_from_refs: [
          {
            ref_kind: 'json_pointer',
            ref: '/runtime_inventory',
            label: 'runtime inventory',
          },
          {
            ref_kind: 'json_pointer',
            ref: '/task_lifecycle',
            label: 'task lifecycle',
          },
        ],
      },
    ],
    source_provenance: [],
  };
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
  const lifecycleLedger = {
    surface_kind: 'family_lifecycle_ledger',
    version: 'family-lifecycle-ledger.v1',
    target_domain_id: 'redcube_ai',
    ledger_id: 'redcube_product_entry_lifecycle_ledger',
    phase: 'verify',
    status: 'verified',
    summary: 'Lifecycle discovery records the current RedCube product-entry contract and the session resume proof surface.',
    actions: [
      {
        action_id: 'verify_redcube_product_entry_manifest',
        action_kind: 'verify_manifest_projection',
        target_ref: {
          ref_kind: 'json_pointer',
          ref: '/product_entry_overview',
          label: 'product-entry overview',
        },
        authority_owner: 'redcube_ai',
        safety_gate: 'runtime_contract_verified',
        result: 'verified',
        manifest_ref: {
          ref_kind: 'repo_path',
          ref: 'contracts/runtime-program/current-program.json',
          label: 'current runtime program contract',
        },
        sha256: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        restore_ref: {
          ref_kind: 'json_pointer',
          ref: '/operator_loop_actions/continue_session',
          label: 'continue session action',
        },
      },
    ],
  };
  const ownerRoute = {
    surface_kind: 'family_owner_route',
    version: 'family-owner-route.v1',
    target_domain_id: 'redcube_ai',
    route_id: 'redcube_product_entry_owner_route',
    route_epoch: '2026-05-08T00:00:00Z',
    source_fingerprint: 'manifest:redcube_product_entry_manifest:v2',
    next_owner: 'redcube_ai',
    allowed_actions: [
      'continue_session',
      'inspect_progress',
      'handoff_to_opl_hosted',
    ],
    idempotency_key: 'redcube_ai:redcube_product_entry_owner_route:2026-05-08',
    status: 'active',
    summary: 'OPL can discover RedCube route ownership without owning visual deliverable truth.',
    handoff_refs: [
      {
        ref_kind: 'json_pointer',
        ref: '/shared_handoff/opl_return_surface',
        label: 'OPL return surface',
      },
    ],
    projection_refs: [
      {
        ref_kind: 'json_pointer',
        ref: '/runtime_inventory',
        label: 'runtime inventory',
      },
      {
        ref_kind: 'json_pointer',
        ref: '/task_lifecycle',
        label: 'task lifecycle',
      },
    ],
  };
  const runtimeContinuityEnvelope = {
    surface_kind: 'skill_runtime_continuity',
    runtime_owner: runtime.runtime_owner,
    domain_owner: oplProviderRuntimeContract.domain_owner,
    executor_owner: oplProviderRuntimeContract.executor_owner,
    session_locator_field: familyOrchestration.resume_contract.session_locator_field,
    session_surface_ref: {
      ref_kind: 'json_pointer',
      ref: '/entry_session',
      label: 'entry session surface',
    },
    progress_surface_ref: {
      ref_kind: 'json_pointer',
      ref: '/progress_projection',
      label: 'progress projection surface',
    },
    artifact_surface_ref: {
      ref_kind: 'json_pointer',
      ref: '/artifact_inventory',
      label: 'artifact inventory surface',
    },
    restore_point_surface_ref: {
      ref_kind: 'json_pointer',
      ref: '/session_continuity/restore_point',
      label: 'restore point surface',
    },
    recommended_resume_command: productEntrySessionCommand,
    recommended_progress_command: productEntrySessionCommand,
    recommended_artifact_command: productEntrySessionCommand,
  };
  const oplRuntimeManagerRegistration = buildOplRuntimeManagerRegistration({
    runtimeContinuityEnvelope,
    productEntrySessionCommand,
    standardDomainAgentSkeleton,
  });
  const actionMetadata = buildRedCubeActionMetadata();
  const familyStageControlPlane = buildRedCubeFamilyStageControlPlane({
    familyActionCatalog: actionMetadata.family_action_catalog,
  });
  const automation = buildAutomationCatalog({
    summary: 'RedCube automation companions expose continuation board tracking with operator review-gated continuation truth.',
    automations: [
      buildAutomationDescriptor({
        automation_id: 'redcube_autopilot_continuation_board',
        title: 'RedCube autopilot continuation board',
        owner: 'redcube_ai',
        trigger_kind: 'continuation_board',
        target_surface_kind: 'product_entry_session',
        summary: 'Track and continue the active deliverable loop from the same entry session through the tracked board.',
        readiness_status: 'tracked_follow_on',
        gate_policy: 'operator_review_gated',
        output_expectation: [
          'continue same entry session',
          'preserve publication and review truth',
          'update latest OPL stage continuation handle',
        ],
        target_command: productEntrySessionCommand,
        domain_projection: {
          board_scope: 'repo_tracked',
          continuation_action: 'continue_session',
        },
      }),
      buildAutomationDescriptor({
        automation_id: 'redcube_operator_review_gate',
        title: 'RedCube operator review gate',
        owner: 'redcube_ai',
        trigger_kind: 'operator_review_gate',
        target_surface_kind: 'product_entry_session',
        summary: 'Require operator review before each continuation freeze point for the active deliverable loop.',
        readiness_status: 'repo_tracked',
        gate_policy: 'human_gate_required',
        output_expectation: [
          'record operator decision',
          'gate continuation by same-session review truth',
        ],
        target_command: productEntrySessionCommand,
        domain_projection: {
          human_gate_id: 'redcube_operator_review_gate',
          review_surface_ref: '/operator_loop_actions/continue_session',
        },
      }),
    ],
    readiness_summary: (
      'Autopilot continuation stays tracked_follow_on while operator review gate remains repo_tracked and active.'
    ),
  });
  const familySchedulerReplacement = buildFamilySchedulerReplacementProjection();
  const oplGenericPrimitiveConsumption = buildOplGenericPrimitiveConsumptionProjection();
  const oplStabilityReadModelConsumption = buildOplStabilityReadModelConsumptionProjection();
  const visualPackCompilerHandoff = buildVisualPackCompilerHandoffProjection();
  const privatizedFunctionalModuleAudit = buildPrivatizedFunctionalModuleAuditProjection({
    familySchedulerReplacement,
    oplGenericPrimitiveConsumption,
    oplStabilityReadModelConsumption,
  });
  const oplSubstrateAdapterExport = buildOplSubstrateAdapterExportProjection();
  const {
    entryStatusSurface,
    operatorLoopActions,
    operatorLoopSurface,
    productEntryShell,
    skillCatalog,
  } = buildProductEntryManifestShellCatalog({
    actionMetadata,
    familySchedulerReplacement,
    nativePptOperatorUx,
    oplGenericPrimitiveConsumption,
    oplRuntimeManagerRegistration,
    oplStabilityReadModelConsumption,
    oplSubstrateAdapterExport,
    pptRoutePolicy,
    pptRouteSelection,
    privatizedFunctionalModuleAudit,
    productEntrySessionCommand,
    productSidecarForbiddenWrites: listProductSidecarForbiddenWrites(),
    productSidecarGuardedActionIds: listProductSidecarGuardedActionIds(),
    runtimeContinuityEnvelope,
    visualPackCompilerHandoff,
    workspaceRoot,
  });

  const manifest = buildFamilyProductEntryManifest({
    manifest_kind: 'redcube_product_entry_manifest',
    target_domain_id: 'redcube_ai',
    formal_entry: {
      default: 'CLI',
      supported_protocols: ['MCP'],
      internal_surface: 'gateway',
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
