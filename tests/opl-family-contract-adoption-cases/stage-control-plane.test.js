import {
  assert,
  contract,
  declarativeStageManifest,
  GENERATED_STAGE_CONTROL_PLANE_REF,
  test,
} from './shared.js';

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

test('RCA declarative manifest is the sole tracked stage source for OPL projection', () => {
  const manifest = declarativeStageManifest();

  assert.equal(manifest.surface_kind, 'opl_standard_agent_declarative_stage_manifest');
  assert.equal(manifest.version, 'opl-standard-agent-declarative-stage-manifest.v1');
  assert.deepEqual(manifest.stages.map((stage) => stage.stage_id), [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);
  assert.equal(manifest.stages.every((stage) => stage.policy_ref.startsWith('agent/stages/')), true);
  assert.equal(manifest.stages.every((stage) => stage.prompt_ref.startsWith('agent/prompts/')), true);
  assert.equal(manifest.authority_boundary.opl_role, 'projection_consumer_only');
  assert.equal(manifest.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(manifest.authority_boundary.provider_completion_is_domain_completion, false);
  assert.equal(GENERATED_STAGE_CONTROL_PLANE_REF, 'opl-generated:family_stage_control_plane');
});
