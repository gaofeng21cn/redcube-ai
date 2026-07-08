// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import {
  activePrivatePlatformResurrectionViolations,
} from '../scripts/private-platform-source-scan.ts';
import {
  TEXT_EXTENSIONS,
  listTextFiles,
  normalizePath,
  sourceRefCoversFile,
  sourceRefPath,
} from './helpers/rca-retired-surface-guard.ts';

test('RCA active CLI source legacy names are covered by explicit morphology allowance', () => {
  const policy = JSON.parse(readFileSync(
    path.resolve('contracts/physical_source_morphology_policy.json'),
    'utf-8',
  ));
  const trackedTerms = policy.legacy_name_policy.tracked_legacy_terms;
  const classifiedEntries = policy.active_surface_classifications.filter(
    (entry) => entry.legacy_name_allowance,
  );
  const activeCliFiles = [
    'apps/redcube-cli/package.json',
    'apps/redcube-cli/src/cli-parts/dispatch.ts',
    'apps/redcube-cli/src/cli-parts/help.ts',
    'apps/redcube-cli/src/types.ts',
  ];

  for (const file of activeCliFiles) {
    const text = readFileSync(path.resolve(file), 'utf-8');
    const legacyHits = trackedTerms.filter((term) => new RegExp(`\\b${term}\\b`, 'i').test(text));

    const coveringEntries = classifiedEntries.filter((entry) => (
      entry.source_refs || []
    ).some((sourceRef) => sourceRefCoversFile(sourceRef, normalizePath(file))));
    assert.deepEqual(
      coveringEntries.map((entry) => entry.surface_id),
      ['redcube_cli_domain_entry_adapter'],
      file,
    );
    const allowedTerms = new Set(coveringEntries.flatMap(
      (entry) => entry.legacy_name_allowance.legacy_terms,
    ));
    assert.deepEqual(
      legacyHits.filter((term) => !allowedTerms.has(term)),
      [],
      file,
    );
    for (const entry of coveringEntries) {
      assert.equal(entry.legacy_name_allowance.compatibility_alias_allowed, false, entry.surface_id);
      assert.equal(entry.legacy_name_allowance.public_identity_allowed, false, entry.surface_id);
      assert.equal(entry.legacy_name_allowance.active_generic_runtime_owner_allowed, false, entry.surface_id);
      assert.equal(entry.legacy_name_allowance.active_generic_session_runtime_owner_allowed, false, entry.surface_id);
      assert.equal(entry.legacy_name_allowance.active_generic_domain_action_adapter_owner_allowed, false, entry.surface_id);
    }
  }
});

test('RCA active code source legacy names are covered by explicit morphology allowance', () => {
  const policy = JSON.parse(readFileSync(
    path.resolve('contracts/physical_source_morphology_policy.json'),
    'utf-8',
  ));
  const trackedTerms = policy.legacy_name_policy.tracked_legacy_terms;
  const skippedBroadOrProvenanceSurfaceIds = new Set([
    'runtime_program_machine_contracts',
    'retired_product_entry_contract_tombstone_refs',
  ]);
  const classifiedEntries = policy.active_surface_classifications.filter(
    (entry) => entry.legacy_name_allowance && !skippedBroadOrProvenanceSurfaceIds.has(entry.surface_id),
  );
  const violations = [];

  for (const entry of classifiedEntries) {
    const allowedTerms = new Set(entry.legacy_name_allowance.legacy_terms);
    for (const sourceRef of entry.source_refs || []) {
      const sourcePath = sourceRefPath(sourceRef);
      if (sourcePath.endsWith('.json')) continue;
      const sourceFiles = existsSync(path.resolve(sourcePath)) && !path.extname(sourcePath)
        ? listTextFiles(sourcePath)
        : [sourcePath];
      for (const file of sourceFiles) {
        if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
        const text = readFileSync(path.resolve(file), 'utf-8');
        const uncoveredLegacyHits = trackedTerms.filter((term) => (
          new RegExp(`\\b${term}\\b`, 'i').test(text) && !allowedTerms.has(term)
        ));
        for (const term of uncoveredLegacyHits) {
          violations.push(`${entry.surface_id}:${normalizePath(file)}:${term}`);
        }
      }
    }
  }

  assert.deepEqual(violations, []);
});

test('RCA source-morphology tail thinning gate prevents runtimeWatch and domain_action_adapter resurrection', () => {
  const policy = JSON.parse(readFileSync(
    path.resolve('contracts/physical_source_morphology_policy.json'),
    'utf-8',
  ));
  const gate = policy.default_caller_tail_thinning_gate;
  assert.equal(gate.gate_id, 'rca.source_morphology.default_caller_tail_thinning.v1');
  assert.equal(gate.state, 'non_live_functional_structure_gate_landed');
  assert.deepEqual(gate.applies_to_surface_ids, []);
  assert.equal(gate.current_non_tail_surface_ids.includes('domain_action_adapter_guarded_actions'), true);
  assert.equal(gate.current_non_tail_surface_ids.includes('product_entry_continuity_refs_adapter'), true);
  assert.equal(gate.retained_current_refs_only_boundary_ids.includes('runtime_watch_projection'), true);
  assert.equal(gate.current_role_guard.runtimeWatch_can_return_to_domain_action_adapter_default_dispatch, false);
  assert.equal(gate.current_role_guard.domain_action_adapter_can_become_generic_dispatch_owner, false);
  assert.equal(gate.current_role_guard.domain_action_adapter_can_become_generated_wrapper_owner, false);
  assert.equal(gate.current_role_guard.compatibility_alias_or_facade_allowed, false);
  assert.equal(gate.false_ready_guard.source_classification_can_claim_physical_delete_authorized, false);
  assert.equal(gate.false_ready_guard.source_classification_can_claim_production_ready, false);

  const scanPolicy = gate.active_source_resurrection_scan_policy;
  assert.equal(scanPolicy.policy_id, 'rca.source_morphology.active_source_no_resurrection_scan.v1');
  assert.equal(scanPolicy.helper_ref, 'scripts/private-platform-source-scan.ts#ACTIVE_PRIVATE_PLATFORM_RESURRECTION_CLAIM_PATTERNS');
  assert.equal(scanPolicy.scan_roots.includes('packages'), true);
  assert.equal(scanPolicy.scan_roots.includes('contracts'), true);
  for (const key of [
    'runtimeWatch_can_return_to_domain_action_adapter_default_dispatch',
    'domain_action_adapter_can_become_generic_dispatch_owner',
    'domain_action_adapter_can_become_generated_wrapper_owner',
    'generic_runtime_owner_allowed',
  ]) {
    assert.equal(scanPolicy.forbidden_true_claim_keys.includes(key), true, key);
  }
  assert.equal(scanPolicy.fail_closed_conditions.includes('compatibility_alias_or_facade_resurrection_claim'), true);
  assert.equal(scanPolicy.authority_boundary.scan_can_authorize_physical_delete, false);
  assert.equal(scanPolicy.authority_boundary.scan_can_claim_production_ready, false);
  assert.deepEqual(
    activePrivatePlatformResurrectionViolations(scanPolicy.scan_roots),
    [],
  );
});
