// @ts-nocheck
import path from 'node:path';

import { productEntrySessionDir } from '@redcube/runtime';
import { buildManagedRuntimeContract } from 'opl-gateway-shared/managed-runtime-contract';
import {
  buildCheckpointSummary,
  buildRuntimeInventory,
  buildTaskLifecycle,
} from 'opl-gateway-shared/runtime-task-companions';
import {
  buildSkillCatalog,
} from 'opl-gateway-shared/skill-catalog';
import {
  buildAutomationCatalog,
  buildAutomationDescriptor,
} from 'opl-gateway-shared/automation-companions';
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
} from 'opl-gateway-shared/product-entry-companions';

import {
  buildRedCubeDomainEntryContract,
  buildRedCubeGatewayInteractionContract,
  buildRedCubeSharedHandoff,
} from './domain-entry-contract.js';
import { buildFamilyOrchestrationCompanion } from './family-orchestration-companion.js';
import { getProductPreflight } from './get-product-preflight.js';
import { buildOplRuntimeManagerRegistration } from './product-entry-continuity-surfaces.js';
import { buildRouteEquivalenceContract, buildDeliverableFacadeContract } from './get-product-entry-manifest-parts/contracts.js';
import { buildManifestExtraPayload } from './get-product-entry-manifest-parts/extra-payload.js';
import { buildNativePptOperatorUx } from './get-product-entry-manifest-parts/native-ppt-operator-ux.js';
import {
  FEDERATED_PRODUCT_ENTRY_CONTRACT_REF,
  LONG_TASK_STAGE_POLICY,
  MANAGED_PRODUCT_ENTRY_CONTRACT_REF,
  MANAGED_RUNTIME_OWNER,
  PRODUCT_ENTRY_CONTRACT_REF,
  PRODUCT_FEDERATE_COMMAND,
  PRODUCT_FRONTDESK_COMMAND,
  PRODUCT_INVOKE_COMMAND,
  PRODUCT_MANIFEST_COMMAND,
  PRODUCT_SESSION_COMMAND,
  PRODUCT_START_COMMAND,
  SERVICE_SAFE_DOMAIN_ENTRY_CONTRACT_REF,
} from './get-product-entry-manifest-parts/policy.js';
import { normalizeWorkspaceRoot, readCurrentProgramContract, safeText } from './get-product-entry-manifest-parts/utils.js';

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
    productFrontdeskCommand: PRODUCT_FRONTDESK_COMMAND,
    productStartCommand: PRODUCT_START_COMMAND,
    productInvokeCommand: PRODUCT_INVOKE_COMMAND,
    productFederateCommand: PRODUCT_FEDERATE_COMMAND,
    productSessionCommand: PRODUCT_SESSION_COMMAND,
    serviceSafeDomainEntryContractRef: SERVICE_SAFE_DOMAIN_ENTRY_CONTRACT_REF,
    productEntryContractRef: PRODUCT_ENTRY_CONTRACT_REF,
    federatedProductEntryContractRef: FEDERATED_PRODUCT_ENTRY_CONTRACT_REF,
    managedProductEntryContractRef: MANAGED_PRODUCT_ENTRY_CONTRACT_REF,
  });
  const gatewayInteractionContract = buildRedCubeGatewayInteractionContract({
    productFrontdeskCommand: PRODUCT_FRONTDESK_COMMAND,
    productManifestCommand: PRODUCT_MANIFEST_COMMAND,
    federatedProductEntryContractRef: FEDERATED_PRODUCT_ENTRY_CONTRACT_REF,
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
      'Open the RedCube product-entry overview first via the `frontdesk` compatibility command; if the user requested plan/storyline review, invoke with lifecycle_policy=operator_review_after_plan; otherwise direct invoke runs to terminal export unless explicit stop_after_stage or a runtime review gate stops it.'
    ),
    recommended_step_id: 'open_frontdesk',
    steps: [
      {
        step_id: 'open_frontdesk',
        title: 'Open RedCube product-entry overview',
        command: `${PRODUCT_FRONTDESK_COMMAND} --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_frontdesk',
        summary: 'Read the agent-facing product-entry overview for the current workspace; `frontdesk` is the legacy command key, not a GUI shell.',
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
  const productEntryOverview = buildProductEntryOverview({
    summary: 'Repo-verified product-entry overview/intake surface 已 landed；direct invoke 默认 auto_to_terminal；`frontdesk` 仅作为兼容命令键保留，成熟终端用户前台壳与 managed web productization 仍未 landed。',
    frontdesk_command: PRODUCT_FRONTDESK_COMMAND,
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
      '继续把 internal OPL bridge 与同一 downstream product-entry contract 对齐。',
    ],
    remaining_gaps_count: 2,
    human_gate_ids: humanGateIds,
  });
  const productEntryStart = buildProductEntryStart({
    summary: (
      '先读取 RedCube product-entry overview（`frontdesk` 兼容命令）；direct session 默认自动推进到终态，'
      + '需要给外层 OPL shell 走 bridge contract 时使用 internal OPL bridge handoff，已有 session 则直接恢复。'
    ),
    recommended_mode_id: 'open_frontdesk',
    modes: [
      {
        mode_id: 'open_frontdesk',
        title: 'Open RedCube product-entry overview',
        command: `${PRODUCT_FRONTDESK_COMMAND} --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_frontdesk',
        summary: 'Read the agent-facing product-entry overview for the current workspace; `frontdesk` is the legacy command key, not a GUI shell.',
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
        mode_id: 'opl_bridge_handoff',
        title: 'Internal OPL bridge handoff',
        command: (
          `${PRODUCT_FEDERATE_COMMAND} --workspace-root ${workspaceRoot} `
          + '--entry-session-id <entry-session-id> --target-domain-id redcube_ai '
          + '--entry-mode opl_gateway --return-surface-kind product_entry '
          + '--overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>'
        ),
        surface_kind: 'federated_product_entry',
        summary: 'Reserved for OPL shell / compatibility bridge callers while preserving the same downstream product entry contract.',
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
      + 'internal OPL bridge contract 也已冻结给外层壳读取，'
      + '但还不是成熟的最终用户前台或托管 Web 产品。'
    ),
    recommended_start_surface: 'product_frontdesk',
    recommended_start_command: PRODUCT_FRONTDESK_COMMAND,
    recommended_loop_surface: 'product_entry',
    recommended_loop_command: PRODUCT_INVOKE_COMMAND,
    blocking_gaps: [
      '成熟的最终用户前台壳仍未 landed。',
      'managed web productization 仍未 landed。',
    ],
  });
  const runtime = {
    runtime_owner: MANAGED_RUNTIME_OWNER,
    runtime_state_root: path.dirname(sessionStoreRoot),
    session_store_root: sessionStoreRoot,
  };
  const routeEquivalence = buildRouteEquivalenceContract({
    runtime,
    productEntrySessionCommand,
  });
  const managedRuntimeContract = buildManagedRuntimeContract({
    domain_owner: 'redcube_ai',
    executor_owner: 'codex_cli',
    supervision_status_surface: 'product_entry_session',
    attention_queue_surface: 'product_frontdesk',
    recovery_contract_surface: 'product_entry_session',
  });
  const runtimeInventory = buildRuntimeInventory({
    summary: (
      'RedCube managed runtime inventory follows the same session store truth, managed runtime contract, '
      + 'and product-entry preflight/runtime surfaces.'
    ),
    runtime_owner: runtime.runtime_owner,
    domain_owner: managedRuntimeContract.domain_owner,
    executor_owner: managedRuntimeContract.executor_owner,
    substrate: 'external_hermes_agent_target',
    availability: productEntryPreflight.ready_to_try_now ? 'ready' : 'attention_needed',
    health_status: productEntryPreflight.ready_to_try_now ? 'healthy' : 'degraded',
    status_surface: {
      ref_kind: 'json_pointer',
      ref: '/product_entry_preflight',
      label: 'product_entry_preflight',
    },
    attention_surface: {
      ref_kind: 'json_pointer',
      ref: '/frontdesk_surface',
      label: 'product_frontdesk',
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
  const oplRuntimeManagerRegistration = buildOplRuntimeManagerRegistration({ runtimeContinuityEnvelope, productEntrySessionCommand });
  const skillActivationHints = {
    plugin_name: 'redcube-ai',
    skill_semantics: 'single_domain_app_skill',
    canonical_entry_semantics: 'agent_facing_product_entry_overview',
    entry_shell_key: 'frontdesk',
    entry_command: PRODUCT_FRONTDESK_COMMAND,
    supporting_shell_keys: ['direct', 'session'],
    shell_commands: {
      frontdesk: {
        command: PRODUCT_FRONTDESK_COMMAND,
        target_surface_kind: 'product_frontdesk',
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
    summary: 'RedCube AI is exposed as one domain app skill; the `frontdesk` command remains a compatibility key for the agent-facing product-entry overview, while direct invoke and session continuity stay internal product-entry contracts for OPL and operator tooling.',
    skills: [
      {
        skill_id: 'redcube-ai',
        title: 'RedCube AI',
        owner: 'redcube_ai',
        distribution_mode: 'repo_tracked',
        surface_kind: 'product_frontdesk',
        description: 'Operate the RedCube AI domain app through the agent-facing product-entry overview while preserving the `frontdesk` compatibility command and the same direct/session contracts underneath.',
        command: PRODUCT_FRONTDESK_COMMAND,
        readiness: 'landed',
        tags: ['domain-app', 'product-entry', 'visual-deliverables'],
        domain_projection: {
          skill_activation: skillActivationHints,
          runtime_continuity: runtimeContinuityEnvelope,
          opl_runtime_manager_registration: oplRuntimeManagerRegistration,
          long_task_stage_policy: LONG_TASK_STAGE_POLICY,
        },
      },
    ],
    supported_commands: [
      PRODUCT_FRONTDESK_COMMAND,
      PRODUCT_INVOKE_COMMAND,
      PRODUCT_SESSION_COMMAND,
      nativePptOperatorUx.image_proof_runner.helper_command,
      nativePptOperatorUx.proof_runner.helper_command,
    ],
    command_contracts: [
      {
        command: PRODUCT_FRONTDESK_COMMAND,
        shell_key: 'frontdesk',
        target_surface_kind: 'product_frontdesk',
      },
      {
        command: PRODUCT_INVOKE_COMMAND,
        shell_key: 'direct',
        target_surface_kind: 'product_entry',
      },
      {
        command: PRODUCT_SESSION_COMMAND,
        shell_key: 'session',
        target_surface_kind: 'product_entry_session',
      },
      {
        command: nativePptOperatorUx.image_proof_runner.helper_command,
        shell_key: 'image_ppt_proof',
        target_surface_kind: 'image_ppt_product_entry_proof',
        public_skill_policy: 'do_not_register_as_second_public_skill',
      },
      {
        command: nativePptOperatorUx.proof_runner.helper_command,
        shell_key: 'native_ppt_proof',
        target_surface_kind: 'native_ppt_product_entry_proof',
        public_skill_policy: 'do_not_register_as_second_public_skill',
      },
    ],
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
  const productEntryShell = buildProductEntryShellCatalog({
    frontdesk: {
      command: PRODUCT_FRONTDESK_COMMAND,
      command_template: `${PRODUCT_FRONTDESK_COMMAND} --workspace-root ${workspaceRoot}`,
      surface_kind: 'product_frontdesk',
      purpose: (
        '当前 agent-facing product-entry overview/intake shell；`frontdesk` 只是兼容命令键，'
        + '用于暴露 direct / session 入口，并把 internal OPL bridge 保持在单独的 bridge contract。'
      ),
      extra_payload: {
        canonical_entry_semantics: 'agent_facing_product_entry_overview',
        legacy_command_key: 'frontdesk',
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
    },
    opl_bridge: {
      command: PRODUCT_FEDERATE_COMMAND,
      command_template: (
        `${PRODUCT_FEDERATE_COMMAND} --workspace-root ${workspaceRoot} `
        + '--entry-session-id <entry-session-id> --target-domain-id redcube_ai '
        + '--entry-mode opl_gateway --return-surface-kind product_entry '
        + '--overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>'
      ),
      surface_kind: 'federated_product_entry',
      purpose: '通过 internal OPL bridge 进入同一 downstream product entry，保留给外层 shell / compatibility bridge。',
    },
    session: {
      command: PRODUCT_SESSION_COMMAND,
      command_template: productEntrySessionCommand,
      surface_kind: 'product_entry_session',
      purpose: '在已有 entry_session_id 下继续同一交付并检查当前 session 进度。',
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
        allowed_routes: nativePptOperatorUx.image_proof_runner.allowed_routes,
      },
    },
  });
  const frontdeskSurface = buildProductEntryShellLinkedSurface({
    shell_key: 'frontdesk',
    shell_surface: productEntryShell.frontdesk,
    summary: productEntryShell.frontdesk.purpose,
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
    opl_bridge_handoff: {
      command: productEntryShell.opl_bridge.command,
      surface_kind: productEntryShell.opl_bridge.surface_kind,
      summary: productEntryShell.opl_bridge.purpose,
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
    frontdesk_surface: frontdeskSurface,
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
      summary: 'Repo-verified product-entry overview/intake surface 已 landed；direct invoke 默认 auto_to_terminal；`frontdesk` 仅作为兼容命令键保留，成熟终端用户前台壳与 managed web productization 仍未 landed。',
      next_focus: [
        '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry overview/intake service surface 之上。',
        '继续把 internal OPL bridge 与同一 downstream product-entry contract 对齐。',
      ],
      remaining_gaps_count: 2,
    },
    runtime,
    managed_runtime_contract: managedRuntimeContract,
    runtime_inventory: runtimeInventory,
    task_lifecycle: taskLifecycle,
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
    ppt_deck_visual_route_truth: {
      surface_kind: 'ppt_deck_visual_route_truth',
      default_visual_route: pptRoutePolicy.default_visual_route,
      default_visual_policy: pptRoutePolicy.default_visual_policy,
      protected_stage_sequence: pptRoutePolicy.protected_stage_sequence,
      route_selection_policy: pptRoutePolicy.route_selection_policy,
      image_provider_diagnostics: nativePptOperatorUx.image_provider_diagnostics,
    },
	    product_entry_readiness: productEntryReadiness,
    product_entry_quickstart: productEntryQuickstart,
    family_orchestration: familyOrchestration,
    notes: [
      'This manifest freezes the current repo-verified RedCube product-entry overview/intake service surface; `frontdesk` is retained only as the compatibility command key.',
      'The OPL bridge stays available as an internal integration contract instead of a first-read user entry shell.',
      'It does not claim that a mature end-user shell or managed web productization is already landed.',
    ],
    domain_entry_contract: domainEntryContract,
	    gateway_interaction_contract: gatewayInteractionContract,
	    extra_payload: buildManifestExtraPayload({
      routeEquivalence,
      deliverableFacade,
      nativePptOperatorUx,
      productEntrySessionCommand,
    }),
	  });
  return {
    ...manifest,
    native_ppt_operator_ux: nativePptOperatorUx,
    ppt_deck_visual_route_truth: {
      surface_kind: 'ppt_deck_visual_route_truth',
      default_visual_route: pptRoutePolicy.default_visual_route,
      default_visual_policy: pptRoutePolicy.default_visual_policy,
      protected_stage_sequence: pptRoutePolicy.protected_stage_sequence,
      route_selection_policy: pptRoutePolicy.route_selection_policy,
      image_provider_diagnostics: nativePptOperatorUx.image_provider_diagnostics,
    },
    product_entry_shell: {
      ...manifest.product_entry_shell,
      native_ppt_proof: productEntryShell.native_ppt_proof,
      image_ppt_proof: productEntryShell.image_ppt_proof,
    },
    operator_loop_actions: {
      ...manifest.operator_loop_actions,
      run_native_ppt_proof: operatorLoopActions.run_native_ppt_proof,
      run_image_ppt_proof: operatorLoopActions.run_image_ppt_proof,
    },
    skill_catalog: {
      ...manifest.skill_catalog,
      supported_commands: [...new Set([
        ...(manifest.skill_catalog?.supported_commands || []),
        nativePptOperatorUx.image_proof_runner.helper_command,
        nativePptOperatorUx.proof_runner.helper_command,
      ])],
      command_contracts: [
        ...(manifest.skill_catalog?.command_contracts || [])
          .filter((contract) => contract?.command !== nativePptOperatorUx.proof_runner.helper_command)
          .filter((contract) => contract?.command !== nativePptOperatorUx.image_proof_runner.helper_command),
        {
          command: nativePptOperatorUx.image_proof_runner.helper_command,
          shell_key: 'image_ppt_proof',
          target_surface_kind: 'image_ppt_product_entry_proof',
          public_skill_policy: 'do_not_register_as_second_public_skill',
        },
        {
          command: nativePptOperatorUx.proof_runner.helper_command,
          shell_key: 'native_ppt_proof',
          target_surface_kind: 'native_ppt_product_entry_proof',
          public_skill_policy: 'do_not_register_as_second_public_skill',
        },
      ],
    },
  };
	}
