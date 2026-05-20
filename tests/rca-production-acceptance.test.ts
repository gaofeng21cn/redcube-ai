// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const acceptancePath = 'contracts/production_acceptance/rca-production-acceptance.json';
const evidenceFixturePath = 'contracts/production_acceptance/rca-evidence-receipt-fixture.json';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function collectKeys(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectKeys(entry, `${prefix}[${index}]`));
  }
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, entry]) => {
    const current = prefix ? `${prefix}.${key}` : key;
    return [current, ...collectKeys(entry, current)];
  });
}

function assertRefString(value, label) {
  assert.equal(typeof value, 'string', label);
  assert.notEqual(value.trim(), '', label);
  assert.equal(value.startsWith('/'), false, `${label} must be a portable ref, not an absolute path`);
  assert.equal(value.includes('\n'), false, label);
}

function assertRefArray(values, label) {
  assert.equal(Array.isArray(values), true, label);
  assert.equal(values.length > 0, true, label);
  for (const [index, value] of values.entries()) {
    assertRefString(value, `${label}[${index}]`);
  }
}

test('RCA production acceptance surface exists and records domain-owned scope', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, acceptancePath)), true);
  const acceptance = readJson(acceptancePath);

  assert.equal(acceptance.surface_kind, 'rca_domain_owned_visual_production_acceptance_evidence');
  assert.equal(acceptance.domain_id, 'redcube_ai');
  assert.equal(acceptance.owner, 'redcube_ai');
  assert.equal(acceptance.acceptance_scope, 'domain_owned_visual_export_acceptance_evidence');
  assert.equal(acceptance.repository_boundary.repo_tracks_acceptance_surface, true);
  assert.equal(acceptance.repository_boundary.repo_tracks_evidence_refs_only, true);
  assert.equal(acceptance.repository_boundary.repo_tracks_visual_artifact_blobs, false);
  assert.equal(acceptance.repository_boundary.repo_tracks_export_artifact_blobs, false);
  assert.equal(acceptance.repository_boundary.repo_tracks_live_receipt_instances, false);
});

test('RCA production acceptance records conformance as passed without authorizing visual readiness', () => {
  const acceptance = readJson(acceptancePath);
  const conformance = acceptance.structural_conformance;

  assert.equal(conformance.opl_family_structural_conformance_status, 'passed');
  assert.equal(conformance.physical_source_morphology_status, 'passed');
  assert.equal(conformance.structural_conformance_claimed, true);
  assert.equal(conformance.physical_conformance_claimed, true);
  assert.equal(conformance.visual_or_export_ready_claimed_by_conformance, false);
  assert.equal(conformance.domain_ready_claimed_by_conformance, false);
  assertRefArray(conformance.conformance_refs, 'structural_conformance.conformance_refs');
});

test('OPL and provider completion cannot authorize RCA visual, export, or domain ready', () => {
  const acceptance = readJson(acceptancePath);
  const boundary = acceptance.authority_boundary;
  const forbidden = acceptance.forbidden_claims;

  assert.equal(boundary.visual_export_readiness_owner, 'redcube_ai');
  assert.equal(boundary.domain_ready_owner, 'redcube_ai');
  assert.equal(boundary.opl_role, 'generated_hosted_shell_and_refs_only_projection_consumer');
  assert.equal(boundary.provider_role, 'stage_attempt_executor_or_runtime_substrate');
  for (const key of [
    'opl_can_authorize_visual_ready',
    'opl_can_authorize_exportable',
    'opl_can_authorize_handoffable',
    'opl_can_authorize_domain_ready',
    'provider_completion_is_visual_ready',
    'provider_completion_is_exportable',
    'provider_completion_is_domain_ready',
    'conformance_pass_is_visual_ready',
    'conformance_pass_is_exportable',
    'conformance_pass_is_domain_ready',
  ]) {
    assert.equal(boundary[key], false, key);
  }
  for (const [key, value] of Object.entries(forbidden)) {
    assert.equal(value, false, key);
  }
});

test('RCA acceptance chain is refs-only and requires owner, artifact, and review/export refs', () => {
  const acceptance = readJson(acceptancePath);
  const chain = acceptance.visual_artifact_receipt_chain;

  assert.equal(chain.chain_status, 'present_refs_only');
  assert.equal(chain.chain_kind, 'visual_artifact_producing_receipt_chain');
  assert.deepEqual(chain.required_ref_groups, [
    'visual_owner_receipt_refs',
    'artifact_receipt_refs',
    'review_export_gate_refs',
  ]);
  assertRefArray(chain.visual_owner_receipt_refs, 'visual_owner_receipt_refs');
  assertRefString(chain.evidence_receipt_fixture_ref, 'evidence_receipt_fixture_ref');
  assert.equal(fs.existsSync(path.join(repoRoot, chain.evidence_receipt_fixture_ref)), true);
  assertRefArray(chain.artifact_receipt_refs, 'artifact_receipt_refs');
  assertRefArray(chain.review_export_gate_refs, 'review_export_gate_refs');
  assertRefArray(chain.memory_and_lifecycle_receipt_refs, 'memory_and_lifecycle_receipt_refs');
  assertRefArray(chain.provider_attempt_refs, 'provider_attempt_refs');
  assert.equal(chain.chain_is_artifact_producing, true);
  assert.equal(chain.chain_contains_artifact_blob, false);
  assert.equal(chain.chain_declares_visual_ready, false);
  assert.equal(chain.chain_declares_exportable, false);
  assert.equal(chain.chain_declares_handoffable, false);

  const serialized = JSON.stringify(chain);
  for (const forbiddenToken of [
    'canonical_artifact_blob',
    'artifact_body',
    'visual_truth_body',
    'review_export_verdict_body',
  ]) {
    assert.equal(serialized.includes(forbiddenToken), false, forbiddenToken);
  }
});

test('RCA evidence tail is closed only by domain receipt or by typed blocker with next verification refs', () => {
  const acceptance = readJson(acceptancePath);
  const tail = acceptance.evidence_tail;

  assert.deepEqual(tail.allowed_status_values, [
    'closed_by_domain_owned_acceptance_receipt',
    'domain_owned_typed_blocker_with_next_verification_ref',
  ]);
  assert.equal(tail.allowed_status_values.includes(tail.status), true);
  assert.equal(tail.production_live_soak_not_claimed_by_conformance, false);
  assert.equal(tail.domain_ready_not_claimed_by_conformance, false);
  assertRefArray(acceptance.next_verification_command_refs.map((entry) => entry.ref), 'next_verification_command_refs');

  if (tail.status === 'closed_by_domain_owned_acceptance_receipt') {
    assert.equal(tail.typed_blocker, null);
    assert.equal(tail.closure_receipt.owner, 'redcube_ai');
    assert.equal(tail.closure_receipt.return_shape, 'domain_receipt');
    for (const key of [
      'receipt_ref',
      'attempt_ref',
      'artifact_locator_ref',
      'review_export_ref',
      'memory_receipt_ref',
      'lifecycle_receipt_ref',
      'forbidden_write_proof_ref',
      'evidence_receipt_fixture_ref',
    ]) {
      assertRefString(tail.closure_receipt[key], `closure_receipt.${key}`);
    }
    assertRefArray(tail.closure_receipt.artifact_receipt_refs, 'closure_receipt.artifact_receipt_refs');
    return;
  }

  assert.equal(tail.status, 'domain_owned_typed_blocker_with_next_verification_ref');
  assert.equal(tail.closure_receipt, null);
  assert.equal(tail.typed_blocker.owner, 'redcube_ai');
  for (const key of tail.typed_blocker_policy.required_fields) {
    assert.ok(key in tail.typed_blocker, key);
  }
  assertRefArray(tail.typed_blocker.next_verification_command_refs, 'typed_blocker.next_verification_command_refs');
});

test('RCA evidence receipt fixture records artifact receipt refs, memory workspace refs, and a controlled soak blocker', () => {
  const acceptance = readJson(acceptancePath);
  const fixture = readJson(evidenceFixturePath);

  assert.equal(acceptance.visual_artifact_receipt_chain.evidence_receipt_fixture_ref, evidenceFixturePath);
  assert.equal(acceptance.evidence_tail.closure_receipt.evidence_receipt_fixture_ref, evidenceFixturePath);
  assert.equal(acceptance.controlled_visual_soak.evidence_receipt_fixture_ref, evidenceFixturePath);
  assert.equal(acceptance.controlled_visual_soak.production_soak_complete, false);

  assert.equal(fixture.surface_kind, 'rca_evidence_receipt_fixture');
  assert.equal(fixture.owner, 'redcube_ai');
  assert.equal(
    fixture.fixture_scope,
    'artifact_producing_owner_receipt_memory_workspace_refs_and_controlled_soak_blocker',
  );
  assert.equal(fixture.repository_boundary.repo_tracks_receipt_fixture, true);
  assert.equal(fixture.repository_boundary.repo_tracks_live_receipt_instances, false);
  assert.equal(fixture.repository_boundary.repo_tracks_artifact_body, false);
  assert.equal(fixture.repository_boundary.repo_tracks_memory_body, false);

  const receipt = fixture.artifact_producing_owner_receipt;
  assert.equal(receipt.return_shape, 'domain_receipt');
  assert.equal(receipt.owner, 'redcube_ai');
  assert.equal(receipt.artifact_producing_receipt, true);
  assert.equal(receipt.contains_artifact_blob, false);
  assert.equal(receipt.declares_visual_ready, false);
  assert.equal(receipt.declares_exportable, false);
  assert.equal(receipt.declares_handoffable, false);
  assert.equal(receipt.declares_domain_ready, false);
  for (const key of [
    'receipt_ref',
    'attempt_ref',
    'artifact_locator_ref',
    'review_export_ref',
    'forbidden_write_proof_ref',
  ]) {
    assertRefString(receipt[key], `artifact_producing_owner_receipt.${key}`);
  }
  assertRefArray(receipt.artifact_receipt_refs, 'artifact_producing_owner_receipt.artifact_receipt_refs');
  assertRefArray(receipt.artifact_stage_refs, 'artifact_producing_owner_receipt.artifact_stage_refs');

  const memoryWorkspace = fixture.visual_memory_workspace_evidence;
  assert.equal(memoryWorkspace.evidence_model, 'runtime_receipt_refs_only');
  assertRefArray(memoryWorkspace.memory_receipt_refs, 'visual_memory_workspace_evidence.memory_receipt_refs');
  assert.equal(memoryWorkspace.memory_receipt_refs.some((ref) => ref.includes('transition-accepted')), true);
  assert.equal(memoryWorkspace.memory_receipt_refs.some((ref) => ref.includes('transition-rejected')), true);
  assertRefString(memoryWorkspace.workspace_receipt_inventory_ref, 'workspace_receipt_inventory_ref');
  assertRefString(memoryWorkspace.runtime_receipt_instances_ref, 'runtime_receipt_instances_ref');
  assert.deepEqual(memoryWorkspace.required_workspace_receipt_kinds, [
    'domain_owner',
    'accepted_memory',
    'rejected_memory',
    'lifecycle_cleanup',
    'lifecycle_restore',
    'lifecycle_retention',
  ]);
  assert.equal(memoryWorkspace.workspace_receipt_scaleout_claimed, false);
  assert.equal(memoryWorkspace.contains_memory_body, false);
  assert.equal(memoryWorkspace.contains_receipt_instance_body, false);
  assert.equal(memoryWorkspace.contains_artifact_blob, false);

  const soak = fixture.controlled_visual_soak_closeout;
  assert.equal(soak.state, 'domain_owned_typed_blocker_with_next_verification_ref');
  assert.equal(soak.production_soak_complete, false);
  assert.equal(soak.provider_restart_requery_retry_dead_letter_proven, false);
  assert.equal(soak.typed_blocker.owner, 'redcube_ai');
  assert.equal(soak.typed_blocker.blocker_kind, 'controlled_visual_soak_runtime_evidence_pending');
  assertRefString(soak.typed_blocker.blocker_ref, 'controlled_visual_soak_closeout.typed_blocker.blocker_ref');
  assertRefArray(
    soak.typed_blocker.next_verification_command_refs,
    'controlled_visual_soak_closeout.typed_blocker.next_verification_command_refs',
  );

  assert.equal(fixture.legacy_managed_naming_policy.active_caller_compatibility_alias_restored, false);
  assert.deepEqual(fixture.legacy_managed_naming_policy.allowed_managed_occurrence_classes, [
    'provenance',
    'semantic_id',
    'tombstone',
  ]);
  assert.equal(
    fixture.legacy_managed_naming_policy.forbidden_active_occurrence_classes.includes('compatibility_alias'),
    true,
  );
  assert.equal(fixture.forbidden_payload_fields.includes('managed_runtime_compatibility_alias'), true);
});

test('RCA production acceptance surface does not introduce ready-claim keys or blob fields', () => {
  const acceptance = readJson(acceptancePath);
  const keys = collectKeys(acceptance);
  const forbiddenReadyClaims = keys.filter((key) =>
    /(?:visual_ready|exportable|handoffable|domain_ready)$/.test(key)
    && !(
      key.startsWith('authority_boundary.')
      || key.startsWith('forbidden_claims.')
      || key.startsWith('structural_conformance.')
      || key.startsWith('visual_artifact_receipt_chain.chain_declares_')
    )
  );

  assert.deepEqual(forbiddenReadyClaims, []);
  assert.equal(JSON.stringify(acceptance).includes('canonical_artifact_blob'), false);
  assert.equal(acceptance.repository_boundary.repo_tracks_visual_truth_body, false);
  assert.equal(acceptance.repository_boundary.repo_tracks_review_export_verdict_body, false);
});
