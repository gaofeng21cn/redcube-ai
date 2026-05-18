// @ts-nocheck
import path from 'node:path';

import { productEntrySessionDir } from '@redcube/runtime';
import { buildManagedRuntimeContract } from 'opl-framework-shared/managed-runtime-contract';
import {
  buildCheckpointSummary,
  buildRuntimeInventory,
  buildTaskLifecycle,
} from 'opl-framework-shared/runtime-task-companions';
import {
  buildSkillCatalog,
} from 'opl-framework-shared/skill-catalog';
import {
  buildAutomationCatalog,
  buildAutomationDescriptor,
} from 'opl-framework-shared/automation-companions';
import {
  buildFamilyProductEntryManifest,
  buildOperatorLoopActionCatalog,
  buildProductEntryStart,
  buildProductEntryOverview,
  buildProductEntryQuickstart,
  buildProductEntryReadiness,
  buildProductEntryResumeSurface,
  buildProductEntryShellCatalog,
  buildProductEntryShellLinkedSurface,
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
  OPL_FRAMEWORK_MANAGED_RUNTIME_CONTRACT,
  buildRouteEquivalenceContract,
  buildDeliverableFacadeContract,
} from './get-product-entry-manifest-parts/contracts.js';
import { buildManifestExtraPayload } from './get-product-entry-manifest-parts/extra-payload.js';
import { buildReturnedManifestProjection } from './get-product-entry-manifest-parts/manifest-return.js';
import { buildNativePptOperatorUx } from './get-product-entry-manifest-parts/native-ppt-operator-ux.js';
import {
  DEFAULT_RUNTIME_OWNER,
  OPL_HOSTED_PRODUCT_ENTRY_CONTRACT_REF,
  LONG_TASK_STAGE_POLICY,
  MANAGED_PRODUCT_ENTRY_CONTRACT_REF,
  PRODUCT_ENTRY_CONTRACT_REF,
  OPL_HOSTED_HANDOFF_REF,
  PRODUCT_STATUS_COMMAND,
  PRODUCT_INVOKE_COMMAND,
  PRODUCT_MANIFEST_COMMAND,
  PRODUCT_SESSION_COMMAND,
  PRODUCT_START_COMMAND,
  SERVICE_SAFE_DOMAIN_ENTRY_CONTRACT_REF,
} from './get-product-entry-manifest-parts/policy.js';
import { normalizeWorkspaceRoot, readCurrentProgramContract, safeText } from './get-product-entry-manifest-parts/utils.js';
import { buildWorkspaceReceiptInventoryProjection } from './get-product-entry-manifest-parts/workspace-receipt-inventory.js';
import { buildVisualTransitionEvaluatorProjection } from './product-sidecar-parts/visual-transition-evaluator.js';

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
    managedProductEntryContractRef: MANAGED_PRODUCT_ENTRY_CONTRACT_REF,
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
  const productEntryQuickstart = buildProductEntryQuickstart({
    summary: (
      'Open the RedCube product-entry overview first via the `status` command; if the user requested plan/storyline review, invoke with lifecycle_policy=operator_review_after_plan; otherwise direct invoke runs to terminal export unless explicit stop_after_stage or a runtime review gate stops it.'
    ),
    recommended_step_id: 'open_status',
    steps: [
      {
        step_id: 'open_status',
        title: 'Open RedCube product-entry overview',
        command: `${PRODUCT_STATUS_COMMAND} --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_status',
        summary: 'Read the agent-facing product-entry overview for the current workspace; `status` is the product overview command, not a GUI shell.',
        requires: [],
      },
      {
        step_id: 'continue_current_loop',
        title: 'Continue current deliverable loop',
        command: (
          `${PRODUCT_INVOKE_COMMAND} --workspace-root ${workspaceRoot} `
          + '--entry-session-id <entry-session-id> --overlay <overlay-id> '
          + '--topic-id <topic-id> --deliverable-id <deliverable-id>'
        ),
        surface_kind: 'product_entry',
        summary: 'Run the current deliverable loop; use lifecycle_policy=operator_review_after_plan for review-first deck tasks, otherwise it runs to terminal export unless explicit stop_after_stage or a runtime review gate stops it.',
        requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
      {
        step_id: 'inspect_current_progress',
        title: 'Inspect current session progress',
        command: productEntrySessionCommand,
        surface_kind: 'product_entry_session',
        summary: 'Inspect the current session progress for the same deliverable.',
        requires: ['entry_session_id'],
      },
      {
        step_id: 'default_image_ppt_proof',
        title: 'Run default image-first PPT proof',
        command: nativePptOperatorUx.image_proof_runner.command_template,
        surface_kind: 'image_ppt_product_entry_proof',
        summary: 'Default ppt_deck visual route uses image-first page authoring; style_reference_dir is accepted through delivery_request.style_reference_dir and provider diagnostics expose blocked_reason.',
        requires: ['entry_session_id', 'topic_id', 'deliverable_id'],
      },
      {
        step_id: 'optional_native_ppt_proof',
        title: 'Run optional native PPT proof',
        command: nativePptOperatorUx.proof_runner.command_template,
        surface_kind: 'native_ppt_product_entry_proof',
        summary: 'Use only when the operator explicitly selects the native PPT proof lane; this helper delegates to the repo-owned route runner and preserves review/export gates.',
        requires: ['entry_session_id', 'topic_id', 'deliverable_id'],
      },
    ],
    resume_contract: familyOrchestration.resume_contract,
    human_gate_ids: humanGateIds,
  });
  const productEntryOverview = {
    ...buildProductEntryOverview({
    summary: 'Repo-verified product-entry overview/intake surface 已 landed；默认 invoke 生成 OPL stage execution plan 并交给 OPL provider 推进；`status` 是当前 product overview 命令，成熟终端用户前台壳与 managed web productization 仍未 landed。',
    product_entry_command: PRODUCT_STATUS_COMMAND,
    recommended_command: PRODUCT_INVOKE_COMMAND,
    operator_loop_command: PRODUCT_INVOKE_COMMAND,
    progress_surface: {
      surface_kind: 'product_entry_session',
      command: productEntrySessionCommand,
      step_id: 'inspect_current_progress',
    },
    resume_surface: buildProductEntryResumeSurface(
      productEntrySessionCommand,
      familyOrchestration.resume_contract,
    ),
    recommended_step_id: productEntryQuickstart.recommended_step_id,
    next_focus: [
      '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry overview/intake service surface 之上。',
      '继续把 OPL-hosted stage runtime handoff 作为默认 production consumption 路径验证到真实长跑证据。',
    ],
    remaining_gaps_count: 2,
    human_gate_ids: humanGateIds,
    }),
    entry_status_command: PRODUCT_STATUS_COMMAND,
  };
  const productEntryStart = buildProductEntryStart({
    summary: (
      '先读取 RedCube product-entry overview（`status` 命令）；direct session 默认自动推进到终态，'
      + '需要给 OPL framework 托管时使用 OPL-hosted stage runtime handoff，已有 session 则直接恢复。'
    ),
    recommended_mode_id: 'open_status',
    modes: [
      {
        mode_id: 'open_status',
        title: 'Open RedCube product-entry overview',
        command: `${PRODUCT_STATUS_COMMAND} --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_status',
        summary: 'Read the agent-facing product-entry overview for the current workspace; `status` is the product overview command, not a GUI shell.',
        requires: [],
      },
      {
        mode_id: 'start_direct_session',
        title: 'Start direct session',
        command: (
          `${PRODUCT_INVOKE_COMMAND} --workspace-root ${workspaceRoot} `
          + '--entry-session-id <entry-session-id> --overlay <overlay-id> '
          + '--topic-id <topic-id> --deliverable-id <deliverable-id>'
        ),
        surface_kind: 'product_entry',
        summary: 'Start or continue a direct RedCube product-entry session; set lifecycle_policy=operator_review_after_plan for review-first planning, or omit stop_after_stage for autonomous terminal export.',
        requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
      {
        mode_id: 'opl_hosted_handoff',
        title: 'OPL-hosted stage runtime handoff',
        command: OPL_HOSTED_HANDOFF_REF,
        action_ref: OPL_HOSTED_HANDOFF_REF,
        surface_kind: 'opl_hosted_product_entry',
        summary: 'Reserved for OPL framework callers while preserving the same downstream product entry contract.',
        requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
      {
        mode_id: 'resume_session',
        title: 'Resume session',
        command: productEntrySessionCommand,
        surface_kind: 'product_entry_session',
        summary: 'Resume an existing RedCube product-entry session by entry_session_id.',
        requires: ['entry_session_id'],
      },
    ],
    resume_surface: buildProductEntryResumeSurface(
      productEntrySessionCommand,
      familyOrchestration.resume_contract,
    ),
    human_gate_ids: humanGateIds,
  });
  const productEntryReadiness = buildProductEntryReadiness({
    verdict: 'service_surface_ready_not_managed_product',
    usable_now: true,
    good_to_use_now: false,
    fully_automatic: false,
    summary: (
      '当前可以作为 RedCube 的 agent-facing product-entry overview / CLI product-entry 主线使用，'
      + '默认 product-entry 已返回 OPL stage execution plan / RCA authority refs，'
      + '但还不是成熟的最终用户前台或托管 Web 产品。'
    ),
    recommended_start_surface: 'product_status',
    recommended_start_command: PRODUCT_STATUS_COMMAND,
    recommended_loop_surface: 'product_entry',
    recommended_loop_command: PRODUCT_INVOKE_COMMAND,
    blocking_gaps: [
      '成熟的最终用户前台壳仍未 landed。',
      'managed web productization 仍未 landed。',
    ],
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
  const managedRuntimeContract = buildManagedRuntimeContract({
    runtime_owner: runtime.runtime_owner,
    domain_owner: 'redcube_ai',
    executor_owner: 'configured_by_opl_runtime_provider',
    supervision_status_surface: 'product_entry_session',
    attention_queue_surface: 'product_status',
    recovery_contract_surface: 'product_entry_session',
    contract: OPL_FRAMEWORK_MANAGED_RUNTIME_CONTRACT,
  });
  const runtimeInventory = buildRuntimeInventory({
    summary: (
      'RedCube managed runtime inventory follows the same session store truth, managed runtime contract, '
      + 'and product-entry preflight/runtime surfaces.'
    ),
    runtime_owner: runtime.runtime_owner,
    domain_owner: managedRuntimeContract.domain_owner,
    executor_owner: managedRuntimeContract.executor_owner,
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
      managed_runtime_contract_ref: managedRuntimeContract.shared_contract_ref,
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
    task_id: safeText(activeBaton.id, 'redcube_product_entry_loop'),
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
    domain_owner: managedRuntimeContract.domain_owner,
    executor_owner: managedRuntimeContract.executor_owner,
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
  const skillCommandContracts = actionMetadata.skill_commands.map((contract) => {
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
  });
  const skillActivationHints = {
    plugin_name: 'redcube-ai',
    skill_semantics: 'single_domain_app_skill',
    canonical_entry_semantics: 'agent_facing_product_entry_overview',
    generated_interface_owner: 'one-person-lab',
    domain_handler_owner: 'redcube_ai',
    repo_local_redcube_cli_role: 'domain_handler_target_or_direct_domain_entry_only',
    repo_local_redcube_mcp_role: 'domain_handler_target_or_direct_protocol_adapter_only',
    entry_shell_key: 'status',
    entry_command: PRODUCT_STATUS_COMMAND,
    supporting_shell_keys: ['direct', 'session'],
    shell_commands: {
      status: {
        command: PRODUCT_STATUS_COMMAND,
        target_surface_kind: 'product_status',
      },
      direct: {
        command: PRODUCT_INVOKE_COMMAND,
        target_surface_kind: 'product_entry',
      },
      session: {
        command: PRODUCT_SESSION_COMMAND,
        target_surface_kind: 'product_entry_session',
      },
      native_ppt_proof: {
        command: nativePptOperatorUx.proof_runner.helper_command,
        target_surface_kind: 'native_ppt_product_entry_proof',
        role: 'controlled_operator_helper',
      },
      image_ppt_proof: {
        command: nativePptOperatorUx.image_proof_runner.helper_command,
        target_surface_kind: 'image_ppt_product_entry_proof',
        role: 'controlled_operator_helper',
      },
    },
  };
  const skillCatalog = buildSkillCatalog({
    summary: 'RedCube AI is exposed as one domain app skill; the `status` command is the agent-facing product-entry overview command, while direct invoke and session continuity stay internal product-entry contracts for OPL and operator tooling.',
    skills: [
      {
        skill_id: 'redcube-ai',
        title: 'RedCube AI',
        owner: 'one-person-lab',
        domain_handler_owner: 'redcube_ai',
        distribution_mode: 'opl_generated_descriptor_with_repo_local_handler_targets',
        surface_kind: 'product_status',
        description: 'Operate the RedCube AI domain app through the agent-facing product-entry overview while using the `status` product overview command and the same direct/session contracts underneath.',
        command: PRODUCT_STATUS_COMMAND,
        readiness: 'landed',
        tags: ['domain-app', 'product-entry', 'visual-deliverables'],
        domain_projection: {
          skill_activation: skillActivationHints,
          runtime_continuity: runtimeContinuityEnvelope,
          opl_runtime_manager_registration: oplRuntimeManagerRegistration,
          long_task_stage_policy: LONG_TASK_STAGE_POLICY,
          family_action_catalog_ref: {
            ref_kind: 'json_pointer',
            ref: '/family_action_catalog',
            label: 'RedCube family action catalog',
          },
          domain_memory_descriptor_locator_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator', label: 'RCA visual pattern memory descriptor locator' },
          domain_memory_descriptor_ref: { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor', label: 'RCA OPL family domain memory ref' },
        },
      },
    ],
    supported_commands: actionMetadata.skill_commands.map((contract) => contract.command),
    command_contracts: skillCommandContracts,
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
          'update latest managed continuation handle',
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
  const productEntryShell = buildProductEntryShellCatalog({
    status: {
      command: PRODUCT_STATUS_COMMAND,
      command_template: `${PRODUCT_STATUS_COMMAND} --workspace-root ${workspaceRoot}`,
      surface_kind: 'product_status',
      purpose: (
        '当前 agent-facing product-entry overview/intake shell；`status` 是当前 product overview 命令，'
        + '用于暴露 direct / session 入口，并把 OPL-hosted stage runtime handoff 保持在单独的 bridge contract。'
      ),
      extra_payload: {
        generated_interface_owner: 'one-person-lab',
        domain_handler_owner: 'redcube_ai',
        repo_local_command_role: 'domain_status_projection_target',
        canonical_entry_semantics: 'agent_facing_product_entry_overview',
        command_key: 'status',
        claims_gui_shell: false,
        ppt_deck_default_visual_route: pptRoutePolicy.default_visual_route,
        ppt_deck_default_visual_policy: pptRoutePolicy.default_visual_policy,
        route_selection_policy: pptRoutePolicy.route_selection_policy,
        style_reference_dir_input: pptRouteSelection.style_reference_dir_input,
        provider_diagnostics: nativePptOperatorUx.image_provider_diagnostics,
      },
    },
    direct: {
      command: PRODUCT_INVOKE_COMMAND,
      command_template: (
        `${PRODUCT_INVOKE_COMMAND} --workspace-root ${workspaceRoot} `
        + '--entry-session-id <entry-session-id> --overlay <overlay-id> '
        + '--topic-id <topic-id> --deliverable-id <deliverable-id>'
      ),
      surface_kind: 'product_entry',
      purpose: '直接进入当前 deliverable loop 的 primary operator surface。',
      extra_payload: {
        generated_interface_owner: 'one-person-lab',
        domain_handler_owner: 'redcube_ai',
        repo_local_command_role: 'direct_domain_entry_target',
      },
    },
    opl_hosted: {
      command: OPL_HOSTED_HANDOFF_REF,
      action_ref: OPL_HOSTED_HANDOFF_REF,
      surface_kind: 'opl_hosted_product_entry',
      purpose: '通过 OPL framework hosted stage runtime handoff 进入同一 downstream product entry。',
    },
    session: {
      command: PRODUCT_SESSION_COMMAND,
      command_template: productEntrySessionCommand,
      surface_kind: 'product_entry_session',
      purpose: '在已有 entry_session_id 下继续同一交付并检查当前 session 进度。',
      extra_payload: {
        generated_interface_owner: 'one-person-lab',
        domain_handler_owner: 'redcube_ai',
        repo_local_command_role: 'entry_session_domain_snapshot_refs_adapter',
      },
    },
    sidecar: {
      command: 'redcube product sidecar',
      command_template: `redcube product sidecar export --workspace-root ${workspaceRoot} --format json`,
      dispatch_command_template: 'redcube product sidecar dispatch --task <task.json> --format json',
      surface_kind: 'product_sidecar_adapter',
      purpose: 'RCA product sidecar adapter for the configured OPL family runtime provider; dispatch exposes only RCA receipt/verdict/ref authority actions plus read-only watch, while generic supervise and product-entry continuation stay with OPL runner/session shell.',
      extra_payload: {
        generated_interface_owner: 'one-person-lab',
        domain_handler_owner: 'redcube_ai',
        repo_local_command_role: 'domain_sidecar_target',
        runtime_owner: 'configured_family_runtime_provider',
        provider_transport_owner: 'opl_family_runtime_provider',
        control_plane_owner: 'opl',
        domain_truth_owner: 'redcube_ai',
        allowed_actions: listProductSidecarGuardedActionIds(),
        forbidden_writes: listProductSidecarForbiddenWrites(),
        family_scheduler_replacement: familySchedulerReplacement,
        opl_generic_primitive_consumption: oplGenericPrimitiveConsumption,
        opl_stability_read_model_consumption: oplStabilityReadModelConsumption,
        privatized_functional_module_audit: privatizedFunctionalModuleAudit,
        opl_substrate_adapter_export: oplSubstrateAdapterExport,
        visual_pack_compiler_handoff: visualPackCompilerHandoff,
        workspace_receipt_inventory_projection_ref: '/workspace_receipt_inventory_projection',
        visual_transition_evaluator_ref: '/visual_transition_evaluator',
      },
    },
    native_ppt_proof: {
      command: nativePptOperatorUx.proof_runner.helper_command,
      command_template: nativePptOperatorUx.proof_runner.command_template,
      surface_kind: 'native_ppt_product_entry_proof',
      purpose: '受控 operator helper；仅在显式选择 native PPT proof lane 时调用 repo-owned route runner，不注册第二公开 skill。',
      extra_payload: {
        selectable_status: nativePptOperatorUx.status,
        blocked_reason: nativePptOperatorUx.blocked_reason,
        allowed_routes: nativePptOperatorUx.proof_runner.allowed_routes,
      },
    },
    image_ppt_proof: {
      command: nativePptOperatorUx.image_proof_runner.helper_command,
      command_template: nativePptOperatorUx.image_proof_runner.command_template,
      surface_kind: 'image_ppt_product_entry_proof',
      purpose: '受控 operator helper；映射 ppt_deck 默认 image-first proof route，不注册第二公开 skill。',
      extra_payload: {
        default_visual_route: pptRoutePolicy.default_visual_route,
        default_visual_policy: pptRoutePolicy.default_visual_policy,
        style_reference_dir_input: pptRouteSelection.style_reference_dir_input,
        provider_diagnostics: nativePptOperatorUx.image_provider_diagnostics,
        image_first_proof_readiness: nativePptOperatorUx.image_first_proof_readiness,
        style_reference_summary: nativePptOperatorUx.style_reference_summary,
        cache_status: nativePptOperatorUx.cache_status,
        artifact_inventory: nativePptOperatorUx.artifact_inventory,
        allowed_routes: nativePptOperatorUx.image_proof_runner.allowed_routes,
      },
    },
  });
  const entryStatusSurface = buildProductEntryShellLinkedSurface({
    shell_key: 'status',
    shell_surface: productEntryShell.status,
    summary: productEntryShell.status.purpose,
  });
  const operatorLoopSurface = buildProductEntryShellLinkedSurface({
    shell_key: 'direct',
    shell_surface: productEntryShell.direct,
    summary: (
      '当前 operator loop 仍 anchored on direct product entry；'
      + '拿到 entry_session_id 后继续通过 session surface 追踪同一交付。'
    ),
    extra_payload: {
      continuation_shell_key: 'session',
      continuation_command: productEntryShell.session.command,
    },
  });
  const operatorLoopActions = buildOperatorLoopActionCatalog({
    start_deliverable: {
      command: productEntryShell.direct.command,
      surface_kind: productEntryShell.direct.surface_kind,
      summary: productEntryShell.direct.purpose,
      requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
    },
    continue_session: {
      command: productEntryShell.session.command,
      surface_kind: productEntryShell.session.surface_kind,
      summary: productEntryShell.session.purpose,
      requires: ['entry_session_id'],
    },
    opl_hosted_handoff: {
      command: productEntryShell.opl_hosted.command,
      action_ref: productEntryShell.opl_hosted.action_ref,
      surface_kind: productEntryShell.opl_hosted.surface_kind,
      summary: productEntryShell.opl_hosted.purpose,
      requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
    },
    run_native_ppt_proof: {
      command: productEntryShell.native_ppt_proof.command,
      surface_kind: productEntryShell.native_ppt_proof.surface_kind,
      summary: productEntryShell.native_ppt_proof.purpose,
      requires: ['entry_session_id', 'topic_id', 'deliverable_id'],
    },
    run_image_ppt_proof: {
      command: productEntryShell.image_ppt_proof.command,
      surface_kind: productEntryShell.image_ppt_proof.surface_kind,
      summary: productEntryShell.image_ppt_proof.purpose,
      requires: ['entry_session_id', 'topic_id', 'deliverable_id'],
    },
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
      active_baton_id: safeText(activeBaton.id, 'unknown_baton'),
      active_baton_status: safeText(activeBaton.status, 'unknown'),
    },
    product_entry_status: {
      summary: 'Repo-verified product-entry overview/intake surface 已 landed；direct invoke 默认 auto_to_terminal；`status` 是当前 product overview 命令，成熟终端用户前台壳与 managed web productization 仍未 landed。',
      next_focus: [
        '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry overview/intake service surface 之上。',
        '继续把 OPL-hosted stage runtime handoff 与同一 downstream product-entry contract 对齐。',
      ],
      remaining_gaps_count: 2,
    },
    runtime,
    managed_runtime_contract: managedRuntimeContract,
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
      'It does not claim that a mature end-user shell or managed web productization is already landed.',
    ],
    domain_entry_contract: domainEntryContract,
	    user_interaction_contract: userInteractionContract,
	    extra_payload: buildManifestExtraPayload({
      routeEquivalence,
      deliverableFacade,
      nativePptOperatorUx,
      productEntrySessionCommand,
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
    oplGenericPrimitiveConsumption,
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
  });
		}
