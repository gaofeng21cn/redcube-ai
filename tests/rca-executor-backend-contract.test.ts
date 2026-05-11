import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';

import {
  buildCodexExecutorDescriptor,
  buildExecutorBackendContract,
  buildHermesAgentLoopExecutorDescriptor,
  normalizeExecutorBackend,
} from './package-surfaces.ts';

test('RCA executor contract exposes only canonical public backends and execution shapes', () => {
  assert.equal(normalizeExecutorBackend('codex_cli'), 'codex_cli');
  assert.equal(normalizeExecutorBackend('codex_cli'), 'codex_cli');
  assert.equal(normalizeExecutorBackend('hermes_agent'), 'hermes_agent');
  assert.equal(normalizeExecutorBackend('hermes_agent'), 'hermes_agent');
  assert.throws(() => normalizeExecutorBackend('hermes'), /Unsupported executor backend: hermes/);
  assert.throws(() => normalizeExecutorBackend('simple_llm'), /Unsupported executor backend: simple_llm/);
  assert.throws(
    () => normalizeExecutorBackend('openai_compatible_gateway'),
    /Unsupported executor backend: openai_compatible_gateway/,
  );

  const codex = buildCodexExecutorDescriptor();
  assert.equal(codex.adapter, 'codex_cli');
  assert.equal(codex.executor_backend, 'codex_cli');
  assert.equal(codex.execution_shape, 'structured_call');
  assert.equal(codex.execution_model.executor_backend, 'codex_cli');
  assert.equal(codex.execution_model.execution_shape, 'structured_call');

  const hermes = buildHermesAgentLoopExecutorDescriptor();
  assert.equal(hermes.adapter, 'hermes_agent');
  assert.equal(hermes.executor_backend, 'hermes_agent');
  assert.equal(hermes.execution_shape, 'agent_loop');
  assert.equal(hermes.execution_model.executor_backend, 'hermes_agent');
  assert.equal(hermes.execution_model.execution_shape, 'agent_loop');
});

test('RCA route execution policy keeps render_html structured and fix_html agent escalation explicit', () => {
  assert.deepEqual(buildExecutorBackendContract({ adapter: 'codex_cli', route: 'render_html' }), {
    executor_backend: 'codex_cli',
    execution_shape: 'structured_call',
    route_execution_policy: {
      render_html_default_shape: 'structured_call',
      fix_html_default_shape: 'structured_call',
      fix_html_escalation_shape: 'agent_loop',
      route: 'render_html',
    },
  });

  assert.deepEqual(buildExecutorBackendContract({ adapter: 'hermes_agent', route: 'fix_html' }), {
    executor_backend: 'hermes_agent',
    execution_shape: 'agent_loop',
    route_execution_policy: {
      render_html_default_shape: 'structured_call',
      fix_html_default_shape: 'structured_call',
      fix_html_escalation_shape: 'agent_loop',
      route: 'fix_html',
    },
  });
});

test('RCA retired skeleton adapter and product/domain action harness names stay absent', () => {
  const retiredSkeleton = 'domain-agent-skeleton-' + 'adapter.ts';
  const retiredHarnessPrefix = 'gateway' + '-';
  const retiredMcpPrefix = 'mcp' + '-';
  const retiredPaths = [
    `packages/redcube-gateway/src/actions/${retiredSkeleton}`,
    `tests/${retiredHarnessPrefix}test-api.ts`,
    `tests/${retiredHarnessPrefix}case-shared.ts`,
    `tests/${retiredHarnessPrefix}actions.test.ts`,
    `tests/${retiredMcpPrefix}${retiredHarnessPrefix.slice(0, -1)}.test.ts`,
    `tests/${retiredMcpPrefix}${retiredHarnessPrefix}cases`,
  ];
  const canonicalPaths = [
    'packages/redcube-gateway/src/actions/standard-domain-agent-skeleton.ts',
    'tests/product-domain-action-test-api.ts',
    'tests/product-domain-action-case-shared.ts',
    'tests/product-domain-actions.test.ts',
    'tests/product-domain-action-api.test.ts',
    'tests/product-domain-action-api-cases',
  ];

  for (const retiredPath of retiredPaths) {
    assert.equal(existsSync(path.resolve(retiredPath)), false, retiredPath);
  }
  for (const canonicalPath of canonicalPaths) {
    assert.equal(existsSync(path.resolve(canonicalPath)), true, canonicalPath);
  }
});
