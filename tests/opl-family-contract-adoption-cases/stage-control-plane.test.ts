// @ts-nocheck
import { assert, contract, stageControlPlane, test, USER_STAGE_LOG_REQUIRED_FIELDS } from './shared.ts';

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
