import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

import {
  invokeFederatedProductEntry,
  invokeProductEntry,
  getProductEntryManifest,
  getProductEntrySession,
} from '../packages/redcube-gateway/src/index.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import {
  startMockHermesAgentUpstream,
  withEnv,
} from './helpers/mock-hermes-agent-upstream.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

async function withMockHermesAndRuntimeState(testFn) {
  const upstream = await startMockHermesAgentUpstream();
  const runtimeStateRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-state-'));
  const restoreEnv = withEnv({
    REDCUBE_HERMES_UPSTREAM_BASE_URL: upstream.baseUrl,
    REDCUBE_HERMES_UPSTREAM_MODEL: 'hermes-agent',
    REDCUBE_HERMES_UPSTREAM_API_KEY: undefined,
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
    brief: '验证 direct / federated product entry 与 session continuity。',
    keywords: ['product-entry', 'opl'],
  });

  return workspaceRoot;
}

test('invokeProductEntry creates a deliverable, delegates to the service-safe domain entry, and persists session continuity', async () => {
  await withMockHermesAndRuntimeState(async ({ runtimeStateRoot }) => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const response = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-a',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        profile_id: 'lecture_student',
        title: 'Product entry proof',
        goal: '验证 direct product entry',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      },
    });

    assert.equal(response.ok, true);
    assert.equal(response.surface_kind, 'product_entry');
    assert.equal(response.product_entry_contract_id, 'redcube_product_entry');
    assert.equal(response.entry_session.entry_session_id, 'session-a');
    assert.equal(response.entry_session.created_deliverable, true);
    assert.equal(response.entry_session.resumed_from_session, false);
    assert.equal(response.entry_session.runtime_owner, 'upstream_hermes_agent');
    assert.equal(response.delivery_identity.deliverable_family, 'ppt_deck');
    assert.equal(response.delivery_identity.topic_id, 'topic-a');
    assert.equal(response.delivery_identity.deliverable_id, 'deck-a');
    assert.equal(response.domain_entry_surface.entry_contract_id, 'redcube_service_safe_domain_entry');
    assert.equal(response.domain_entry_surface.entry_mode, 'redcube_product_entry');
    assert.equal(response.domain_entry_surface.result_surface.surface_kind, 'managed_run');
    assert.equal(response.continuation_snapshot.latest_managed_run_id, response.domain_entry_surface.summary.target_handle);
    assert.equal(response.continuation_snapshot.latest_run_id, null);
    assert.equal(response.continuation_snapshot.managed_progress_projection.current_stage, 'storyline');
    assert.equal(response.continuation_snapshot.runtime_supervision.runtime_owner, 'upstream_hermes_agent');
    assert.equal(response.review_state.surface_kind, 'review_state');
    assert.equal(response.publication_projection.surface_kind, 'publication_projection');

    const sessionFile = path.join(runtimeStateRoot, 'product-entry-sessions', 'session-a.json');
    assert.equal(existsSync(sessionFile), true);
    const storedSession = readJson(sessionFile);
    assert.equal(storedSession.entry_session_id, 'session-a');
    assert.equal(storedSession.deliverable_family, 'ppt_deck');
    assert.equal(storedSession.topic_id, 'topic-a');
    assert.equal(storedSession.deliverable_id, 'deck-a');
    assert.equal(storedSession.latest_managed_run_id, response.continuation_snapshot.latest_managed_run_id);
  });
});

test('invokeProductEntry can continue the same deliverable from the persisted entry session without respecifying delivery identity', async () => {
  await withMockHermesAndRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const first = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-a',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        profile_id: 'lecture_student',
        title: 'Product entry proof',
        goal: '验证 session continuity',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      },
    });

    const continued = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-a',
      },
      delivery_request: {
        user_intent: '继续推进到最终 PPT',
      },
    });

    assert.equal(first.ok, true);
    assert.equal(continued.ok, true);
    assert.equal(continued.surface_kind, 'product_entry');
    assert.equal(continued.entry_session.entry_session_id, 'session-a');
    assert.equal(continued.entry_session.created_deliverable, false);
    assert.equal(continued.entry_session.resumed_from_session, true);
    assert.equal(continued.delivery_identity.deliverable_family, 'ppt_deck');
    assert.equal(continued.delivery_identity.topic_id, 'topic-a');
    assert.equal(continued.delivery_identity.deliverable_id, 'deck-a');
    assert.equal(continued.domain_entry_surface.entry_mode, 'redcube_product_entry');
    assert.equal(continued.domain_entry_surface.result_surface.surface_kind, 'managed_run');
    assert.equal(continued.continuation_snapshot.latest_managed_run_id !== first.continuation_snapshot.latest_managed_run_id, true);

    const session = await getProductEntrySession({
      entry_session_id: 'session-a',
    });

    assert.equal(session.ok, true);
    assert.equal(session.surface_kind, 'product_entry_session');
    assert.equal(session.entry_session.entry_session_id, 'session-a');
    assert.equal(session.entry_session.runtime_owner, 'upstream_hermes_agent');
    assert.equal(session.delivery_identity.deliverable_family, 'ppt_deck');
    assert.equal(session.delivery_identity.topic_id, 'topic-a');
    assert.equal(session.delivery_identity.deliverable_id, 'deck-a');
    assert.equal(session.continuation_snapshot.latest_managed_run_id, continued.continuation_snapshot.latest_managed_run_id);
    assert.equal(session.review_state.surface_kind, 'review_state');
    assert.equal(session.publication_projection.surface_kind, 'publication_projection');
  });
});

test('invokeFederatedProductEntry validates the OPL envelope and converges onto the same downstream product-entry surface', async () => {
  await withMockHermesAndRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const response = await invokeFederatedProductEntry({
      target_domain_id: 'redcube_ai',
      task_intent: 'run_managed_deliverable',
      entry_mode: 'opl_gateway',
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      runtime_session_contract: {
        runtime_owner: 'upstream_hermes_agent',
      },
      return_surface_contract: {
        surface_kind: 'product_entry',
      },
      entry_session_contract: {
        entry_session_id: 'session-federated',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-fed',
        profile_id: 'lecture_student',
        title: 'Federated product entry proof',
        goal: '验证 OPL federation',
        user_intent: '先给我主线故事',
        stop_after_stage: 'storyline',
      },
    });

    assert.equal(response.ok, true);
    assert.equal(response.surface_kind, 'federated_product_entry');
    assert.equal(response.federated_product_entry_contract_id, 'opl_gateway_federated_product_entry');
    assert.equal(response.target_domain_id, 'redcube_ai');
    assert.equal(response.entry_mode, 'opl_gateway');
    assert.equal(response.runtime_session_contract.runtime_owner, 'upstream_hermes_agent');
    assert.equal(response.return_surface_contract.requested_surface_kind, 'product_entry');
    assert.equal(response.return_surface_contract.actual_surface_kind, 'product_entry');
    assert.equal(response.product_entry_surface.surface_kind, 'product_entry');
    assert.equal(response.product_entry_surface.entry_session.entry_session_id, 'session-federated');
    assert.equal(response.product_entry_surface.domain_entry_surface.entry_mode, 'opl_gateway');
    assert.equal(response.product_entry_surface.domain_entry_surface.entry_contract_id, 'redcube_service_safe_domain_entry');
    assert.equal(response.product_entry_surface.continuation_snapshot.latest_managed_run_id, response.summary.target_handle);
  });
});

test('getProductEntryManifest projects the current direct-entry shell and shared OPL handoff truth', async () => {
  await withMockHermesAndRuntimeState(async ({ runtimeStateRoot }) => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const manifest = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });

    assert.equal(manifest.ok, true);
    assert.equal(manifest.surface_kind, 'product_entry_manifest');
    assert.equal(manifest.manifest_version, 1);
    assert.equal(manifest.manifest_kind, 'redcube_product_entry_manifest');
    assert.equal(manifest.target_domain_id, 'redcube_ai');
    assert.equal(manifest.formal_entry.default, 'CLI');
    assert.deepEqual(manifest.formal_entry.supported_protocols, ['MCP']);
    assert.equal(manifest.workspace_locator.workspace_surface_kind, 'redcube_workspace');
    assert.equal(manifest.workspace_locator.workspace_root, workspaceRoot);
    assert.equal(manifest.recommended_shell, 'direct');
    assert.equal(manifest.recommended_command, 'redcube product invoke');
    assert.equal(manifest.runtime.runtime_owner, 'upstream_hermes_agent');
    assert.equal(manifest.runtime.runtime_state_root, runtimeStateRoot);
    assert.equal(manifest.product_entry_shell.direct.command, 'redcube product invoke');
    assert.equal(manifest.product_entry_shell.federated.command, 'redcube product federate');
    assert.equal(manifest.product_entry_shell.session.command, 'redcube product session');
    assert.equal(manifest.shared_handoff.opl_return_surface.surface_kind, 'product_entry');
    assert.equal(manifest.current_truth.product_entry_contract, 'contracts/runtime-program/redcube-product-entry-mvp.json');
  });
});
