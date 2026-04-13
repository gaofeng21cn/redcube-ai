import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';

import {
  createDeliverable,
  invokeDomainEntry,
} from '../packages/redcube-gateway/src/index.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.js';

async function withMockHermesUpstream(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

async function prepareDomainEntryWorkspace() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-domain-entry-'));

  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: 'Domain entry proof',
    brief: '验证 service-safe domain entry surface。',
    keywords: ['entry', 'opl'],
  });

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: 'Domain entry proof',
    goal: '验证 service-safe domain entry',
  });

  return workspaceRoot;
}

test('invokeDomainEntry runs the service-safe managed deliverable adapter against Codex CLI', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = await prepareDomainEntryWorkspace();

    const response = await invokeDomainEntry({
      target_domain_id: 'redcube_ai',
      task_intent: 'run_managed_deliverable',
      entry_mode: 'opl_gateway',
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      runtime_session_contract: {
        runtime_owner: 'codex_cli',
        adapter_surface: '@redcube/codex-cli-client',
        session_mode: 'ephemeral_run',
      },
      return_surface_contract: {
        surface_kind: 'managed_run',
      },
      domain_payload: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        user_intent: '先只做主线故事',
        stop_after_stage: 'storyline',
      },
    });

    assert.equal(response.ok, true);
    assert.equal(response.surface_kind, 'domain_entry');
    assert.equal(response.entry_contract_id, 'redcube_service_safe_domain_entry');
    assert.equal(response.task_intent, 'run_managed_deliverable');
    assert.equal(response.entry_mode, 'opl_gateway');
    assert.equal(response.runtime_session_contract.runtime_owner, 'codex_cli');
    assert.equal(response.return_surface_contract.requested_surface_kind, 'managed_run');
    assert.equal(response.return_surface_contract.actual_surface_kind, 'managed_run');
    assert.equal(response.result_surface.surface_kind, 'managed_run');
    assert.equal(response.result_surface.managed_run.runtime_bridge?.owner, 'codex_cli');
    assert.equal(response.result_surface.runtime_supervision.runtime_owner, 'codex_cli');
  });
});

test('invokeDomainEntry rejects unsupported target domains', async () => {
  await assert.rejects(
    () => invokeDomainEntry({
      target_domain_id: 'other_domain',
      task_intent: 'run_managed_deliverable',
      workspace_locator: { workspace_root: '/tmp/redcube' },
      runtime_session_contract: { runtime_owner: 'codex_cli' },
      return_surface_contract: { surface_kind: 'managed_run' },
      domain_payload: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
      },
    }),
    /Unsupported target_domain_id: other_domain/,
  );
});

test('invokeDomainEntry rejects requests missing entry_mode from the minimal OPL handoff envelope', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = await prepareDomainEntryWorkspace();

    await assert.rejects(
      () => invokeDomainEntry({
        target_domain_id: 'redcube_ai',
        task_intent: 'run_managed_deliverable',
        workspace_locator: {
          workspace_root: workspaceRoot,
        },
        runtime_session_contract: {
          runtime_owner: 'codex_cli',
          adapter_surface: '@redcube/codex-cli-client',
          session_mode: 'ephemeral_run',
        },
        return_surface_contract: {
          surface_kind: 'managed_run',
        },
        domain_payload: {
          deliverable_family: 'ppt_deck',
          topic_id: 'topic-a',
          deliverable_id: 'deck-a',
        },
      }),
      /entry_mode 不能为空/,
    );
  });
});

test('invokeDomainEntry rejects mismatched requested surface kinds', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = await prepareDomainEntryWorkspace();

    await assert.rejects(
      () => invokeDomainEntry({
        target_domain_id: 'redcube_ai',
        task_intent: 'run_managed_deliverable',
        entry_mode: 'opl_gateway',
        workspace_locator: {
          workspace_root: workspaceRoot,
        },
        runtime_session_contract: {
          runtime_owner: 'codex_cli',
          adapter_surface: '@redcube/codex-cli-client',
          session_mode: 'ephemeral_run',
        },
        return_surface_contract: {
          surface_kind: 'route_run',
        },
        domain_payload: {
          deliverable_family: 'ppt_deck',
          topic_id: 'topic-a',
          deliverable_id: 'deck-a',
        },
      }),
      /return_surface_contract\.surface_kind 必须为 managed_run/,
    );
  });
});

test('service-safe domain entry contract is frozen in contracts and current program', () => {
  const contract = JSON.parse(readFileSync('contracts/runtime-program/service-safe-domain-entry-adapter.json', 'utf-8'));
  const currentProgram = JSON.parse(readFileSync('contracts/runtime-program/current-program.json', 'utf-8'));
  const statusDoc = readFileSync('docs/status.md', 'utf-8');
  const architectureDoc = readFileSync('docs/architecture.md', 'utf-8');

  assert.equal(contract.entry_contract_id, 'redcube_service_safe_domain_entry');
  assert.equal(contract.runtime_session_contract.runtime_owner, 'codex_cli');
  assert.deepEqual(contract.opl_handoff_envelope.minimum_fields, [
    'target_domain_id',
    'task_intent',
    'entry_mode',
    'workspace_locator',
    'runtime_session_contract',
    'return_surface_contract',
  ]);
  assert.deepEqual(contract.validation.fail_closed_on_missing_fields, [
    'entry_mode',
    'runtime_session_contract.runtime_owner',
    'return_surface_contract.surface_kind',
  ]);
  assert.deepEqual(contract.validation.task_intent_surface_kind_map, {
    run_managed_deliverable: 'managed_run',
    run_deliverable_route: 'route_run',
  });
  assert.equal(contract.redcube_domain_payload.required_fields.includes('deliverable_family'), true);
  assert.equal(currentProgram.current_state.foundation_milestones.service_safe_domain_entry_adapter.status, 'closeout_completed');
  assert.match(statusDoc, /service-safe domain entry/i);
  assert.match(architectureDoc, /service-safe domain entry/i);
});
