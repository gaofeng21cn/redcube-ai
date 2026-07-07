// @ts-nocheck
import { assert, contract, stageControlPlane, test } from './shared.ts';

test('RCA stage control projection maps route stages without owning runtime control', () => {
  const payload = contract();
  const projection = payload.stage_control_projection;

  assert.equal(projection.surface_kind, 'opl_family_stage_control_projection');
  assert.equal(projection.projection_id, 'rca.opl.family.stage-control.projection.v1');
  assert.equal(projection.adapter_model, 'descriptor_and_stage_execution_plan_provider');
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
  assert.equal(projection.authority_boundary.rca_owns_visual_truth, true);
  assert.equal(projection.authority_boundary.opl_role, 'read_only_stage_projection_consumer');
});

test('RCA stage control contract is refs-only and leaves generic stage plane ownership to OPL', () => {
  const plane = stageControlPlane();

  assert.equal(plane.surface_kind, 'rca_stage_control_refs');
  assert.equal(plane.projection_mode, 'rca_refs_only_opl_generated_stage_control');
  assert.equal(plane.generated_stage_control_owner, 'one-person-lab');
  assert.equal(plane.stage_descriptor_body_copied, false);
  assert.deepEqual(plane.stage_ids, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);
  assert.equal(plane.stage_refs.every((ref) => ref.startsWith('agent/stages/')), true);
  assert.equal(plane.prompt_refs.every((ref) => ref.startsWith('agent/prompts/')), true);
  assert.equal(plane.authority_boundary.opl_can_generate_stage_control_from_refs, true);
  assert.equal(plane.authority_boundary.opl_can_write_visual_truth, false);
  assert.equal(plane.authority_boundary.provider_completion_is_visual_ready, false);
});
