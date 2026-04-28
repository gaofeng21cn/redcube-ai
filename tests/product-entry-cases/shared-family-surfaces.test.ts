// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  getProductFrontdesk,
  getProductStart,
  getProductPreflight,
  invokeFederatedProductEntry,
  invokeProductEntry,
  getProductEntryManifest,
  getProductEntrySession,
} from '@redcube/gateway';
import { completeSourceReadiness } from '../helpers/complete-source-readiness.ts';
import {
  startMockCodexCli,
  withEnv,
} from '../helpers/mock-codex-cli.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('../helpers/mock-redcube-python-with-playwright.ts', import.meta.url)),
]);
const GATEWAY_PACKAGE_JSON = fileURLToPath(
  new URL('../../packages/redcube-gateway/package.json', import.meta.url),
);
const gatewayRequire = createRequire(GATEWAY_PACKAGE_JSON);
const PRODUCT_ENTRY_COMPANIONS_SPECIFIER = 'opl-gateway-shared/product-entry-companions';
const PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER = 'opl-gateway-shared/product-entry-program-companions';

async function importGatewaySharedModule(moduleSpecifier) {
  return import(pathToFileURL(gatewayRequire.resolve(moduleSpecifier)).href);
}

async function withMockHermesAndRuntimeState(testFn) {
  const upstream = await startMockCodexCli();
  const runtimeStateRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-state-'));
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
  });
  try {
    return await testFn({ runtimeStateRoot });
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

async function prepareProductEntryWorkspace() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-'));

  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: 'Product entry proof',
    brief: '验证 direct product entry、internal OPL bridge 与 session continuity。',
    keywords: ['product-entry', 'opl'],
  });

  return workspaceRoot;
}

function assertFamilyOrchestrationCompanion(surface, { sessionLocatorField }) {
  assert.equal(surface.family_orchestration.action_graph_ref.ref_kind, 'json_pointer');
  assert.equal(surface.family_orchestration.action_graph_ref.ref, '/family_orchestration/action_graph');
  assert.equal(surface.family_orchestration.action_graph.graph_id, 'redcube_product_entry_overview_graph');
  assert.equal(surface.family_orchestration.action_graph.target_domain_id, 'redcube_ai');
  assert.deepEqual(
    surface.family_orchestration.action_graph.nodes.map((node) => node.node_id),
    [
      'step:open_frontdesk',
      'step:continue_current_loop',
      'step:opl_bridge_handoff',
      'step:inspect_current_progress',
    ],
  );
  assert.deepEqual(surface.family_orchestration.action_graph.entry_nodes, ['step:open_frontdesk']);
  assert.deepEqual(surface.family_orchestration.action_graph.exit_nodes, ['step:inspect_current_progress']);
  assert.equal(Array.isArray(surface.family_orchestration.human_gates), true);
  assert.equal(surface.family_orchestration.human_gates.length >= 1, true);
  assert.equal(surface.family_orchestration.human_gates[0].gate_id, 'redcube_operator_review_gate');
  assert.equal(surface.family_orchestration.resume_contract.surface_kind, 'product_entry_session');
  assert.equal(surface.family_orchestration.resume_contract.session_locator_field, sessionLocatorField);
  assert.equal(
    surface.family_orchestration.resume_contract.checkpoint_locator_field,
    'continuation_snapshot.latest_managed_run_id',
  );
}

function assertRuntimeLoopClosureShape(surface, { source, entryMode }) {
  assert.equal(surface.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
  assert.equal(surface.runtime_loop_closure.loop_owner.runtime_owner, 'upstream_hermes_agent');
  assert.equal(surface.runtime_loop_closure.loop_owner.domain_owner, 'redcube_ai');
  assert.equal(surface.runtime_loop_closure.loop_owner.product_entry_owner, 'redcube_ai');
  assert.equal(surface.runtime_loop_closure.resume_point.entry_session_id, surface.entry_session?.entry_session_id ?? null);
  assert.equal(
    surface.runtime_loop_closure.resume_point.latest_handle,
    surface.summary?.target_handle ?? surface.summary?.latest_handle ?? null,
  );
  assert.equal(surface.runtime_loop_closure.continuity_cursor.surface_kind, 'session_continuity');
  assert.equal(surface.runtime_loop_closure.continuity_cursor.surface_ref, '/session_continuity');
  assert.equal(
    surface.runtime_loop_closure.continuity_cursor.entry_session_id,
    surface.entry_session?.entry_session_id ?? null,
  );
  assert.equal(surface.runtime_loop_closure.progress_cursor.surface_kind, 'progress_projection');
  assert.equal(surface.runtime_loop_closure.progress_cursor.surface_ref, '/progress_projection');
  assert.equal(surface.runtime_loop_closure.artifact_pickup.surface_kind, 'artifact_inventory');
  assert.equal(surface.runtime_loop_closure.artifact_pickup.surface_ref, '/artifact_inventory');
  assert.equal(surface.runtime_loop_closure.control_policy.approval_gate_id, 'redcube_operator_review_gate');
  assert.equal(surface.runtime_loop_closure.control_policy.default_run_mode, 'auto_to_terminal');
  assert.equal(
    surface.runtime_loop_closure.control_policy.stop_policy,
    'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
  );
  assert.equal(
    surface.runtime_loop_closure.control_policy.gate_status,
    surface.runtime_loop_closure.control_policy.approval_required ? 'requested' : 'approved',
  );
  assert.equal(
    surface.runtime_loop_closure.control_policy.interrupt_policy,
    surface.runtime_loop_closure.control_policy.approval_required
      ? 'human_gate_required_before_continuation'
      : 'continue_autonomously_until_runtime_gate',
  );
  assert.equal(surface.runtime_loop_closure.control_policy.continue_action.surface_kind, 'product_entry_session');
  assert.equal(surface.runtime_loop_closure.source_linkage.current_source, source);
  assert.equal(surface.runtime_loop_closure.source_linkage.entry_mode, entryMode);
  assert.equal(surface.runtime_loop_closure.source_linkage.direct_surface_kind, 'product_entry');
  assert.equal(surface.runtime_loop_closure.source_linkage.federated_surface_kind, 'federated_product_entry');
  assert.equal(surface.runtime_loop_closure.source_linkage.session_surface_kind, 'product_entry_session');
  assert.equal(surface.runtime_loop_closure.source_linkage.downstream_entry_surface_kind, 'domain_entry');
}

const SERIAL_ENV_TEST = { concurrency: false };


test('gateway shared family orchestration surface exposes the frontdesk product-entry preset builder', async () => {
  const familyOrchestration = await importGatewaySharedModule('opl-gateway-shared/family-orchestration');

  assert.equal(
    typeof familyOrchestration.buildFamilyFrontdeskProductEntryOrchestration,
    'function',
  );
});

test('session continuation family orchestration companion uses the shared continuation refs', async () => {
  const companionModule = await import('../../packages/redcube-gateway/dist/actions/family-orchestration-companion.js');
  const buildSessionContinuationFamilyOrchestration = companionModule.buildSessionContinuationFamilyOrchestration;
  assert.equal(typeof buildSessionContinuationFamilyOrchestration, 'function');

  const requested = buildSessionContinuationFamilyOrchestration({
    continuationSnapshot: {
      managed_progress_projection: {
        needs_user_decision: true,
      },
    },
  });
  assert.equal(requested.human_gates[0].status, 'requested');
  assert.deepEqual(requested.human_gates[0].review_surface, {
    ref_kind: 'json_pointer',
    ref: '/review_state',
    label: 'current review state surface',
  });
  assert.deepEqual(requested.event_envelope_surface, {
    ref_kind: 'json_pointer',
    ref: '/continuation_snapshot/managed_progress_projection/latest_events',
    label: 'managed run event companion',
  });
  assert.deepEqual(requested.checkpoint_lineage_surface, {
    ref_kind: 'json_pointer',
    ref: '/continuation_snapshot/latest_managed_run_id',
    label: 'latest managed-run continuation locator',
  });

  const approved = buildSessionContinuationFamilyOrchestration({
    continuationSnapshot: {
      managed_progress_projection: {
        needs_user_decision: false,
      },
    },
    sessionLocatorField: 'entry_session_contract.entry_session_id',
  });
  assert.equal(approved.human_gates[0].status, 'approved');
  assert.equal(
    approved.resume_contract.session_locator_field,
    'entry_session_contract.entry_session_id',
  );
});

