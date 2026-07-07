import {
  buildSurfaceArtifactSpecs,
  buildSurfaceBundle,
  listSurfaceArtifactPaths,
  type SurfaceContract,
  type SurfaceValidator,
  validateBaselinePolicySurface,
  validateDeliveryContractSurface,
  validateDisplayRegistrySurface,
  validateGovernanceSurfaceArtifact,
  validateHydratedDeliverableSurface,
  validateSurfaceArtifact,
} from '@redcube/overlay-core';

const SURFACE_ARTIFACTS = buildSurfaceArtifactSpecs({ includeLifecycleStageContract: true });

export function buildPosterSurfaceBundle({ contract }: { contract: SurfaceContract }) {
  return buildSurfaceBundle(contract, SURFACE_ARTIFACTS);
}

export function listPosterSurfaceArtifactPaths() {
  return listSurfaceArtifactPaths(SURFACE_ARTIFACTS);
}

const SURFACE_VALIDATORS: Record<string, SurfaceValidator> = {
  'contracts/stage-sequence.json': (content: SurfaceContract) => Array.isArray(content?.stages)
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'poster_blueprint')
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'visual_director_review'),
  'contracts/stage-requirements.json': (content: SurfaceContract) => Array.isArray(content?.render_html?.requires_artifacts)
    && content.render_html.requires_artifacts.includes('poster_blueprint')
    && content.render_html.requires_artifacts.includes('visual_direction')
    && content.export_bundle?.requires_review_pass === true,
  'contracts/lifecycle-stage-contract.json': (content: SurfaceContract) => content?.stage_model === 'direct_delivery_human_workline'
    && Array.isArray(content?.human_workline)
    && content.human_workline.join(',') === 'source_readiness,storyline,plan,visual,delivery'
    && content?.human_to_macro_stage?.plan === 'story_architecture'
    && content?.human_to_macro_stage?.visual === 'visual_authorship'
    && content?.human_to_macro_stage?.delivery === 'delivery_packaging'
    && content?.review_overlay_within === 'visual'
    && content?.operator_handoff_within === 'delivery'
    && content?.closeout_within === 'delivery'
    && content?.route_to_human_stage?.poster_blueprint === 'plan'
    && content?.route_to_human_stage?.export_bundle === 'delivery',
  'contracts/prompt-pack.json': (content: SurfaceContract) => content?.root === 'prompts/poster_onepager'
    && content?.routes?.render_html === 'prompts/poster_onepager/render_html.md'
    && content?.render_contract?.render_strategy === 'prompt_director_first',
  'contracts/review-surface.json': (content: SurfaceContract) => Array.isArray(content?.required_checks)
    && content.required_checks.includes('director_intent_landed')
    && content.required_checks.includes('message_hierarchy_clear'),
  'contracts/layout-rules.json': (content: SurfaceContract) => content?.canvas?.ratio === '4:5'
    && content?.canvas?.width === 1080
    && Array.isArray(content?.forbidden_template_routes),
  'contracts/baseline-policy.json': validateBaselinePolicySurface,
  'contracts/export-bundle.json': (content: SurfaceContract) => content?.bundle_id === 'poster_onepager_bundle'
    && content?.include_html === true,
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
  'contracts/hydrated-deliverable.json': (content: SurfaceContract) => content?.overlay === 'poster_onepager'
    && content?.prompt_pack?.pack_id === 'poster_onepager_mainline_v1'
    && content?.lifecycle_stage_contract?.stage_model === 'direct_delivery_human_workline'
    && content?.lifecycle_stage_contract?.route_to_human_stage?.poster_blueprint === 'plan'
    && validateHydratedDeliverableSurface(content, { requiredExportRoute: 'export_bundle' })
    && content?.source_truth_contract?.poster_guarded_boundary?.academic_contract_active === false
    && content?.delivery_contract?.required_export_bundle_id === 'poster_onepager_bundle',
  'views/display-registry.json': (content: SurfaceContract) =>
    validateDisplayRegistrySurface(content, [
      'poster_blueprint',
      'visual_director_review',
      'export_bundle',
    ]),
};

export function validatePosterSurfaceArtifact(relativePath: string, content: unknown): boolean {
  return validateSurfaceArtifact({
    family: 'poster',
    validators: SURFACE_VALIDATORS,
    relativePath,
    content,
  });
}
