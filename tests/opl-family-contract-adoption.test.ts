// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const CONTRACT_PATH = 'contracts/runtime-program/opl-family-contract-adoption.json';
const CURRENT_PROGRAM_PATH = 'contracts/runtime-program/current-program.json';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function contract() {
  return JSON.parse(read(CONTRACT_PATH));
}

function currentProgram() {
  return JSON.parse(read(CURRENT_PROGRAM_PATH));
}

test('RCA declares thin OPL family contract adoption', () => {
  const payload = contract();

  assert.equal(payload.contract_kind, 'rca_opl_family_contract_adoption.v1');
  assert.equal(payload.domain_id, 'redcube-ai');
  assert.equal(payload.opl_role, 'family-level projection consumer only');
});

test('RCA runtime projection maps to visual deliverable runtime surfaces', () => {
  const payload = contract();
  const attempt = payload.attempt_projection;

  for (const surface of ['product-entry session', 'runtimeWatch', 'artifact inventory', 'runtime health']) {
    assert.ok(attempt.source_surfaces.includes(surface));
  }
  assert.equal(attempt.maps_to_opl_contract, 'opl_family_runtime_attempt_contract.v1');
  assert.match(attempt.owner_boundary, /RCA owns visual deliverable runtime/);
});

test('RCA quality projection keeps visual proof owner and excludes other domain gates', () => {
  const payload = contract();
  const quality = payload.quality_projection;

  for (const surface of [
    'content-fit review',
    'visual_director_review',
    'screenshot_review',
    'render proof',
    'export proof',
    'getReviewState',
    'getPublicationProjection',
  ]) {
    assert.ok(quality.source_surfaces.includes(surface));
  }
  assert.equal(quality.maps_to_opl_contract, 'opl_family_domain_quality_projection_contract.v1');
  assert.equal(quality.claim_only_ready_forbidden, true);
});

test('RCA operator and incident projection require source refs and RCA closure', () => {
  const payload = contract();
  const incident = payload.incident_projection;
  const operator = payload.operator_projection;

  assert.equal(incident.maps_to_opl_contract, 'opl_family_incident_learning_loop.v1');
  assert.match(incident.closure_rule, /RCA-owned closure ref/);
  for (const field of ['source_refs', 'freshness', 'owner_split', 'next_surface_ref', 'human_gate_reason']) {
    assert.ok(operator.required_fields.includes(field));
  }
  for (const nonGoal of [
    'OPL owns RedCube visual truth',
    'OPL owns canonical artifacts',
    'OPL owns review/export judgment',
    'medical publication gate',
    'grant fundability gate',
  ]) {
    assert.ok(payload.non_goals.includes(nonGoal));
  }
});

test('RCA exposes a thick OPL family lifecycle adapter while keeping SQLite deferred', () => {
  const payload = contract();
  const adapter = payload.lifecycle_adapter_surface;

  assert.equal(adapter.surface_kind, 'opl_family_lifecycle_adapter');
  assert.equal(adapter.adapter_id, 'rca.opl.family.lifecycle.adapter.v1');
  assert.equal(adapter.sqlite_status, 'deferred_for_rca');
  assert.equal(adapter.authority_model, 'file_authority_plus_rebuildable_artifact_indexes');
  for (const surface of [
    'managed-runs',
    'product-entry sessions',
    'review state',
    'publication projection',
  ]) {
    assert.ok(adapter.source_surfaces.includes(surface));
  }
  assert.deepEqual(adapter.adoption_state_values, [
    'discoverable_manifest_projection',
    'hydrated_session_projection',
  ]);
  assert.ok(adapter.exposed_on.includes('federated product entry response'));
});

test('RCA stage control projection maps route stages without owning runtime control', () => {
  const payload = contract();
  const projection = payload.stage_control_projection;

  assert.equal(projection.surface_kind, 'opl_family_stage_control_projection');
  assert.equal(projection.projection_id, 'rca.opl.family.stage-control.projection.v1');
  assert.equal(projection.adapter_model, 'descriptor_read_only');
  assert.equal(projection.maps_to_opl_contract, 'opl_family_stage_control_plane.v1');
  assert.deepEqual(projection.covered_families, [
    'ppt_deck',
    'xiaohongshu',
    'poster_onepager',
  ]);
  assert.deepEqual(projection.family_stage_kinds, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);
  assert.deepEqual(projection.route_stage_projection.ppt_deck.artifact_creation, [
    'author_image_pages',
    'render_html',
    'author_pptx_native',
  ]);
  assert.deepEqual(projection.route_stage_projection.xiaohongshu.package_and_handoff, [
    'publish_copy',
    'export_bundle',
  ]);
  assert.deepEqual(projection.route_stage_projection.poster_onepager.communication_strategy, [
    'poster_blueprint',
  ]);
  assert.deepEqual(projection.authority_boundary, {
    rca_owns_visual_truth: true,
    rca_owns_review_publication_projection: true,
    rca_owns_artifact_authority: true,
    opl_role: 'read_only_stage_projection_consumer',
    default_ppt_route_changed: false,
    managed_deliverable_runtime_changed: false,
  });
});

test('RCA standard domain-agent skeleton keeps repo source and runtime artifacts separate', () => {
  const payload = contract();
  const skeleton = payload.domain_agent_skeleton_adapter;

  assert.equal(skeleton.surface_kind, 'domain_agent_skeleton_adapter');
  assert.equal(skeleton.adapter_id, 'rca.domain-agent.skeleton.adapter.v1');
  assert.equal(skeleton.mapping_model, 'manifest_descriptor_mapping_only');
  assert.deepEqual(skeleton.repo_source_boundary.allowed_roots, [
    'agent',
    'contracts',
    'runtime',
    'docs',
  ]);
  assert.equal(skeleton.repo_source_boundary.repo_tracks_runtime_artifact_blobs, false);
  assert.equal(skeleton.repo_source_boundary.repo_tracks_receipt_instances, false);
  assert.deepEqual(skeleton.runtime_declarations.declares_only, [
    'product_sidecar_adapter',
    'projection_builder',
    'lifecycle_adapter',
    'domain_memory_descriptor_locator',
  ]);
  assert.equal(skeleton.runtime_declarations.sidecar_adapter_ref, '/product_entry_shell/sidecar');
  assert.equal(skeleton.runtime_declarations.projection_builder_ref, '/family_stage_control_plane');
  assert.equal(skeleton.runtime_declarations.lifecycle_adapter_ref, '/opl_family_lifecycle_adapter');
  assert.equal(skeleton.runtime_declarations.domain_memory_descriptor_locator_ref, '/domain_memory_descriptor_locator');
});

test('RCA artifact locator and sidecar receipts expose refs without OPL visual verdict ownership', () => {
  const payload = contract();
  const skeleton = payload.domain_agent_skeleton_adapter;

  assert.equal(skeleton.artifact_locator_contract.contract_id, 'rca.workspace_runtime_artifact_locator.v1');
  assert.equal(skeleton.artifact_locator_contract.locator_model, 'workspace_runtime_artifact_root_refs_only');
  assert.equal(skeleton.artifact_locator_contract.repo_tracks_visual_or_export_artifact_blobs, false);
  for (const forbidden of [
    'store_png_pptx_pdf_blob',
    'declare_visual_export_verdict',
    'rewrite_canonical_artifact',
    'mutate_review_state',
  ]) {
    assert.ok(skeleton.artifact_locator_contract.opl_forbidden.includes(forbidden));
  }
  assert.equal(skeleton.product_sidecar_receipt_refs.receipt_contract_id, 'rca.product_sidecar.receipt_refs.v1');
  for (const field of ['visual_verdict', 'export_verdict', 'review_verdict', 'publication_gate_verdict', 'artifact_blob']) {
    assert.ok(skeleton.product_sidecar_receipt_refs.forbidden_receipt_fields.includes(field));
  }
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.fixture_id, 'rca.controlled_visual_stage_attempt.fixture.v1');
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_consumes_descriptor_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_consumes_artifact_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_visual_verdict, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_export_verdict, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_canonical_artifact_content, false);
});

test('RCA domain memory descriptor exposes locator and receipts without moving visual authority to OPL', () => {
  const payload = contract();
  const memory = payload.domain_agent_skeleton_adapter.domain_memory_descriptor_locator;

  assert.equal(memory.descriptor_id, 'rca.visual_pattern_memory.descriptor.v1');
  assert.equal(memory.locator_id, 'rca.visual_pattern_memory.locator.v1');
  assert.equal(memory.memory_family, 'visual_pattern_memory');
  assert.equal(memory.memory_model, 'natural_language_pattern_cards');
  assert.equal(memory.descriptor_model, 'repo_tracked_descriptor_refs_only');
  assert.equal(memory.locator_model, 'rca_owned_memory_ref_locator');
  assert.equal(memory.policy_ref, 'docs/policies/visual_pattern_memory_policy.md');
  assert.equal(memory.human_doc_ref, 'docs/references/domain_memory_descriptor_locator.md');
  assert.deepEqual(memory.opl_consumes, [
    'memory locator refs',
    'memory provenance refs',
    'writeback receipt refs',
  ]);
  for (const forbidden of [
    'own_memory_content',
    'choose_visual_route',
    'issue_review_or_export_verdict',
    'mutate_canonical_artifacts',
  ]) {
    assert.ok(memory.opl_forbidden.includes(forbidden));
  }
  assert.deepEqual(memory.authority_boundary, {
    memory_content_owner: 'redcube_ai',
    route_truth_owner: 'redcube_ai',
    review_export_verdict_owner: 'redcube_ai',
    artifact_authority_owner: 'redcube_ai',
    opl_role: 'locator_ref_receipt_consumer_only',
  });
});

test('current runtime program points OPL Runtime Manager at the RCA lifecycle adapter projection', () => {
  const payload = currentProgram();
  const managerBoundary = payload.longrun_goal.runtime_manager_boundary;
  const persistence = payload.current_state.runtime_persistence_strategy;
  const adapter = payload.current_state.active_baton.scope.opl_family_lifecycle_adapter;
  const stageProjection = payload.current_state.active_baton.scope.opl_family_stage_control_projection;
  const memory = payload.current_state.active_baton.scope.domain_memory_descriptor_locator;

  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('opl_family_lifecycle_adapter'));
  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('opl_family_stage_control_projection'));
  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('domain_memory_descriptor_locator'));
  assert.ok(managerBoundary.does_not_own.includes('domain memory content or verdicts'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('opl_family_lifecycle_adapter projection'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('opl_family_stage_control_projection projection'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('domain_memory_descriptor_locator projection'));
  assert.equal(adapter.status, 'repo_tracked_projection_contract');
  assert.equal(adapter.adapter_id, 'rca.opl.family.lifecycle.adapter.v1');
  assert.equal(adapter.sqlite_status, 'deferred_for_rca');
  assert.deepEqual(adapter.exposes, [
    'family persistence',
    'lifecycle projection',
    'owner-route discovery',
    'adoption surface',
  ]);
  assert.equal(stageProjection.status, 'repo_tracked_projection_contract');
  assert.equal(stageProjection.adapter_model, 'descriptor_read_only');
  assert.equal(stageProjection.default_ppt_route_changed, false);
  assert.equal(stageProjection.managed_deliverable_runtime_changed, false);
  assert.equal(memory.status, 'repo_tracked_descriptor_locator_contract');
  assert.equal(memory.descriptor_id, 'rca.visual_pattern_memory.descriptor.v1');
  assert.equal(memory.locator_id, 'rca.visual_pattern_memory.locator.v1');
  assert.equal(memory.memory_content_owner, 'redcube_ai');
  assert.equal(memory.route_truth_owner, 'redcube_ai');
  assert.equal(memory.review_export_verdict_owner, 'redcube_ai');
  assert.equal(memory.artifact_authority_owner, 'redcube_ai');
  assert.equal(memory.opl_role, 'locator_ref_receipt_consumer_only');
});
