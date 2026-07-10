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
    opl_generated_mcp_descriptor_role: 'protocol_descriptor_for_domain_handler_targets',
    domain_handler_role: 'domain_handler_target_or_refs_only_adapter',
    generic_session_shell_owner: 'one-person-lab',
    generic_workbench_owner: 'one-person-lab',
    default_generic_dispatch_owner: 'one-person-lab',
    default_supervision_owner: 'one-person-lab',
    temporal_stage_run_consumption_policy: {
      policy_ref: '/temporal_stage_run_consumption_policy',
      temporal_attempt_ledger_owner: 'one-person-lab/OPL',
      provider_completion_is_domain_completion: false,
      domain_repo_can_own_temporal_runtime: false,
      rca_writes_opl_stage_attempts: false,
      generated_surface_ready_can_claim_domain_ready: false,
      domain_completion_requires_one_of: [
        'owner_receipt_ref',
        'typed_blocker_ref',
        'human_gate_ref',
        'route_back_ref',
      ],
    },
    write_policy: 'no_domain_truth_writes',
  });
  assert.deepEqual(
    manifest.family_action_catalog.actions.map((action) => action.action_id),
    [
      'get_product_status',
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
  assert.deepEqual(domainHandlerDispatchAction.authority_boundary.allowed_temporal_stage_run_writes, []);
  assert.equal(domainHandlerDispatchAction.authority_boundary.rca_writes_opl_stage_attempts, false);
  assert.equal(manifest.family_action_catalog_parity.surface_kind, 'family_action_catalog_parity');
  assert.equal(manifest.family_action_catalog_parity.status, 'aligned');
  assert.deepEqual(manifest.family_action_catalog_parity.issues, []);
  assert.equal(manifest.family_stage_control_plane.surface_kind, 'family_stage_control_plane');
  assert.equal(manifest.family_stage_control_plane.version, 'family-stage-control-plane.v1');
  assert.equal(manifest.family_stage_control_plane.plane_id, 'redcube_ai_stage_control_plane');
  assert.equal(manifest.family_stage_control_plane.target_domain_id, 'redcube_ai');
  assert.equal(manifest.family_stage_control_plane.projection_mode, 'rca_refs_only_opl_generated_stage_control');
  assert.equal(manifest.family_stage_control_plane.generated_stage_control_owner, 'one-person-lab');
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_role, 'projection_consumer_only');
  assert.equal(manifest.family_stage_control_plane.authority_boundary.rca_owns_visual_truth, true);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.rca_owns_review_publication_projection, true);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.rca_owns_artifact_authority, true);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_stage_attempt_owner, 'one-person-lab');
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_generate_stage_control_from_refs, true);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_schedule_stage, true);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_schedule_stage_attempt, true);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_visual_truth, false);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_review_truth, false);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_publication_projection, false);
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
  const catalogActionIds = new Set(manifest.family_action_catalog.actions.map((action) => action.action_id));
  for (const stage of manifest.family_stage_control_plane.stages) {
    assert.equal(typeof stage.stage_ref, 'string');
    assert.equal(stage.stage_ref.startsWith('agent/stages/'), true);
    assert.equal(typeof stage.prompt_ref, 'string');
    assert.equal(stage.prompt_ref.startsWith('agent/prompts/'), true);
    assert.equal(typeof stage.goal, 'string');
    assert.equal(stage.goal.length > 20, true);
    assert.equal(stage.stage_kind, 'domain_specific');
    assert.equal(stage.owner, 'redcube_ai');
    assert.equal(Array.isArray(stage.skill_refs), true);
    assert.equal(Array.isArray(stage.quality_gate_refs), true);
    assert.deepEqual(stage.missing_action_refs, []);
    for (const actionRef of stage.action_refs) {
      assert.equal(catalogActionIds.has(actionRef), true);
    }
    assert.equal(stage.authority_boundary.opl_can_write_visual_truth, false);
    assert.equal(stage.authority_boundary.provider_completion_is_visual_ready, false);
    assert.equal(stage.authority_boundary.provider_completion_is_domain_ready, false);
  }
  const artifactStage = manifest.family_stage_control_plane.stages.find((stage) => stage.stage_id === 'artifact_creation');
  assert.deepEqual(artifactStage.domain_stage_refs, ['author_image_pages', 'render_html', 'author_pptx_native']);
  assert.deepEqual(artifactStage.action_refs, ['invoke_product_entry', 'run_image_ppt_proof', 'run_native_ppt_proof']);
  const reviewStage = manifest.family_stage_control_plane.stages.find((stage) => stage.stage_id === 'review_and_revision');
  assert.equal(reviewStage.authority_boundary.redcube_ai_owns_review_export_verdict, true);
  const handoffStage = manifest.family_stage_control_plane.stages.find((stage) => stage.stage_id === 'package_and_handoff');
  assert.deepEqual(handoffStage.domain_stage_refs, ['export_pptx', 'publish_copy', 'export_bundle', 'export_poster']);
}
