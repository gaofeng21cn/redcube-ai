// @ts-nocheck
import { assert, contract, STAGE_ARTIFACT_KERNEL_ADOPTION_PATH, test } from './shared.ts';

test('RCA declares thin OPL family contract adoption', () => {
  const payload = contract();

  assert.equal(payload.contract_kind, 'rca_opl_family_contract_adoption.v1');
  assert.equal(payload.domain_id, 'redcube-ai');
  assert.equal(payload.opl_role, 'family-level projection consumer only');
});

test('RCA runtime projection maps to visual deliverable runtime surfaces', () => {
  const payload = contract();
  const attempt = payload.attempt_projection;

  for (const surface of [
    'OPL generated product-entry session surface refs',
    'RCA product-entry domain snapshot refs',
    'runtimeWatch',
    'artifact authority refs',
    'OPL provider attempt currentness refs',
  ]) {
    assert.ok(attempt.source_surfaces.includes(surface));
  }
  assert.equal(attempt.maps_to_opl_contract, 'opl_family_runtime_attempt_contract.v1');
  assert.match(attempt.owner_boundary, /OPL owns generic stage-attempt runtime/);
  assert.match(attempt.owner_boundary, /RCA owns visual route truth/);
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

test('RCA exposes refs-only lifecycle adoption while OPL owns session and runtime state', () => {
  const payload = contract();
  const adapter = payload.lifecycle_adapter_surface;

  assert.equal(adapter.surface_kind, 'opl_family_lifecycle_adapter');
  assert.equal(adapter.adapter_id, 'rca.opl.family.lifecycle.adapter.v1');
  assert.equal(adapter.projection_mode, 'rca_domain_snapshot_and_authority_refs_only');
  assert.equal(adapter.sqlite_status, 'deferred_for_rca_opl_state_index_kernel_sidecar');
  assert.equal(
    adapter.authority_model,
    'rca_file_domain_authority_plus_opl_owned_session_and_rebuildable_ref_indexes',
  );
  assert.equal(adapter.rca_owns_generic_lifecycle_adapter, false);
  assert.equal(adapter.rca_owns_generic_session_shell, false);
  assert.equal(adapter.rca_owns_runtime_loop, false);
  assert.equal(adapter.state_index_kernel_adoption_ref, `${STAGE_ARTIFACT_KERNEL_ADOPTION_PATH}#/opl_state_index_kernel_adoption`);
  assert.deepEqual(adapter.state_index_kernel_adoption, {
    owner: 'one-person-lab',
    consumer: 'redcube_ai',
    sqlite_enabled_now: false,
    index_backend: 'sqlite_sidecar_index',
    refs_only: true,
    rebuildable: true,
    sidecar_is_domain_runtime: false,
    sqlite_can_be_truth_source: false,
    sqlite_can_store_visual_artifact_body: false,
    sqlite_can_store_review_export_judgment: false,
  });
  for (const surface of [
    'OPL generated product-entry session surface refs',
    'RCA product-entry domain snapshot refs',
    'review state',
    'publication projection',
    'artifact authority refs',
    'OPL provider attempt currentness refs',
  ]) {
    assert.ok(adapter.source_surfaces.includes(surface));
  }
  assert.deepEqual(adapter.adoption_state_values, [
    'discoverable_manifest_projection',
    'hydrated_session_projection',
  ]);
  assert.ok(adapter.exposed_on.includes('oplHosted product entry response'));
});
