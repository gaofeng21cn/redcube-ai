// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  acceptancePath,
  assertRefArray,
  assertRefString,
  collectKeys,
  evidenceFixturePath,
  readJson,
  realNoRegressionRefs,
  repoRoot,
} from './rca-production-acceptance-shared.ts';
import './rca-production-acceptance-cases/visual-evidence-scaleout-refs.test.ts';

const READY_FALSE_TOKENS = [
  '"visual_ready_claimed":true',
  '"exportable_claimed":true',
  '"handoffable_claimed":true',
  '"domain_ready_claimed":true',
  '"production_ready_claimed":true',
  '"declares_visual_ready":true',
  '"declares_exportable":true',
  '"declares_handoffable":true',
  '"declares_domain_ready":true',
  '"declares_production_ready":true',
  '"declares_production_soak_complete":true',
  '"production_visual_stage_long_soak_complete":true',
];

function assertNoReadyOrPayloadClaims(surface) {
  const serialized = JSON.stringify(surface);
  for (const token of READY_FALSE_TOKENS) {
    assert.equal(serialized.includes(token), false, token);
  }
  const forbiddenPayloadFields = collectKeys(surface).filter((key) =>
    /(?:^|\.)(?:canonical_artifact_blob|artifact_body|visual_truth_body|review_export_verdict_body)$/.test(key)
  );
  assert.deepEqual(forbiddenPayloadFields, []);
}

function assertBoundaryFalse(boundary, keys, label) {
  for (const key of keys) {
    assert.equal(boundary[key], false, `${label}.${key}`);
  }
}

test('RCA production acceptance remains refs-only and RCA-owned', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, acceptancePath)), true);
  const acceptance = readJson(acceptancePath);

  assert.equal(acceptance.surface_kind, 'rca_domain_owned_visual_production_acceptance_evidence');
  assert.equal(acceptance.domain_id, 'redcube_ai');
  assert.equal(acceptance.owner, 'redcube_ai');
  assert.equal(acceptance.acceptance_scope, 'domain_owned_visual_export_acceptance_evidence');
  assert.equal(acceptance.repository_boundary.repo_tracks_evidence_refs_only, true);
  assertBoundaryFalse(acceptance.repository_boundary, [
    'repo_tracks_visual_artifact_blobs',
    'repo_tracks_export_artifact_blobs',
    'repo_tracks_live_receipt_instances',
    'repo_tracks_visual_truth_body',
    'repo_tracks_review_export_verdict_body',
  ], 'repository_boundary');
  assertNoReadyOrPayloadClaims(acceptance);
});

test('OPL/provider/conformance surfaces cannot promote RCA readiness', () => {
  const acceptance = readJson(acceptancePath);

  assert.equal(acceptance.structural_conformance.opl_family_structural_conformance_status, 'passed');
  assert.equal(acceptance.structural_conformance.physical_source_morphology_status, 'passed');
  assertRefArray(acceptance.structural_conformance.conformance_refs, 'structural_conformance.conformance_refs');
  assert.equal(acceptance.authority_boundary.visual_export_readiness_owner, 'redcube_ai');
  assert.equal(acceptance.authority_boundary.domain_ready_owner, 'redcube_ai');
  assertBoundaryFalse(acceptance.authority_boundary, [
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
  ], 'authority_boundary');
  for (const [key, value] of Object.entries(acceptance.forbidden_claims)) {
    assert.equal(value, false, `forbidden_claims.${key}`);
  }
});

test('artifact receipt chain and fixture expose owner/review refs without blobs', () => {
  const acceptance = readJson(acceptancePath);
  const fixture = readJson(evidenceFixturePath);
  const chain = acceptance.visual_artifact_receipt_chain;

  assert.equal(chain.chain_status, 'present_refs_only');
  assert.equal(chain.chain_kind, 'visual_artifact_producing_receipt_chain');
  assert.equal(chain.chain_is_artifact_producing, true);
  assertRefArray(chain.visual_owner_receipt_refs, 'visual_owner_receipt_refs');
  assertRefArray(chain.artifact_receipt_refs, 'artifact_receipt_refs');
  assertRefArray(chain.review_export_gate_refs, 'review_export_gate_refs');
  assertRefString(chain.evidence_receipt_fixture_ref, 'evidence_receipt_fixture_ref');
  assert.equal(fs.existsSync(path.join(repoRoot, chain.evidence_receipt_fixture_ref)), true);

  assert.equal(fixture.surface_kind, 'rca_evidence_receipt_fixture');
  assert.equal(fixture.repository_boundary.repo_tracks_live_receipt_instances, false);
  assert.equal(fixture.artifact_producing_owner_receipt.artifact_producing_receipt, true);
  assert.equal(fixture.artifact_producing_owner_receipt.contains_artifact_blob, false);
  assertRefArray(fixture.artifact_producing_owner_receipt.artifact_receipt_refs, 'fixture.artifact_receipt_refs');
  assertRefArray(fixture.visual_memory_workspace_evidence.memory_receipt_refs, 'fixture.memory_receipt_refs');
  for (const evidenceRef of realNoRegressionRefs) {
    assert.equal(
      fixture.production_evidence_scaleout_refs.repeated_no_regression_evidence_refs.evidence_refs.includes(evidenceRef),
      true,
      evidenceRef,
    );
  }
  assertNoReadyOrPayloadClaims({ chain, fixture });
});

test('expected receipt handoff and tail workorder stay body-free with typed blockers', () => {
  const acceptance = readJson(acceptancePath);
  const handoff = acceptance.opl_expected_receipt_monitor_freshness_handoff;
  const workorder = acceptance.production_evidence_tail_workorder;

  assert.equal(handoff.status, 'body_free_refs_ready_for_opl_workorder');
  assert.equal(handoff.stage_expected_receipt_payload_summary.stage_count, 6);
  assertRefArray(handoff.production_tail_typed_blocker_refs.blocker_refs, 'handoff.blocker_refs');
  assert.equal(handoff.opl_payload_policy.payload_body_allowed, false);
  assertBoundaryFalse(handoff.authority_boundary, [
    'opl_can_write_rca_visual_truth',
    'opl_can_store_artifact_payload',
    'opl_can_store_memory_body',
    'opl_can_authorize_review_export_verdict',
    'opl_can_claim_visual_stage_soak_complete',
  ], 'handoff.authority_boundary');

  assert.equal(workorder.status, 'open_typed_blocker_workorder');
  assert.deepEqual(workorder.work_items.map((item) => item.item_id), [
    'owner_chain_apply',
    'memory_lifecycle_receipt_scaleout',
    'temporal_controlled_visual_stage_long_soak',
    'cross_family_repeated_no_regression',
  ]);
  for (const item of workorder.work_items) {
    assertRefArray(item.required_input_refs, `${item.item_id}.required_input_refs`);
    assertRefArray(item.expected_output_refs, `${item.item_id}.expected_output_refs`);
    assert.equal(item.payload_body_allowed, false, item.item_id);
    assert.equal(item.success_claims_allowed, false, item.item_id);
  }
  assertNoReadyOrPayloadClaims({ handoff, workorder });
});

test('production acceptance has no stray ready-claim or blob-bearing fields', () => {
  const acceptance = readJson(acceptancePath);
  const forbiddenReadyClaims = collectKeys(acceptance).filter((key) =>
    /(?:visual_ready|exportable|handoffable|domain_ready)$/.test(key)
    && !(
      key.startsWith('authority_boundary.')
      || key.startsWith('forbidden_claims.')
      || key.startsWith('structural_conformance.')
      || key.startsWith('visual_artifact_receipt_chain.chain_declares_')
      || key.startsWith('production_evidence_scaleout_refs.accepted_payload_paths.')
    )
  );
  assert.deepEqual(forbiddenReadyClaims, []);
  assertNoReadyOrPayloadClaims(acceptance);
});
