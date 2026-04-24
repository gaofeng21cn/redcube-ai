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
} from '../packages/redcube-gateway/src/index.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

const MOCK_REDCUBE_PYTHON_COMMAND = fileURLToPath(
  new URL('./helpers/mock-redcube-python-with-playwright.mjs', import.meta.url),
);
const GATEWAY_PACKAGE_JSON = fileURLToPath(
  new URL('../packages/redcube-gateway/package.json', import.meta.url),
);
const gatewayRequire = createRequire(GATEWAY_PACKAGE_JSON);
const PRODUCT_ENTRY_COMPANIONS_SPECIFIER = 'opl-gateway-shared/product-entry-companions';
const PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER = 'opl-gateway-shared/product-entry-program-companions';

async function importGatewaySharedModule(moduleSpecifier) {
  return import(pathToFileURL(gatewayRequire.resolve(moduleSpecifier)).href);
}

test('gateway shared family orchestration surface exposes the frontdesk product-entry preset builder', async () => {
  const familyOrchestration = await importGatewaySharedModule('opl-gateway-shared/family-orchestration');

  assert.equal(
    typeof familyOrchestration.buildFamilyFrontdeskProductEntryOrchestration,
    'function',
  );
});

test('session continuation family orchestration companion uses the shared continuation refs', async () => {
  const companionModule = await import('../packages/redcube-gateway/src/actions/family-orchestration-companion.js');
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
  assert.equal(surface.family_orchestration.action_graph.graph_id, 'redcube_frontdoor_product_entry_graph');
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
  assert.equal(
    surface.runtime_loop_closure.control_policy.gate_status,
    surface.runtime_loop_closure.control_policy.approval_required ? 'requested' : 'approved',
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

test('invokeProductEntry creates a deliverable, delegates to the service-safe domain entry, and persists session continuity', SERIAL_ENV_TEST, async () => {
  await withMockHermesAndRuntimeState(async ({ runtimeStateRoot }) => {
    const sharedCompanions = await importGatewaySharedModule(PRODUCT_ENTRY_COMPANIONS_SPECIFIER);
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
    assert.deepEqual(
      response.entry_session,
      sharedCompanions.buildEntrySessionSurface({
        entry_session_id: 'session-a',
        session_file: path.join(runtimeStateRoot, 'product-entry-sessions', 'session-a.json'),
        runtime_owner: 'upstream_hermes_agent',
        resumed_from_session: false,
        created_deliverable: true,
      }),
    );
    assert.deepEqual(
      response.delivery_identity,
      sharedCompanions.buildDeliveryIdentitySurface({
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        profile_id: 'lecture_student',
      }),
    );
    assert.equal(response.domain_entry_surface.entry_contract_id, 'redcube_service_safe_domain_entry');
    assert.equal(response.domain_entry_surface.entry_mode, 'redcube_product_entry');
    assert.equal(response.domain_entry_surface.result_surface.surface_kind, 'managed_run');
    assert.deepEqual(
      response.continuation_snapshot,
      sharedCompanions.buildProductEntryContinuationSnapshot({
        latest_managed_run_id: response.domain_entry_surface.summary.target_handle,
        latest_run_id: null,
        managed_progress_projection: response.continuation_snapshot.managed_progress_projection,
        runtime_supervision: response.continuation_snapshot.runtime_supervision,
      }),
    );
    assert.equal(response.session_continuity.surface_kind, 'session_continuity');
    assert.equal(response.session_continuity.entry_session_id, 'session-a');
    assert.equal(response.summary.latest_handle, response.summary.target_handle);
    assert.equal(
      response.summary.approval_required,
      response.runtime_loop_closure.control_policy.approval_required,
    );
    assert.equal(
      response.summary.gate_status,
      response.runtime_loop_closure.control_policy.gate_status,
    );
    assert.equal(
      response.summary.resume_command,
      response.runtime_loop_closure.control_policy.continue_action.command,
    );
    assert.equal(
      response.summary.session_locator_field,
      response.family_orchestration.resume_contract.session_locator_field,
    );
    assert.equal(
      response.summary.checkpoint_locator_field,
      response.family_orchestration.resume_contract.checkpoint_locator_field,
    );
    assert.equal(response.session_continuity.restore_point.latest_handle, response.summary.target_handle);
    assert.equal(
      response.session_continuity.restore_point.latest_managed_run_id,
      response.continuation_snapshot.latest_managed_run_id,
    );
    if (response.continuation_snapshot.managed_progress_projection) {
      assert.equal(response.progress_projection.surface_kind, 'progress_projection');
      assert.deepEqual(
        response.progress_projection.projection,
        response.continuation_snapshot.managed_progress_projection,
      );
      assert.equal(response.artifact_inventory.surface_kind, 'artifact_inventory');
      assert.equal(response.artifact_inventory.summary.latest_handle, response.summary.target_handle);
      assert.deepEqual(
        response.artifact_inventory.artifact_refs,
        response.continuation_snapshot.managed_progress_projection.final_artifact_refs,
      );
    } else {
      assert.equal(response.progress_projection, null);
      assert.equal(response.artifact_inventory.surface_kind, 'artifact_inventory');
      assert.deepEqual(response.artifact_inventory.artifact_refs, []);
    }
    assert.deepEqual(
      response.domain_entry_surface.runtime_session_contract,
      sharedCompanions.buildRuntimeSessionContract({
        runtime_owner: 'upstream_hermes_agent',
        expected_runtime_owner: 'upstream_hermes_agent',
        adapter_surface: '@redcube/codex-cli-client',
        session_mode: 'entry_session',
      }),
    );
    assert.deepEqual(
      response.domain_entry_surface.return_surface_contract,
      sharedCompanions.buildReturnSurfaceContract({
        requested_surface_kind: 'managed_run',
        expected_surface_kind: 'managed_run',
        actual_surface_kind: 'managed_run',
        durable_truth_surfaces: [
          'runtimeWatch',
          'getReviewState',
          'getPublicationProjection',
          'auditDeliverable',
        ],
      }),
    );
    assert.equal(response.review_state.surface_kind, 'review_state');
    assert.equal(response.publication_projection.surface_kind, 'publication_projection');
    assertRuntimeLoopClosureShape(response, {
      source: 'direct',
      entryMode: 'redcube_product_entry',
    });
    assertFamilyOrchestrationCompanion(response, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });

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

test('invokeProductEntry can continue the same deliverable from the persisted entry session without respecifying delivery identity', SERIAL_ENV_TEST, async () => {
  await withMockHermesAndRuntimeState(async () => {
    const sharedCompanions = await importGatewaySharedModule(PRODUCT_ENTRY_COMPANIONS_SPECIFIER);
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
    assert.deepEqual(
      continued.entry_session,
      sharedCompanions.buildEntrySessionSurface({
        entry_session_id: 'session-a',
        session_file: continued.entry_session.session_file,
        runtime_owner: 'upstream_hermes_agent',
        resumed_from_session: true,
        created_deliverable: false,
      }),
    );
    assert.deepEqual(
      continued.delivery_identity,
      sharedCompanions.buildDeliveryIdentitySurface({
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        profile_id: 'lecture_student',
      }),
    );
    assert.equal(continued.domain_entry_surface.entry_mode, 'redcube_product_entry');
    assert.equal(continued.domain_entry_surface.result_surface.surface_kind, 'managed_run');
    assert.equal(continued.continuation_snapshot.latest_managed_run_id !== first.continuation_snapshot.latest_managed_run_id, true);

    const session = await getProductEntrySession({
      entry_session_id: 'session-a',
    });

    assert.equal(session.ok, true);
    assert.equal(session.surface_kind, 'product_entry_session');
    assert.deepEqual(
      session.entry_session,
      sharedCompanions.buildEntrySessionSurface({
        entry_session_id: 'session-a',
        session_file: session.entry_session.session_file,
        runtime_owner: 'upstream_hermes_agent',
      }),
    );
    assert.deepEqual(
      session.delivery_identity,
      sharedCompanions.buildDeliveryIdentitySurface({
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        profile_id: 'lecture_student',
      }),
    );
    assert.deepEqual(
      session.continuation_snapshot,
      sharedCompanions.buildProductEntryContinuationSnapshot({
        latest_managed_run_id: continued.continuation_snapshot.latest_managed_run_id,
        latest_run_id: continued.continuation_snapshot.latest_run_id,
        managed_progress_projection: session.continuation_snapshot.managed_progress_projection,
        runtime_supervision: session.continuation_snapshot.runtime_supervision,
      }),
    );
    assert.equal(session.session_continuity.surface_kind, 'session_continuity');
    assert.equal(session.session_continuity.entry_session_id, 'session-a');
    assert.equal(session.summary.target_handle, session.summary.latest_handle);
    assert.equal(
      session.summary.approval_required,
      session.runtime_loop_closure.control_policy.approval_required,
    );
    assert.equal(
      session.summary.gate_status,
      session.runtime_loop_closure.control_policy.gate_status,
    );
    assert.equal(
      session.summary.resume_command,
      session.runtime_loop_closure.control_policy.continue_action.command,
    );
    assert.equal(
      session.summary.session_locator_field,
      session.family_orchestration.resume_contract.session_locator_field,
    );
    assert.equal(
      session.summary.checkpoint_locator_field,
      session.family_orchestration.resume_contract.checkpoint_locator_field,
    );
    assert.equal(session.session_continuity.restore_point.latest_handle, continued.summary.target_handle);
    assert.equal(session.session_continuity.restore_point.latest_managed_run_id, continued.summary.target_handle);
    assert.deepEqual(session.artifact_inventory.restore_point, session.session_continuity.restore_point);
    if (session.continuation_snapshot.managed_progress_projection) {
      assert.equal(session.progress_projection.surface_kind, 'progress_projection');
      assert.deepEqual(
        session.progress_projection.projection,
        session.continuation_snapshot.managed_progress_projection,
      );
      assert.deepEqual(
        session.artifact_inventory.artifact_refs,
        session.continuation_snapshot.managed_progress_projection.final_artifact_refs,
      );
    } else {
      assert.equal(session.progress_projection, null);
      assert.deepEqual(session.artifact_inventory.artifact_refs, []);
    }
    assert.equal(session.review_state.surface_kind, 'review_state');
    assert.equal(session.publication_projection.surface_kind, 'publication_projection');
    assertRuntimeLoopClosureShape(continued, {
      source: 'direct',
      entryMode: 'redcube_product_entry',
    });
    assertRuntimeLoopClosureShape(session, {
      source: 'session',
      entryMode: 'redcube_product_entry',
    });
    assertFamilyOrchestrationCompanion(continued, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
    assertFamilyOrchestrationCompanion(session, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
  });
});

test('invokeFederatedProductEntry validates the OPL envelope and converges onto the same downstream product-entry surface', SERIAL_ENV_TEST, async () => {
  await withMockHermesAndRuntimeState(async () => {
    const sharedCompanions = await importGatewaySharedModule(PRODUCT_ENTRY_COMPANIONS_SPECIFIER);
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
    assert.deepEqual(
      response.runtime_session_contract,
      sharedCompanions.buildRuntimeSessionContract({
        runtime_owner: 'upstream_hermes_agent',
        expected_runtime_owner: 'upstream_hermes_agent',
      }),
    );
    assert.deepEqual(
      response.return_surface_contract,
      sharedCompanions.buildReturnSurfaceContract({
        requested_surface_kind: 'product_entry',
        expected_surface_kind: 'product_entry',
        actual_surface_kind: 'product_entry',
      }),
    );
    assert.equal(response.product_entry_surface.surface_kind, 'product_entry');
    assert.equal(response.product_entry_surface.entry_session.entry_session_id, 'session-federated');
    assert.deepEqual(response.entry_session, response.product_entry_surface.entry_session);
    assert.deepEqual(response.delivery_identity, response.product_entry_surface.delivery_identity);
    assert.deepEqual(response.continuation_snapshot, response.product_entry_surface.continuation_snapshot);
    assert.deepEqual(response.review_state, response.product_entry_surface.review_state);
    assert.deepEqual(response.publication_projection, response.product_entry_surface.publication_projection);
    assert.equal(response.product_entry_surface.domain_entry_surface.entry_mode, 'opl_gateway');
    assert.equal(response.product_entry_surface.domain_entry_surface.entry_contract_id, 'redcube_service_safe_domain_entry');
    assert.equal(response.summary.latest_handle, response.summary.target_handle);
    assert.equal(
      response.summary.approval_required,
      response.runtime_loop_closure.control_policy.approval_required,
    );
    assert.equal(
      response.summary.gate_status,
      response.runtime_loop_closure.control_policy.gate_status,
    );
    assert.equal(
      response.summary.resume_command,
      response.runtime_loop_closure.control_policy.continue_action.command,
    );
    assert.equal(
      response.summary.session_locator_field,
      response.family_orchestration.resume_contract.session_locator_field,
    );
    assert.equal(
      response.summary.checkpoint_locator_field,
      response.family_orchestration.resume_contract.checkpoint_locator_field,
    );
    assert.equal(response.product_entry_surface.continuation_snapshot.latest_managed_run_id, response.summary.target_handle);
    assert.equal(response.session_continuity.entry_session_id, 'session-federated');
    assert.deepEqual(response.session_continuity, response.product_entry_surface.session_continuity);
    assert.deepEqual(response.progress_projection, response.product_entry_surface.progress_projection);
    assert.deepEqual(response.artifact_inventory, response.product_entry_surface.artifact_inventory);
    assert.equal(response.product_entry_surface.session_continuity.entry_session_id, 'session-federated');
    assert.equal(response.product_entry_surface.session_continuity.restore_point.latest_handle, response.summary.target_handle);
    assertRuntimeLoopClosureShape(response.product_entry_surface, {
      source: 'federated',
      entryMode: 'opl_gateway',
    });
    assert.equal(response.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(response.runtime_loop_closure.source_linkage.current_source, 'federated');
    assert.equal(response.runtime_loop_closure.source_linkage.entry_mode, 'opl_gateway');
    assert.deepEqual(
      response.runtime_loop_closure.loop_owner,
      response.product_entry_surface.runtime_loop_closure.loop_owner,
    );
    assertFamilyOrchestrationCompanion(response, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
    assertFamilyOrchestrationCompanion(response.product_entry_surface, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
  });
});

test('getProductEntryManifest projects the current direct-entry shell and shared OPL handoff truth', SERIAL_ENV_TEST, async () => {
  await withMockHermesAndRuntimeState(async ({ runtimeStateRoot }) => {
    const sharedCompanions = await importGatewaySharedModule(PRODUCT_ENTRY_COMPANIONS_SPECIFIER);
    const workspaceRoot = await prepareProductEntryWorkspace();

    const manifest = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });

    assert.equal(manifest.ok, true);
    assert.equal(manifest.surface_kind, 'product_entry_manifest');
    assert.equal(manifest.manifest_version, 2);
    assert.equal(manifest.manifest_kind, 'redcube_product_entry_manifest');
    assert.equal(manifest.target_domain_id, 'redcube_ai');
    assert.equal(manifest.formal_entry.default, 'CLI');
    assert.deepEqual(manifest.formal_entry.supported_protocols, ['MCP']);
    assert.equal(manifest.workspace_locator.workspace_surface_kind, 'redcube_workspace');
    assert.equal(manifest.workspace_locator.workspace_root, workspaceRoot);
    assert.equal(manifest.recommended_shell, 'direct');
    assert.equal(manifest.recommended_command, 'redcube product invoke');
    assert.equal(manifest.frontdesk_surface.shell_key, 'frontdesk');
    assert.equal(manifest.frontdesk_surface.command, 'redcube product frontdesk');
    assert.equal(manifest.frontdesk_surface.surface_kind, 'product_frontdesk');
    assert.match(manifest.frontdesk_surface.summary, /frontdesk/i);
    assert.equal(manifest.operator_loop_surface.shell_key, 'direct');
    assert.equal(manifest.operator_loop_surface.command, 'redcube product invoke');
    assert.equal(manifest.operator_loop_surface.surface_kind, 'product_entry');
    assert.equal(manifest.operator_loop_surface.continuation_shell_key, 'session');
    assert.equal(manifest.operator_loop_surface.continuation_command, 'redcube product session');
    assert.match(manifest.operator_loop_surface.summary, /entry_session_id/);
    assert.equal(manifest.operator_loop_actions.start_deliverable.command, 'redcube product invoke');
    assert.equal(manifest.operator_loop_actions.start_deliverable.surface_kind, 'product_entry');
    assert.deepEqual(manifest.operator_loop_actions.start_deliverable.requires, ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id']);
    assert.equal(manifest.operator_loop_actions.continue_session.command, 'redcube product session');
    assert.deepEqual(manifest.operator_loop_actions.continue_session.requires, ['entry_session_id']);
    assert.equal(manifest.operator_loop_actions.opl_bridge_handoff.command, 'redcube product federate');
    assert.equal(manifest.product_entry_quickstart.surface_kind, 'product_entry_quickstart');
    assert.equal(manifest.product_entry_quickstart.recommended_step_id, 'open_frontdesk');
    assert.deepEqual(manifest.product_entry_quickstart.human_gate_ids, ['redcube_operator_review_gate']);
    assert.deepEqual(
      manifest.product_entry_quickstart.steps.map((step) => step.step_id),
      ['open_frontdesk', 'continue_current_loop', 'inspect_current_progress'],
    );
    assert.equal(
      manifest.product_entry_quickstart.steps[0].command,
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
    );
    assert.equal(
      manifest.product_entry_quickstart.steps[1].command,
      `redcube product invoke --workspace-root ${workspaceRoot} --entry-session-id <entry-session-id> --overlay <overlay-id> --topic-id <topic-id> --deliverable-id <deliverable-id>`,
    );
    assert.deepEqual(manifest.product_entry_quickstart.steps[2].requires, ['entry_session_id']);
    assert.equal(manifest.product_entry_overview.surface_kind, 'product_entry_overview');
    assert.equal(
      manifest.product_entry_overview.summary,
      'Repo-verified product-entry service surface 已 landed，但成熟终端用户前台壳与 managed web productization 仍未 landed。',
    );
    assert.equal(manifest.product_entry_overview.frontdesk_command, 'redcube product frontdesk');
    assert.equal(manifest.product_entry_overview.recommended_command, 'redcube product invoke');
    assert.equal(manifest.product_entry_overview.operator_loop_command, 'redcube product invoke');
    assert.deepEqual(manifest.product_entry_overview.progress_surface, {
      surface_kind: 'product_entry_session',
      command: 'redcube product session --entry-session-id <entry-session-id>',
      step_id: 'inspect_current_progress',
    });
    assert.deepEqual(manifest.product_entry_overview.resume_surface, {
      surface_kind: 'product_entry_session',
      command: 'redcube product session --entry-session-id <entry-session-id>',
      session_locator_field: 'entry_session_contract.entry_session_id',
      checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
    });
    assert.equal(manifest.product_entry_overview.recommended_step_id, 'open_frontdesk');
    assert.deepEqual(manifest.product_entry_overview.human_gate_ids, ['redcube_operator_review_gate']);
    assert.equal(manifest.product_entry_start.surface_kind, 'product_entry_start');
    assert.equal(manifest.product_entry_start.recommended_mode_id, 'open_frontdesk');
    assert.deepEqual(
      manifest.product_entry_start.modes.map((mode) => mode.mode_id),
      ['open_frontdesk', 'start_direct_session', 'opl_bridge_handoff', 'resume_session'],
    );
    assert.equal(
      manifest.product_entry_start.modes[0].command,
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(
      manifest.product_entry_start.modes[1].requires,
      ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
    );
    assert.equal(manifest.product_entry_start.modes[2].surface_kind, 'federated_product_entry');
    assert.equal(manifest.product_entry_start.modes[3].surface_kind, 'product_entry_session');
    assert.deepEqual(manifest.product_entry_start.resume_surface, {
      surface_kind: 'product_entry_session',
      command: 'redcube product session --entry-session-id <entry-session-id>',
      session_locator_field: 'entry_session_contract.entry_session_id',
      checkpoint_locator_field: 'continuation_snapshot.latest_managed_run_id',
    });
    assert.deepEqual(manifest.product_entry_start.human_gate_ids, ['redcube_operator_review_gate']);
    assert.equal(manifest.product_entry_preflight.surface_kind, 'product_entry_preflight');
    assert.equal(
      manifest.product_entry_preflight.summary,
      'Current product-entry preflight passed; inspect the workspace doctor output and then open the RedCube frontdesk.',
    );
    assert.equal(manifest.product_entry_preflight.ready_to_try_now, true);
    assert.equal(
      manifest.product_entry_preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.equal(
      manifest.product_entry_preflight.recommended_start_command,
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(manifest.product_entry_preflight.blocking_check_ids, []);
    assert.deepEqual(
      manifest.product_entry_preflight.checks.map((check) => check.check_id),
      [
        'workspace_root_resolved',
        'workspace_contract_present',
        'runtime_state_root_ready',
        'frontdoor_contract_landed',
      ],
    );
    assert.equal(manifest.product_entry_preflight.checks[0].status, 'pass');
    assert.equal(manifest.product_entry_preflight.checks[1].status, 'pass');
    assert.equal(manifest.product_entry_preflight.checks[2].status, 'pass');
    assert.equal(manifest.product_entry_preflight.checks[3].status, 'pass');
    assert.equal(manifest.repo_mainline.program_id, 'redcube-runtime-program');
    assert.equal(manifest.repo_mainline.phase_id, 'repo_verified_product_entry_and_opl_federation');
    assert.equal(manifest.repo_mainline.active_baton_id, 'managed_product_entry_hardening');
    assert.equal(
      manifest.product_entry_status.summary,
      'Repo-verified product-entry service surface 已 landed，但成熟终端用户前台壳与 managed web productization 仍未 landed。',
    );
    assert.equal(manifest.product_entry_status.remaining_gaps_count, 2);
    assert.deepEqual(manifest.product_entry_status.next_focus, [
      '继续把 mature end-user shell 建在已 landed 的 RedCube product-entry service surface 之上。',
      '继续把 internal OPL bridge 与同一 downstream product-entry contract 对齐。',
    ]);
    assert.equal(manifest.product_entry_readiness.surface_kind, 'product_entry_readiness');
    assert.equal(manifest.product_entry_readiness.verdict, 'service_surface_ready_not_managed_product');
    assert.equal(manifest.product_entry_readiness.usable_now, true);
    assert.equal(manifest.product_entry_readiness.good_to_use_now, false);
    assert.equal(manifest.product_entry_readiness.fully_automatic, false);
    assert.equal(manifest.product_entry_readiness.recommended_start_surface, 'product_frontdesk');
    assert.equal(manifest.product_entry_readiness.recommended_start_command, 'redcube product frontdesk');
    assert.equal(manifest.product_entry_readiness.recommended_loop_surface, 'product_entry');
    assert.equal(manifest.product_entry_readiness.recommended_loop_command, 'redcube product invoke');
    assert.deepEqual(manifest.product_entry_readiness.blocking_gaps, [
      '成熟的最终用户前台壳仍未 landed。',
      'managed web productization 仍未 landed。',
    ]);
    assert.equal(manifest.runtime.runtime_owner, 'upstream_hermes_agent');
    assert.equal(manifest.runtime.runtime_state_root, runtimeStateRoot);
    assert.deepEqual(manifest.managed_runtime_contract, {
      shared_contract_ref: 'contracts/opl-gateway/managed-runtime-three-layer-contract.json',
      runtime_owner: 'upstream_hermes_agent',
      domain_owner: 'redcube_ai',
      executor_owner: 'codex_cli',
      supervision_status_surface: {
        surface_kind: 'product_entry_session',
        owner: 'redcube_ai',
      },
      attention_queue_surface: {
        surface_kind: 'product_frontdesk',
        owner: 'redcube_ai',
      },
      recovery_contract_surface: {
        surface_kind: 'product_entry_session',
        owner: 'redcube_ai',
      },
      fail_closed_rules: [
        'domain_supervision_cannot_bypass_runtime',
        'executor_cannot_declare_global_gate_clear',
        'runtime_cannot_invent_domain_publishability_truth',
      ],
    });
    assert.equal(manifest.runtime_inventory.surface_kind, 'runtime_inventory');
    assert.equal(manifest.runtime_inventory.runtime_owner, 'upstream_hermes_agent');
    assert.equal(manifest.runtime_inventory.domain_owner, 'redcube_ai');
    assert.equal(manifest.runtime_inventory.executor_owner, 'codex_cli');
    assert.equal(manifest.runtime_inventory.status_surface.ref, '/product_entry_preflight');
    assert.equal(manifest.runtime_inventory.attention_surface.ref, '/frontdesk_surface');
    assert.equal(manifest.runtime_inventory.recovery_surface.ref, '/operator_loop_actions/continue_session');
    assert.equal(manifest.runtime_inventory.workspace_binding.workspace_root, workspaceRoot);
    assert.equal(manifest.runtime_inventory.workspace_binding.runtime_state_root, runtimeStateRoot);
    assert.equal(manifest.runtime_inventory.workspace_binding.session_store_root, manifest.runtime.session_store_root);
    assert.equal(manifest.task_lifecycle.surface_kind, 'task_lifecycle');
    assert.equal(manifest.task_lifecycle.task_kind, 'visual_deliverable_loop');
    assert.equal(manifest.task_lifecycle.task_id, 'managed_product_entry_hardening');
    assert.equal(manifest.task_lifecycle.status, 'resumable');
    assert.equal(
      manifest.task_lifecycle.progress_surface.command,
      'redcube product session --entry-session-id <entry-session-id>',
    );
    assert.equal(
      manifest.task_lifecycle.resume_surface.command,
      'redcube product session --entry-session-id <entry-session-id>',
    );
    assert.equal(manifest.task_lifecycle.checkpoint_summary.surface_kind, 'checkpoint_summary');
    assert.equal(manifest.task_lifecycle.checkpoint_summary.status, 'operator_review_required');
    assert.deepEqual(manifest.task_lifecycle.human_gate_ids, ['redcube_operator_review_gate']);
    assert.equal(manifest.skill_catalog.surface_kind, 'skill_catalog');
    assert.equal(manifest.skill_catalog.skills.length, 1);
    assert.deepEqual(manifest.skill_catalog.supported_commands, [
      'redcube product frontdesk',
      'redcube product invoke',
      'redcube product session',
    ]);
    assert.equal(manifest.skill_catalog.command_contracts.length, 3);
    assert.equal(manifest.skill_catalog.skills[0].skill_id, 'redcube-ai');
    assert.equal(manifest.skill_catalog.skills[0].title, 'RedCube AI');
    assert.equal(manifest.skill_catalog.skills[0].command, 'redcube product frontdesk');
    assert.equal(manifest.skill_catalog.skills[0].target_surface_kind, 'product_frontdesk');
    assert.deepEqual(manifest.skill_catalog.skills[0].tags, ['domain-app', 'product-entry', 'visual-deliverables']);
    assert.deepEqual(
      manifest.skill_catalog.skills[0].domain_projection.skill_activation,
      {
        plugin_name: 'redcube-ai',
        skill_semantics: 'single_domain_app_skill',
        entry_shell_key: 'frontdesk',
        entry_command: 'redcube product frontdesk',
        supporting_shell_keys: ['direct', 'session'],
        shell_commands: {
          frontdesk: {
            command: 'redcube product frontdesk',
            target_surface_kind: 'product_frontdesk',
          },
          direct: {
            command: 'redcube product invoke',
            target_surface_kind: 'product_entry',
          },
          session: {
            command: 'redcube product session',
            target_surface_kind: 'product_entry_session',
          },
        },
      },
    );
    assert.deepEqual(
      manifest.skill_catalog.skills[0].domain_projection.runtime_continuity,
      {
        surface_kind: 'skill_runtime_continuity',
        runtime_owner: 'upstream_hermes_agent',
        domain_owner: 'redcube_ai',
        executor_owner: 'codex_cli',
        session_locator_field: 'entry_session_contract.entry_session_id',
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
        recommended_resume_command: 'redcube product session --entry-session-id <entry-session-id>',
        recommended_progress_command: 'redcube product session --entry-session-id <entry-session-id>',
        recommended_artifact_command: 'redcube product session --entry-session-id <entry-session-id>',
      },
    );
    assert.equal(manifest.automation.surface_kind, 'automation');
    assert.equal(manifest.automation.automations.length, 2);
    assert.equal(manifest.automation.automations[0].automation_id, 'redcube_autopilot_continuation_board');
    assert.equal(manifest.automation.automations[0].trigger_kind, 'continuation_board');
    assert.equal(manifest.automation.automations[0].readiness_status, 'tracked_follow_on');
    assert.equal(manifest.automation.automations[0].gate_policy, 'operator_review_gated');
    assert.equal(manifest.automation.automations[1].automation_id, 'redcube_operator_review_gate');
    assert.equal(manifest.automation.automations[1].trigger_kind, 'operator_review_gate');
    assert.equal(manifest.automation.automations[1].readiness_status, 'repo_tracked');
    assert.equal(manifest.automation.automations[1].gate_policy, 'human_gate_required');
    assert.equal(manifest.product_entry_shell.frontdesk.command, 'redcube product frontdesk');
    assert.equal(manifest.product_entry_shell.direct.command, 'redcube product invoke');
    assert.equal(manifest.product_entry_shell.opl_bridge.command, 'redcube product federate');
    assert.equal(manifest.product_entry_shell.session.command, 'redcube product session');
    assert.match(manifest.product_entry_shell.frontdesk.purpose, /frontdesk/i);
    assert.match(manifest.product_entry_shell.direct.purpose, /deliverable loop/i);
    assert.equal(manifest.route_equivalence.surface_kind, 'route_equivalence_contract');
    assert.equal(manifest.route_equivalence.public_skill_policy.skill_count, 1);
    assert.deepEqual(manifest.route_equivalence.public_skill_policy.skill_ids, ['redcube-ai']);
    assert.deepEqual(
      manifest.route_equivalence.equivalent_routes.map((route) => route.route_id),
      ['product_frontdesk', 'product_invoke', 'session_continuation', 'internal_opl_bridge'],
    );
    assert.deepEqual(
      manifest.route_equivalence.shared_truth_surfaces,
      [
        'domain_entry_surface',
        'session_continuity',
        'progress_projection',
        'artifact_inventory',
        'runtime_loop_closure',
        'review_state',
        'publication_projection',
      ],
    );
    assert.equal(
      manifest.route_equivalence.downstream_runtime_truth.entry_surface_kind,
      'domain_entry',
    );
    assert.equal(
      manifest.route_equivalence.downstream_runtime_truth.runtime_owner,
      'upstream_hermes_agent',
    );
    assert.equal(manifest.deliverable_facade.surface_kind, 'deliverable_facade_contract');
    assert.deepEqual(manifest.deliverable_facade.covered_families, ['ppt_deck', 'xiaohongshu']);
    assert.deepEqual(manifest.deliverable_facade.facade_truth_surfaces, [
      'createDeliverable',
      'runManagedDeliverable',
      'runDeliverableRoute',
      'auditDeliverable',
      'runtimeWatch',
      'getReviewState',
      'getPublicationProjection',
    ]);
    assert.equal(manifest.deliverable_facade.public_entry_policy.new_public_entry_allowed, false);
    assert.equal(manifest.deliverable_facade.public_entry_policy.canonical_skill_id, 'redcube-ai');
    assert.equal(manifest.shared_handoff.opl_return_surface.surface_kind, 'product_entry');
    assert.equal(manifest.domain_entry_contract.entry_adapter, 'RedCubeDomainEntry');
    assert.equal(manifest.domain_entry_contract.service_safe_surface_kind, 'domain_entry');
    assert.equal(manifest.domain_entry_contract.product_entry_builder_command, 'redcube product manifest');
    assert.deepEqual(manifest.domain_entry_contract.supported_entry_modes, ['direct', 'opl_gateway', 'session']);
    assert.deepEqual(manifest.domain_entry_contract.supported_commands, [
      'redcube product manifest',
      'redcube product frontdesk',
      'redcube product start',
      'redcube product invoke',
      'redcube product federate',
      'redcube product session',
    ]);
    assert.equal(manifest.domain_entry_contract.command_contracts.length, 6);
    assert.equal(manifest.domain_entry_contract.command_contracts[0].command, 'redcube product manifest');
    assert.deepEqual(manifest.domain_entry_contract.command_contracts[0].required_fields, ['workspace_root']);
    assert.equal(manifest.domain_entry_contract.command_contracts[3].command, 'redcube product invoke');
    assert.deepEqual(manifest.domain_entry_contract.command_contracts[3].required_fields, [
      'workspace_root',
      'entry_session_id',
      'overlay',
      'topic_id',
      'deliverable_id',
    ]);
    assert.equal(manifest.domain_entry_contract.command_contracts[4].command, 'redcube product federate');
    assert.deepEqual(manifest.domain_entry_contract.command_contracts[4].required_fields, [
      'workspace_root',
      'entry_session_id',
      'target_domain_id',
      'entry_mode',
      'return_surface_kind',
      'overlay',
      'topic_id',
      'deliverable_id',
    ]);
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.surface_kind,
      'domain_agent_entry_spec',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.agent_id,
      'rca',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.default_engine,
      'codex',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.workspace_requirement,
      'required',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.codex_entry_strategy,
      'domain_agent_entry',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.artifact_conventions,
      'deck_and_visual_delivery',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.progress_conventions,
      'deliverable_build_narration',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.entry_command,
      'redcube product frontdesk',
    );
    assert.equal(
      manifest.domain_entry_contract.domain_agent_entry_spec.manifest_command,
      'redcube product manifest',
    );
    assert.deepEqual(
      manifest.domain_entry_contract.domain_agent_entry_spec.locator_schema,
      {
        required_fields: ['workspace_root'],
        optional_fields: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      },
    );
    assert.equal(manifest.gateway_interaction_contract.surface_kind, 'gateway_interaction_contract');
    assert.equal(manifest.gateway_interaction_contract.frontdoor_owner, 'opl_gateway_or_domain_gui');
    assert.equal(manifest.gateway_interaction_contract.user_interaction_mode, 'natural_language_frontdoor');
	    assert.equal(manifest.gateway_interaction_contract.user_commands_required, false);
	    assert.equal(manifest.gateway_interaction_contract.command_surfaces_for_agent_consumption_only, true);
	    assert.equal(manifest.gateway_interaction_contract.shared_downstream_entry, 'RedCubeDomainEntry');
    assert.deepEqual(manifest.gateway_interaction_contract.shared_handoff_envelope, [
      'target_domain_id',
      'task_intent',
      'entry_mode',
      'workspace_locator',
      'runtime_session_contract',
      'return_surface_contract',
      'entry_session_contract',
      'delivery_request',
	    ]);
	    assert.equal(manifest.current_truth.product_entry_contract, 'contracts/runtime-program/redcube-product-entry-mvp.json');
	    assert.equal(manifest.session_continuity.surface_kind, 'session_continuity');
	    assert.equal(manifest.session_continuity.owner, 'redcube_ai');
	    assert.equal(manifest.session_continuity.status, 'repo_tracked');
	    assert.equal(manifest.session_continuity.session_command_template, 'redcube product session --entry-session-id <entry-session-id>');
	    assert.equal(manifest.session_continuity.restore_point_surface_ref.ref, '/session_continuity/restore_point');
	    assert.equal(manifest.session_continuity.progress_surface_ref.ref, '/progress_projection');
	    assert.equal(manifest.session_continuity.artifact_surface_ref.ref, '/artifact_inventory');
	    assert.deepEqual(
	      manifest.session_continuity.truth_surfaces.map((surface) => surface.surface_kind),
	      ['product_entry', 'product_entry_session'],
	    );
	    assert.equal(manifest.progress_projection.surface_kind, 'progress_projection');
	    assert.equal(manifest.progress_projection.owner, 'redcube_ai');
	    assert.equal(manifest.progress_projection.status, 'repo_tracked');
	    assert.equal(manifest.progress_projection.projection_field_ref.ref, '/progress_projection/projection');
	    assert.equal(manifest.progress_projection.fallback_projection_ref.ref, '/continuation_snapshot/managed_progress_projection');
	    assert.equal(manifest.artifact_inventory.surface_kind, 'artifact_inventory');
	    assert.equal(manifest.artifact_inventory.owner, 'redcube_ai');
	    assert.equal(manifest.artifact_inventory.status, 'repo_tracked');
	    assert.equal(manifest.artifact_inventory.artifact_refs_ref.ref, '/artifact_inventory/artifact_refs');
	    assert.equal(
	      manifest.artifact_inventory.artifact_refs_fallback_ref.ref,
	      '/continuation_snapshot/managed_progress_projection/final_artifact_refs',
	    );
      assert.equal(manifest.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
      assert.equal(manifest.runtime_loop_closure.loop_owner.runtime_owner, 'upstream_hermes_agent');
      assert.equal(manifest.runtime_loop_closure.loop_owner.domain_owner, 'redcube_ai');
      assert.equal(manifest.runtime_loop_closure.loop_owner.product_entry_owner, 'redcube_ai');
      assert.equal(
        manifest.runtime_loop_closure.resume_point.resume_command_template,
        'redcube product session --entry-session-id <entry-session-id>',
      );
      assert.equal(manifest.runtime_loop_closure.continuity_cursor.surface_ref, '/session_continuity');
      assert.equal(manifest.runtime_loop_closure.progress_cursor.surface_ref, '/progress_projection');
      assert.equal(manifest.runtime_loop_closure.artifact_pickup.surface_ref, '/artifact_inventory');
      assert.equal(manifest.runtime_loop_closure.control_policy.approval_gate_id, 'redcube_operator_review_gate');
      assert.equal(manifest.runtime_loop_closure.control_policy.gate_status, 'requested');
      assert.equal(manifest.runtime_loop_closure.source_linkage.current_source, 'manifest');
      assert.equal(manifest.runtime_loop_closure.source_linkage.entry_mode, 'manifest_projection');
      assert.equal(manifest.runtime_loop_closure.source_linkage.direct_surface_kind, 'product_entry');
      assert.equal(manifest.runtime_loop_closure.source_linkage.federated_surface_kind, 'federated_product_entry');
      assert.equal(manifest.runtime_loop_closure.source_linkage.session_surface_kind, 'product_entry_session');
      assert.equal(manifest.runtime_loop_closure.source_linkage.downstream_entry_surface_kind, 'domain_entry');
	    const validatedManifest = sharedCompanions.validateFamilyProductEntryManifest(manifest, {
	      requireRuntimeCompanions: true,
	    });
    assert.equal(validatedManifest.domain_entry_contract.entry_adapter, 'RedCubeDomainEntry');
    assert.equal(validatedManifest.gateway_interaction_contract.frontdoor_owner, 'opl_gateway_or_domain_gui');
    assertFamilyOrchestrationCompanion(manifest, {
      sessionLocatorField: 'entry_session_contract.entry_session_id',
    });
    assert.equal(manifest.family_orchestration.action_graph.edges.length, 4);
    assert.deepEqual(manifest.family_orchestration.action_graph.human_gates, [
      {
        gate_id: 'redcube_operator_review_gate',
        trigger_nodes: ['step:inspect_current_progress'],
        blocking: true,
      },
    ]);

    const frontdesk = await getProductFrontdesk({
      workspace_root: workspaceRoot,
    });
    assert.equal(frontdesk.ok, true);
    assert.equal(frontdesk.surface_kind, 'product_frontdesk');
    assert.equal(frontdesk.product_entry_overview.surface_kind, 'product_entry_overview');
    assert.equal(frontdesk.product_entry_overview.progress_surface.surface_kind, 'product_entry_session');
    assert.equal(frontdesk.product_entry_start.surface_kind, 'product_entry_start');
    assert.equal(frontdesk.product_entry_start.recommended_mode_id, 'open_frontdesk');
    assert.equal(frontdesk.product_entry_start.modes[2].mode_id, 'opl_bridge_handoff');
    assert.equal(frontdesk.product_entry_start.modes[3].mode_id, 'resume_session');
    assert.deepEqual(frontdesk.product_entry_start, manifest.product_entry_start);
    assert.equal(frontdesk.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(frontdesk.runtime_loop_closure.source_linkage.current_source, 'frontdesk');
    assert.equal(frontdesk.runtime_loop_closure.source_linkage.entry_mode, 'frontdesk_projection');
    assert.equal(
      frontdesk.product_entry_overview.resume_surface.command,
      'redcube product session --entry-session-id <entry-session-id>',
    );
    assert.equal(frontdesk.product_entry_readiness.surface_kind, 'product_entry_readiness');
    assert.equal(frontdesk.product_entry_readiness.verdict, 'service_surface_ready_not_managed_product');
    assert.equal(frontdesk.product_entry_readiness.usable_now, true);
    assert.equal(frontdesk.product_entry_readiness.good_to_use_now, false);
    assert.equal(frontdesk.product_entry_readiness.recommended_start_command, 'redcube product frontdesk');
    assert.equal(frontdesk.product_entry_preflight.surface_kind, 'product_entry_preflight');
    assert.equal(frontdesk.product_entry_preflight.ready_to_try_now, true);
    assert.equal(
      frontdesk.product_entry_preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(frontdesk.product_entry_preflight, manifest.product_entry_preflight);
    assert.equal(frontdesk.product_entry_quickstart.recommended_step_id, 'open_frontdesk');
    assert.equal(frontdesk.product_entry_quickstart.steps[2].step_id, 'inspect_current_progress');
    assert.equal(frontdesk.product_entry_quickstart.steps[2].surface_kind, 'product_entry_session');
    assert.equal(frontdesk.schema_ref, manifest.schema_ref);
    assert.deepEqual(frontdesk.domain_entry_contract, manifest.domain_entry_contract);
    assert.deepEqual(frontdesk.gateway_interaction_contract, manifest.gateway_interaction_contract);
    assert.equal(frontdesk.extra_payload, undefined);
    const validatedFrontdesk = sharedCompanions.validateFamilyProductFrontdesk(frontdesk);
    assert.equal(validatedFrontdesk.domain_entry_contract.entry_adapter, 'RedCubeDomainEntry');
    assert.equal(validatedFrontdesk.gateway_interaction_contract.shared_downstream_entry, 'RedCubeDomainEntry');
    assertFamilyOrchestrationCompanion(frontdesk, {
      sessionLocatorField: 'entry_session_contract.entry_session_id',
    });

    const preflight = await getProductPreflight({
      workspace_root: workspaceRoot,
    });
    assert.equal(preflight.ok, true);
    assert.equal(preflight.surface_kind, 'product_entry_preflight');
    assert.equal(preflight.target_domain_id, 'redcube_ai');
    assert.equal(preflight.workspace_locator.workspace_root, workspaceRoot);
    assert.equal(preflight.ready_to_try_now, true);
    assert.equal(preflight.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(preflight.runtime_loop_closure.source_linkage.current_source, 'preflight');
    assert.equal(preflight.runtime_loop_closure.source_linkage.entry_mode, 'preflight_projection');
    assert.equal(
      preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.equal(
      preflight.recommended_start_command,
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(preflight.blocking_check_ids, []);
    assert.equal(manifest.product_entry_preflight.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(manifest.product_entry_preflight.runtime_loop_closure.source_linkage.current_source, 'preflight');
  });
});

test('getProductStart exposes the same direct-entry start companion as the manifest', SERIAL_ENV_TEST, async () => {
  await withMockHermesAndRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const start = await getProductStart({
      workspace_root: workspaceRoot,
    });

    assert.equal(start.ok, true);
    assert.equal(start.surface_kind, 'product_entry_start');
    assert.equal(start.recommended_mode_id, 'open_frontdesk');
    assert.deepEqual(
      start.modes.map((mode) => mode.mode_id),
      ['open_frontdesk', 'start_direct_session', 'opl_bridge_handoff', 'resume_session'],
    );
    assert.equal(
      start.modes[0].command,
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
    );
    assert.equal(start.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(start.runtime_loop_closure.source_linkage.current_source, 'start');
    assert.equal(start.runtime_loop_closure.source_linkage.entry_mode, 'start_projection');
    assert.equal(start.resume_surface.surface_kind, 'product_entry_session');
    assert.deepEqual(start.human_gate_ids, ['redcube_operator_review_gate']);
  });
});

test('product preflight consumes OPL shared program builders from the pinned owner commit', async () => {
  const gatewayPackage = readJson(GATEWAY_PACKAGE_JSON);
  assert.match(
    gatewayPackage.dependencies['opl-gateway-shared'],
    /^git\+https:\/\/github\.com\/gaofeng21cn\/one-person-lab\.git#[0-9a-f]{40}$/,
  );
  const companions = await importGatewaySharedModule(PRODUCT_ENTRY_PROGRAM_COMPANIONS_SPECIFIER);
  assert.equal(typeof companions.buildProductEntryPreflight, 'function');
  assert.equal(typeof companions.buildProgramCheck, 'function');
});
