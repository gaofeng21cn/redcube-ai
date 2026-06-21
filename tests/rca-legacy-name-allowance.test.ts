// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

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

test('RCA domain_action_adapter implementation legacy names stay under domain-handler no-resurrection guard', () => {
  const policy = JSON.parse(readFileSync(
    path.resolve('contracts/physical_source_morphology_policy.json'),
    'utf-8',
  ));
  const trackedTerms = policy.legacy_name_policy.tracked_legacy_terms;
  const adapterSurface = policy.active_surface_classifications.find(
    (entry) => entry.surface_id === 'domain_action_adapter_guarded_actions',
  );
  assert.ok(adapterSurface);
  assert.equal(adapterSurface.classification, 'domain_handler_target');
  assert.deepEqual(adapterSurface.source_refs, [
    'packages/redcube-domain-entry/src/actions/domain-action-adapter.ts',
    'packages/redcube-domain-entry/src/actions/guarded-domain-actions.ts',
    'packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/',
  ]);
  const allowedTerms = new Set(adapterSurface.legacy_name_allowance.legacy_terms);
  assert.deepEqual([...allowedTerms].sort(), [...trackedTerms].sort());
  assert.deepEqual(adapterSurface.legacy_name_allowance.allowed_as, [
    'domain_handler_target',
    'refs_only_read_model',
    'contract_safe_semantic_id',
    'negative_test_guard',
  ]);
  for (const field of policy.legacy_name_policy.allowance_guard_required_fields) {
    assert.equal(adapterSurface.legacy_name_allowance[field], false, `domain_action_adapter_guarded_actions.${field}`);
  }
  assert.equal(adapterSurface.no_resurrection_gate.generic_dispatch_owner_allowed, false);
  assert.equal(adapterSurface.no_resurrection_gate.generic_domain_action_adapter_owner_allowed, false);
  assert.equal(adapterSurface.no_resurrection_gate.default_runtime_watch_dispatch_allowed, false);
  assert.equal(adapterSurface.no_resurrection_gate.production_readiness_claim_allowed, false);

  const adapterFiles = adapterSurface.source_refs.flatMap((sourceRef) => {
    const sourcePath = sourceRefPath(sourceRef);
    return sourcePath.endsWith('/')
      ? listTextFiles(sourcePath)
      : [sourcePath];
  })
    .filter((file) => TEXT_EXTENSIONS.has(path.extname(file)))
    .map(normalizePath)
    .sort();

  assert.ok(adapterFiles.includes('packages/redcube-domain-entry/src/actions/domain-action-adapter.ts'));
  assert.ok(adapterFiles.includes('packages/redcube-domain-entry/src/actions/guarded-domain-actions.ts'));
  assert.ok(adapterFiles.includes('packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/domain_action_adapter-export-projection.ts'));

  const violations = [];
  for (const file of adapterFiles) {
    const text = readFileSync(path.resolve(file), 'utf-8');
    const hits = trackedTerms.filter((term) => new RegExp(`\\b${term}\\b`, 'i').test(text));
    if (hits.length === 0) continue;
    const coveringSurfaceIds = policy.active_surface_classifications
      .filter((entry) => (entry.source_refs || []).some((sourceRef) => sourceRefCoversFile(sourceRef, file)))
      .map((entry) => entry.surface_id);
    if (!coveringSurfaceIds.includes('domain_action_adapter_guarded_actions')) {
      violations.push(`${file}:missing-domain_action_adapter_guarded_actions`);
      continue;
    }
    for (const term of hits) {
      if (!allowedTerms.has(term)) {
        violations.push(`${file}:unallowed-${term}`);
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
  assert.equal(gate.applies_to_surface_ids.includes('runtime_watch_projection'), true);
  assert.equal(gate.applies_to_surface_ids.includes('domain_action_adapter_guarded_actions'), true);
  assert.equal(gate.applies_to_surface_ids.includes('product_entry_continuity_refs_adapter'), true);
  assert.equal(gate.applies_to_surface_ids.includes('repo_shell_verification_wrappers'), true);
  assert.deepEqual(gate.allowed_current_roles, [
    'refs_only_read_model',
    'domain_handler_target',
    'service_safe_domain_entry',
    'minimal_visual_authority_function',
    'visual_native_helper_implementation',
    'repo_native_verification_wrapper',
    'tombstone_or_provenance',
  ]);
  assert.equal(gate.no_resurrection_guard.runtimeWatch_can_return_to_domain_action_adapter_default_dispatch, false);
  assert.equal(gate.no_resurrection_guard.domain_action_adapter_can_become_generic_dispatch_owner, false);
  assert.equal(gate.no_resurrection_guard.domain_action_adapter_can_become_generated_wrapper_owner, false);
  assert.equal(gate.no_resurrection_guard.route_run_records_can_become_attempt_ledger_owner, false);
  assert.equal(gate.no_resurrection_guard.shell_wrappers_can_become_runtime_owner, false);
  assert.equal(gate.false_ready_guard.source_classification_can_claim_physical_delete_authorized, false);
  assert.equal(gate.false_ready_guard.source_classification_can_claim_visual_ready, false);
  assert.equal(gate.false_ready_guard.source_classification_can_claim_production_ready, false);
});

test('RCA product-entry manifest projection legacy names stay under manifest source classification', () => {
  const policy = JSON.parse(readFileSync(
    path.resolve('contracts/physical_source_morphology_policy.json'),
    'utf-8',
  ));
  const trackedTerms = policy.legacy_name_policy.tracked_legacy_terms;
  const manifestSurface = policy.active_surface_classifications.find(
    (entry) => entry.surface_id === 'product_entry_manifest_projection',
  );
  assert.ok(manifestSurface);
  assert.equal(manifestSurface.classification, 'refs_only_read_model');
  assert.deepEqual(manifestSurface.source_refs, [
    'packages/redcube-domain-entry/src/actions/get-product-entry-manifest.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/',
  ]);
  const allowedTerms = new Set(manifestSurface.legacy_name_allowance.legacy_terms);
  assert.deepEqual([...allowedTerms].sort(), [...trackedTerms].sort());
  assert.deepEqual(manifestSurface.legacy_name_allowance.allowed_as, [
    'refs_only_read_model',
    'domain_handler_target',
    'contract_safe_semantic_id',
    'locator_protocol_boundary',
    'negative_test_guard',
  ]);
  for (const field of policy.legacy_name_policy.allowance_guard_required_fields) {
    assert.equal(manifestSurface.legacy_name_allowance[field], false, `product_entry_manifest_projection.${field}`);
  }

  const manifestSourceRefs = [
    'packages/redcube-domain-entry/src/actions/get-product-entry-manifest.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/',
  ];
  const manifestFiles = manifestSourceRefs.flatMap((sourceRef) => {
    const sourcePath = sourceRefPath(sourceRef);
    return sourcePath.endsWith('/')
      ? listTextFiles(sourcePath)
      : [sourcePath];
  })
    .filter((file) => TEXT_EXTENSIONS.has(path.extname(file)))
    .map(normalizePath)
    .sort();

  assert.ok(manifestFiles.includes('packages/redcube-domain-entry/src/actions/get-product-entry-manifest.ts'));
  assert.ok(manifestFiles.includes('packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/shell-catalog.ts'));

  const violations = [];
  for (const file of manifestFiles) {
    const text = readFileSync(path.resolve(file), 'utf-8');
    const hits = trackedTerms.filter((term) => new RegExp(`\\b${term}\\b`, 'i').test(text));
    if (hits.length === 0) continue;
    const coveringSurfaceIds = policy.active_surface_classifications
      .filter((entry) => (entry.source_refs || []).some((sourceRef) => sourceRefCoversFile(sourceRef, file)))
      .map((entry) => entry.surface_id);
    if (!coveringSurfaceIds.includes('product_entry_manifest_projection')) {
      violations.push(`${file}:missing-product_entry_manifest_projection`);
      continue;
    }
    for (const term of hits) {
      if (!allowedTerms.has(term)) {
        violations.push(`${file}:unallowed-${term}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
