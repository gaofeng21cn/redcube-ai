import path from 'node:path';
import { readFileSync } from 'node:fs';

import { productEntrySessionDir } from '@redcube/runtime';

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
  const currentProgram = readCurrentProgramContract();
  const currentState = currentProgram.current_state || {};
  const activeMainline = currentState.active_mainline || {};
  const activeBaton = currentState.active_baton || {};

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
    family_orchestration: {
      human_gates: [
        {
          gate_id: 'deliverable_publish_gate',
          title: 'Deliverable publish gate',
        },
        {
          gate_id: 'creative_review_gate',
          title: 'Creative review gate',
        },
      ],
      resume_contract: {
        surface_kind: 'product_entry_session',
        session_locator_field: 'entry_session_id',
        checkpoint_locator_field: 'checkpoint_lineage_id',
      },
    },
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
