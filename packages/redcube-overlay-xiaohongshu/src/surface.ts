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

const SURFACE_ARTIFACTS = buildSurfaceArtifactSpecs();

export function buildXiaohongshuSurfaceBundle({ contract }: { contract: SurfaceContract }) {
  return buildSurfaceBundle(contract, SURFACE_ARTIFACTS);
}

export function listXiaohongshuSurfaceArtifactPaths() {
  return listSurfaceArtifactPaths(SURFACE_ARTIFACTS);
}

const SURFACE_VALIDATORS = createSurfaceValidators([
  {
    relativePath: 'contracts/stage-sequence.json',
    validate: (content: SurfaceContract) =>
    Array.isArray(content?.stages)
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'single_note_plan')
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'visual_director_review')
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'export_bundle'),
  },
  {
    relativePath: 'contracts/stage-requirements.json',
    validate: (content: SurfaceContract) => validateSurfaceRequirements(content, [
      { path: 'render_html.requires_artifacts', includes: 'single_note_plan' },
      { path: 'render_html.requires_artifacts', includes: 'visual_direction' },
      { path: 'screenshot_review.requires_artifacts', includes: 'visual_director_review' },
      { path: 'export_bundle.requires_review_pass', equals: true },
    ]),
  },
  {
    relativePath: 'contracts/prompt-pack.json',
    validate: (content: SurfaceContract) => validateSurfaceRequirements(content, [
      { path: 'root', equals: 'prompts/xiaohongshu' },
      { path: 'routes.publish_copy', nonEmptyString: true },
      { path: 'routes.visual_director_review', nonEmptyString: true },
      { path: 'render_contract.render_strategy', equals: 'image_first_page_authoring' },
      { path: 'render_contract.default_visual_route', equals: 'author_image_pages' },
      { path: 'render_contract.shell_file', equals: 'render_shell.html' },
      { path: 'render_contract.recipe_registry.default', nonEmptyString: true },
    ]),
  },
  {
    relativePath: 'contracts/review-surface.json',
    validate: (content: SurfaceContract) => validateSurfaceRequirements(content, [
      { path: 'required_checks', includes: 'platform_copy_complete' },
      { path: 'required_checks', includes: 'director_intent_landed' },
      { path: 'required_checks', includes: 'cta_clear' },
      { path: 'rerun_from_stage', object: true },
    ]),
  },
  {
    relativePath: 'contracts/layout-rules.json',
    validate: (content: SurfaceContract) => validateSurfaceRequirements(content, [
      { path: 'canvas.ratio', equals: '3:4' },
      { path: 'canvas.width', equals: 1086 },
      { path: 'canvas.height', equals: 1448 },
      { path: 'forbidden_template_routes', array: true },
    ]),
  },
  { relativePath: 'contracts/baseline-policy.json', validate: validateBaselinePolicySurface },
  {
    relativePath: 'contracts/export-bundle.json',
    validate: (content: SurfaceContract) => validateSurfaceRequirements(content, [
      { path: 'bundle_id', nonEmptyString: true },
      { path: 'include_publish_manifest', equals: true },
    ]),
  },
  {
    relativePath: 'contracts/delivery-contract.json',
    validate: (content: SurfaceContract) =>
      validateDeliveryContractSurface(content, {
        requiredExportRoute: 'export_bundle',
        requiredExportBundleId: 'xiaohongshu_standard_bundle',
        projectionModel: 'human_publication',
        humanGateRequired: true,
      }),
  },
  {
    relativePath: 'contracts/governance-surface.json',
    validate: (content: SurfaceContract) =>
      validateGovernanceSurfaceArtifact(content, {
        overlay: 'xiaohongshu',
        familyKind: 'human_publication',
      }),
  },
  {
    relativePath: 'contracts/hydrated-deliverable.json',
    validate: (content: SurfaceContract) =>
      validateHydratedDeliverableSurface(content, { overlay: 'xiaohongshu', requiredExportRoute: 'export_bundle' })
      && validateSurfaceRequirements(content, [
        { path: 'stage_sequence.stages', array: true },
        { path: 'prompt_pack.root', nonEmptyString: true },
        { path: 'delivery_contract.required_export_bundle_id', equals: 'xiaohongshu_standard_bundle' },
      ]),
  },
  {
    relativePath: 'views/display-registry.json',
    validate: (content: SurfaceContract) =>
      validateDisplayRegistrySurface(content, [
        'publish_copy',
        'visual_director_review',
        'series_publish_cadence',
      ]),
  },
]);

export function validateXiaohongshuSurfaceArtifact(relativePath: string, content: unknown): boolean {
  return validateSurfaceArtifact({
    family: 'xiaohongshu',
    validators: SURFACE_VALIDATORS,
    relativePath,
    content,
  });
}
