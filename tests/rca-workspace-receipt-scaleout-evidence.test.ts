// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const scaleoutSnapshotPath = 'contracts/production_acceptance/rca-workspace-receipt-scaleout-evidence-20260527.json';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
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

function assertOptionalRefArray(values, label) {
  assert.equal(Array.isArray(values), true, label);
  for (const [index, value] of values.entries()) {
    assertRefString(value, `${label}[${index}]`);
  }
}

test('RCA workspace receipt scaleout evidence snapshot records 5-workspace refs without claiming production readiness', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, scaleoutSnapshotPath)), true);
  const snapshot = readJson(scaleoutSnapshotPath);

  assert.equal(snapshot.surface_kind, 'rca_workspace_receipt_scaleout_evidence_snapshot');
  assert.equal(snapshot.snapshot_id, 'rca.workspace_receipt_scaleout.2026-05-27.5-workspaces');
  assert.equal(snapshot.owner, 'redcube_ai');
  assert.equal(snapshot.consumer, 'one_person_lab');
  assert.equal(snapshot.status, 'runtime_receipt_refs_visible_not_production_soak');
  assert.equal(
    snapshot.evidence_model,
    'refs_only_no_visual_truth_artifact_blob_memory_body_or_review_verdict_body',
  );
  assert.equal(
    snapshot.source_runtime_export_provenance.machine_boundary,
    'local_evidence_path_provenance_not_portable_contract_input',
  );
  assert.equal(snapshot.source_runtime_export_provenance.local_export_path.startsWith('/'), true);
  assert.equal(snapshot.source_runtime_export_provenance.sha256.length, 64);
  assertRefString(
    snapshot.source_runtime_export_provenance.source_command_ref,
    'source_runtime_export_provenance.source_command_ref',
  );
  assertRefString(
    snapshot.source_runtime_export_provenance.source_surface_ref,
    'source_runtime_export_provenance.source_surface_ref',
  );

  assert.equal(snapshot.repository_boundary.repo_tracks_evidence_snapshot, true);
  assert.equal(snapshot.repository_boundary.repo_tracks_runtime_export_body, false);
  assert.equal(snapshot.repository_boundary.repo_tracks_live_receipt_instances, false);
  assert.equal(snapshot.repository_boundary.repo_tracks_visual_truth_body, false);
  assert.equal(snapshot.repository_boundary.repo_tracks_review_export_verdict_body, false);
  assert.equal(snapshot.repository_boundary.repo_tracks_artifact_blob, false);
  assert.equal(snapshot.repository_boundary.repo_tracks_memory_body, false);

  const scaleout = snapshot.scaleout_projection;
  assert.equal(scaleout.surface_kind, 'workspace_receipt_scaleout_projection');
  assert.equal(scaleout.status, 'workspace_receipt_scaleout_ref_model_ready_more_workspaces_pending');
  assert.equal(scaleout.evidence_model, 'receipt_refs_only_multi_receipt_kind_coverage');
  assert.equal(scaleout.required_workspace_count_for_scaleout, 2);
  assert.equal(scaleout.observed_workspace_count, 5);
  assert.equal(scaleout.observed_receipt_count, 30);
  assert.equal(scaleout.receipt_kind_coverage_ready, true);
  assert.equal(scaleout.workspace_receipt_scaleout_claimed, false);
  assert.equal(scaleout.declares_production_soak_complete, false);
  assert.equal(scaleout.writes_visual_truth, false);
  assert.equal(scaleout.writes_artifact_blob, false);
  assert.equal(scaleout.writes_memory_body, false);
  assert.deepEqual(scaleout.missing_receipt_kinds, []);

  assert.deepEqual(snapshot.receipt_counts, {
    total: 30,
    domain_owner: 5,
    memory_visual_pattern: 10,
    lifecycle_cleanup: 5,
    lifecycle_restore: 5,
    lifecycle_retention: 5,
    other: 0,
    invalid: 0,
  });

  const workspaceSources = snapshot.workspace_source_summary.workspace_sources;
  assert.equal(snapshot.workspace_source_summary.workspace_source_ref_model, 'workspace_receipt_source:<index>');
  assert.equal(workspaceSources.length, 5);
  assert.deepEqual(
    workspaceSources.map((source) => source.workspace_source_ref),
    [
      'workspace_receipt_source:0',
      'workspace_receipt_source:1',
      'workspace_receipt_source:2',
      'workspace_receipt_source:3',
      'workspace_receipt_source:4',
    ],
  );
  for (const source of workspaceSources) {
    assert.equal(source.receipt_root_exists, true, source.workspace_source_ref);
    assert.equal(source.receipt_count, 6, source.workspace_source_ref);
    assert.equal(source.valid_receipt_count, 6, source.workspace_source_ref);
    assert.equal(source.invalid_receipt_count, 0, source.workspace_source_ref);
  }

  const actualRefs = snapshot.actual_workspace_receipt_refs;
  assert.equal(actualRefs.route_id, 'ppt_deck.image_first.artifact_producing.v1');
  assert.deepEqual(actualRefs.stage_sequence_refs, [
    'author_image_pages',
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ]);
  assertRefArray(
    actualRefs.artifact_producing_owner_receipt_refs,
    'actual_workspace_receipt_refs.artifact_producing_owner_receipt_refs',
  );
  assert.equal(actualRefs.artifact_producing_owner_receipt_refs.length, 5);
  assertRefArray(
    actualRefs.memory_lifecycle_receipt_refs,
    'actual_workspace_receipt_refs.memory_lifecycle_receipt_refs',
  );
  assert.equal(actualRefs.memory_lifecycle_receipt_refs.length, 25);
  assert.equal(
    actualRefs.memory_lifecycle_receipt_refs.filter((ref) => ref.includes('accepted-memory-accepted')).length,
    5,
  );
  assert.equal(
    actualRefs.memory_lifecycle_receipt_refs.filter((ref) => ref.includes('rejected-memory-rejected')).length,
    5,
  );
  assert.equal(
    actualRefs.memory_lifecycle_receipt_refs.filter((ref) => ref.startsWith('rca-lifecycle-receipt:cleanup:')).length,
    5,
  );
  assert.equal(
    actualRefs.memory_lifecycle_receipt_refs.filter((ref) => ref.startsWith('rca-lifecycle-receipt:restore:')).length,
    5,
  );
  assert.equal(
    actualRefs.memory_lifecycle_receipt_refs.filter((ref) => ref.startsWith('rca-lifecycle-receipt:retention:')).length,
    5,
  );
  assertOptionalRefArray(
    actualRefs.no_regression_evidence_refs,
    'actual_workspace_receipt_refs.no_regression_evidence_refs',
  );
  assertOptionalRefArray(
    actualRefs.review_export_verdict_refs,
    'actual_workspace_receipt_refs.review_export_verdict_refs',
  );
  assert.deepEqual(actualRefs.no_regression_evidence_refs, []);
  assert.deepEqual(actualRefs.review_export_verdict_refs, []);

  assert.equal(snapshot.authority_boundary.opl_can_store_projection_refs, true);
  assert.equal(snapshot.authority_boundary.opl_can_write_rca_visual_truth, false);
  assert.equal(snapshot.authority_boundary.opl_can_store_artifact_blob, false);
  assert.equal(snapshot.authority_boundary.opl_can_store_memory_body, false);
  assert.equal(snapshot.authority_boundary.opl_can_authorize_review_export_verdict, false);
  assert.equal(snapshot.authority_boundary.opl_can_claim_production_soak_complete, false);

  assert.deepEqual(snapshot.remaining_evidence_gates, {
    temporal_controlled_visual_stage_long_soak: 'open',
    cross_family_repeated_no_regression: 'open',
    production_visual_ready: 'not_claimed',
    exportable: 'not_claimed',
    handoffable: 'not_claimed',
    domain_ready: 'not_claimed',
    production_ready: 'not_claimed',
  });
  assert.deepEqual(snapshot.forbidden_payload_classes, [
    'visual_truth_body',
    'review_export_verdict_body',
    'artifact_blob',
    'artifact_body',
    'visual_memory_body',
    'memory_body',
    'generic_runtime_state',
    'owner_receipt_body',
  ]);
});
