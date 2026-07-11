import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ACTION_CATALOG_REF = {
  ref_kind: 'repo_path',
  ref: 'contracts/action_catalog.json',
  label: 'RedCube canonical action catalog',
};
const STAGE_CONTROL_PLANE_REF = {
  ref_kind: 'repo_path',
  ref: 'contracts/stage_control_plane.json',
  label: 'RedCube canonical stage control plane',
};

function readContract(relativePath) {
  return JSON.parse(readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8'));
}

export function assertManifestActionAndStageControlPlane({
  manifest,
  domain_action_adapterGuardedActionMetadata,
}) {
  const actionCatalog = readContract(ACTION_CATALOG_REF.ref);
  const stageControlPlane = readContract(STAGE_CONTROL_PLANE_REF.ref);

  assert.deepEqual(manifest.family_action_catalog_ref, ACTION_CATALOG_REF);
  assert.deepEqual(manifest.family_stage_control_plane_ref, STAGE_CONTROL_PLANE_REF);
  assert.equal(Object.hasOwn(manifest, 'family_action_catalog'), false);
  assert.equal(Object.hasOwn(manifest, 'family_action_catalog_parity'), false);
  assert.equal(Object.hasOwn(manifest, 'family_stage_control_plane'), false);

  assert.equal(actionCatalog.surface_kind, 'family_action_catalog');
  assert.equal(actionCatalog.version, 'family-action-catalog.v1');
  assert.equal(stageControlPlane.surface_kind, 'family_stage_control_plane');
  assert.equal(stageControlPlane.version, 'family-stage-control-plane.v1');
  assert.equal(
    stageControlPlane.source_refs.some((sourceRef) => sourceRef.ref === ACTION_CATALOG_REF.ref),
    true,
  );

  const catalogActionIds = new Set(actionCatalog.actions.map((action) => action.action_id));
  const domainHandlerDispatchAction = actionCatalog.actions.find(
    (action) => action.action_id === 'dispatch_domain_handler',
  );
  assert.deepEqual(
    domainHandlerDispatchAction.authority_boundary.allowed_actions,
    domain_action_adapterGuardedActionMetadata.guardedActionIds,
  );
  assert.deepEqual(
    domainHandlerDispatchAction.authority_boundary.forbidden_writes,
    domain_action_adapterGuardedActionMetadata.forbiddenWrites,
  );

  assert.deepEqual(stageControlPlane.stages.map((stage) => stage.stage_id), stageControlPlane.stage_ids);
  for (const [index, stage] of stageControlPlane.stages.entries()) {
    assert.deepEqual(stage.allowed_action_refs, stage.action_refs);
    assert.equal(stage.action_refs.every((actionRef) => catalogActionIds.has(actionRef)), true);
    assert.equal(stage.missing_action_refs.length, 0);
    assert.equal(stage.authority_boundary.opl_can_write_visual_truth, false);
    assert.equal(stage.authority_boundary.provider_completion_is_visual_ready, false);
    assert.equal(stage.authority_boundary.provider_completion_is_domain_ready, false);
    for (const field of [
      'tool_affordance_boundary',
      'candidate_pool_policy',
      'handoff_policy',
      'independent_gate_policy',
    ]) {
      assert.equal(
        stage.stage_contract[`${field}_ref`],
        `${STAGE_CONTROL_PLANE_REF.ref}#/stages/${index}/${field}`,
      );
    }
  }

  const artifactStage = stageControlPlane.stages.find((stage) => stage.stage_id === 'artifact_creation');
  assert.deepEqual(artifactStage.domain_stage_refs, ['author_image_pages', 'render_html', 'author_pptx_native']);
  assert.deepEqual(artifactStage.action_refs, ['invoke_product_entry', 'run_image_ppt_proof', 'run_native_ppt_proof']);
  const reviewStage = stageControlPlane.stages.find((stage) => stage.stage_id === 'review_and_revision');
  assert.equal(reviewStage.authority_boundary.redcube_ai_owns_review_export_verdict, true);
  const handoffStage = stageControlPlane.stages.find((stage) => stage.stage_id === 'package_and_handoff');
  assert.deepEqual(handoffStage.domain_stage_refs, ['export_pptx', 'publish_copy', 'export_bundle', 'export_poster']);
}
