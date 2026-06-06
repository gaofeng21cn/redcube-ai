// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

import {
  listJsonFiles,
  normalizePath,
  pointerMatchesAllowedSuffix,
  visitJsonPointers,
} from './helpers/rca-retired-surface-guard.ts';

test('retired legacy surface ids only appear in tombstone or provenance pointer paths', () => {
  const policy = JSON.parse(readFileSync(
    path.resolve('contracts/physical_source_morphology_policy.json'),
    'utf-8',
  ));
  const pointerPolicy = policy.legacy_name_policy.retired_legacy_surface_id_pointer_policy;
  assert.equal(
    pointerPolicy.policy_kind,
    'retired_legacy_surface_ids_must_stay_inside_tombstone_or_provenance_fields',
  );
  assert.deepEqual(pointerPolicy.allowed_json_pointer_suffixes, [
    '/physical_deletion_guard/retired_legacy_surface_ids/*',
    '/retired_no_resurrection_guards/*/retired_legacy_surface_id',
  ]);
  assert.deepEqual(pointerPolicy.allowed_leaf_file_pointer_suffixes, [
    {
      file_suffix: '/physical_deletion_guard.json',
      pointer_suffix: '/retired_legacy_surface_ids/*',
    },
    {
      file_suffix: '/retired_no_resurrection_guards.json',
      pointer_suffix: '/*/retired_legacy_surface_id',
    },
  ]);
  assert.equal(pointerPolicy.active_callable_path_allowed, false);
  assert.equal(pointerPolicy.compatibility_alias_allowed, false);
  assert.equal(pointerPolicy.production_readiness_claim_allowed, false);

  const retiredLegacySurfaceIds = new Set(JSON.parse(readFileSync(
    path.resolve('contracts/functional_privatization_audit.json'),
    'utf-8',
  )).physical_deletion_guard.retired_legacy_surface_ids);

  const violations = [];
  for (const file of listJsonFiles('contracts')) {
    const normalizedFile = normalizePath(file);
    const parsed = JSON.parse(readFileSync(file, 'utf-8'));
    visitJsonPointers(parsed, '', (value, pointer) => {
      if (!retiredLegacySurfaceIds.has(value)) return;
      if (pointerPolicy.allowed_json_pointer_suffixes.some((suffix) => pointerMatchesAllowedSuffix(pointer, suffix))) {
        return;
      }
      if (pointerPolicy.allowed_leaf_file_pointer_suffixes.some((entry) => (
        normalizedFile.endsWith(entry.file_suffix)
        && pointerMatchesAllowedSuffix(pointer, entry.pointer_suffix)
      ))) {
        return;
      }
      violations.push(`${normalizedFile}${pointer}`);
    });
  }

  assert.deepEqual(violations, []);
});

test('retired compatibility payload fields only appear in negative guard fields', () => {
  const policy = JSON.parse(readFileSync(
    path.resolve('contracts/physical_source_morphology_policy.json'),
    'utf-8',
  ));
  const payloadFieldPolicy = policy.legacy_name_policy.retired_compatibility_payload_field_policy;
  assert.equal(
    payloadFieldPolicy.policy_kind,
    'retired_compatibility_payload_fields_must_stay_inside_negative_guard_fields',
  );
  assert.deepEqual(payloadFieldPolicy.retired_field_ids, ['managed_runtime_compatibility_alias']);
  assert.equal(payloadFieldPolicy.retired_field_ids_as_json_keys_allowed, false);
  assert.deepEqual(payloadFieldPolicy.policy_declaration_pointer_suffixes, ['/legacy_name_policy/retired_compatibility_payload_field_policy/retired_field_ids/*']);
  assert.deepEqual(payloadFieldPolicy.allowed_json_pointer_suffixes, ['/forbidden_payload_fields/*', '/forbidden_receipt_fields/*']);
  assert.equal(payloadFieldPolicy.active_payload_template_allowed, false);
  assert.equal(payloadFieldPolicy.compatibility_alias_allowed, false);
  assert.equal(payloadFieldPolicy.success_payload_field_allowed, false);
  assert.equal(payloadFieldPolicy.production_readiness_claim_allowed, false);

  const retiredFields = new Set(payloadFieldPolicy.retired_field_ids);
  const violations = [];
  for (const file of listJsonFiles('contracts')) {
    const normalizedFile = normalizePath(file);
    const parsed = JSON.parse(readFileSync(file, 'utf-8'));
    visitJsonPointers(parsed, '', (value, pointer) => {
      if (retiredFields.has(pointer.split('/').at(-1))) violations.push(`${normalizedFile}${pointer}`);
      if (!retiredFields.has(value)) return;
      if (payloadFieldPolicy.policy_declaration_pointer_suffixes.some(
        (suffix) => pointerMatchesAllowedSuffix(pointer, suffix),
      )) {
        return;
      }
      if (payloadFieldPolicy.allowed_json_pointer_suffixes.some(
        (suffix) => pointerMatchesAllowedSuffix(pointer, suffix),
      )) {
        return;
      }
      violations.push(`${normalizedFile}${pointer}`);
    });
  }

  assert.deepEqual(violations, []);
});

test('legacy payload field alias maps stay out of active machine contracts', () => {
  const violations = [];
  for (const file of listJsonFiles('contracts')) {
    const normalizedFile = normalizePath(file);
    const parsed = JSON.parse(readFileSync(file, 'utf-8'));
    visitJsonPointers(parsed, '', (_value, pointer) => {
      if (!pointer.endsWith('/legacy_payload_field_aliases')) return;
      violations.push(`${normalizedFile}${pointer}`);
    });
  }

  assert.deepEqual(violations, []);
});
