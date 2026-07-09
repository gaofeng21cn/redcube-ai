import {
  buildSurfaceArtifactSpecs,
  buildSurfaceBundle,
  createSurfaceValidators,
  listSurfaceArtifactPaths,
  type SurfaceContract,
  validateBaselinePolicySurface,
  validateDeliveryContractSurface,
  validateDisplayRegistrySurface,
  validateGovernanceSurfaceArtifact,
  validateHydratedDeliverableSurface,
  validateSurfaceArtifact,
  validateSurfaceRequirements,
} from '@redcube/overlay-core';

const SURFACE_ARTIFACTS = buildSurfaceArtifactSpecs({ includeLifecycleStageContract: true });

export function buildPosterSurfaceBundle({ contract }: { contract: SurfaceContract }) {
  return buildSurfaceBundle(contract, SURFACE_ARTIFACTS);
}

export function listPosterSurfaceArtifactPaths() {
  return listSurfaceArtifactPaths(SURFACE_ARTIFACTS);
}

const SURFACE_VALIDATORS = createSurfaceValidators({
  'contracts/stage-sequence.json': (content: SurfaceContract) => Array.isArray(content?.stages)
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'poster_blueprint')
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'visual_director_review'),
  'contracts/stage-requirements.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'render_html.requires_artifacts', includes: 'poster_blueprint' },
    { path: 'render_html.requires_artifacts', includes: 'visual_direction' },
    { path: 'export_bundle.requires_review_pass', equals: true },
  ]),
  'contracts/lifecycle-stage-contract.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'stage_model', equals: 'direct_delivery_human_workline' },
    { path: 'human_workline', array: true },
    { path: 'human_to_macro_stage.plan', equals: 'story_architecture' },
    { path: 'human_to_macro_stage.visual', equals: 'visual_authorship' },
    { path: 'human_to_macro_stage.delivery', equals: 'delivery_packaging' },
    { path: 'review_overlay_within', equals: 'visual' },
    { path: 'operator_handoff_within', equals: 'delivery' },
    { path: 'closeout_within', equals: 'delivery' },
    { path: 'route_to_human_stage.poster_blueprint', equals: 'plan' },
    { path: 'route_to_human_stage.export_bundle', equals: 'delivery' },
  ])
    && content.human_workline.join(',') === 'source_readiness,storyline,plan,visual,delivery',
  'contracts/prompt-pack.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'root', equals: 'prompts/poster_onepager' },
    { path: 'routes.render_html', equals: 'prompts/poster_onepager/render_html.md' },
    { path: 'render_contract.render_strategy', equals: 'prompt_director_first' },
  ]),
  'contracts/review-surface.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'required_checks', includes: 'director_intent_landed' },
    { path: 'required_checks', includes: 'message_hierarchy_clear' },
  ]),
  'contracts/layout-rules.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'canvas.ratio', equals: '4:5' },
    { path: 'canvas.width', equals: 1080 },
    { path: 'forbidden_template_routes', array: true },
  ]),
  'contracts/baseline-policy.json': validateBaselinePolicySurface,
  'contracts/export-bundle.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'bundle_id', equals: 'poster_onepager_bundle' },
    { path: 'include_html', equals: true },
  ]),
  'contracts/delivery-contract.json': (content: SurfaceContract) =>
    validateDeliveryContractSurface(content, {
      requiredExportRoute: 'export_bundle',
      requiredExportBundleId: 'poster_onepager_bundle',
      projectionModel: 'direct_delivery',
      humanGateRequired: false,
    }),
  'contracts/governance-surface.json': (content: SurfaceContract) =>
    validateGovernanceSurfaceArtifact(content, {
      overlay: 'poster_onepager',
      familyKind: 'guarded_knowledge_poster',
    }),
  'contracts/hydrated-deliverable.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'overlay', equals: 'poster_onepager' },
    { path: 'prompt_pack.pack_id', equals: 'poster_onepager_mainline_v1' },
    { path: 'lifecycle_stage_contract.stage_model', equals: 'direct_delivery_human_workline' },
    { path: 'lifecycle_stage_contract.route_to_human_stage.poster_blueprint', equals: 'plan' },
    { path: 'source_truth_contract.poster_guarded_boundary.academic_contract_active', equals: false },
    { path: 'delivery_contract.required_export_bundle_id', equals: 'poster_onepager_bundle' },
  ])
    && validateHydratedDeliverableSurface(content, { requiredExportRoute: 'export_bundle' }),
  'views/display-registry.json': (content: SurfaceContract) =>
    validateDisplayRegistrySurface(content, [
      'poster_blueprint',
      'visual_director_review',
      'export_bundle',
    ]),
});

export function validatePosterSurfaceArtifact(relativePath: string, content: unknown): boolean {
  return validateSurfaceArtifact({
    family: 'poster',
    validators: SURFACE_VALIDATORS,
    relativePath,
    content,
  });
}
