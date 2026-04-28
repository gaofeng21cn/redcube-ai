import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCodexExecutorDescriptor,
  buildExecutorBackendContract,
  buildHermesNativeProofExecutorDescriptor,
  normalizeExecutorBackend,
} from './helpers/package-surfaces.ts';

test('RCA executor contract exposes only canonical public backends and execution shapes', () => {
  assert.equal(normalizeExecutorBackend('host_agent'), 'codex_cli');
  assert.equal(normalizeExecutorBackend('codex_cli'), 'codex_cli');
  assert.equal(normalizeExecutorBackend('hermes_native_proof'), 'hermes_agent');
  assert.equal(normalizeExecutorBackend('hermes'), 'hermes_agent');
  assert.equal(normalizeExecutorBackend('hermes_agent'), 'hermes_agent');
  assert.throws(() => normalizeExecutorBackend('simple_llm'), /Unsupported executor backend: simple_llm/);
  assert.throws(
    () => normalizeExecutorBackend('openai_compatible_gateway'),
    /Unsupported executor backend: openai_compatible_gateway/,
  );

  const codex = buildCodexExecutorDescriptor();
  assert.equal(codex.adapter, 'host_agent');
  assert.equal(codex.executor_backend, 'codex_cli');
  assert.equal(codex.execution_shape, 'structured_call');
  assert.equal(codex.execution_model.executor_backend, 'codex_cli');
  assert.equal(codex.execution_model.execution_shape, 'structured_call');

  const hermes = buildHermesNativeProofExecutorDescriptor();
  assert.equal(hermes.adapter, 'hermes_native_proof');
  assert.equal(hermes.executor_backend, 'hermes_agent');
  assert.equal(hermes.execution_shape, 'agent_loop');
  assert.equal(hermes.execution_model.executor_backend, 'hermes_agent');
  assert.equal(hermes.execution_model.execution_shape, 'agent_loop');
});

test('RCA route execution policy keeps render_html structured and fix_html agent escalation explicit', () => {
  assert.deepEqual(buildExecutorBackendContract({ adapter: 'host_agent', route: 'render_html' }), {
    executor_backend: 'codex_cli',
    execution_shape: 'structured_call',
    route_execution_policy: {
      render_html_default_shape: 'structured_call',
      fix_html_default_shape: 'structured_call',
      fix_html_escalation_shape: 'agent_loop',
      route: 'render_html',
    },
    compatibility_aliases: {
      host_agent: 'codex_cli',
      hermes: 'hermes_agent',
      hermes_native_proof: 'hermes_agent',
    },
  });

  assert.deepEqual(buildExecutorBackendContract({ adapter: 'hermes_native_proof', route: 'fix_html' }), {
    executor_backend: 'hermes_agent',
    execution_shape: 'agent_loop',
    route_execution_policy: {
      render_html_default_shape: 'structured_call',
      fix_html_default_shape: 'structured_call',
      fix_html_escalation_shape: 'agent_loop',
      route: 'fix_html',
    },
    compatibility_aliases: {
      host_agent: 'codex_cli',
      hermes: 'hermes_agent',
      hermes_native_proof: 'hermes_agent',
    },
  });
});
