// @ts-nocheck
import assert from 'node:assert/strict';

export function assertManifestActionAndStageControlPlane({
  manifest,
  domain_action_adapterGuardedActionMetadata,
}) {
  assert.equal(manifest.family_action_catalog.surface_kind, 'family_action_catalog');
  assert.equal(manifest.family_action_catalog.version, 'family-action-catalog.v1');
  assert.equal(manifest.family_action_catalog.catalog_id, 'redcube_product_entry_action_catalog');
  assert.equal(manifest.family_action_catalog.target_domain_id, 'redcube_ai');
  assert.equal(manifest.family_action_catalog.owner, 'redcube_ai');
  assert.deepEqual(manifest.family_action_catalog.authority_boundary, {
    domain_truth_owner: 'redcube_ai',
    opl_role: 'generated_interface_metadata_owner',
    generated_interface_owner: 'one-person-lab',
    repo_local_redcube_cli_role: 'domain_handler_target_or_direct_entry_only',
    repo_local_redcube_mcp_role: 'domain_handler_target_or_direct_protocol_adapter_only',
    domain_handler_role: 'domain_handler_target_or_refs_only_adapter',
    generic_session_shell_owner: 'one-person-lab',
    generic_workbench_owner: 'one-person-lab',
    default_generic_dispatch_owner: 'one-person-lab',
    default_supervision_owner: 'one-person-lab',
    write_policy: 'no_domain_truth_writes',
  });
  assert.deepEqual(
    manifest.family_action_catalog.actions.map((action) => action.action_id),
    [
      'get_product_status',
      'get_product_start',
      'get_product_preflight',
      'invoke_product_entry',
      'get_product_entry_session',
      'get_product_entry_manifest',
      'export_domain_handler',
      'dispatch_domain_handler',
      'run_image_ppt_proof',
      'run_native_ppt_proof',
      'invoke_domain_entry',
    ],
  );
  assert.deepEqual(
    manifest.family_action_catalog.actions
      .filter((action) => action.supported_surfaces.skill)
      .map((action) => action.source_command.command),
    [
      'redcube product invoke',
      'redcube image-ppt proof',
      'redcube native-ppt proof',
    ],
  );
  const domainHandlerDispatchAction = manifest.family_action_catalog.actions
    .find((action) => action.action_id === 'dispatch_domain_handler');
  assert.deepEqual(
    domainHandlerDispatchAction.authority_boundary.allowed_actions,
    domain_action_adapterGuardedActionMetadata.guardedActionIds,
  );
  assert.deepEqual(
    domainHandlerDispatchAction.authority_boundary.forbidden_writes,
    domain_action_adapterGuardedActionMetadata.forbiddenWrites,
  );
  assert.equal(manifest.family_action_catalog_parity.surface_kind, 'family_action_catalog_parity');
  assert.equal(manifest.family_action_catalog_parity.status, 'aligned');
  assert.deepEqual(manifest.family_action_catalog_parity.issues, []);
  assert.equal(manifest.family_stage_control_plane.surface_kind, 'family_stage_control_plane');
  assert.equal(manifest.family_stage_control_plane.version, 'family-stage-control-plane.v1');
  assert.equal(manifest.family_stage_control_plane.plane_id, 'redcube_ai_stage_control_plane');
  assert.equal(manifest.family_stage_control_plane.target_domain_id, 'redcube_ai');
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_role, 'projection_consumer_only');
  assert.equal(manifest.family_stage_control_plane.authority_boundary.rca_owns_visual_truth, true);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.rca_owns_review_publication_projection, true);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.rca_owns_artifact_authority, true);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_schedule_stage, true);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_schedule_stage_attempt, true);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_stage_attempt_owner, 'one-person-lab');
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_visual_truth, false);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_review_truth, false);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_publication_projection, false);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.default_ppt_route_changed, false);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.repo_local_stage_runner_retired, true);
  assert.equal(
    manifest.family_stage_control_plane.authority_boundary.repo_local_stage_runner_role,
    'tombstone_or_historical_regression_only',
  );
  assert.equal(manifest.family_stage_control_plane.freshness.status, 'current');
  assert.equal(manifest.family_stage_control_plane.freshness.checked_at, 'manifest_build');
  assert.equal(manifest.family_stage_control_plane.stage_action_parity.status, 'aligned');
  assert.deepEqual(manifest.family_stage_control_plane.stage_action_parity.missing_action_refs, []);
  assert.equal(
    manifest.family_stage_control_plane.source_refs.some((sourceRef) => sourceRef.ref === '/family_action_catalog'),
    true,
  );
  assert.deepEqual(
    manifest.family_stage_control_plane.stages.map((stage) => stage.stage_id),
    [
      'source_intake',
      'communication_strategy',
      'visual_direction',
      'artifact_creation',
      'review_and_revision',
      'package_and_handoff',
    ],
  );
  const expectedNextStageRefs = new Map([
    ['source_intake', ['communication_strategy']],
    ['communication_strategy', ['visual_direction']],
    ['visual_direction', ['artifact_creation']],
    ['artifact_creation', ['review_and_revision']],
    ['review_and_revision', ['package_and_handoff']],
    ['package_and_handoff', []],
  ]);
  const independentGateStageIds = new Set([
    'communication_strategy',
    'visual_direction',
    'review_and_revision',
    'package_and_handoff',
  ]);
  const catalogActionIds = new Set(manifest.family_action_catalog.actions.map((action) => action.action_id));
  const expectedRuntimeEventRefs = new Map([
    ['source_intake', ['runtime_event:rca.source_intake.source_truth_frozen']],
    ['communication_strategy', ['runtime_event:rca.communication_strategy.accepted']],
    ['visual_direction', ['runtime_event:rca.visual_direction.accepted']],
    ['artifact_creation', ['runtime_event:rca.artifact_creation.candidate_rendered']],
    ['review_and_revision', ['runtime_event:rca.review_and_revision.gate_recorded']],
    ['package_and_handoff', ['runtime_event:rca.package_and_handoff.export_handoff_recorded']],
  ]);
  for (const stage of manifest.family_stage_control_plane.stages) {
    assert.equal(stage.owner, 'redcube_ai');
    assert.equal(typeof stage.goal, 'string');
    assert.equal(stage.goal.length > 20, true);
    assert.equal(stage.skills.some((skill) => skill.ref === 'redcube-ai'), true);
    assert.equal(stage.source_refs.some((sourceRef) => sourceRef.ref === '/family_action_catalog'), true);
    assert.equal(stage.source_refs.some((sourceRef) => sourceRef.ref === '/review_state'), true);
    assert.equal(stage.source_refs.some((sourceRef) => sourceRef.ref === '/publication_projection'), true);
    assert.equal(stage.freshness.status, 'current');
    assert.equal(stage.freshness.checked_at, 'manifest_build');
    assert.equal(stage.action_parity.status, 'aligned');
    assert.deepEqual(stage.action_parity.missing_action_refs, []);
    for (const actionRef of stage.allowed_action_refs) {
      assert.equal(catalogActionIds.has(actionRef), true);
    }
    assert.equal(
      stage.evaluation.some((evaluationRef) => evaluationRef.role === 'owner_receipt_gate'),
      true,
    );
    assert.equal(stage.handoff.next_owner, 'one-person-lab');
    assert.deepEqual(stage.handoff.next_stage_refs, expectedNextStageRefs.get(stage.stage_id));
    assert.deepEqual(stage.handoff.provides, stage.stage_contract.ensures);
    assert.equal(stage.handoff.resume_surface_ref, '/session_continuity');
    assert.equal(stage.handoff.artifact_surface_ref, '/artifact_inventory');
    assert.equal(stage.handoff.stage_execution_plan_ref, '/continuation_snapshot/latest_stage_execution_plan_ref');
    assert.equal(stage.stage_contract.requires.length > 0, true);
    assert.equal(stage.stage_contract.ensures.length > 0, true);
    assert.equal(stage.trust_boundary.owner_receipt_required, true);
    assert.equal(stage.trust_boundary.runtime_guard_required, true);
    assert.deepEqual(stage.stage_contract.runtime_event_refs, expectedRuntimeEventRefs.get(stage.stage_id));
    assert.deepEqual(stage.trust_boundary.runtime_event_refs, expectedRuntimeEventRefs.get(stage.stage_id));
    assert.equal(stage.stage_contract.source_scope_refs.length > 0, true);
    assert.equal(stage.stage_contract.cohort_query_refs.length > 0, true);
    assert.equal(stage.stage_contract.trigger_refs.length > 0, true);
    assert.equal(stage.stage_contract.monitor_refs.length > 0, true);
    assert.equal(stage.stage_contract.dashboard_metric_refs.length > 0, true);
    assert.equal(stage.stage_contract.metric_refs.length >= 4, true);
    assert.equal(
      stage.stage_contract.metric_refs.some((metricRef) => metricRef.role === 'expected_success_ref'),
      true,
    );
    assert.equal(
      stage.stage_contract.metric_refs.some((metricRef) => metricRef.role === 'boundary_success_rate_ref'),
      true,
    );
    assert.deepEqual(stage.stage_contract.recorded_runtime_event_refs, expectedRuntimeEventRefs.get(stage.stage_id));
    assert.deepEqual(stage.stage_contract.owner_receipt_refs, [`owner_receipt:${stage.stage_id}`]);
    assert.equal(stage.stage_contract.append_only_event_log_refs.length, 1);
    assert.equal(stage.stage_contract.attempt_ledger_refs.length, 1);
    assert.equal(
      stage.stage_contract.closeout_receipt_refs.includes(`owner_receipt:${stage.stage_id}`),
      true,
    );
    assert.deepEqual(
      stage.stage_contract.replay_evidence_refs.map((replayRef) => replayRef.role),
      [
        'append_only_event_log_ref',
        'opl_stage_attempt_ledger_ref',
        'recorded_runtime_event_refs',
        'stage_closeout_receipt_ref',
        'domain_owner_receipt_ref',
      ],
    );
    assert.equal(
      JSON.stringify(stage.stage_contract.replay_evidence_refs).includes('artifact_body'),
      false,
    );
    assert.equal(
      JSON.stringify(stage.stage_contract.replay_evidence_refs).includes('visual_truth'),
      false,
    );
    assert.equal(
      stage.stage_contract.trigger_refs.some((triggerRef) =>
        triggerRef.role === 'opl_provider_stage_launch_trigger'),
      true,
    );
    assert.equal(
      stage.authority_boundary.independent_gate_receipt_required,
      independentGateStageIds.has(stage.stage_id),
    );
    if (['communication_strategy', 'visual_direction', 'review_and_revision'].includes(stage.stage_id)) {
      assert.equal(stage.trust_boundary.lane, 'ai_decision');
      assert.equal(stage.trust_boundary.effect_boundary, true);
    }
    assert.equal(stage.authority_boundary.domain_truth_owner, 'redcube_ai');
    assert.equal(stage.authority_boundary.visual_truth_owner, 'redcube_ai');
    assert.equal(stage.authority_boundary.artifact_authority_owner, 'redcube_ai');
    assert.equal(stage.authority_boundary.review_publication_projection_owner, 'redcube_ai');
    assert.equal(stage.authority_boundary.opl_role, 'projection_consumer_only');
    assert.equal(stage.authority_boundary.opl_can_schedule_stage, true);
    assert.equal(stage.authority_boundary.opl_can_schedule_stage_attempt, true);
    assert.equal(stage.authority_boundary.opl_stage_attempt_owner, 'one-person-lab');
    assert.equal(stage.authority_boundary.opl_can_write_visual_truth, false);
    assert.equal(stage.authority_boundary.opl_can_write_review_truth, false);
    assert.equal(stage.authority_boundary.opl_can_write_publication_projection, false);
    assert.equal(stage.authority_boundary.default_ppt_route_changed, false);
    assert.equal(stage.authority_boundary.provider_completion_is_visual_ready, false);
    assert.equal(stage.authority_boundary.provider_completion_is_exportable, false);
    assert.equal(stage.authority_boundary.provider_completion_is_domain_ready, false);
    assert.equal(stage.authority_boundary.repo_local_stage_runner_retired, true);
    assert.equal(stage.authority_boundary.repo_local_stage_runner_role, 'tombstone_or_historical_regression_only');
  }
  const artifactStage = manifest.family_stage_control_plane.stages.find((stage) => stage.stage_id === 'artifact_creation');
  assert.deepEqual(artifactStage.domain_stage_refs, ['author_image_pages', 'render_html', 'author_pptx_native']);
  assert.deepEqual(artifactStage.allowed_action_refs, ['invoke_product_entry', 'run_image_ppt_proof', 'run_native_ppt_proof']);
  assert.equal(artifactStage.authority_boundary.default_ppt_route_changed, false);
  assert.equal(artifactStage.authority_boundary.repo_local_stage_runner_retired, true);
  const reviewStage = manifest.family_stage_control_plane.stages.find((stage) => stage.stage_id === 'review_and_revision');
  assert.deepEqual(reviewStage.visual_pattern_memory_refs, [
    '/domain_memory_descriptor_locator/writeback_proposal_generator',
    '/domain_memory_descriptor_locator/accept_reject_command',
  ]);
  assert.equal(
    reviewStage.outputs.some((output) => output.ref === '/domain_memory_descriptor_locator/writeback_proposal_generator'),
    true,
  );
  const handoffStage = manifest.family_stage_control_plane.stages.find((stage) => stage.stage_id === 'package_and_handoff');
  assert.deepEqual(handoffStage.visual_pattern_memory_refs, [
    '/domain_memory_descriptor_locator/writeback_receipt_locator',
    '/domain_memory_descriptor_locator/operator_receipt_projection',
  ]);
  assert.equal(
    handoffStage.outputs.some((output) => output.ref === '/domain_memory_descriptor_locator/operator_receipt_projection'),
    true,
  );
}
