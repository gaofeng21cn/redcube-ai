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
  PptDeckSurfaceArtifact,
  PptDeckSurfaceArtifactPath,
  PptDeckSurfaceBundleRequest,
} from './types.js';

function deriveStageRequirements(contract: SurfaceContract) {
  if (contract?.stage_requirements) {
    return contract.stage_requirements;
  }
  const stages = Array.isArray(contract?.stage_sequence?.stages)
    ? contract.stage_sequence.stages
    : [];
  const hardStops = Array.isArray(contract?.stage_sequence?.hard_stops)
    ? contract.stage_sequence.hard_stops
    : [];
  const derived: Record<string, { requires_artifacts: unknown[]; requires_review_pass: boolean }> = {};
  for (const stage of stages as SurfaceContract[]) {
    const hardStop = (hardStops as SurfaceContract[]).find((item) => item?.stage_id === stage?.stage_id) || null;
    derived[stage.stage_id] = {
      requires_artifacts: Array.isArray(stage?.requires_stages) ? stage.requires_stages : [],
      requires_review_pass: Boolean(hardStop?.requires_review?.length),
    };
  }
  return derived;
}

const SURFACE_ARTIFACTS = buildSurfaceArtifactSpecs({
  includeLifecycleStageContract: true,
  stageRequirements: deriveStageRequirements,
});

export function buildDeckSurfaceBundle({ contract }: PptDeckSurfaceBundleRequest): PptDeckSurfaceArtifact[] {
  return buildSurfaceBundle(contract, SURFACE_ARTIFACTS) as PptDeckSurfaceArtifact[];
}

export function listDeckSurfaceArtifactPaths(): PptDeckSurfaceArtifactPath[] {
  return listSurfaceArtifactPaths(SURFACE_ARTIFACTS) as PptDeckSurfaceArtifactPath[];
}

const SURFACE_VALIDATORS = {
  'contracts/stage-sequence.json': (content: SurfaceContract) =>
    Array.isArray(content?.stages)
    && content.stages.length > 0
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'storyline')
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'visual_director_review'),
  'contracts/stage-requirements.json': (content: SurfaceContract) =>
    validateSurfaceRequirements(content, [
      { path: 'author_image_pages.requires_artifacts', includes: 'slide_blueprint' },
      { path: 'author_image_pages.requires_artifacts', includes: 'visual_direction' },
      { path: 'repair_image_pages.requires_artifacts', includes: 'author_image_pages' },
      { path: 'screenshot_review.requires_artifacts', includes: 'visual_director_review' },
      { path: 'export_pptx.requires_review_pass', equals: true },
    ]),
  'contracts/lifecycle-stage-contract.json': (content: SurfaceContract) =>
    content?.stage_model === 'direct_delivery_human_workline'
    && Array.isArray(content?.human_workline)
    && content.human_workline.join(',') === 'source_readiness,storyline,plan,visual,delivery'
    && content?.human_to_macro_stage?.plan === 'story_architecture'
    && content?.human_to_macro_stage?.visual === 'visual_authorship'
    && content?.human_to_macro_stage?.delivery === 'delivery_packaging'
    && content?.review_overlay_within === 'visual'
    && content?.operator_handoff_within === 'delivery'
    && content?.closeout_within === 'delivery'
    && content?.route_to_human_stage?.detailed_outline === 'plan'
    && content?.route_to_human_stage?.slide_blueprint === 'plan'
    && content?.route_to_human_stage?.export_pptx === 'delivery',
  'contracts/prompt-pack.json': (content: SurfaceContract) =>
    typeof content?.root === 'string'
    && content.root === 'prompts/ppt_deck'
    && content.routes.author_image_pages === 'prompts/ppt_deck/author_image_pages.md'
    && typeof content?.routes?.render_html === 'string'
    && content.routes.render_html === 'prompts/ppt_deck/render_html.md'
    && content.routes.author_pptx_native === 'prompts/ppt_deck/author_pptx_native.md'
    && content.routes.repair_image_pages === 'prompts/ppt_deck/repair_image_pages.md'
    && content.routes.repair_pptx_native === 'prompts/ppt_deck/repair_pptx_native.md'
    && typeof content?.routes?.visual_director_review === 'string'
    && content.routes.visual_director_review === 'prompts/ppt_deck/director_review.md'
    && content.stages.author_image_pages?.file === 'author_image_pages.md'
    && typeof content?.stages?.render_html?.file === 'string'
    && content.stages.render_html.file === 'render_html.md'
    && content.stages.author_pptx_native?.file === 'author_pptx_native.md'
    && content.stages.repair_image_pages?.file === 'repair_image_pages.md'
    && content.stages.repair_pptx_native?.file === 'repair_pptx_native.md'
    && typeof content?.stages?.visual_director_review?.file === 'string'
    && content.stages.visual_director_review.file === 'director_review.md'
    && content?.render_contract?.render_strategy === 'image_first_page_authoring'
    && content.render_contract.default_visual_route === 'author_image_pages'
    && content.render_contract.image_page_authoring_lane?.status === 'production_default'
    && content.render_contract.image_page_authoring_lane?.default_enabled === true
    && content.render_contract.image_page_authoring_lane?.style_reference_dir_input === 'delivery_request.style_reference_dir'
    && content.render_contract.image_page_authoring_lane?.provider_diagnostics_surface === 'image_provider_diagnostics'
    && content.render_contract.image_page_authoring_lane?.fact_governance?.fact_whitelist_surface === 'shared_source_truth.readable_shared_source_truth_fields'
    && content.render_contract.image_page_authoring_lane?.fact_governance?.verification_ledger_surface === 'reports/fact-verification-ledger.json'
    && Array.isArray(content.render_contract.image_page_authoring_lane?.fact_governance?.forbidden_generated_artifacts)
    && content.render_contract.image_page_authoring_lane.fact_governance.forbidden_generated_artifacts.includes('fake QR code')
    && content.render_contract.image_page_authoring_lane?.verified_asset_overlay_policy?.deterministic_overlay_only === true
    && content.render_contract.image_page_authoring_lane?.verified_asset_overlay_policy?.composition_repair_allowed === false
    && content.render_contract.image_page_authoring_lane?.long_deck_production_contract?.contract_id === 'ppt_image_first_long_deck_production_v1'
    && content.render_contract.image_page_authoring_lane?.long_deck_production_contract?.full_long_deck_default_regression === false
    && content.render_contract.image_page_authoring_lane?.long_deck_production_contract?.line_divergence_policy?.image_route_is_not_html_skin === true
    && content.render_contract.image_page_authoring_lane?.long_deck_production_contract?.rejected_repair_route_policy?.rejected_route_provenance_required === true
    && content.render_contract.image_page_authoring_lane?.audience_language_policy?.visible_operator_language_allowed === false
    && content.render_contract.image_page_authoring_lane?.audience_language_policy?.forbidden_visible_fragments?.includes('汇报讨论用途')
    && content.render_contract.image_page_authoring_lane?.layout_legibility_policy?.title_safe_zone_clear?.required === true
    && content.render_contract.image_page_authoring_lane?.layout_legibility_policy?.table_legibility?.min_body_font_pt === 11
    && content.render_contract.html_authoring_lane?.status === 'production_selectable_optional'
    && content.render_contract.html_authoring_lane?.default_enabled === false
    && content.render_contract.html_authoring_lane?.explicit_selection_required === true
    && content.render_contract.native_ppt_proof_lane?.status === 'production_selectable_optional'
    && content.render_contract.native_ppt_proof_lane?.default_enabled === false
    && content.render_contract.native_ppt_proof_lane?.production_selectable === true
    && Array.isArray(content.render_contract.native_ppt_proof_lane?.replaces_routes)
    && content.render_contract.native_ppt_proof_lane.replaces_routes.join(',') === 'author_image_pages,repair_image_pages'
    && Array.isArray(content.render_contract.native_ppt_proof_lane?.legacy_html_replaces_routes)
    && content.render_contract.native_ppt_proof_lane.legacy_html_replaces_routes.join(',') === 'render_html,fix_html'
    && Array.isArray(content.render_contract.native_ppt_proof_lane?.preserved_gates)
    && content.render_contract.native_ppt_proof_lane.preserved_gates.join(',') === 'visual_director_review,screenshot_review,export_pptx'
    && content.render_contract.native_ppt_proof_lane?.review_input_surface === 'rendered_pptx_screenshots'
    && content.render_contract.native_ppt_proof_lane?.engine_capabilities?.authoring_ir === 'redcube_svg_ir'
    && content.render_contract.native_ppt_proof_lane?.engine_capabilities?.pptx_writer === 'officecli_pptx_materializer'
    && content.render_contract.native_ppt_proof_lane?.officecli_materializer_policy?.skill_authoring_loop_adopted === false
    && content.render_contract.native_ppt_proof_lane?.officecli_materializer_policy?.current_pptx_writer === 'officecli_pptx_materializer'
    && content.render_contract.native_ppt_proof_lane?.officecli_materializer_policy?.view_issues_required === true
    && content.render_contract.native_ppt_proof_lane?.officecli_materializer_policy?.true_render_proof_substitute_allowed === false
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.required === true
    && content.render_contract.native_ppt_proof_lane?.engine_capabilities?.true_render_proof_renderer === 'libreoffice_headless'
    && content.render_contract.native_ppt_proof_lane?.engine_capabilities?.cross_platform_render_required === true
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.source_surface_kind === 'native_pptx'
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.renderer_selection_policy === 'capability_probe_auto_bootstrap'
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.user_preinstalled_libreoffice_required === false
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.renderer_kind === 'libreoffice_headless'
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.renderer_pipeline === 'libreoffice_headless_pdf_png_v1'
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.runtime === 'libreoffice_headless'
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.cross_platform_render_required === true
    && Array.isArray(content.render_contract.native_ppt_proof_lane?.true_render_proof?.supported_renderers)
    && content.render_contract.native_ppt_proof_lane.true_render_proof.supported_renderers[0]?.renderer_pipeline === 'libreoffice_headless_pdf_png_v1'
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.bootstrap_policy?.repo_owned_installer === 'tools/native-ppt-proof/install-deps.sh'
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.fail_closed_blocker?.typed_blocker === 'missing_renderer_dependency'
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.html_render_substitute_allowed === false
    && content.render_contract.native_ppt_proof_lane?.true_render_proof?.officecli_validate_substitute_allowed === false
    && Array.isArray(content.render_contract.selectable_explicit_routes)
    && content.render_contract.selectable_explicit_routes.join(',') === 'render_html,fix_html,author_pptx_native,repair_pptx_native'
    && content.render_contract.explicit_route_policy === 'html_and_native_routes_require_operator_selection'
    && content?.render_contract?.shell_file === 'render_shell.html'
    && typeof content?.render_contract?.recipe_registry?.default === 'string',
  'contracts/review-surface.json': (content: SurfaceContract) =>
    validateSurfaceRequirements(content, [
      { path: 'required_checks', nonEmptyArray: true },
      { path: 'required_checks', includes: 'director_intent_landed' },
      { path: 'required_checks', includes: 'anti_template_ok' },
      { path: 'required_checks', includes: 'external_audience_language_ok' },
      { path: 'required_checks', includes: 'title_safe_zone_clear' },
      { path: 'required_checks', includes: 'table_legibility_ok' },
      { path: 'required_checks', includes: 'layout_density_ok' },
      { path: 'rerun_from_stage', object: true },
      { path: 'rerun_from_stage.overflow_free', equals: 'repair_image_pages' },
      { path: 'rerun_from_stage.director_intent_landed', equals: 'visual_director_review' },
      { path: 'rerun_from_stage.anti_template_ok', equals: 'visual_director_review' },
    ]),
  'contracts/layout-rules.json': (content: SurfaceContract) =>
    validateSurfaceRequirements(content, [
      { path: 'density_mode', nonEmptyString: true },
      { path: 'structured_families_require_anchor', nonEmptyArray: true },
      { path: 'evidence_surface_rules.require_public_source_label', equals: true },
    ]),
  'contracts/baseline-policy.json': validateBaselinePolicySurface,
  'contracts/export-bundle.json': (content: SurfaceContract) =>
    typeof content?.bundle_id === 'string'
    && content.bundle_id.length > 0
    && typeof content?.include_pptx === 'boolean',
  'contracts/delivery-contract.json': (content: SurfaceContract) =>
    validateDeliveryContractSurface(content, {
      requiredExportRoute: 'export_pptx',
      projectionModel: 'direct_delivery',
      humanGateRequired: false,
    }),
  'contracts/governance-surface.json': (content: SurfaceContract) =>
    validateGovernanceSurfaceArtifact(content, {
      overlay: 'ppt_deck',
      familyKind: 'direct_delivery_capable',
    }),
  'contracts/hydrated-deliverable.json': (content: SurfaceContract) =>
    typeof content?.profile_id === 'string'
    && content.profile_id.length > 0
    && Array.isArray(content?.stage_sequence?.stages)
    && content.stage_sequence.stages.length > 0
    && content.stage_sequence.stages.some((stage: SurfaceContract) => stage?.stage_id === 'visual_director_review')
    && typeof content?.export_bundle?.bundle_id === 'string'
    && content?.lifecycle_stage_contract?.stage_model === 'direct_delivery_human_workline'
    && content?.lifecycle_stage_contract?.route_to_human_stage?.detailed_outline === 'plan'
    && validateHydratedDeliverableSurface(content, { requiredExportRoute: 'export_pptx' }),
  'views/display-registry.json': (content: SurfaceContract) =>
    validateDisplayRegistrySurface(content, [
      'source_index',
      'author_image_pages',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ]),
};

export function validateDeckSurfaceArtifact(
  relativePath: PptDeckSurfaceArtifactPath,
  content: unknown,
): boolean {
  return validateSurfaceArtifact({
    family: 'deck',
    validators: SURFACE_VALIDATORS,
    relativePath,
    content,
  });
}
