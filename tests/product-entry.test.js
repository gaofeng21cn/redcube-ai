import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

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

async function withMockHermesAndRuntimeState(testFn) {
  const upstream = await startMockCodexCli();
  const runtimeStateRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-state-'));
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
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
      'step:federated_handoff',
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
    assert.equal(response.entry_session.runtime_owner, 'codex_cli');
    assert.equal(response.delivery_identity.deliverable_family, 'ppt_deck');
    assert.equal(response.delivery_identity.topic_id, 'topic-a');
    assert.equal(response.delivery_identity.deliverable_id, 'deck-a');
    assert.equal(response.domain_entry_surface.entry_contract_id, 'redcube_service_safe_domain_entry');
    assert.equal(response.domain_entry_surface.entry_mode, 'redcube_product_entry');
    assert.equal(response.domain_entry_surface.result_surface.surface_kind, 'managed_run');
    assert.equal(response.continuation_snapshot.latest_managed_run_id, response.domain_entry_surface.summary.target_handle);
    assert.equal(response.continuation_snapshot.latest_run_id, null);
    assert.equal(response.continuation_snapshot.managed_progress_projection.current_stage, 'storyline');
    assert.equal(response.continuation_snapshot.runtime_supervision.runtime_owner, 'codex_cli');
    assert.equal(response.review_state.surface_kind, 'review_state');
    assert.equal(response.publication_projection.surface_kind, 'publication_projection');
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
    assert.equal(session.entry_session.runtime_owner, 'codex_cli');
    assert.equal(session.delivery_identity.deliverable_family, 'ppt_deck');
    assert.equal(session.delivery_identity.topic_id, 'topic-a');
    assert.equal(session.delivery_identity.deliverable_id, 'deck-a');
    assert.equal(session.continuation_snapshot.latest_managed_run_id, continued.continuation_snapshot.latest_managed_run_id);
    assert.equal(session.review_state.surface_kind, 'review_state');
    assert.equal(session.publication_projection.surface_kind, 'publication_projection');
    assertFamilyOrchestrationCompanion(continued, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
    assertFamilyOrchestrationCompanion(session, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
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
        runtime_owner: 'codex_cli',
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
    assert.equal(response.runtime_session_contract.runtime_owner, 'codex_cli');
    assert.equal(response.return_surface_contract.requested_surface_kind, 'product_entry');
    assert.equal(response.return_surface_contract.actual_surface_kind, 'product_entry');
    assert.equal(response.product_entry_surface.surface_kind, 'product_entry');
    assert.equal(response.product_entry_surface.entry_session.entry_session_id, 'session-federated');
    assert.equal(response.product_entry_surface.domain_entry_surface.entry_mode, 'opl_gateway');
    assert.equal(response.product_entry_surface.domain_entry_surface.entry_contract_id, 'redcube_service_safe_domain_entry');
    assert.equal(response.product_entry_surface.continuation_snapshot.latest_managed_run_id, response.summary.target_handle);
    assertFamilyOrchestrationCompanion(response, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
    assertFamilyOrchestrationCompanion(response.product_entry_surface, {
      sessionLocatorField: 'entry_session.entry_session_id',
    });
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
    assert.equal(manifest.operator_loop_actions.federated_handoff.command, 'redcube product federate');
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
      ['open_frontdesk', 'start_direct_session', 'federated_handoff', 'resume_session'],
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
      '继续把 OPL federated handoff 与同一 downstream product-entry contract 对齐。',
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
    assert.equal(manifest.runtime.runtime_owner, 'codex_cli');
    assert.equal(manifest.runtime.runtime_state_root, runtimeStateRoot);
    assert.equal(manifest.product_entry_shell.frontdesk.command, 'redcube product frontdesk');
    assert.equal(manifest.product_entry_shell.direct.command, 'redcube product invoke');
    assert.equal(manifest.product_entry_shell.federated.command, 'redcube product federate');
    assert.equal(manifest.product_entry_shell.session.command, 'redcube product session');
    assert.equal(manifest.shared_handoff.opl_return_surface.surface_kind, 'product_entry');
    assert.equal(manifest.current_truth.product_entry_contract, 'contracts/runtime-program/redcube-product-entry-mvp.json');
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
    assert.equal(frontdesk.product_entry_start.modes[2].mode_id, 'federated_handoff');
    assert.equal(frontdesk.product_entry_start.modes[3].mode_id, 'resume_session');
    assert.deepEqual(frontdesk.product_entry_start, manifest.product_entry_start);
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
    assert.equal(
      preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );
    assert.equal(
      preflight.recommended_start_command,
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
    );
    assert.deepEqual(preflight.blocking_check_ids, []);
  });
});

test('getProductStart exposes the same direct-entry start companion as the manifest', async () => {
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
      ['open_frontdesk', 'start_direct_session', 'federated_handoff', 'resume_session'],
    );
    assert.equal(
      start.modes[0].command,
      `redcube product frontdesk --workspace-root ${workspaceRoot}`,
    );
    assert.equal(start.resume_surface.surface_kind, 'product_entry_session');
    assert.deepEqual(start.human_gate_ids, ['redcube_operator_review_gate']);
  });
});
