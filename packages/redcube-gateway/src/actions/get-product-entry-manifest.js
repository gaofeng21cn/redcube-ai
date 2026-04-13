import path from 'node:path';
import { readFileSync } from 'node:fs';

import { productEntrySessionDir } from '@redcube/runtime';

import { buildFamilyOrchestrationCompanion } from './family-orchestration-companion.js';
import { getProductPreflight } from './get-product-preflight.js';

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
  const productEntryPreflight = await getProductPreflight({ workspace_root: workspaceRoot });
  const currentProgram = readCurrentProgramContract();
  const currentState = currentProgram.current_state || {};
  const activeMainline = currentState.active_mainline || {};
  const activeBaton = currentState.active_baton || {};
  const productEntryQuickstart = {
    surface_kind: 'product_entry_quickstart',
    recommended_step_id: 'open_frontdesk',
    summary: (
      'Open the RedCube frontdesk first, then continue the same deliverable loop or inspect the current entry session.'
    ),
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
        command: 'redcube product session --entry-session-id <entry-session-id>',
        surface_kind: 'product_entry_session',
        summary: 'Inspect the current session progress for the same deliverable.',
        requires: ['entry_session_id'],
      },
    ],
    resume_contract: {
      surface_kind: 'product_entry_session',
      session_locator_field: 'entry_session_contract.entry_session_id',
      checkpoint_locator_field: 'checkpoint_lineage_id',
    },
    human_gate_ids: ['redcube_operator_review_gate'],
  };
  const productEntryOverview = {
    surface_kind: 'product_entry_overview',
    summary: 'Repo-verified product-entry service surface 已 landed，但成熟终端用户前台壳与 managed web productization 仍未 landed。',
    frontdesk_command: 'redcube product frontdesk',
    recommended_command: 'redcube product invoke',
    operator_loop_command: 'redcube product invoke',
    progress_surface: {
      surface_kind: 'product_entry_session',
      command: 'redcube product session --entry-session-id <entry-session-id>',
      step_id: 'inspect_current_progress',
    },
    resume_surface: {
      surface_kind: 'product_entry_session',
      command: 'redcube product session --entry-session-id <entry-session-id>',
      session_locator_field: 'entry_session_contract.entry_session_id',
      checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
    },
    recommended_step_id: 'open_frontdesk',
    next_focus: [
      '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry service surface 之上。',
      '继续把 OPL federated handoff 与同一 downstream product-entry contract 对齐。',
    ],
    remaining_gaps_count: 2,
    human_gate_ids: ['redcube_operator_review_gate'],
  };
  const productEntryReadiness = {
    surface_kind: 'product_entry_readiness',
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
  };

  return {
    ok: true,
    surface_kind: 'product_entry_manifest',
    manifest_version: 2,
    recommended_action: 'invoke_product_entry',
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
    runtime: {
      runtime_owner: 'upstream_hermes_agent',
      runtime_state_root: path.dirname(sessionStoreRoot),
      session_store_root: sessionStoreRoot,
    },
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
        command_template: 'redcube product session --entry-session-id <entry-session-id>',
        surface_kind: 'product_entry_session',
      },
    },
    shared_handoff: {
      opl_return_surface: {
        surface_kind: 'product_entry',
        target_domain_id: 'redcube_ai',
      },
    },
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
    family_orchestration: buildFamilyOrchestrationCompanion({
      sessionLocatorField: 'entry_session_contract.entry_session_id',
      gateStatus: 'requested',
      reviewSurfaceRef: {
        ref_kind: 'json_pointer',
        ref: '/operator_loop_actions/continue_session',
        label: 'continue session surface',
      },
    }),
    current_truth: {
      product_entry_contract: 'contracts/runtime-program/redcube-product-entry-mvp.json',
      federated_product_entry_contract: 'contracts/runtime-program/opl-gateway-federated-product-entry.json',
      managed_product_entry_contract: 'contracts/runtime-program/managed-product-entry-hardening.json',
    },
    notes: [
      'This manifest freezes the current repo-verified RedCube product-entry service surface.',
      'It does not claim that a mature end-user shell or managed web productization is already landed.',
    ],
  };
}
