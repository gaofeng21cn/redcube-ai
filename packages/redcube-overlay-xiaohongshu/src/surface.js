import {
  buildGovernanceSurfaceContract,
  validateGovernanceSurfaceContract,
} from '@redcube/overlay-core';

export function buildXiaohongshuSurfaceBundle({ contract }) {
  return [
    { relativePath: 'contracts/stage-sequence.json', content: contract.stage_sequence },
    { relativePath: 'contracts/stage-requirements.json', content: contract.stage_requirements },
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

export function listXiaohongshuSurfaceArtifactPaths() {
  return [
    'contracts/stage-sequence.json',
    'contracts/stage-requirements.json',
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
  'contracts/stage-sequence.json': (content) =>
    Array.isArray(content?.stages)
    && content.stages.some((stage) => stage?.stage_id === 'single_note_plan')
    && content.stages.some((stage) => stage?.stage_id === 'visual_director_review')
    && content.stages.some((stage) => stage?.stage_id === 'export_bundle'),
  'contracts/stage-requirements.json': (content) =>
    Array.isArray(content?.render_html?.requires_artifacts)
    && content.render_html.requires_artifacts.includes('single_note_plan')
    && content.render_html.requires_artifacts.includes('visual_direction')
    && Array.isArray(content?.screenshot_review?.requires_artifacts)
    && content.screenshot_review.requires_artifacts.includes('visual_director_review')
    && content.export_bundle?.requires_review_pass === true,
  'contracts/prompt-pack.json': (content) =>
    typeof content?.root === 'string'
    && content.root === 'prompts/xiaohongshu'
    && typeof content?.routes?.publish_copy === 'string'
    && typeof content?.routes?.visual_director_review === 'string'
    && content?.render_contract?.render_strategy === 'prompt_director_first'
    && content?.render_contract?.shell_file === 'render_shell.html'
    && typeof content?.render_contract?.recipe_registry?.default === 'string',
  'contracts/review-surface.json': (content) =>
    Array.isArray(content?.required_checks)
    && content.required_checks.includes('platform_copy_complete')
    && content.required_checks.includes('director_intent_landed')
    && content.required_checks.includes('cta_clear')
    && typeof content?.rerun_from_stage === 'object',
  'contracts/layout-rules.json': (content) =>
    content?.canvas?.ratio === '3:4'
    && content?.canvas?.width === 448
    && content?.canvas?.height === 597
    && Array.isArray(content?.forbidden_template_routes),
  'contracts/baseline-policy.json': (content) =>
    content?.modes?.draft_new?.baseline_required === false
    && content?.modes?.optimize_existing?.baseline_required === true,
  'contracts/export-bundle.json': (content) =>
    typeof content?.bundle_id === 'string'
    && content?.include_publish_manifest === true,
  'contracts/delivery-contract.json': (content) =>
    content?.authoritative_projection_surface === 'getPublicationProjection'
    && content?.authoritative_review_surface === 'getReviewState'
    && content?.required_export_route === 'export_bundle'
    && content?.required_export_bundle_id === 'xiaohongshu_standard_bundle'
    && content?.projection_model === 'human_publication'
    && content?.human_gate?.required === true,
  'contracts/governance-surface.json': (content) =>
    validateGovernanceSurfaceContract(content)
    && content?.family_boundary?.family_kind === 'human_publication'
    && content?.family_boundary?.overlay === 'xiaohongshu',
  'contracts/hydrated-deliverable.json': (content) =>
    content?.overlay === 'xiaohongshu'
    && Array.isArray(content?.stage_sequence?.stages)
    && typeof content?.prompt_pack?.root === 'string'
    && content?.source_truth_contract?.authoritative_surface === 'shared_source_truth'
    && content?.source_truth_contract?.route_gate_rule === 'authoritative_fail_closed_in_audit_and_runtime_watch'
    && content?.delivery_contract?.required_export_route === 'export_bundle',
  'views/display-registry.json': (content) =>
    Array.isArray(content?.surfaces)
    && content.surfaces.some((surface) => surface?.id === 'publish_copy')
    && content.surfaces.some((surface) => surface?.id === 'visual_director_review')
    && content.surfaces.some((surface) => surface?.id === 'series_publish_cadence'),
};

export function validateXiaohongshuSurfaceArtifact(relativePath, content) {
  const validator = SURFACE_VALIDATORS[relativePath];
  if (!validator) {
    throw new Error(`Unknown xiaohongshu surface artifact: ${relativePath}`);
  }
  return Boolean(validator(content));
}
