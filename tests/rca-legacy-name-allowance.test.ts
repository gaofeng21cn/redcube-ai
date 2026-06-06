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
