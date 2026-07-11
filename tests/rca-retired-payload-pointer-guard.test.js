import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';

import {
  normalizePath,
} from './helpers/rca-retired-surface-guard.js';

function listJsonFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return listJsonFiles(file);
    }
    return entry.isFile() && entry.name.endsWith('.json') ? [file] : [];
  });
}

function visitJsonPointers(value, pointer, visitor) {
  visitor(value, pointer);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visitJsonPointers(entry, `${pointer}/${index}`, visitor));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      visitJsonPointers(entry, `${pointer}/${key}`, visitor);
    }
  }
}

test('current role guard replaces retired legacy surface id pointer allowances', () => {
  const policy = JSON.parse(readFileSync(
    path.resolve('contracts/physical_source_morphology_policy.json'),
    'utf-8',
  ));
  const rolePolicy = policy.legacy_name_policy.current_role_guard_policy;
  assert.equal(
    rolePolicy.policy_kind,
    'active_surfaces_must_match_allowed_roles_and_false_forbidden_owner_flags',
  );
  assert.equal(rolePolicy.closed_retirement_count_only, true);
  assert.equal(rolePolicy.active_callable_path_allowed, false);
  assert.equal(rolePolicy.compatibility_alias_allowed, false);
  assert.equal(rolePolicy.production_readiness_claim_allowed, false);

  const audit = JSON.parse(readFileSync(
    path.resolve('contracts/functional_privatization_audit.json'),
    'utf-8',
  ));
  assert.equal(audit.retired_no_resurrection_guards, undefined);
  assert.equal(audit.physical_deletion_guard.retired_legacy_surface_ids, undefined);
  assert.equal(audit.physical_deletion_guard.closed_retirement_count, 8);
  assert.equal(audit.physical_deletion_guard.current_role_guard.compatibility_alias_allowed, false);
  assert.equal(audit.closed_retirement_summary, undefined);
  assert.equal(audit.owner_evidence_lane_index, undefined);

  const forbiddenKeys = new Set([
    'retired_legacy_surface_ids',
    'retired_legacy_surface_id',
    'retired_no_resurrection_guards',
    'deleted_or_thinned_default_surfaces',
  ]);
  const violations = [];
  for (const file of listJsonFiles('contracts')) {
    const normalizedFile = normalizePath(file);
    const parsed = JSON.parse(readFileSync(file, 'utf-8'));
    visitJsonPointers(parsed, '', (_value, pointer) => {
      const key = pointer.split('/').pop();
      if (forbiddenKeys.has(key)) violations.push(`${normalizedFile}${pointer}`);
    });
  }

  assert.deepEqual(violations, []);
});

test('compatibility alias is guarded by forbidden payload role, not legacy field id list', () => {
  const policy = JSON.parse(readFileSync(
    path.resolve('contracts/physical_source_morphology_policy.json'),
    'utf-8',
  ));
  const payloadFieldPolicy = policy.legacy_name_policy.forbidden_payload_role_policy;
  assert.equal(
    payloadFieldPolicy.policy_kind,
    'compatibility_alias_payload_role_must_stay_forbidden',
  );
  assert.deepEqual(payloadFieldPolicy.forbidden_payload_roles, ['compatibility_alias']);
  assert.equal(payloadFieldPolicy.legacy_field_ids_allowed, false);
  assert.deepEqual(payloadFieldPolicy.policy_declaration_pointer_suffixes, ['/legacy_name_policy/forbidden_payload_role_policy/forbidden_payload_roles/*']);
  assert.deepEqual(payloadFieldPolicy.allowed_json_pointer_suffixes, ['/forbidden_payload_roles/*', '/forbidden_receipt_roles/*']);
  assert.equal(payloadFieldPolicy.active_payload_template_allowed, false);
  assert.equal(payloadFieldPolicy.compatibility_alias_allowed, false);
  assert.equal(payloadFieldPolicy.success_payload_field_allowed, false);
  assert.equal(payloadFieldPolicy.production_readiness_claim_allowed, false);

  const violations = [];
  for (const file of listJsonFiles('contracts')) {
    const normalizedFile = normalizePath(file);
    const parsed = JSON.parse(readFileSync(file, 'utf-8'));
    visitJsonPointers(parsed, '', (value, pointer) => {
      if (value === 'managed_runtime_compatibility_alias' || pointer.endsWith('/managed_runtime_compatibility_alias')) {
        violations.push(`${normalizedFile}${pointer}`);
      }
    });
  }

  assert.deepEqual(violations, []);
});
