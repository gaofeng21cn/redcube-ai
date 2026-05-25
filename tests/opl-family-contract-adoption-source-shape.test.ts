// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function modulesById(surface) {
  return Object.fromEntries(surface.modules.map((entry) => [entry.module_id, entry]));
}

test('RCA privatized functional audit source shape is landed across runtime contract projections', () => {
  const root = readJson('contracts/functional_privatization_audit.json').privatized_functional_module_audit;
  const current = readJson('contracts/runtime-program/current-program.json');
  const adoption = readJson('contracts/runtime-program/opl-family-contract-adoption.json');
  const surfaces = [
    root,
    current.product_release_metadata.privatized_functional_module_audit,
    current.product_release_metadata.functional_privatization_audit.privatized_functional_module_audit,
    current.current_state.privatized_functional_module_audit,
    current.current_state.active_baton.scope.privatized_functional_module_audit,
    adoption.privatized_functional_module_audit,
  ];

  for (const surface of surfaces) {
    assert.equal(surface.fresh_large_private_surface_scan.scan_date, '2026-05-25');
    assert.equal(surface.bridge_exit_gate.source_shape_status, 'landed');
    assert.equal(surface.bridge_exit_gate.functional_structure_gap_count, 0);
    assert.deepEqual(surface.bridge_exit_gate.remaining_bridge_module_ids, []);
  }
});

test('RCA source-shape tail modules are refs-only or native-helper tails, not bridge residues', () => {
  const adoption = readJson('contracts/runtime-program/opl-family-contract-adoption.json');
  const byId = modulesById(adoption.privatized_functional_module_audit);

  assert.equal(byId.workspace_source_intake.status, 'source_readiness_refs_adapter_landed');
  assert.equal(byId.memory_writeback_receipt_transport.status, 'memory_receipt_refs_adapter_landed');
  assert.equal(byId.review_repair_transport.status, 'review_repair_refs_adapter_landed');
  assert.equal(byId.native_helper_envelope.status, 'native_helper_implementation_opl_envelope_tail');
  assert.equal(byId.operator_projection_shell.status, 'operator_evidence_refs_projection_landed');
  assert.equal(byId.codex_executor_adapter.status, 'route_executor_policy_refs_adapter_landed');
  assert.equal(byId.codex_executor_adapter.activeCallerStatus, 'route_run_record_api_neutralized_default_caller_tail');
});
