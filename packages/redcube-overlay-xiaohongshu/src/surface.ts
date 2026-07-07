import {
  buildSurfaceArtifactSpecs,
  buildSurfaceBundle,
  listSurfaceArtifactPaths,
  type SurfaceContract,
  type SurfaceValidator,
  validateGovernanceSurfaceContract,
  validateSurfaceArtifact,
} from '@redcube/overlay-core';

const SURFACE_ARTIFACTS = buildSurfaceArtifactSpecs();

export function buildXiaohongshuSurfaceBundle({ contract }: { contract: SurfaceContract }) {
  return buildSurfaceBundle(contract, SURFACE_ARTIFACTS);
}

export function listXiaohongshuSurfaceArtifactPaths() {
  return listSurfaceArtifactPaths(SURFACE_ARTIFACTS);
}

const SURFACE_VALIDATORS: Record<string, SurfaceValidator> = {
  'contracts/stage-sequence.json': (content: SurfaceContract) =>
    Array.isArray(content?.stages)
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'single_note_plan')
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'visual_director_review')
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'export_bundle'),
  'contracts/stage-requirements.json': (content: SurfaceContract) =>
    Array.isArray(content?.render_html?.requires_artifacts)
    && content.render_html.requires_artifacts.includes('single_note_plan')
    && content.render_html.requires_artifacts.includes('visual_direction')
    && Array.isArray(content?.screenshot_review?.requires_artifacts)
    && content.screenshot_review.requires_artifacts.includes('visual_director_review')
    && content.export_bundle?.requires_review_pass === true,
  'contracts/prompt-pack.json': (content: SurfaceContract) =>
    typeof content?.root === 'string'
    && content.root === 'prompts/xiaohongshu'
    && typeof content?.routes?.publish_copy === 'string'
    && typeof content?.routes?.visual_director_review === 'string'
    && content?.render_contract?.render_strategy === 'image_first_page_authoring'
    && content?.render_contract?.default_visual_route === 'author_image_pages'
    && content?.render_contract?.shell_file === 'render_shell.html'
    && typeof content?.render_contract?.recipe_registry?.default === 'string',
  'contracts/review-surface.json': (content: SurfaceContract) =>
    Array.isArray(content?.required_checks)
    && content.required_checks.includes('platform_copy_complete')
    && content.required_checks.includes('director_intent_landed')
    && content.required_checks.includes('cta_clear')
    && typeof content?.rerun_from_stage === 'object',
  'contracts/layout-rules.json': (content: SurfaceContract) =>
    content?.canvas?.ratio === '3:4'
    && content?.canvas?.width === 1086
    && content?.canvas?.height === 1448
    && Array.isArray(content?.forbidden_template_routes),
  'contracts/baseline-policy.json': (content: SurfaceContract) =>
    content?.modes?.draft_new?.baseline_required === false
    && content?.modes?.optimize_existing?.baseline_required === true,
  'contracts/export-bundle.json': (content: SurfaceContract) =>
    typeof content?.bundle_id === 'string'
    && content?.include_publish_manifest === true,
  'contracts/delivery-contract.json': (content: SurfaceContract) =>
    content?.authoritative_projection_surface === 'getPublicationProjection'
    && content?.authoritative_review_surface === 'getReviewState'
    && content?.required_export_route === 'export_bundle'
    && content?.required_export_bundle_id === 'xiaohongshu_standard_bundle'
    && content?.projection_model === 'human_publication'
    && content?.human_gate?.required === true,
  'contracts/governance-surface.json': (content: SurfaceContract) =>
    validateGovernanceSurfaceContract(content)
    && content?.family_boundary?.family_kind === 'human_publication'
    && content?.family_boundary?.overlay === 'xiaohongshu',
  'contracts/hydrated-deliverable.json': (content: SurfaceContract) =>
    content?.overlay === 'xiaohongshu'
    && Array.isArray(content?.stage_sequence?.stages)
    && typeof content?.prompt_pack?.root === 'string'
    && content?.source_truth_contract?.authoritative_surface === 'shared_source_truth'
    && content?.source_truth_contract?.route_gate_rule === 'authoritative_fail_closed_in_audit_and_runtime_watch'
    && content?.delivery_contract?.required_export_route === 'export_bundle',
  'views/display-registry.json': (content: SurfaceContract) =>
    Array.isArray(content?.surfaces)
    && content.surfaces.some((surface: SurfaceContract) => surface?.id === 'publish_copy')
    && content.surfaces.some((surface: SurfaceContract) => surface?.id === 'visual_director_review')
    && content.surfaces.some((surface: SurfaceContract) => surface?.id === 'series_publish_cadence'),
};

export function validateXiaohongshuSurfaceArtifact(relativePath: string, content: unknown): boolean {
  return validateSurfaceArtifact({
    family: 'xiaohongshu',
    validators: SURFACE_VALIDATORS,
    relativePath,
    content,
  });
}
