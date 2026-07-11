import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

import {
  buildCodexExecutorDescriptor,
  resolveExecutorAdapter,
} from './package-surfaces.js';

function readJson(file: string): Record<string, any> {
  return JSON.parse(readFileSync(file, 'utf-8')) as Record<string, any>;
}

test('RCA runtime materializes only the Codex executor descriptor', () => {
  const codex = buildCodexExecutorDescriptor();
  assert.equal(codex.adapter, 'codex_cli');
  assert.equal(codex.executor_backend, 'codex_cli');
  assert.equal(codex.execution_shape, 'structured_call');
  assert.equal(codex.execution_model.mainline_adapter, 'codex_cli');
  assert.equal(codex.execution_model.primary_surface, 'codex_cli_runtime');
  assert.equal(codex.execution_model.executor_adapter_owner_boundary.generic_executor_adapter_owner, 'one-person-lab');
  assert.equal(codex.execution_model.executor_adapter_owner_boundary.rca_owns_generic_executor_adapter, false);

  assert.equal(resolveExecutorAdapter().adapter, 'codex_cli');
  for (const adapter of ['external_llm', 'hermes_agent']) {
    assert.throws(
      () => resolveExecutorAdapter({ adapter }),
      new RegExp(`Unsupported executor adapter: ${adapter}`),
    );
  }
});

test('OPL executor policy remains refs-only without an RCA routing configuration surface', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const stageControlPlane = readJson('contracts/stage_control_plane.json');
  const selectedExecutors = Object.values(stageControlPlane.stages || {})
    .map((stage: any) => stage?.selected_executor)
    .filter(Boolean);

  assert.equal(
    packCompilerInput.source_refs.executor_policy_source_ref,
    'contracts/stage_control_plane.json#/stages/*/selected_executor',
  );
  assert.ok(selectedExecutors.length > 0);
  assert.equal(selectedExecutors.every((executor: any) => executor.executor_kind === 'codex_cli'), true);
  assert.equal(existsSync('contracts/runtime-program/rca-executor-routing-config.schema.json'), false);
  assert.equal(existsSync('config/examples/executor-routing.example.json'), false);
  assert.equal(existsSync('packages/redcube-runtime/src/executor-routing.ts'), false);
});
