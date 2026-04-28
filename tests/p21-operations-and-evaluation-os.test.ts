// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const P21_CLOSEOUT_CONTRACT = 'contracts/runtime-program/p21-operations-evaluation-closeout.json';
const GATEWAY_TYPE_SURFACE_FILES = [
  'packages/redcube-gateway/src/types.ts',
  'packages/redcube-gateway/src/types-parts/foundation.ts',
  'packages/redcube-gateway/src/types-parts/managed.ts',
  'packages/redcube-gateway/src/types-parts/product-entry.ts',
  'packages/redcube-gateway/src/types-parts/review.ts',
  'packages/redcube-gateway/src/types-parts/source.ts',
  'packages/redcube-gateway/src/types-parts/telemetry.ts',
];

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readImplementation(file) {
  const source = read(file);
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? read(path.join(path.dirname(file), shell[1])) : source;
}

function readGatewayTypes() {
  return GATEWAY_TYPE_SURFACE_FILES.map(read).join('\n');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('P21.A red: run record contract must freeze telemetry, error taxonomy, and rerun lineage surfaces', () => {
  const runtimeProtocolTypes = read('packages/redcube-runtime-protocol/src/types.ts');
  const runRecordFactory = readImplementation('packages/redcube-runtime-protocol/src/runs.ts');
  const runtimeIndex = readImplementation('packages/redcube-runtime/src/index.ts');
  const hermesSubstrate = read('packages/redcube-hermes-substrate/src/index.impl.ts');

  assert.equal(runtimeProtocolTypes.includes('export interface RunTelemetryEnvelope'), true);
  assert.equal(runtimeProtocolTypes.includes('export type RuntimeErrorKind ='), true);
  assert.equal(runtimeProtocolTypes.includes('telemetry: RunTelemetryEnvelope | null;'), true);
  assert.equal(runtimeProtocolTypes.includes('error_kind: RuntimeErrorKind | null;'), true);
  assert.equal(runtimeProtocolTypes.includes('rerun_linkage:'), true);

  assert.equal(runRecordFactory.includes('telemetry:'), true);
  assert.equal(runRecordFactory.includes('error_kind:'), true);
  assert.equal(runRecordFactory.includes('rerun_linkage:'), true);
  assert.equal(runtimeIndex.includes('completeHermesRun as completeRunJs'), true);
  assert.equal(runtimeIndex.includes('export function completeRun'), true);
  assert.equal(runtimeIndex.includes('appendHermesEvent as appendEventJs'), true);
  assert.equal(runtimeIndex.includes('export function appendEvent'), true);
  assert.equal(hermesSubstrate.includes('error_kind:'), true);
  assert.equal(hermesSubstrate.includes('createRunRecord({'), true);
});

test('P21.A red: operator-facing run/watch surfaces must expose formal ops-eval summaries', () => {
  const gatewayTypes = readGatewayTypes();

  assert.equal(gatewayTypes.includes('run_telemetry:'), true);
  assert.equal(gatewayTypes.includes('error_taxonomy:'), true);
  assert.equal(gatewayTypes.includes('rerun_analytics:'), true);
  assert.equal(gatewayTypes.includes('cost_summary:'), true);
  assert.equal(gatewayTypes.includes('quality_drift_summary:'), true);
  assert.equal(gatewayTypes.includes('approval_throughput_summary:'), true);
});

test('P21 tracked closeout contract defines generic base contract, extension surface, and reserved freeze files', () => {
  const audit = readJson(P21_CLOSEOUT_CONTRACT);

  assert.equal(audit.freeze_contract.generic_base_contract, 'shared_generic_ops_eval_base_contract');
  assert.equal(audit.freeze_contract.extension_surface, 'family_profile_metric_extension_surface');
  assert.equal(audit.freeze_contract.operator_surface, 'run_watch_ops_eval_summaries');
  assert.equal(audit.freeze_contract.leader_reserved_freeze_files.length >= 2, true);
  assert.equal(audit.freeze_contract.leader_reserved_freeze_files.includes('contracts/runtime-program/p21-operations-evaluation-closeout.json'), true);
  assert.equal(audit.freeze_contract.leader_reserved_freeze_files.includes('contracts/runtime-program/poster-production-hardening-freeze.json'), true);
});

test('P21.C red: poster-specific metrics must be registered through a formal extension surface', () => {
  const governanceTypes = read('packages/redcube-governance/src/types.ts');
  const gatewayTypes = readGatewayTypes();
  const audit = readJson(P21_CLOSEOUT_CONTRACT);

  assert.equal(governanceTypes.includes('export interface MetricExtensionRegistration'), true);
  assert.equal(governanceTypes.includes('metric_ids: string[];'), true);
  assert.equal(gatewayTypes.includes('metric_extensions: MetricExtensionSummary[];'), true);
  assert.equal(gatewayTypes.includes('extension_id: string;'), true);
  assert.equal(gatewayTypes.includes('far_view_readability'), true);
  assert.equal(gatewayTypes.includes('print_export_safe'), true);
  assert.equal(audit.family_profile_metric_extension_surface.status, 'declared_machine_readable_extension');
  assert.deepEqual(audit.family_profile_metric_extension_surface.metric_ids, [
    'far_view_readability',
    'scan_path_clarity',
    'figure_claim_alignment',
    'citation_visibility',
    'print_export_safe',
  ]);
});

test('P21.A tracked machine-readable closeout contract must exist', () => {
  assert.equal(
    existsSync(path.resolve(P21_CLOSEOUT_CONTRACT)),
    true,
  );
});

test('P21.D tracked closeout contract records implemented ops-eval scope and isolates remaining non-P21 red', () => {
  const audit = readJson(P21_CLOSEOUT_CONTRACT);

  assert.equal(audit.program, 'P21');
  assert.equal(audit.historical_snapshot, true);
  assert.equal(audit.is_active_mainline, false);
  assert.equal(audit.closeout_scope_ready, true);
  assert.equal(audit.shared_generic_ops_eval_base_contract.run_telemetry, 'implemented');
  assert.equal(audit.shared_generic_ops_eval_base_contract.error_taxonomy, 'implemented');
  assert.equal(audit.shared_generic_ops_eval_base_contract.rerun_analytics, 'implemented');
  assert.equal(audit.shared_generic_ops_eval_base_contract.cost_latency_token, 'implemented');
  assert.equal(audit.shared_generic_ops_eval_base_contract.quality_drift_regression, 'implemented');
  assert.equal(audit.shared_generic_ops_eval_base_contract.publish_approval_throughput, 'implemented');
  assert.equal(audit.family_profile_metric_extension_surface.status, 'declared_machine_readable_extension');
  assert.deepEqual(audit.remaining_red_failures, ['future academic poster machine-readable surface missing']);
  assert.deepEqual(audit.out_of_scope_remaining_reds, ['poster_production_hardening.academic_surface_missing']);
});
