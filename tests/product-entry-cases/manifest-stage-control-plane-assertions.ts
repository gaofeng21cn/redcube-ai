// @ts-nocheck
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ACTION_CATALOG_REF = {
  ref_kind: 'repo_path',
  ref: 'contracts/action_catalog.json',
  label: 'RedCube canonical action catalog',
};
const DECLARATIVE_STAGE_MANIFEST_REF = 'agent/stages/manifest.json';
const GENERATED_STAGE_CONTROL_PLANE_REF = 'opl-generated:family_stage_control_plane';

function readContract(relativePath) {
  return JSON.parse(readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8'));
}

export function assertManifestActionAndStageControlPlane({
  manifest,
  domain_action_adapterGuardedActionMetadata,
}) {
  const actionCatalog = readContract(ACTION_CATALOG_REF.ref);
  const stageManifest = readContract(DECLARATIVE_STAGE_MANIFEST_REF);

  assert.deepEqual(manifest.family_action_catalog_ref, ACTION_CATALOG_REF);
  assert.equal(manifest.declarative_stage_manifest_ref, DECLARATIVE_STAGE_MANIFEST_REF);
  assert.equal(manifest.family_stage_control_plane_ref, GENERATED_STAGE_CONTROL_PLANE_REF);
  assert.equal(Object.hasOwn(manifest, 'family_action_catalog'), false);
  assert.equal(Object.hasOwn(manifest, 'family_action_catalog_parity'), false);
  assert.equal(Object.hasOwn(manifest, 'family_stage_control_plane'), false);

  assert.equal(actionCatalog.surface_kind, 'family_action_catalog');
  assert.equal(actionCatalog.version, 'family-action-catalog.v1');
  assert.equal(stageManifest.surface_kind, 'opl_standard_agent_declarative_stage_manifest');
  assert.equal(stageManifest.version, 'opl-standard-agent-declarative-stage-manifest.v1');

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

  for (const stage of stageManifest.stages) {
    assert.equal(stage.allowed_action_refs.every((actionRef) => catalogActionIds.has(actionRef)), true);
    assert.deepEqual(stage.next_stage_refs, stage.handoff.next_stage_refs);
  }

  const artifactStage = stageManifest.stages.find((stage) => stage.stage_id === 'artifact_creation');
  assert.deepEqual(artifactStage.domain_stage_refs, ['author_image_pages', 'render_html', 'author_pptx_native']);
  assert.deepEqual(artifactStage.allowed_action_refs, ['invoke_product_entry', 'run_image_ppt_proof', 'run_native_ppt_proof']);
  const reviewStage = stageManifest.stages.find((stage) => stage.stage_id === 'review_and_revision');
  assert.equal(reviewStage.trust_lane, 'ai_decision');
  const handoffStage = stageManifest.stages.find((stage) => stage.stage_id === 'package_and_handoff');
  assert.deepEqual(handoffStage.domain_stage_refs, ['export_pptx', 'publish_copy', 'export_bundle', 'export_poster']);
}
