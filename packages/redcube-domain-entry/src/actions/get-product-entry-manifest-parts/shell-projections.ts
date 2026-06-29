// @ts-nocheck
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
  buildOplRuntimeManagerRegistration,
} from '../product-entry-continuity-surfaces.js';
import {
  buildFamilySchedulerReplacementProjection,
  buildOplGenericPrimitiveConsumptionProjection,
  buildOplStabilityReadModelConsumptionProjection,
  buildPrivatizedFunctionalModuleAuditProjection,
  buildOplSubstrateAdapterExportProjection,
  buildVisualPackCompilerHandoffProjection,
} from '../guarded-domain-actions.js';
import { buildTemporalAutonomyReadinessProjection } from '../domain-action-adapter-parts/temporal-autonomy-readiness.js';
import { buildTemporalStageRunConsumptionPolicy } from '../domain-action-adapter-parts/temporal-stage-run-consumption-policy.js';
import { OPL_FRAMEWORK_PROVIDER_RUNTIME_CONTRACT } from './contracts.js';
import { buildProductEntryManifestShellCatalog } from './shell-catalog.js';

export function buildProductEntryManifestShellProjections({
  actionMetadata,
  familyOrchestration,
  humanGateIds,
  nativePptOperatorUx,
  productEntryPreflight,
  productEntrySessionCommand,
  domainActionAdapterForbiddenWrites,
  domainActionAdapterGuardedActionIds,
  pptRoutePolicy,
  pptRouteSelection,
  runtime,
  standardDomainAgentSkeleton,
  workspaceRoot,
}) {
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
      session_continuity_root: runtime.session_continuity_root,
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
  const temporalAutonomyReadiness = buildTemporalAutonomyReadinessProjection({
    familySchedulerReplacement,
    oplGenericPrimitiveConsumption,
    oplStabilityReadModelConsumption,
    standardDomainAgentSkeleton,
    runtimeInventory,
    taskLifecycle,
    domainActionAdapterGuardedActionIds,
  });
  const temporalStageRunConsumptionPolicy = buildTemporalStageRunConsumptionPolicy();
  const shellCatalog = buildProductEntryManifestShellCatalog({
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
    domainActionAdapterForbiddenWrites,
    domainActionAdapterGuardedActionIds,
    runtimeContinuityEnvelope,
    visualPackCompilerHandoff,
    workspaceRoot,
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
            ref: 'packages/redcube-domain-entry/src/actions/get-product-entry-manifest.ts',
            label: 'product-entry manifest builder',
          },
        ],
      },
    ],
    domain_action_adapter_indexes: [],
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
      {
        ref_kind: 'json_pointer',
        ref: '/rca_efficiency_handoff_projection',
        label: 'Agent Lab refs-only efficiency handoff projection',
      },
      {
        ref_kind: 'json_pointer',
        ref: '/operator_evidence_readiness_projection/rca_efficiency_handoff_projection',
        label: 'operator evidence readiness efficiency handoff',
      },
      {
        ref_kind: 'json_pointer',
        ref: '/goal_workflow_agent_lab_suite',
        label: 'Agent Lab /goal workflow suite',
      },
      {
        ref_kind: 'json_pointer',
        ref: '/operator_evidence_readiness_projection/goal_workflow_agent_lab_suite',
        label: 'operator evidence readiness /goal workflow suite',
      },
      {
        ref_kind: 'json_pointer',
        ref: '/ppt_three_route_agent_lab_suite',
        label: 'Agent Lab PPT three-route suite',
      },
      {
        ref_kind: 'json_pointer',
        ref: '/operator_evidence_readiness_projection/ppt_three_route_agent_lab_suite',
        label: 'operator evidence readiness PPT three-route suite',
      },
    ],
  };
  return {
    automation,
    familySchedulerReplacement,
    lifecycleLedger,
    oplGenericPrimitiveConsumption,
    oplProviderRuntimeContract,
    oplRuntimeManagerRegistration,
    oplStabilityReadModelConsumption,
    oplSubstrateAdapterExport,
    ownerRoute,
    persistencePolicy,
    privatizedFunctionalModuleAudit,
    runtimeContinuityEnvelope,
    runtimeInventory,
    taskLifecycle,
    temporalAutonomyReadiness,
    temporalStageRunConsumptionPolicy,
    visualPackCompilerHandoff,
    ...shellCatalog,
  };
}
