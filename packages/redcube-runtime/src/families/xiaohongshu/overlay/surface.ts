import {
  buildSurfaceArtifactSpecs,
  buildSurfaceBundle,
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

import type {
  XiaohongshuSurfaceArtifact,
  XiaohongshuSurfaceArtifactPath,
  XiaohongshuSurfaceBundleRequest,
} from './types.js';

const SURFACE_ARTIFACTS = buildSurfaceArtifactSpecs();

export function buildXiaohongshuSurfaceBundle(
  { contract }: XiaohongshuSurfaceBundleRequest,
): XiaohongshuSurfaceArtifact[] {
  return buildSurfaceBundle(contract, SURFACE_ARTIFACTS) as XiaohongshuSurfaceArtifact[];
}

export function listXiaohongshuSurfaceArtifactPaths(): XiaohongshuSurfaceArtifactPath[] {
  return listSurfaceArtifactPaths(SURFACE_ARTIFACTS) as XiaohongshuSurfaceArtifactPath[];
}

const SURFACE_VALIDATORS = {
  'contracts/stage-sequence.json': (content: SurfaceContract) =>
    Array.isArray(content?.stages)
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'single_note_plan')
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'visual_director_review')
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'export_bundle'),
  'contracts/stage-requirements.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'render_html.input_stage_refs', includes: 'single_note_plan' },
    { path: 'render_html.input_stage_refs', includes: 'visual_direction' },
    { path: 'screenshot_review.input_stage_refs', includes: 'visual_director_review' },
    { path: 'export_bundle.ready_claim_requires_review_pass', equals: true },
    { path: 'export_bundle.can_block_stage_launch', equals: false },
  ]),
  'contracts/prompt-pack.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'root', equals: 'prompts/xiaohongshu' },
    { path: 'routes.publish_copy', nonEmptyString: true },
    { path: 'routes.visual_director_review', nonEmptyString: true },
    { path: 'render_contract.render_strategy', equals: 'image_first_page_authoring' },
    { path: 'render_contract.default_visual_route', equals: 'author_image_pages' },
    { path: 'render_contract.shell_file', equals: 'render_shell.html' },
    { path: 'render_contract.recipe_registry.default', nonEmptyString: true },
  ]),
  'contracts/review-surface.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'required_checks', includes: 'platform_copy_complete' },
    { path: 'required_checks', includes: 'director_intent_landed' },
    { path: 'required_checks', includes: 'cta_clear' },
    { path: 'rerun_from_stage', object: true },
  ]),
  'contracts/layout-rules.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'canvas.ratio', equals: '3:4' },
    { path: 'canvas.width', equals: 1086 },
    { path: 'canvas.height', equals: 1448 },
    { path: 'forbidden_template_routes', array: true },
  ]),
  'contracts/baseline-policy.json': validateBaselinePolicySurface,
  'contracts/export-bundle.json': (content: SurfaceContract) => validateSurfaceRequirements(content, [
    { path: 'bundle_id', nonEmptyString: true },
    { path: 'include_publish_manifest', equals: true },
  ]),
  'contracts/delivery-contract.json': (content: SurfaceContract) =>
    validateDeliveryContractSurface(content, {
      requiredExportRoute: 'export_bundle',
      requiredExportBundleId: 'xiaohongshu_standard_bundle',
      projectionModel: 'human_publication',
      humanGateRequired: true,
    }),
  'contracts/governance-surface.json': (content: SurfaceContract) =>
    validateGovernanceSurfaceArtifact(content, {
      overlay: 'xiaohongshu',
      familyKind: 'human_publication',
    }),
  'contracts/hydrated-deliverable.json': (content: SurfaceContract) =>
    validateHydratedDeliverableSurface(content, { overlay: 'xiaohongshu', requiredExportRoute: 'export_bundle' })
    && validateSurfaceRequirements(content, [
      { path: 'stage_sequence.stages', array: true },
      { path: 'prompt_pack.root', nonEmptyString: true },
      { path: 'delivery_contract.required_export_bundle_id', equals: 'xiaohongshu_standard_bundle' },
    ]),
  'views/display-registry.json': (content: SurfaceContract) =>
    validateDisplayRegistrySurface(content, [
      'publish_copy',
      'visual_director_review',
      'series_publish_cadence',
    ]),
};

export function validateXiaohongshuSurfaceArtifact(
  relativePath: XiaohongshuSurfaceArtifactPath,
  content: unknown,
): boolean {
  return validateSurfaceArtifact({
    family: 'xiaohongshu',
    validators: SURFACE_VALIDATORS,
    relativePath,
    content,
  });
}
