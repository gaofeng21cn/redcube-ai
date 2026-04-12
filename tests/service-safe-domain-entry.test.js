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
  startMockHermesAgentUpstream,
  withEnv,
} from './helpers/mock-hermes-agent-upstream.js';

async function withMockHermesUpstream(testFn) {
  const upstream = await startMockHermesAgentUpstream();
  const restoreEnv = withEnv({
    REDCUBE_HERMES_UPSTREAM_BASE_URL: upstream.baseUrl,
    REDCUBE_HERMES_UPSTREAM_MODEL: 'hermes-agent',
    REDCUBE_HERMES_UPSTREAM_API_KEY: undefined,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

test('invokeDomainEntry runs the service-safe managed deliverable adapter against upstream Hermes-Agent', async () => {
  await withMockHermesUpstream(async () => {
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

    const response = await invokeDomainEntry({
      target_domain_id: 'redcube_ai',
      task_intent: 'run_managed_deliverable',
      entry_mode: 'opl_gateway',
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      runtime_session_contract: {
        runtime_owner: 'upstream_hermes_agent',
        adapter_surface: '@redcube/hermes-agent-client',
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
    assert.equal(response.runtime_session_contract.runtime_owner, 'upstream_hermes_agent');
    assert.equal(response.return_surface_contract.actual_surface_kind, 'managed_run');
    assert.equal(response.result_surface.surface_kind, 'managed_run');
    assert.equal(response.result_surface.managed_run.runtime_bridge.owner, 'upstream_hermes_agent');
    assert.equal(response.result_surface.runtime_supervision.runtime_owner, 'upstream_hermes_agent');
  });
});

test('invokeDomainEntry rejects unsupported target domains', async () => {
  await assert.rejects(
    () => invokeDomainEntry({
      target_domain_id: 'other_domain',
      task_intent: 'run_managed_deliverable',
      workspace_locator: { workspace_root: '/tmp/redcube' },
      runtime_session_contract: { runtime_owner: 'upstream_hermes_agent' },
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

test('service-safe domain entry contract is frozen in contracts and current program', () => {
  const contract = JSON.parse(readFileSync('contracts/runtime-program/service-safe-domain-entry-adapter.json', 'utf-8'));
  const currentProgram = JSON.parse(readFileSync('contracts/runtime-program/current-program.json', 'utf-8'));
  const statusDoc = readFileSync('docs/status.md', 'utf-8');
  const architectureDoc = readFileSync('docs/architecture.md', 'utf-8');

  assert.equal(contract.entry_contract_id, 'redcube_service_safe_domain_entry');
  assert.equal(contract.runtime_session_contract.runtime_owner, 'upstream_hermes_agent');
  assert.deepEqual(contract.opl_handoff_envelope.minimum_fields, [
    'target_domain_id',
    'task_intent',
    'entry_mode',
    'workspace_locator',
    'runtime_session_contract',
    'return_surface_contract',
  ]);
  assert.equal(contract.redcube_domain_payload.required_fields.includes('deliverable_family'), true);
  assert.equal(currentProgram.current_state.foundation_milestones.service_safe_domain_entry_adapter.status, 'closeout_completed');
  assert.match(statusDoc, /service-safe domain entry/i);
  assert.match(architectureDoc, /service-safe domain entry/i);
});
