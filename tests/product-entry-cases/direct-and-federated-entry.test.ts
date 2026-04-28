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


test('invokeProductEntry converts review-first deck intent into a stop-after-outline lifecycle gate', SERIAL_ENV_TEST, async () => {
  await withMockHermesAndRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const response = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-review-first',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-review-first',
        profile_id: 'lecture_student',
        title: 'OPL 系列项目介绍',
        goal: '介绍 OPL 系列项目和 Med Auto Science 自动科研，面向医生专家，20 分钟以上',
        user_intent: '不要一次性生成，先做到故事主线给我看看，我审阅之后再继续往下做',
        lifecycle_policy: 'operator_review_after_plan',
      },
    });

    assert.equal(response.ok, true);
    assert.equal(response.domain_entry_surface.result_surface.managed_run.mode, 'stop_after_stage');
    assert.equal(response.domain_entry_surface.result_surface.managed_run.stop_after_stage, 'detailed_outline');
    assert.equal(response.domain_entry_surface.result_surface.managed_run.status, 'stopped_after_stage');
    assert.equal(response.domain_entry_surface.result_surface.managed_run.current_stage, 'detailed_outline');
    assert.equal(response.runtime_loop_closure.control_policy.approval_required, true);
    assert.equal(response.summary.approval_required, true);
  });
});

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

