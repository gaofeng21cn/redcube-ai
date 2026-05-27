import {
  buildGovernanceSurfaceContract,
  validateGovernanceSurfaceContract,
} from '@redcube/overlay-core';

type SurfaceContract = Record<string, any>;
type SurfaceValidator = (content: SurfaceContract) => boolean;

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

export function buildDeckSurfaceBundle({ contract }: { contract: SurfaceContract }) {
  return [
    {
      relativePath: 'contracts/stage-sequence.json',
      content: contract.stage_sequence,
    },
    {
      relativePath: 'contracts/stage-requirements.json',
      content: deriveStageRequirements(contract),
    },
    {
      relativePath: 'contracts/lifecycle-stage-contract.json',
      content: contract.lifecycle_stage_contract,
    },
    {
      relativePath: 'contracts/prompt-pack.json',
      content: contract.prompt_pack,
    },
    {
      relativePath: 'contracts/review-surface.json',
      content: contract.review_surface,
    },
    {
      relativePath: 'contracts/layout-rules.json',
      content: contract.layout_rules,
    },
    {
      relativePath: 'contracts/baseline-policy.json',
      content: contract.baseline_policy,
    },
    {
      relativePath: 'contracts/export-bundle.json',
      content: contract.export_bundle,
    },
    {
      relativePath: 'contracts/delivery-contract.json',
      content: contract.delivery_contract,
    },
    {
      relativePath: 'contracts/governance-surface.json',
      content: buildGovernanceSurfaceContract(contract),
    },
    {
      relativePath: 'contracts/hydrated-deliverable.json',
      content: contract,
    },
    {
      relativePath: 'views/display-registry.json',
      content: contract.display_registry,
    },
  ];
}

export function listDeckSurfaceArtifactPaths() {
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

const SURFACE_VALIDATORS: Record<string, SurfaceValidator> = {
  'contracts/stage-sequence.json': (content: SurfaceContract) =>
    Array.isArray(content?.stages)
    && content.stages.length > 0
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'storyline')
    && content.stages.some((stage: SurfaceContract) => stage?.stage_id === 'visual_director_review'),
  'contracts/stage-requirements.json': (content: SurfaceContract) =>
    Array.isArray(content?.author_image_pages?.requires_artifacts)
    && content.author_image_pages.requires_artifacts.includes('slide_blueprint')
    && content.author_image_pages.requires_artifacts.includes('visual_direction')
    && Array.isArray(content?.repair_image_pages?.requires_artifacts)
    && content.repair_image_pages.requires_artifacts.includes('author_image_pages')
    && Array.isArray(content?.screenshot_review?.requires_artifacts)
    && content.screenshot_review.requires_artifacts.includes('visual_director_review')
    && content.export_pptx?.requires_review_pass === true,
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
    && content.render_contract.native_ppt_proof_lane?.engine_capabilities?.pptx_writer === 'redcube_drawingml_writer'
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
    Array.isArray(content?.required_checks)
    && content.required_checks.length > 0
    && content.required_checks.includes('director_intent_landed')
    && content.required_checks.includes('anti_template_ok')
    && content.required_checks.includes('external_audience_language_ok')
    && content.required_checks.includes('title_safe_zone_clear')
    && content.required_checks.includes('table_legibility_ok')
    && content.required_checks.includes('layout_density_ok')
    && content.rerun_from_stage
    && typeof content.rerun_from_stage === 'object'
    && content.rerun_from_stage.overflow_free === 'repair_image_pages'
    && content.rerun_from_stage.director_intent_landed === 'visual_director_review'
    && content.rerun_from_stage.anti_template_ok === 'visual_director_review',
  'contracts/layout-rules.json': (content: SurfaceContract) =>
    typeof content?.density_mode === 'string'
    && content.density_mode.length > 0
    && Array.isArray(content?.structured_families_require_anchor)
    && content.structured_families_require_anchor.length > 0
    && content.evidence_surface_rules?.require_public_source_label === true,
  'contracts/baseline-policy.json': (content: SurfaceContract) =>
    content?.modes?.draft_new?.baseline_required === false
    && content?.modes?.optimize_existing?.baseline_required === true,
  'contracts/export-bundle.json': (content: SurfaceContract) =>
    typeof content?.bundle_id === 'string'
    && content.bundle_id.length > 0
    && typeof content?.include_pptx === 'boolean',
  'contracts/delivery-contract.json': (content: SurfaceContract) =>
    content?.authoritative_projection_surface === 'getPublicationProjection'
    && content?.authoritative_review_surface === 'getReviewState'
    && content?.required_export_route === 'export_pptx'
    && typeof content?.required_export_bundle_id === 'string'
    && content.required_export_bundle_id.length > 0
    && content?.projection_model === 'direct_delivery'
    && content?.human_gate?.required === false
    && content?.operator_handoff?.owner_surface === 'required_export_artifact.delivery_state'
    && content?.operator_handoff?.handoff_ready_state === 'output_ready'
    && Array.isArray(content?.operator_handoff?.gate_surfaces)
    && content.operator_handoff.gate_surfaces.includes('auditDeliverable')
    && content.operator_handoff.gate_surfaces.includes('runtimeWatch')
    && content.operator_handoff.reopen_mutation_surface === 'request_changes'
    && content.operator_handoff.closeout_mutation_surface === 'promote_baseline',
  'contracts/governance-surface.json': (content: SurfaceContract) =>
    validateGovernanceSurfaceContract(content)
    && content?.family_boundary?.family_kind === 'direct_delivery_capable'
    && content?.family_boundary?.overlay === 'ppt_deck',
  'contracts/hydrated-deliverable.json': (content: SurfaceContract) =>
    typeof content?.profile_id === 'string'
    && content.profile_id.length > 0
    && Array.isArray(content?.stage_sequence?.stages)
    && content.stage_sequence.stages.length > 0
    && content.stage_sequence.stages.some((stage: SurfaceContract) => stage?.stage_id === 'visual_director_review')
    && typeof content?.export_bundle?.bundle_id === 'string'
    && content?.lifecycle_stage_contract?.stage_model === 'direct_delivery_human_workline'
    && content?.lifecycle_stage_contract?.route_to_human_stage?.detailed_outline === 'plan'
    && content?.source_truth_contract?.authoritative_surface === 'shared_source_truth'
    && content?.source_truth_contract?.route_gate_rule === 'authoritative_fail_closed_in_audit_and_runtime_watch'
    && content?.delivery_contract?.required_export_route === 'export_pptx',
  'views/display-registry.json': (content: SurfaceContract) =>
    Array.isArray(content?.surfaces)
    && content.surfaces.some((surface: SurfaceContract) => surface?.id === 'source_index')
    && content.surfaces.some((surface: SurfaceContract) => surface?.id === 'author_image_pages')
    && content.surfaces.some((surface: SurfaceContract) => surface?.id === 'visual_director_review')
    && content.surfaces.some((surface: SurfaceContract) => surface?.id === 'screenshot_review')
    && content.surfaces.some((surface: SurfaceContract) => surface?.id === 'export_pptx'),
};

export function validateDeckSurfaceArtifact(relativePath: string, content: unknown): boolean {
  const validator = SURFACE_VALIDATORS[relativePath];
  if (!validator) {
    throw new Error(`Unknown deck surface artifact: ${relativePath}`);
  }

  return Boolean(validator(content as SurfaceContract));
}
