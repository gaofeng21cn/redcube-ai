import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { readCurrentProgramContract } from './helpers/current-program-contract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const oplBin = process.env.OPL_BIN || '/Users/gaofeng/workspace/one-person-lab/bin/opl';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function canonicalAuditSurface(surface, rootAudit) {
  if (
    surface?.body_copy_in_adoption === false
    || surface?.body_copy_in_current_program === false
    || surface?.canonical_contract_ref === 'contracts/functional_privatization_audit.json#/'
  ) {
    return rootAudit;
  }
  return surface;
}

test('RCA bridge residue exposes exit gates without claiming generic ownership', () => {
  const rootAudit = readJson('contracts/functional_privatization_audit.json');
  const current = readCurrentProgramContract();
  const adoption = readJson('contracts/runtime-program/opl-family-contract-adoption.json');
  const adoptionAudit = canonicalAuditSurface(adoption.privatized_functional_module_audit, rootAudit);
  const surfaces = [
    rootAudit,
    canonicalAuditSurface(current.product_release_metadata.privatized_functional_module_audit, rootAudit),
    canonicalAuditSurface(current.current_state.privatized_functional_module_audit, rootAudit),
    canonicalAuditSurface(current.current_state.active_baton.scope.privatized_functional_module_audit, rootAudit),
    adoptionAudit,
  ];

  for (const surface of surfaces) {
    assert.equal(surface.bridge_exit_gate.gate_id, 'rca.private_generic_residue_bridge_exit.v1');
    assert.deepEqual(surface.bridge_exit_gate.required_before_retiring_remaining_repo_local_bridges, []);
    assert.deepEqual(surface.bridge_exit_gate.required_before_retiring_adapter_tail_modules, [
      'domain_authority_refs_preserved',
      'no_regression_proof_recorded',
      'explicit_owner_receipt_authorizes_physical_delete',
    ]);
    assert.deepEqual(surface.bridge_exit_gate.remaining_bridge_module_ids, []);
    assert.equal(surface.bridge_exit_gate.adapter_thinning_module_ids.includes('generic_cli_mcp_wrappers'), true);
    assert.equal(surface.bridge_exit_gate.source_shape_status, 'landed');
    assert.equal(surface.bridge_exit_gate.functional_structure_gap_count, 0);
    assert.equal(surface.bridge_exit_gate.declares_no_active_bridge_modules, true);
    assert.equal(surface.bridge_exit_gate.forbidden_after_exit_rca_surface_classes.includes('generic_session_shell'), true);
    assert.equal(surface.bridge_exit_gate.declares_generated_surface_consumption_complete, false);
    assert.equal(surface.bridge_exit_gate.declares_production_consumption_complete, false);
    assert.equal(
      surface.bridge_exit_gate.production_consumption_scope,
      'descriptor_and_contract_consumed_not_production_default_caller_live_soak',
    );
    assert.equal(surface.bridge_exit_gate.declares_visual_stage_long_soak_complete, false);
    assert.deepEqual(surface.bridge_exit_gate.remaining_blocker_ids, []);
    assert.deepEqual(surface.bridge_exit_gate.remaining_evidence_gate_ids, [
      'real_artifact_producing_domain_owner_receipt',
      'opl_hosted_controlled_visual_stage_long_soak',
      'real_memory_lifecycle_receipt_instances',
      'cross_family_repeated_no_regression_evidence',
    ]);

    for (const entry of surface.modules) {
      assert.equal(entry.bridge_exit_gate.gate_id, `${entry.module_id}_bridge_exit_gate`, entry.module_id);
      assert.equal(entry.bridge_exit_gate.rca_can_own_replacement_runtime, false, entry.module_id);
      assert.equal(entry.bridge_exit_gate.opl_can_write_visual_truth, false, entry.module_id);
      assert.equal(entry.bridge_exit_gate.opl_can_store_artifact_blob, false, entry.module_id);
      assert.equal(
        entry.bridge_exit_gate.declares_replacement_complete,
        ['product_entry_continuity_refs_adapter', 'native_helper_envelope'].includes(entry.module_id),
        entry.module_id,
      );
      if (entry.module_id === 'product_entry_continuity_refs_adapter') {
        assert.deepEqual(entry.bridge_exit_gate.required_before_retire, []);
        assert.equal(entry.bridge_exit_gate.generic_session_source_retirement, 'completed');
        assert.equal(
          entry.bridge_exit_gate.keep_as_authority_adapter_ref,
          'rca-keep-authority-adapter:private-platform-retirement:product-entry-continuity-refs-adapter',
        );
      } else if (!['visual_pack_compiler_handoff', 'visual_authority_functions'].includes(entry.module_id)) {
        assert.deepEqual(entry.bridge_exit_gate.required_before_retire, [
          'domain_authority_refs_preserved',
          'no_regression_proof_recorded',
          'explicit_owner_receipt_authorizes_physical_delete',
        ], entry.module_id);
      }
    }
  }
});

test('OPL generated interfaces are ready from RCA root contracts when OPL checkout is available', {
  skip: !fs.existsSync(oplBin) ? `OPL bin not found: ${oplBin}` : false,
}, () => {
  const result = spawnSync(oplBin, [
    'agents',
    'interfaces',
    '--repo-dir',
    repoRoot,
    '--json',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  const bundle = payload.generated_agent_interfaces;
  assert.equal(bundle.source_kind, 'standard_agent_repo_contracts');
  assert.equal(bundle.status, 'ready');
  assert.equal(bundle.owner, 'one-person-lab');
  assert.equal(bundle.agent_id, 'rca');
  assert.equal(bundle.target_domain_id, 'redcube_ai');
  assert.equal(bundle.domain_repo_can_own_generated_surface, false);
  assert.deepEqual(bundle.blocker_reasons, []);
  assert.equal(bundle.cli.status, 'ready');
  assert.equal(bundle.mcp.status, 'ready');
  assert.equal(bundle.skill.status, 'ready');
  assert.equal(bundle.product_entry.status, 'ready');
  assert.equal(bundle.stage_routes.length, 6);
});

test('OPL default callers see RCA deletion evidence refs without delete authority', {
  skip: !fs.existsSync(oplBin) ? `OPL bin not found: ${oplBin}` : false,
}, () => {
  const result = spawnSync(oplBin, [
    'agents',
    'default-callers',
    '--agent',
    `redcube-ai=${repoRoot}`,
    '--json',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  const readiness = payload.agent_default_caller_readiness;
  assert.equal(readiness.status, 'ready_domain_evidence_required');
  assert.equal(readiness.summary.generated_default_caller_surface_count, 8);
  assert.equal(readiness.summary.missing_domain_owner_receipt_or_typed_blocker_count, 0);
  assert.equal(readiness.summary.missing_no_forbidden_write_proof_count, 0);
  assert.equal(readiness.summary.missing_tombstone_or_provenance_ref_count, 0);
  assert.equal(readiness.migration_gate_policy.physical_delete_authorized_by_this_report, false);
  assert.equal(readiness.authority_boundary.report_can_authorize_domain_repo_physical_delete, false);

  const report = readiness.reports[0];
  assert.equal(report.deletion_gate.physical_delete_authorized, false);
  assert.equal(report.deletion_gate.evidence_worklist_count, 0);
  assert.equal(report.deletion_gate.default_caller_delete_ready, false);
  assert.equal(report.private_platform_residue_deletion_gate.status, 'empty');
  assert.equal(report.private_platform_residue_deletion_gate.residue_gate_count, 0);
  assert.equal(report.private_platform_residue_deletion_gate.owner_decision_work_order.open_count_semantics, 'zero_residue_gate_count_means_no_cleanup_lane_items_not_physical_delete_authorized');
});
