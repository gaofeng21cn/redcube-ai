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
  const root = readJson('contracts/functional_privatization_audit.json');
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
    const scan = surface.fresh_large_private_surface_scan;

    assert.equal(scan.scan_date, '2026-06-06');
    assert.equal(scan.authoritative_gate_entrypoint, 'scripts/line-budget.ts');
    assert.deepEqual(scan.retired_duplicate_gate_entrypoints, ['scripts/check-line-budget.ts']);
    assert.equal(scan.current_clean_truth.authoritative_line_budget_gate_count, 1);
    assert.equal(scan.current_clean_truth.duplicate_check_line_budget_retired, true);
    assert.deepEqual(scan.current_clean_truth.reviewed_baseline_ratchet, {});
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
  assert.equal(byId.codex_executor_adapter.activeCallerStatus, 'route_run_record_api_refs_only_delete_tail');
  for (const entry of Object.values(byId)) {
    if (entry.bridge_exit_gate?.tail_class) {
      assert.notEqual(entry.bridge_exit_gate.tail_class, 'generated_default_caller_or_refs_only_adapter_thinning');
      assert.notEqual(entry.bridge_exit_gate.current_status, 'source_shape_landed_default_caller_tail_open');
    }
  }
});
