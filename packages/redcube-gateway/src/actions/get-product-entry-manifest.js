import path from 'node:path';
import { readFileSync } from 'node:fs';

import { productEntrySessionDir } from '@redcube/runtime';
import { buildManagedRuntimeContract } from 'opl-gateway-shared/managed-runtime-contract';
import {
  buildCheckpointSummary,
  buildRuntimeInventory,
  buildTaskLifecycle,
} from 'opl-gateway-shared/runtime-task-companions';
import {
  buildSkillCatalog,
  buildSkillDescriptor,
} from 'opl-gateway-shared/skill-catalog';
import {
  buildAutomationCatalog,
  buildAutomationDescriptor,
} from 'opl-gateway-shared/automation-companions';
import {
  buildFamilyProductEntryManifest,
  buildProductEntryStart,
  buildProductEntryOverview,
  buildProductEntryQuickstart,
  buildProductEntryReadiness,
  buildProductEntryResumeSurface,
  collectFamilyHumanGateIds,
} from 'opl-gateway-shared/product-entry-companions';

import {
  buildRedCubeDomainEntryContract,
  buildRedCubeGatewayInteractionContract,
  buildRedCubeSharedHandoff,
} from './domain-entry-contract.js';
import { buildFamilyOrchestrationCompanion } from './family-orchestration-companion.js';
import { getProductPreflight } from './get-product-preflight.js';

const MANAGED_RUNTIME_OWNER = 'upstream_hermes_agent';
const PRODUCT_MANIFEST_COMMAND = 'redcube product manifest';
const PRODUCT_FRONTDESK_COMMAND = 'redcube product frontdesk';
const PRODUCT_START_COMMAND = 'redcube product start';
const PRODUCT_INVOKE_COMMAND = 'redcube product invoke';
const PRODUCT_FEDERATE_COMMAND = 'redcube product federate';
const PRODUCT_SESSION_COMMAND = 'redcube product session';
const PRODUCT_ENTRY_CONTRACT_REF = 'contracts/runtime-program/redcube-product-entry-mvp.json';
const FEDERATED_PRODUCT_ENTRY_CONTRACT_REF = 'contracts/runtime-program/opl-gateway-federated-product-entry.json';
const MANAGED_PRODUCT_ENTRY_CONTRACT_REF = 'contracts/runtime-program/managed-product-entry-hardening.json';
const SERVICE_SAFE_DOMAIN_ENTRY_CONTRACT_REF = 'contracts/runtime-program/service-safe-domain-entry-adapter.json';

const CURRENT_PROGRAM_CONTRACT_URL = new URL(
  '../../../../contracts/runtime-program/current-program.json',
  import.meta.url,
);
function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function requireField(name, value) {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

function normalizeWorkspaceRoot(request) {
  return requireField(
    'workspace_root',
    request?.workspace_root || request?.workspaceRoot || request?.workspace_locator?.workspace_root,
  );
}

function readCurrentProgramContract() {
  return JSON.parse(readFileSync(CURRENT_PROGRAM_CONTRACT_URL, 'utf8'));
}

export async function getProductEntryManifest(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const sessionStoreRoot = productEntrySessionDir();
  const productEntrySessionCommand = `${PRODUCT_SESSION_COMMAND} --entry-session-id <entry-session-id>`;
  const productEntryPreflight = await getProductPreflight({ workspace_root: workspaceRoot });
  const currentProgram = readCurrentProgramContract();
  const currentState = currentProgram.current_state || {};
  const activeMainline = currentState.active_mainline || {};
  const activeBaton = currentState.active_baton || {};
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
      'Open the RedCube frontdesk first, then continue the same deliverable loop or inspect the current entry session.'
    ),
    recommended_step_id: 'open_frontdesk',
    steps: [
      {
        step_id: 'open_frontdesk',
        title: 'Open RedCube frontdesk',
        command: `${PRODUCT_FRONTDESK_COMMAND} --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_frontdesk',
        summary: 'Open the direct RedCube frontdesk for the current workspace.',
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
        summary: 'Continue the current deliverable loop once identifiers are known.',
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
    ],
    resume_contract: familyOrchestration.resume_contract,
    human_gate_ids: humanGateIds,
  });
  const productEntryOverview = buildProductEntryOverview({
    summary: 'Repo-verified product-entry service surface 已 landed，但成熟终端用户前台壳与 managed web productization 仍未 landed。',
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
      '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry service surface 之上。',
      '继续把 internal OPL bridge 与同一 downstream product-entry contract 对齐。',
    ],
    remaining_gaps_count: 2,
    human_gate_ids: humanGateIds,
  });
  const productEntryStart = buildProductEntryStart({
    summary: (
      '先打开 RedCube frontdesk；需要直接起一个新会话就走 direct session，'
      + '需要给外层 OPL shell 走 bridge contract 时使用 internal OPL bridge handoff，已有 session 则直接恢复。'
    ),
    recommended_mode_id: 'open_frontdesk',
    modes: [
      {
        mode_id: 'open_frontdesk',
        title: 'Open RedCube frontdesk',
        command: `${PRODUCT_FRONTDESK_COMMAND} --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_frontdesk',
        summary: 'Open the direct RedCube frontdesk for the current workspace.',
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
        summary: 'Start or continue a direct RedCube product-entry session for one deliverable.',
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
      '当前可以作为 RedCube 的 direct frontdesk / CLI product-entry 主线使用，'
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
  const skillCatalog = buildSkillCatalog({
    summary: 'RedCube product-entry skill catalog spans frontdesk, direct invoke, and session continuity shells; the internal OPL bridge stays in separately tracked integration records.',
    skills: [
      buildSkillDescriptor({
        skill_id: 'redcube_product_frontdesk',
        title: 'RedCube product frontdesk',
        owner: 'redcube_ai',
        distribution_mode: 'repo_tracked',
        surface_kind: 'product_frontdesk',
        description: 'Open the canonical product frontdesk shell for this workspace.',
        command: PRODUCT_FRONTDESK_COMMAND,
        readiness: 'landed',
        tags: ['frontdesk', 'product-entry', 'workspace'],
      }),
      buildSkillDescriptor({
        skill_id: 'redcube_product_entry_direct',
        title: 'RedCube product entry direct loop',
        owner: 'redcube_ai',
        distribution_mode: 'repo_tracked',
        surface_kind: 'product_entry',
        description: 'Run the direct same-session deliverable loop through product entry.',
        command: PRODUCT_INVOKE_COMMAND,
        readiness: 'landed',
        tags: ['direct', 'deliverable', 'operator-loop'],
      }),
      buildSkillDescriptor({
        skill_id: 'redcube_product_entry_session',
        title: 'RedCube product entry session continuation',
        owner: 'redcube_ai',
        distribution_mode: 'repo_tracked',
        surface_kind: 'product_entry_session',
        description: 'Inspect and continue the same deliverable loop by entry_session_id.',
        command: PRODUCT_SESSION_COMMAND,
        readiness: 'landed',
        tags: ['session', 'continuation', 'runtime'],
      }),
    ],
    supported_commands: [
      PRODUCT_FRONTDESK_COMMAND,
      PRODUCT_INVOKE_COMMAND,
      PRODUCT_SESSION_COMMAND,
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

  return buildFamilyProductEntryManifest({
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
    frontdesk_surface: {
      shell_key: 'frontdesk',
      command: PRODUCT_FRONTDESK_COMMAND,
      surface_kind: 'product_frontdesk',
      summary: '当前 direct RedCube frontdesk，先暴露 direct / session 入口，并把 internal OPL bridge 保持在单独的 bridge contract。',
    },
    operator_loop_surface: {
      shell_key: 'direct',
      command: PRODUCT_INVOKE_COMMAND,
      surface_kind: 'product_entry',
      summary: (
        '当前 operator loop 仍 anchored on direct product entry；'
        + '拿到 entry_session_id 后继续通过 session surface 追踪同一交付。'
      ),
      continuation_shell_key: 'session',
      continuation_command: PRODUCT_SESSION_COMMAND,
    },
    operator_loop_actions: {
      start_deliverable: {
        command: PRODUCT_INVOKE_COMMAND,
        surface_kind: 'product_entry',
        summary: '直接进入当前 deliverable 的 primary operator loop。',
        requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
      continue_session: {
        command: PRODUCT_SESSION_COMMAND,
        surface_kind: 'product_entry_session',
        summary: '在已有 entry_session_id 下继续同一交付。',
        requires: ['entry_session_id'],
      },
      opl_bridge_handoff: {
        command: PRODUCT_FEDERATE_COMMAND,
        surface_kind: 'federated_product_entry',
        summary: '通过 internal OPL bridge 进入同一 downstream product entry；这条命令保留给外层 shell / compatibility bridge。',
        requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
    },
    repo_mainline: {
      program_id: safeText(activeMainline.id, 'redcube-runtime-program'),
      phase_id: safeText(currentState.phase_id, 'unknown_phase'),
      phase_label: safeText(currentState.phase_label, 'unknown phase'),
      active_baton_id: safeText(activeBaton.id, 'unknown_baton'),
      active_baton_status: safeText(activeBaton.status, 'unknown'),
    },
    product_entry_status: {
      summary: 'Repo-verified product-entry service surface 已 landed，但成熟终端用户前台壳与 managed web productization 仍未 landed。',
      next_focus: [
        '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry service surface 之上。',
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
    product_entry_shell: {
      frontdesk: {
        command: PRODUCT_FRONTDESK_COMMAND,
        command_template: `${PRODUCT_FRONTDESK_COMMAND} --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_frontdesk',
      },
      direct: {
        command: PRODUCT_INVOKE_COMMAND,
        command_template: (
          `${PRODUCT_INVOKE_COMMAND} --workspace-root ${workspaceRoot} `
          + '--entry-session-id <entry-session-id> --overlay <overlay-id> '
          + '--topic-id <topic-id> --deliverable-id <deliverable-id>'
        ),
        surface_kind: 'product_entry',
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
      },
      session: {
        command: PRODUCT_SESSION_COMMAND,
        command_template: productEntrySessionCommand,
        surface_kind: 'product_entry_session',
      },
    },
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
    },
    product_entry_readiness: productEntryReadiness,
    product_entry_quickstart: productEntryQuickstart,
    family_orchestration: familyOrchestration,
    notes: [
      'This manifest freezes the current repo-verified RedCube product-entry service surface.',
      'The OPL bridge stays available as an internal integration contract instead of a first-read user entry shell.',
      'It does not claim that a mature end-user shell or managed web productization is already landed.',
    ],
    domain_entry_contract: domainEntryContract,
    gateway_interaction_contract: gatewayInteractionContract,
    extra_payload: {
      ok: true,
      recommended_action: 'invoke_product_entry',
      current_truth: {
        product_entry_contract: PRODUCT_ENTRY_CONTRACT_REF,
        federated_product_entry_contract: FEDERATED_PRODUCT_ENTRY_CONTRACT_REF,
        managed_product_entry_contract: MANAGED_PRODUCT_ENTRY_CONTRACT_REF,
      },
    },
  });
}
