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
import { createStructuredArtifactExecutor } from '../packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/executor-routing.ts';

const HERMES_ADAPTER_DELETION_GATE = [
  'opl_agent_executor_adapter_default_caller_parity',
  'attempt_ledger_runtime_record_parity',
  'rca_route_policy_and_receipt_refs_preserved',
  'focused_proof_tests_migrated_to_opl_owned_surface',
  'no_active_rca_caller_scan',
  'rca_owner_receipt_or_typed_blocker',
];

function safeText(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

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
  assert.notEqual(codex.execution_model.backend_lifecycle, 'historical_opt_in_deferred_external_adapter');

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
  assert.equal(hermes.execution_model.backend_lifecycle, 'historical_opt_in_deferred_external_adapter');
  assert.equal(hermes.execution_model.rca_default_backend, false);
  assert.equal(hermes.execution_model.adapter_deletion_gate_owner, 'opl_agent_executor_adapter');
  assert.deepEqual(hermes.execution_model.adapter_deletion_gate, HERMES_ADAPTER_DELETION_GATE);
  assert.equal(hermesExecutionModel.opl_executor_adapter_receipt?.owner, 'opl_runtime_manager');
  assert.equal(hermesExecutionModel.opl_executor_adapter_receipt?.source, 'opl_executor_adapter_receipt');
  assert.equal(hermesExecutionModel.opl_executor_adapter_receipt?.hosted_adapter_reference, 'opl_hosted:hermes_agent_loop');
  assert.equal(
    hermesExecutionModel.opl_executor_adapter_receipt?.backend_lifecycle,
    'historical_opt_in_deferred_external_adapter',
  );
  assert.equal(hermesExecutionModel.opl_executor_adapter_receipt?.rca_default_backend, false);
  assert.equal(hermesExecutionModel.opl_executor_adapter_receipt?.adapter_deletion_gate_owner, 'opl_agent_executor_adapter');
  assert.deepEqual(hermesExecutionModel.opl_executor_adapter_receipt?.adapter_deletion_gate, HERMES_ADAPTER_DELETION_GATE);
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
  const fallbackGuard = routePolicy?.allOf?.[1]?.then;

  assert.deepEqual(receipt.required, [
    'source',
    'owner',
    'hosted_adapter_reference',
    'selected_executor_backend',
    'backend_lifecycle',
    'rca_default_backend',
    'adapter_deletion_gate_owner',
    'adapter_deletion_gate',
    'domain_truth_owner',
    'review_export_gate_owner',
    'activation',
    'auditability',
    'failure_mode',
    'effect_equivalence_guaranteed',
  ]);
  assert.equal(receipt.properties.owner.const, 'opl_runtime_manager');
  assert.equal(receipt.properties.hosted_adapter_reference.const, 'opl_hosted:hermes_agent_loop');
  assert.equal(receipt.properties.selected_executor_backend.const, 'hermes_agent');
  assert.equal(receipt.properties.backend_lifecycle.const, 'historical_opt_in_deferred_external_adapter');
  assert.equal(receipt.properties.rca_default_backend.const, false);
  assert.equal(receipt.properties.adapter_deletion_gate_owner.const, 'opl_agent_executor_adapter');
  assert.deepEqual(receipt.properties.adapter_deletion_gate.items.enum, HERMES_ADAPTER_DELETION_GATE);
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
  assert.deepEqual(routePolicy.properties.lane.enum, ['production', 'experimental_proof']);
  assert.equal(routePolicy.properties.lane.default, 'production');
  assert.deepEqual(fallbackGuard.required, ['lane', 'fallback']);
  assert.equal(fallbackGuard.properties.lane.const, 'experimental_proof');
  assert.equal(fallbackGuard.properties.fallback.const, 'inherit_effective_default_executor');
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

test('RCA runtime fallback gate requires experimental proof lane even for direct executorRouting input', async () => {
  let codexCalls = 0;
  const executor = createStructuredArtifactExecutor({
    CODEX_DEFAULT_ADAPTER: 'codex_cli',
    HERMES_AGENT_EXECUTOR_BACKEND: 'hermes_agent',
    HERMES_AGENT_ADAPTER: 'hermes_agent_loop',
    generateStructuredArtifactViaCodexCli: async () => {
      codexCalls += 1;
      return {
        data: { ok: true },
        generationRuntime: { owner: 'codex_cli' },
      };
    },
    failRetiredHermesAgentAdapter: () => {
      throw new Error('hermes adapter retired');
    },
    isHermesAgentAdapter: (adapter: string) => adapter === 'hermes_agent',
    safeText,
  }) as (input: Record<string, unknown>) => Promise<any>;
  const baseRouting = {
    selected_executor: {
      executor_backend: 'hermes_agent',
      execution_shape: 'structured_call',
      adapter: 'hermes_agent',
    },
    effective_default_executor: {
      executor_backend: 'codex_cli',
      execution_shape: 'structured_call',
      adapter: 'codex_cli',
    },
  };

  await assert.rejects(
    () => executor({
      adapter: 'hermes_agent',
      executionShape: 'structured_call',
      executorRouting: {
        ...baseRouting,
        structured_call_routing: {
          lane: 'production',
          fallback: 'inherit_effective_default_executor',
          failure_policy: 'fallback_with_proof',
        },
      },
    }),
    /hermes adapter retired/,
  );
  assert.equal(codexCalls, 0);

  const result = await executor({
    adapter: 'hermes_agent',
    executionShape: 'structured_call',
    executorRouting: {
      ...baseRouting,
      structured_call_routing: {
        lane: 'experimental_proof',
        fallback: 'inherit_effective_default_executor',
        failure_policy: 'fallback_with_proof',
      },
    },
  });
  assert.equal(codexCalls, 1);
  assert.equal(result.generationRuntime.executor_routing.fallback.status, 'used');
  assert.equal(result.generationRuntime.executor_routing.fallback.failed_executor_backend, 'hermes_agent');
  assert.equal(result.generationRuntime.executor_routing.fallback.fallback_executor_backend, 'codex_cli');
});
