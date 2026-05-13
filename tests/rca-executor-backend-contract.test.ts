import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  const hermesExecutionModel = hermes.execution_model as Record<string, any>;
  const hermesProof = hermes as Record<string, any>;
  assert.equal(hermes.adapter, 'hermes_agent');
  assert.equal(hermes.executor_backend, 'hermes_agent');
  assert.equal(hermes.execution_shape, 'agent_loop');
  assert.equal(hermes.execution_model.executor_backend, 'hermes_agent');
  assert.equal(hermes.execution_model.execution_shape, 'agent_loop');
  assert.equal(hermes.execution_model.adapter_role, 'opl_hosted_executor_adapter_proof');
  assert.equal(hermes.execution_model.runtime_substrate_owner, 'OPL Runtime Manager');
  assert.equal(hermesExecutionModel.opl_executor_adapter_receipt?.owner, 'opl_runtime_manager');
  assert.equal(hermesExecutionModel.opl_executor_adapter_receipt?.source, 'opl_executor_adapter_receipt');
  assert.equal(hermesExecutionModel.opl_executor_adapter_receipt?.hosted_adapter_reference, 'opl_hosted:hermes_agent_loop');
  assert.equal(
    hermesExecutionModel.opl_executor_adapter_receipt?.domain_truth_owner,
    'redcube_ai_visual_deliverable_runtime',
  );
  assert.equal(hermesExecutionModel.opl_executor_adapter_receipt?.review_export_gate_owner, 'redcube_ai');
  assert.equal(hermesProof.execution_model.opl_executor_adapter_receipt?.source, 'opl_executor_adapter_receipt');
  assert.equal(hermesProof.opl_executor_adapter_receipt?.hosted_adapter_reference, 'opl_hosted:hermes_agent_loop');
});

test('RCA executor routing schema requires OPL receipt or requirement for non-default Hermes routes', () => {
  const schema = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/rca-executor-routing-config.schema.json'),
    'utf-8',
  )) as Record<string, any>;
  const receipt = schema.$defs?.opl_executor_adapter_receipt;
  const requirement = schema.$defs?.opl_hosted_executor_requirement;
  const routePolicy = schema.properties?.structured_call_routing?.properties?.routes?.additionalProperties;
  const hermesGuard = routePolicy?.allOf?.[0]?.then?.anyOf;

  assert.deepEqual(receipt.required, [
    'source',
    'owner',
    'hosted_adapter_reference',
    'adapter_runtime_owner',
    'domain_truth_owner',
    'review_export_gate_owner',
    'activation',
    'auditability',
    'failure_mode',
    'effect_equivalence_guaranteed',
  ]);
  assert.equal(receipt.properties.owner.const, 'opl_runtime_manager');
  assert.equal(receipt.properties.hosted_adapter_reference.const, 'opl_hosted:hermes_agent_loop');
  assert.equal(receipt.properties.adapter_runtime_owner.const, 'hermes_agent');
  assert.equal(receipt.properties.domain_truth_owner.const, 'redcube_ai_visual_deliverable_runtime');
  assert.equal(receipt.properties.review_export_gate_owner.const, 'redcube_ai');
  assert.equal(receipt.properties.activation.const, 'explicit_opt_in_only');
  assert.equal(receipt.properties.auditability.const, 'receipt_backed');
  assert.equal(receipt.properties.failure_mode.const, 'fail_closed');
  assert.equal(receipt.properties.effect_equivalence_guaranteed.const, false);
  assert.equal(requirement.properties.source.const, 'opl_hosted_executor_requirement');
  assert.equal(requirement.properties.required_receipt_source.const, 'opl_executor_adapter_receipt');
  assert.deepEqual(hermesGuard, [
    { required: ['opl_executor_adapter_receipt'] },
    { required: ['opl_hosted_executor_requirement'] },
  ]);
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
