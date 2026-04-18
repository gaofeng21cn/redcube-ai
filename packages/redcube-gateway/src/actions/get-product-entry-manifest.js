import path from 'node:path';
import { readFileSync } from 'node:fs';

import { productEntrySessionDir } from '@redcube/runtime';
import { buildManagedRuntimeContract } from 'opl-readonly-gateway/managed-runtime-contract';
import {
  buildCheckpointSummary,
  buildRuntimeInventory,
  buildTaskLifecycle,
} from 'opl-readonly-gateway/runtime-task-companions';
import {
  buildSkillCatalog,
  buildSkillDescriptor,
} from 'opl-readonly-gateway/skill-catalog';
import {
  buildAutomationCatalog,
  buildAutomationDescriptor,
} from 'opl-readonly-gateway/automation-companions';
import {
  buildFamilyProductEntryManifest,
  buildProductEntryStart,
  buildProductEntryOverview,
  buildProductEntryQuickstart,
  buildProductEntryReadiness,
  buildProductEntryResumeSurface,
  collectFamilyHumanGateIds,
} from 'opl-readonly-gateway/product-entry-companions';

import { buildFamilyOrchestrationCompanion } from './family-orchestration-companion.js';
import { getProductPreflight } from './get-product-preflight.js';

const MANAGED_RUNTIME_OWNER = 'upstream_hermes_agent';

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
  const productEntrySessionCommand = 'redcube product session --entry-session-id <entry-session-id>';
  const productEntryPreflight = await getProductPreflight({ workspace_root: workspaceRoot });
  const currentProgram = readCurrentProgramContract();
  const currentState = currentProgram.current_state || {};
  const activeMainline = currentState.active_mainline || {};
  const activeBaton = currentState.active_baton || {};
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
        command: `redcube product frontdesk --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_frontdesk',
        summary: 'Open the direct RedCube frontdesk for the current workspace.',
        requires: [],
      },
      {
        step_id: 'continue_current_loop',
        title: 'Continue current deliverable loop',
        command: (
          `redcube product invoke --workspace-root ${workspaceRoot} `
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
    frontdesk_command: 'redcube product frontdesk',
    recommended_command: 'redcube product invoke',
    operator_loop_command: 'redcube product invoke',
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
      '继续把 OPL federated handoff 与同一 downstream product-entry contract 对齐。',
    ],
    remaining_gaps_count: 2,
    human_gate_ids: humanGateIds,
  });
  const productEntryStart = buildProductEntryStart({
    summary: (
      '先打开 RedCube frontdesk；需要直接起一个新会话就走 direct session，'
      + '需要走顶层联邦入口时使用 federated handoff，已有 session 则直接恢复。'
    ),
    recommended_mode_id: 'open_frontdesk',
    modes: [
      {
        mode_id: 'open_frontdesk',
        title: 'Open RedCube frontdesk',
        command: `redcube product frontdesk --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_frontdesk',
        summary: 'Open the direct RedCube frontdesk for the current workspace.',
        requires: [],
      },
      {
        mode_id: 'start_direct_session',
        title: 'Start direct session',
        command: (
          `redcube product invoke --workspace-root ${workspaceRoot} `
          + '--entry-session-id <entry-session-id> --overlay <overlay-id> '
          + '--topic-id <topic-id> --deliverable-id <deliverable-id>'
        ),
        surface_kind: 'product_entry',
        summary: 'Start or continue a direct RedCube product-entry session for one deliverable.',
        requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
      {
        mode_id: 'federated_handoff',
        title: 'Federated handoff',
        command: (
          `redcube product federate --workspace-root ${workspaceRoot} `
          + '--entry-session-id <entry-session-id> --target-domain-id redcube_ai '
          + '--entry-mode opl_gateway --return-surface-kind product_entry '
          + '--overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>'
        ),
        surface_kind: 'federated_product_entry',
        summary: 'Enter the same downstream product entry through OPL / family federation.',
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
      + '但还不是成熟的最终用户前台或托管 Web 产品。'
    ),
    recommended_start_surface: 'product_frontdesk',
    recommended_start_command: 'redcube product frontdesk',
    recommended_loop_surface: 'product_entry',
    recommended_loop_command: 'redcube product invoke',
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
    summary: 'RedCube product-entry skill catalog spans frontdesk, direct invoke, federated handoff, and session continuity shells.',
    skills: [
      buildSkillDescriptor({
        skill_id: 'redcube_product_frontdesk',
        title: 'RedCube product frontdesk',
        owner: 'redcube_ai',
        distribution_mode: 'repo_tracked',
        surface_kind: 'product_frontdesk',
        description: 'Open the canonical product frontdesk shell for this workspace.',
        command: 'redcube product frontdesk',
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
        command: 'redcube product invoke',
        readiness: 'landed',
        tags: ['direct', 'deliverable', 'operator-loop'],
      }),
      buildSkillDescriptor({
        skill_id: 'redcube_product_entry_federated',
        title: 'RedCube product entry federated handoff',
        owner: 'redcube_ai',
        distribution_mode: 'repo_tracked',
        surface_kind: 'federated_product_entry',
        description: 'Use OPL/family federation while preserving the same downstream product entry contract.',
        command: 'redcube product federate',
        readiness: 'landed',
        tags: ['federated', 'opl', 'handoff'],
      }),
      buildSkillDescriptor({
        skill_id: 'redcube_product_entry_session',
        title: 'RedCube product entry session continuation',
        owner: 'redcube_ai',
        distribution_mode: 'repo_tracked',
        surface_kind: 'product_entry_session',
        description: 'Inspect and continue the same deliverable loop by entry_session_id.',
        command: 'redcube product session',
        readiness: 'landed',
        tags: ['session', 'continuation', 'runtime'],
      }),
    ],
    supported_commands: [
      'redcube product frontdesk',
      'redcube product invoke',
      'redcube product federate',
      'redcube product session',
    ],
    command_contracts: [
      {
        command: 'redcube product frontdesk',
        shell_key: 'frontdesk',
        target_surface_kind: 'product_frontdesk',
      },
      {
        command: 'redcube product invoke',
        shell_key: 'direct',
        target_surface_kind: 'product_entry',
      },
      {
        command: 'redcube product federate',
        shell_key: 'federated',
        target_surface_kind: 'federated_product_entry',
      },
      {
        command: 'redcube product session',
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
    recommended_command: 'redcube product invoke',
    frontdesk_surface: {
      shell_key: 'frontdesk',
      command: 'redcube product frontdesk',
      surface_kind: 'product_frontdesk',
      summary: '当前 direct RedCube frontdesk，先暴露 direct / federated / session 三种 operator-facing 入口。',
    },
    operator_loop_surface: {
      shell_key: 'direct',
      command: 'redcube product invoke',
      surface_kind: 'product_entry',
      summary: (
        '当前 operator loop 仍 anchored on direct product entry；'
        + '拿到 entry_session_id 后继续通过 session surface 追踪同一交付。'
      ),
      continuation_shell_key: 'session',
      continuation_command: 'redcube product session',
    },
    operator_loop_actions: {
      start_deliverable: {
        command: 'redcube product invoke',
        surface_kind: 'product_entry',
        summary: '直接进入当前 deliverable 的 primary operator loop。',
        requires: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
      continue_session: {
        command: 'redcube product session',
        surface_kind: 'product_entry_session',
        summary: '在已有 entry_session_id 下继续同一交付。',
        requires: ['entry_session_id'],
      },
      federated_handoff: {
        command: 'redcube product federate',
        surface_kind: 'federated_product_entry',
        summary: '通过 family / OPL gateway 进入同一 downstream product entry。',
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
        '继续把 OPL federated handoff 与同一 downstream product-entry contract 对齐。',
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
        command: 'redcube product frontdesk',
        command_template: `redcube product frontdesk --workspace-root ${workspaceRoot}`,
        surface_kind: 'product_frontdesk',
      },
      direct: {
        command: 'redcube product invoke',
        command_template: (
          `redcube product invoke --workspace-root ${workspaceRoot} `
          + '--entry-session-id <entry-session-id> --overlay <overlay-id> '
          + '--topic-id <topic-id> --deliverable-id <deliverable-id>'
        ),
        surface_kind: 'product_entry',
      },
      federated: {
        command: 'redcube product federate',
        command_template: (
          `redcube product federate --workspace-root ${workspaceRoot} `
          + '--entry-session-id <entry-session-id> --target-domain-id redcube_ai '
          + '--entry-mode opl_gateway --return-surface-kind product_entry '
          + '--overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>'
        ),
        surface_kind: 'federated_product_entry',
      },
      session: {
        command: 'redcube product session',
        command_template: productEntrySessionCommand,
        surface_kind: 'product_entry_session',
      },
    },
    shared_handoff: {
      opl_return_surface: {
        surface_kind: 'product_entry',
        target_domain_id: 'redcube_ai',
      },
    },
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
      'It does not claim that a mature end-user shell or managed web productization is already landed.',
    ],
    extra_payload: {
      ok: true,
      recommended_action: 'invoke_product_entry',
      current_truth: {
        product_entry_contract: 'contracts/runtime-program/redcube-product-entry-mvp.json',
        federated_product_entry_contract: 'contracts/runtime-program/opl-gateway-federated-product-entry.json',
        managed_product_entry_contract: 'contracts/runtime-program/managed-product-entry-hardening.json',
      },
    },
  });
}
