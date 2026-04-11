import {
  buildGovernanceSurfaceContract,
  validateGovernanceSurfaceContract,
} from '@redcube/overlay-core';

export function buildPosterSurfaceBundle({ contract }) {
  return [
    { relativePath: 'contracts/stage-sequence.json', content: contract.stage_sequence },
    { relativePath: 'contracts/stage-requirements.json', content: contract.stage_requirements },
    { relativePath: 'contracts/lifecycle-stage-contract.json', content: contract.lifecycle_stage_contract },
    { relativePath: 'contracts/prompt-pack.json', content: contract.prompt_pack },
    { relativePath: 'contracts/review-surface.json', content: contract.review_surface },
    { relativePath: 'contracts/layout-rules.json', content: contract.layout_rules },
    { relativePath: 'contracts/baseline-policy.json', content: contract.baseline_policy },
    { relativePath: 'contracts/export-bundle.json', content: contract.export_bundle },
    { relativePath: 'contracts/delivery-contract.json', content: contract.delivery_contract },
    { relativePath: 'contracts/governance-surface.json', content: buildGovernanceSurfaceContract(contract) },
    { relativePath: 'contracts/hydrated-deliverable.json', content: contract },
    { relativePath: 'views/display-registry.json', content: contract.display_registry },
  ];
}

export function listPosterSurfaceArtifactPaths() {
  return [
    'contracts/stage-sequence.json',
    'contracts/stage-requirements.json',
    'contracts/lifecycle-stage-contract.json',
    'contracts/prompt-pack.json',
    'contracts/review-surface.json',
    'contracts/layout-rules.json',
    'contracts/baseline-policy.json',
    'contracts/export-bundle.json',
    'contracts/delivery-contract.json',
    'contracts/governance-surface.json',
    'contracts/hydrated-deliverable.json',
    'views/display-registry.json',
  ];
}

const SURFACE_VALIDATORS = {
  'contracts/stage-sequence.json': (content) => Array.isArray(content?.stages)
    && content.stages.some((stage) => stage?.stage_id === 'poster_blueprint')
    && content.stages.some((stage) => stage?.stage_id === 'visual_director_review'),
  'contracts/stage-requirements.json': (content) => Array.isArray(content?.render_html?.requires_artifacts)
    && content.render_html.requires_artifacts.includes('poster_blueprint')
    && content.render_html.requires_artifacts.includes('visual_direction')
    && content.export_bundle?.requires_review_pass === true,
  'contracts/lifecycle-stage-contract.json': (content) => content?.stage_model === 'direct_delivery_human_workline'
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
  'contracts/prompt-pack.json': (content) => content?.root === 'prompts/poster_onepager'
    && content?.routes?.render_html === 'prompts/poster_onepager/render_html.md'
    && content?.render_contract?.render_strategy === 'prompt_director_first',
  'contracts/review-surface.json': (content) => Array.isArray(content?.required_checks)
    && content.required_checks.includes('director_intent_landed')
    && content.required_checks.includes('message_hierarchy_clear'),
  'contracts/layout-rules.json': (content) => content?.canvas?.ratio === '4:5'
    && content?.canvas?.width === 1080
    && Array.isArray(content?.forbidden_template_routes),
  'contracts/baseline-policy.json': (content) => content?.modes?.draft_new?.baseline_required === false
    && content?.modes?.optimize_existing?.baseline_required === true,
  'contracts/export-bundle.json': (content) => content?.bundle_id === 'poster_onepager_bundle'
    && content?.include_html === true,
  'contracts/delivery-contract.json': (content) => content?.authoritative_projection_surface === 'getPublicationProjection'
    && content?.authoritative_review_surface === 'getReviewState'
    && content?.required_export_route === 'export_bundle'
    && content?.required_export_bundle_id === 'poster_onepager_bundle'
    && content?.projection_model === 'direct_delivery'
    && content?.human_gate?.required === false
    && content?.operator_handoff?.owner_surface === 'required_export_artifact.delivery_state'
    && content?.operator_handoff?.handoff_ready_state === 'output_ready'
    && Array.isArray(content?.operator_handoff?.gate_surfaces)
    && content.operator_handoff.gate_surfaces.includes('auditDeliverable')
    && content.operator_handoff.gate_surfaces.includes('runtimeWatch')
    && content.operator_handoff.reopen_mutation_surface === 'request_changes'
    && content.operator_handoff.closeout_mutation_surface === 'promote_baseline',
  'contracts/governance-surface.json': (content) => validateGovernanceSurfaceContract(content)
    && content?.family_boundary?.family_kind === 'guarded_knowledge_poster'
    && content?.family_boundary?.overlay === 'poster_onepager',
  'contracts/hydrated-deliverable.json': (content) => content?.overlay === 'poster_onepager'
    && content?.prompt_pack?.pack_id === 'poster_onepager_mainline_v1'
    && content?.lifecycle_stage_contract?.stage_model === 'direct_delivery_human_workline'
    && content?.lifecycle_stage_contract?.route_to_human_stage?.poster_blueprint === 'plan'
    && content?.source_truth_contract?.authoritative_surface === 'shared_source_truth'
    && content?.source_truth_contract?.poster_guarded_boundary?.academic_contract_active === false
    && content?.delivery_contract?.required_export_route === 'export_bundle',
  'views/display-registry.json': (content) => Array.isArray(content?.surfaces)
    && content.surfaces.some((surface) => surface?.id === 'poster_blueprint')
    && content.surfaces.some((surface) => surface?.id === 'visual_director_review')
    && content.surfaces.some((surface) => surface?.id === 'export_bundle'),
};

export function validatePosterSurfaceArtifact(relativePath, content) {
  const validator = SURFACE_VALIDATORS[relativePath];
  if (!validator) {
    throw new Error(`Unknown poster surface artifact: ${relativePath}`);
  }
  return Boolean(validator(content));
}
