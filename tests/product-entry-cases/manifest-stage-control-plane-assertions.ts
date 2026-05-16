// @ts-nocheck
import assert from 'node:assert/strict';

export function assertManifestActionAndStageControlPlane({
  manifest,
  sidecarGuardedActionMetadata,
}) {
  assert.equal(manifest.family_action_catalog.surface_kind, 'family_action_catalog');
  assert.equal(manifest.family_action_catalog.version, 'family-action-catalog.v1');
  assert.equal(manifest.family_action_catalog.catalog_id, 'redcube_product_entry_action_catalog');
  assert.equal(manifest.family_action_catalog.target_domain_id, 'redcube_ai');
  assert.equal(manifest.family_action_catalog.owner, 'redcube_ai');
  assert.deepEqual(manifest.family_action_catalog.authority_boundary, {
    domain_truth_owner: 'redcube_ai',
    opl_role: 'projection_consumer_only',
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
      'export_product_sidecar',
      'dispatch_product_sidecar',
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
      'redcube product status',
      'redcube product invoke',
      'redcube product session',
      'redcube image-ppt proof',
      'redcube native-ppt proof',
    ],
  );
  const sidecarDispatchAction = manifest.family_action_catalog.actions
    .find((action) => action.action_id === 'dispatch_product_sidecar');
  assert.deepEqual(
    sidecarDispatchAction.authority_boundary.allowed_actions,
    sidecarGuardedActionMetadata.guardedActionIds,
  );
  assert.deepEqual(
    sidecarDispatchAction.authority_boundary.forbidden_writes,
    sidecarGuardedActionMetadata.forbiddenWrites,
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
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_schedule_stage, false);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_visual_truth, false);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_review_truth, false);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.opl_can_write_publication_projection, false);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.default_ppt_route_changed, false);
  assert.equal(manifest.family_stage_control_plane.authority_boundary.managed_deliverable_runtime_changed, false);
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
    assert.equal(stage.handoff.next_owner, 'redcube_ai');
    assert.equal(stage.handoff.resume_surface_ref, '/session_continuity');
    assert.equal(stage.handoff.artifact_surface_ref, '/artifact_inventory');
    assert.equal(stage.authority_boundary.domain_truth_owner, 'redcube_ai');
    assert.equal(stage.authority_boundary.visual_truth_owner, 'redcube_ai');
    assert.equal(stage.authority_boundary.artifact_authority_owner, 'redcube_ai');
    assert.equal(stage.authority_boundary.review_publication_projection_owner, 'redcube_ai');
    assert.equal(stage.authority_boundary.opl_role, 'projection_consumer_only');
    assert.equal(stage.authority_boundary.opl_can_schedule_stage, false);
    assert.equal(stage.authority_boundary.opl_can_write_visual_truth, false);
    assert.equal(stage.authority_boundary.opl_can_write_review_truth, false);
    assert.equal(stage.authority_boundary.opl_can_write_publication_projection, false);
    assert.equal(stage.authority_boundary.default_ppt_route_changed, false);
    assert.equal(stage.authority_boundary.managed_deliverable_runtime_changed, false);
  }
  const artifactStage = manifest.family_stage_control_plane.stages.find((stage) => stage.stage_id === 'artifact_creation');
  assert.deepEqual(artifactStage.domain_stage_refs, ['author_image_pages', 'render_html', 'author_pptx_native']);
  assert.deepEqual(artifactStage.allowed_action_refs, ['invoke_product_entry', 'run_image_ppt_proof', 'run_native_ppt_proof']);
  assert.equal(artifactStage.authority_boundary.default_ppt_route_changed, false);
  assert.equal(artifactStage.authority_boundary.managed_deliverable_runtime_changed, false);
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
