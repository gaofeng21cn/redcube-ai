import path from 'node:path';

import { productEntrySessionDir } from '@redcube/runtime';

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

export async function getProductEntryManifest(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const sessionStoreRoot = productEntrySessionDir();

  return {
    ok: true,
    surface_kind: 'product_entry_manifest',
    manifest_version: 1,
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
    runtime: {
      runtime_owner: 'upstream_hermes_agent',
      runtime_state_root: path.dirname(sessionStoreRoot),
      session_store_root: sessionStoreRoot,
    },
    product_entry_shell: {
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
