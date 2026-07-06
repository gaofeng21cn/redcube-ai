// @ts-nocheck
import { assert, contract, read, stageControlPlane, test, USER_STAGE_LOG_REQUIRED_FIELDS } from './shared.ts';

const FOUNDRY_AGENT_SERIES_POLICY_BUNDLE_FINGERPRINT =
  'sha256:503f515e8fa08b3f81ce28cac461368c609d4565de239c9f95c3f910cb758ed5';

function foundryAgentSeries() {
  return JSON.parse(read('contracts/foundry_agent_series.json'));
}

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
    repo_local_stage_runner_retired: true,
    repo_local_stage_runner_role: 'tombstone_or_historical_regression_only',
  });
});

test('RCA stage control plane requires visual-facing user stage log semantics', () => {
  const plane = stageControlPlane();

  assert.deepEqual(plane.stages.map((stage) => stage.stage_id), [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);
  assert.equal(plane.projection_mode, 'compact_static_contract_with_generated_descriptor_readback');
  assert.equal(plane.stage_descriptor_body_copied, false);

  for (const stage of plane.stages) {
    const userStageLogRef = stage.stage_contract.user_stage_log_contract_ref;

    assert.equal(
      userStageLogRef,
      `opl_generated:product_entry_manifest#/family_stage_control_plane/stages/${stage.stage_id}/stage_contract/user_stage_log_contract`,
    );
    assert.equal(
      plane.stage_policy_body_refs.user_stage_log_contract_ref,
      'opl_generated:product_entry_manifest#/family_stage_control_plane/stages/*/stage_contract/user_stage_log_contract',
    );
    assert.deepEqual(USER_STAGE_LOG_REQUIRED_FIELDS, [
      'stage_name',
      'problem_summary',
      'stage_goal',
      'stage_work_done',
      'changed_stage_surfaces',
      'outcome',
      'remaining_blockers',
      'evidence_refs',
    ]);
  }
});

test('RCA stage control plane declares standard domain stage completion policy', () => {
  const plane = stageControlPlane();

  for (const stage of plane.stages) {
    assert.equal(
      stage.stage_contract.stage_completion_policy_ref,
      `opl_generated:product_entry_manifest#/family_stage_control_plane/stages/${stage.stage_id}/stage_contract/stage_completion_policy`,
      stage.stage_id,
    );
    assert.equal(stage.stage_contract.projection_mode, 'refs_only_static_contract', stage.stage_id);
    assert.equal(stage.authority_boundary.provider_completion_is_visual_ready, false, stage.stage_id);
    assert.equal(stage.authority_boundary.provider_completion_is_exportable, false, stage.stage_id);
    assert.equal(stage.authority_boundary.provider_completion_is_domain_ready, false, stage.stage_id);
    assert.deepEqual(stage.stage_contract.closeout_receipt_refs.includes(`owner_receipt:${stage.stage_id}`), true);
  }
});

test('RCA foundry agent series declares standard membership and public projection policy', () => {
  const foundry = foundryAgentSeries();

  assert.equal(
    foundry.shared_policy_release.policy_bundle_fingerprint,
    FOUNDRY_AGENT_SERIES_POLICY_BUNDLE_FINGERPRINT,
  );

  assert.deepEqual(foundry.agent_membership_projection_policy, {
    surface_kind: 'opl_foundry_agent_membership_projection_policy',
    version: 'foundry-agent-membership-projection.v1',
    policy_id: 'standard_agent_membership_not_surface_origin',
    default_membership: 'standard_domain_agent',
    public_agent_list_must_not_split_by_generated_surface: true,
    public_agent_list_must_not_split_by_plugin_transport: true,
    generated_surface_is_membership_axis: false,
    generated_surface_is_status_axis: false,
    plugin_transport_is_membership_axis: false,
    plugin_transport_is_status_axis: false,
    generated_surface_only_field_public_default: false,
  });

  assert.deepEqual(foundry.standard_public_projection_policy, {
    surface_kind: 'opl_foundry_agent_standard_public_projection_policy',
    version: 'foundry-agent-standard-public-projection.v1',
    policy_id: 'standard_agent_public_foundry_surface_is_opl_generated_hosted_series',
    standard_public_foundry_surface: 'opl_generated_hosted_series',
    canonical_inspect_command_pattern: 'opl foundry agents inspect <agent_id>',
    allowed_active_public_foundry_surfaces: [
      'opl_foundry_agent_series_spine',
      'opl_family_hosted_surfaces',
    ],
    active_public_projection_allows_non_opl_foundry_cli: false,
    active_public_projection_allows_domain_owned_cli_as_standard_surface: false,
    active_public_projection_allows_retired_surface_aliases: false,
    active_public_projection_allows_compatibility_aliases: false,
    active_public_projection_allows_legacy_json_aliases: false,
    minimal_authority_functions_are_membership_axis: false,
    domain_owned_helpers_are_membership_axis: false,
    allowed_domain_owned_helper_context: 'minimal_authority_functions_only',
    non_standard_surface_retention_contexts: [
      'history',
      'tombstone',
    ],
  });
});

test('RCA stage control plane declares cognitive-kernel strategy sections for each visual stage', () => {
  const plane = stageControlPlane();
  const defaultStageIds = plane.stages
    .filter((stage) => stage.selected_executor.default_executor === true)
    .map((stage) => stage.stage_id);
  assert.deepEqual(defaultStageIds, ['source_intake']);

  for (const stage of plane.stages) {
    assert.equal(stage.selected_executor.executor_kind, 'codex_cli', stage.stage_id);
    assert.equal(stage.selected_executor.default_executor, stage.stage_id === 'source_intake', stage.stage_id);
    assert.ok(stage.prompt_refs.length > 0, stage.stage_id);
    assert.ok(stage.skill_refs.length > 0, stage.stage_id);
    assert.ok(stage.tool_refs.length > 0, stage.stage_id);
    assert.ok(stage.knowledge_refs.length > 0, stage.stage_id);
    assert.ok(stage.quality_gate_refs.length > 0, stage.stage_id);
    assert.ok(stage.strategy_refs.length > 0, stage.stage_id);

    assert.equal(
      stage.stage_contract.tool_affordance_boundary_ref,
      `/family_stage_control_plane/stages/${stage.stage_id}/tool_affordance_boundary`,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.candidate_pool_policy_ref,
      `/family_stage_control_plane/stages/${stage.stage_id}/candidate_pool_policy`,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.independent_gate_policy_ref,
      `/family_stage_control_plane/stages/${stage.stage_id}/independent_gate_policy`,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.handoff_policy_ref,
      `/family_stage_control_plane/stages/${stage.stage_id}/handoff_policy`,
      stage.stage_id,
    );
    assert.equal(stage.stage_contract.cognitive_kernel_contract_ref, 'contracts/opl-framework/cognitive-computation-kernel.json', stage.stage_id);
  }

  const artifactCreation = plane.stages.find((stage) => stage.stage_id === 'artifact_creation');
  assert.ok(artifactCreation.strategy_refs.includes('image_first_candidate_generation'));
  assert.ok(artifactCreation.tool_refs.some((tool) => tool.ref === 'tool:codex-native-imagegen'));
  assert.equal(
    artifactCreation.stage_contract.independent_gate_policy_ref,
    '/family_stage_control_plane/stages/artifact_creation/independent_gate_policy',
  );

  const review = plane.stages.find((stage) => stage.stage_id === 'review_and_revision');
  assert.ok(review.strategy_refs.includes('grounded_visual_review'));
  assert.equal(review.quality_gate_refs[0].ref, 'agent/quality_gates/review_export_memory.md');
});
