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

  for (const stage of plane.stages) {
    const userStageLog = stage.stage_contract.user_stage_log_contract;

    assert.equal(userStageLog.surface_kind, 'opl_standard_agent_user_stage_log_contract');
    assert.equal(userStageLog.version, 'standard-user-stage-log.v1');
    assert.equal(
      userStageLog.standard_agent_requirement,
      'domain_stage_closeout_must_return_user_readable_stage_semantics_or_typed_blocker',
    );
    assert.equal(userStageLog.opl_projection_surface, 'stage_progress_log.user_stage_log');
    assert.deepEqual(userStageLog.required_domain_semantic_fields, USER_STAGE_LOG_REQUIRED_FIELDS);
    assert.deepEqual(userStageLog.required_observability_fields, ['duration', 'token_usage', 'cost']);
    assert.equal(
      userStageLog.missing_semantics_policy,
      'typed_blocker_or_missing_domain_semantic_summary_no_opl_inference',
    );
    assert.equal(userStageLog.token_policy, 'observed_or_explicit_missing_null_no_zero_fill');
    assert.deepEqual(userStageLog.authority_boundary, {
      opl_can_infer_domain_semantics: false,
      opl_can_read_artifact_body: false,
      opl_can_write_domain_truth: false,
      opl_can_authorize_quality_or_export: false,
      provider_completion_can_claim_stage_semantics_complete: false,
    });
  }
});

test('RCA stage control plane declares standard domain stage completion policy', () => {
  const plane = stageControlPlane();

  for (const stage of plane.stages) {
    const policy = stage.stage_contract.stage_completion_policy;

    assert.equal(policy.surface_kind, 'domain_stage_completion_policy', stage.stage_id);
    assert.equal(policy.version, 'domain-stage-completion-policy.v1', stage.stage_id);
    assert.equal(policy.completion_judgment_owner, 'domain_stage', stage.stage_id);
    assert.equal(policy.closeout_packet_required, true, stage.stage_id);
    assert.equal(policy.provider_completion_is_domain_completion, false, stage.stage_id);
    assert.equal(policy.opl_content_judgment_allowed, false, stage.stage_id);
    assert.equal(policy.next_stage_transition_owner, 'opl_runtime', stage.stage_id);
    assert.deepEqual(policy.required_closeout_outcomes, [
      'completed_and_continue',
      'completed_and_wait_owner',
      'route_back',
      'blocked',
      'rejected',
    ]);
    assert.deepEqual(policy.accepted_closeout_ref_fields, [
      'owner_receipt_ref',
      'typed_blocker_ref',
      'human_gate_ref',
      'route_back_ref',
    ]);
    assert.equal(policy.authority_boundary.opl_can_decide_domain_completion, false, stage.stage_id);
    assert.equal(policy.authority_boundary.provider_completion_counts_as_stage_complete, false, stage.stage_id);
    assert.equal(policy.authority_boundary.suite_pass_counts_as_stage_complete, false, stage.stage_id);
    assert.equal(policy.authority_boundary.opl_can_write_visual_truth, false, stage.stage_id);
    assert.equal(policy.authority_boundary.opl_can_authorize_review_export_verdict, false, stage.stage_id);
    assert.equal(policy.authority_boundary.opl_can_mutate_artifacts, false, stage.stage_id);
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
      stage.tool_affordance_boundary.catalog_role,
      'available_affordance_catalog_not_workflow_script',
      stage.stage_id,
    );
    assert.equal(stage.tool_affordance_boundary.executor_autonomy.executor_can_choose_tools, true, stage.stage_id);
    assert.equal(stage.tool_affordance_boundary.executor_autonomy.executor_can_choose_order_and_parallelism, true, stage.stage_id);
    assert.equal(stage.tool_affordance_boundary.executor_autonomy.tool_catalog_can_prescribe_tool_sequence, false, stage.stage_id);
    assert.equal(stage.tool_affordance_boundary.executor_autonomy.tool_catalog_can_define_cognitive_strategy, false, stage.stage_id);
    assert.equal(stage.tool_affordance_boundary.executor_autonomy.tool_catalog_can_authorize_forbidden_write, false, stage.stage_id);
    assert.ok(stage.tool_affordance_boundary.capability_refs.length > 0, stage.stage_id);
    assert.ok(stage.tool_affordance_boundary.permission_scope_refs.length > 0, stage.stage_id);
    assert.ok(stage.tool_affordance_boundary.credential_boundary_refs.length > 0, stage.stage_id);
    assert.ok(stage.tool_affordance_boundary.write_scope_refs.length > 0, stage.stage_id);
    assert.ok(stage.tool_affordance_boundary.side_effect_risk_refs.length > 0, stage.stage_id);
    assert.ok(stage.tool_affordance_boundary.forbidden_authority_refs.length > 0, stage.stage_id);

    assert.equal(stage.candidate_pool_policy.candidate_pool_is_stage_internal_artifact, true, stage.stage_id);
    assert.equal(stage.candidate_pool_policy.user_visible_flow_changed, false, stage.stage_id);
    assert.equal(stage.candidate_pool_policy.route_can_complete_stage, false, stage.stage_id);
    assert.ok(stage.candidate_pool_policy.allowed_candidate_kinds.length > 0, stage.stage_id);

    assert.equal(stage.independent_gate_policy.execution_review_separation_required, true, stage.stage_id);
    assert.equal(stage.independent_gate_policy.same_attempt_self_review_can_close_quality_gate, false, stage.stage_id);
    assert.equal(stage.independent_gate_policy.provider_completion_can_close_quality_gate, false, stage.stage_id);
    assert.ok(stage.independent_gate_policy.gate_ref.startsWith('agent/quality_gates/'), stage.stage_id);

    assert.equal(stage.handoff_policy.owner_receipt_or_typed_blocker_required, true, stage.stage_id);
    assert.equal(stage.handoff_policy.handoff_refs_only, true, stage.stage_id);
    assert.equal(stage.stage_contract.cognitive_kernel_contract_ref, 'contracts/opl-framework/cognitive-computation-kernel.json', stage.stage_id);
  }

  const artifactCreation = plane.stages.find((stage) => stage.stage_id === 'artifact_creation');
  assert.ok(artifactCreation.strategy_refs.includes('image_first_candidate_generation'));
  assert.ok(artifactCreation.tool_refs.some((tool) => tool.ref === 'tool:codex-native-imagegen'));
  assert.equal(artifactCreation.independent_gate_policy.next_quality_gate_stage_ref, 'review_and_revision');

  const review = plane.stages.find((stage) => stage.stage_id === 'review_and_revision');
  assert.ok(review.strategy_refs.includes('grounded_visual_review'));
  assert.equal(review.independent_gate_policy.gate_ref, 'agent/quality_gates/review_export_memory.md');
});
