import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('P21.A red: run record contract must freeze telemetry, error taxonomy, and rerun lineage surfaces', () => {
  const runtimeProtocolTypes = read('packages/redcube-runtime-protocol/src/types.ts');
  const runRecordFactory = read('packages/redcube-runtime-protocol/src/runs.js');
  const runStore = read('packages/redcube-runtime/src/run-store.js');

  assert.equal(runtimeProtocolTypes.includes('export interface RunTelemetryEnvelope'), true);
  assert.equal(runtimeProtocolTypes.includes('export type RuntimeErrorKind ='), true);
  assert.equal(runtimeProtocolTypes.includes('telemetry: RunTelemetryEnvelope | null;'), true);
  assert.equal(runtimeProtocolTypes.includes('error_kind: RuntimeErrorKind | null;'), true);
  assert.equal(runtimeProtocolTypes.includes('rerun_linkage:'), true);

  assert.equal(runRecordFactory.includes('telemetry:'), true);
  assert.equal(runRecordFactory.includes('error_kind:'), true);
  assert.equal(runRecordFactory.includes('rerun_linkage:'), true);
  assert.equal(runStore.includes('error_kind:'), true);
});

test('P21.A red: operator-facing run/watch surfaces must expose formal ops-eval summaries', () => {
  const gatewayTypes = read('packages/redcube-gateway/src/types.ts');

  assert.equal(gatewayTypes.includes('run_telemetry:'), true);
  assert.equal(gatewayTypes.includes('error_taxonomy:'), true);
  assert.equal(gatewayTypes.includes('rerun_analytics:'), true);
  assert.equal(gatewayTypes.includes('cost_summary:'), true);
  assert.equal(gatewayTypes.includes('quality_drift_summary:'), true);
  assert.equal(gatewayTypes.includes('approval_throughput_summary:'), true);
});

test('P21.A freeze docs define generic base contract, extension surface, lane write scopes, and convergence order', () => {
  const combined = [
    read('.omx/plans/spec-redcube-p21-operations-and-evaluation-os.md'),
    read('.omx/plans/plan-redcube-p21-operations-and-evaluation-os.md'),
    read('.omx/plans/test-spec-redcube-p21-operations-and-evaluation-os.md'),
  ].join('\n');

  for (const token of [
    'shared generic ops-eval base contract',
    'family/profile-specific metric extension surface',
    'far_view_readability',
    'Leader-reserved freeze files',
    'P21 generic shared ops/eval contract',
    'P21 operator-facing surface',
    'poster-specific metric extension contract',
    'closeout artifact',
  ]) {
    assert.equal(combined.includes(token), true, token);
  }
});

test('P21.C red: poster-specific metrics must be registered through a formal extension surface', () => {
  const governanceTypes = read('packages/redcube-governance/src/types.ts');
  const gatewayTypes = read('packages/redcube-gateway/src/types.ts');

  assert.equal(governanceTypes.includes('export interface MetricExtensionRegistration'), true);
  assert.equal(governanceTypes.includes('metric_ids: string[];'), true);
  assert.equal(gatewayTypes.includes('metric_extensions: MetricExtensionSummary[];'), true);
  assert.equal(gatewayTypes.includes('extension_id: string;'), true);
  assert.equal(gatewayTypes.includes('far_view_readability'), true);
  assert.equal(gatewayTypes.includes('print_export_safe'), true);
});

test('P21.A red: machine-readable ops-eval closeout artifact must exist', () => {
  assert.equal(
    existsSync(path.resolve('.omx/reports/redcube-runtime-program/P21_OPERATIONS_EVALUATION_STATUS.json')),
    true,
  );
});
