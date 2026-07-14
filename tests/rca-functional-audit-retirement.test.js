import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve('.');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));

function refPath(ref) {
  return String(ref).split('#', 1)[0].replace(/\/$/, '');
}

test('RCA functional audit is canonical and contains only authority-function inventory', () => {
  const audit = readJson('contracts/functional_privatization_audit.json');

  assert.equal(audit.surface_kind, 'functional_privatization_audit');
  assert.equal(audit.schema_version, 1);
  assert.equal(audit.domain_id, 'redcube_ai');
  assert.equal(audit.target_domain_id, 'redcube_ai');
  assert.deepEqual(
    audit.modules.map((entry) => entry.module_id),
    ['rca.visual_authority_decisions', 'rca.python_native_helpers'],
  );
  for (const entry of audit.modules) {
    assert.equal(entry.classification, 'minimal_authority_function');
    assert.equal(entry.standardization_layer, 'authority_function_inventory');
    assert.notDeepEqual(entry.active_callers, []);
    assert.equal(entry.semantic_equivalence_status, 'cleared_by_boundary');
    for (const sourceRef of entry.code_paths) {
      assert.equal(fs.existsSync(path.join(repoRoot, refPath(sourceRef))), true, sourceRef);
    }
  }
  assert.equal(audit.modules.some((entry) => /adapter|runtime|wrapper|session/i.test(entry.module_id)), false);
  assert.equal(audit.authority_boundary.domain_can_claim_generic_runtime_owner, false);
  assert.equal(audit.authority_boundary.domain_repo_can_own_generated_surface, false);
});

test('RCA private control-plane retirement provenance covers every physically absent root', () => {
  const audit = readJson('contracts/functional_privatization_audit.json');
  const morphology = readJson('contracts/physical_source_morphology_policy.json');

  assert.equal(audit.retired_generated_surface_provenance.length, morphology.retired_private_source_roots.length);
  for (const sourceRoot of morphology.retired_private_source_roots) {
    assert.equal(fs.existsSync(path.join(repoRoot, sourceRoot)), false, sourceRoot);
  }
  for (const entry of audit.retired_generated_surface_provenance) {
    assert.match(entry.replacement_ref, /^(?:opl_generated:|opl_hosted:|agent\/)/);
    assert.deepEqual(entry.provenance_refs, ['docs/history/process/retired-surface-provenance.md']);
  }
  assert.notDeepEqual(audit.bridge_exit_gate.physical_delete_authorization_refs, []);
  assert.notDeepEqual(audit.bridge_exit_gate.no_forbidden_write_refs, []);
});

test('RCA physical morphology resolves every active source and forbids a second control plane', () => {
  const morphology = readJson('contracts/physical_source_morphology_policy.json');

  assert.equal(morphology.status, 'standard_agent_source_roots_only');
  assert.equal(morphology.source_ref_integrity_gate.missing_source_ref_allowed, false);
  assert.equal(morphology.source_ref_integrity_gate.retired_private_source_root_allowed, false);
  for (const entry of morphology.active_surface_classifications) {
    for (const sourceRef of entry.source_refs) {
      assert.equal(fs.existsSync(path.join(repoRoot, refPath(sourceRef))), true, sourceRef);
    }
  }
  assert.equal(
    Object.values(morphology.forbidden_generic_owner_flags).every((value) => value === false),
    true,
  );
});
