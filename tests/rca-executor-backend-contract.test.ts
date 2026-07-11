import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  buildCodexExecutorDescriptor,
  resolveExecutorAdapter,
} from './package-surfaces.ts';

test('RCA runtime materializes only the Codex executor descriptor', () => {
  const codex = buildCodexExecutorDescriptor();
  assert.equal(codex.adapter, 'codex_cli');
  assert.equal(codex.executor_backend, 'codex_cli');
  assert.equal(codex.execution_shape, 'structured_call');
  assert.equal(codex.execution_model.mainline_adapter, 'codex_cli');
  assert.equal(codex.execution_model.primary_surface, 'codex_cli_runtime');
  assert.equal(codex.execution_model.executor_adapter_owner_boundary.generic_executor_adapter_owner, 'one-person-lab');
  assert.equal(codex.execution_model.executor_adapter_owner_boundary.rca_owns_generic_executor_adapter, false);

  assert.throws(
    () => resolveExecutorAdapter({ adapter: 'external_llm' }),
    /Unsupported executor adapter: external_llm/,
  );
});

test('OPL hosted executor contract keeps opaque refs without RCA routing configuration', () => {
  const schema = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/opl-hosted-executor-refs.schema.json'),
    'utf-8',
  )) as Record<string, any>;

  assert.deepEqual(schema.required, [
    'schema_version',
    'surface_kind',
    'owner_boundary',
    'refs',
  ]);
  assert.equal(schema.properties.schema_version.const, 1);
  assert.equal(schema.properties.surface_kind.const, 'opl_hosted_executor_refs');
  assert.equal(
    schema.properties.owner_boundary.properties.executor_adapter_owner.const,
    'one-person-lab',
  );
  assert.equal(
    schema.properties.owner_boundary.properties.rca_owns_generic_executor_adapter.const,
    false,
  );
  assert.equal(
    schema.properties.owner_boundary.properties.rca_executes_hosted_adapter.const,
    false,
  );
  assert.deepEqual(schema.properties.refs.required, [
    'opl_executor_adapter_receipt_ref',
    'opl_hosted_executor_requirement_ref',
  ]);

  const serialized = JSON.stringify(schema);
  assert.doesNotMatch(serialized, /executor_backend|structured_call_routing|profile|fallback/);
});
