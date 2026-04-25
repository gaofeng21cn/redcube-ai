import {
  buildGovernanceSurfaceContract,
  validateGovernanceSurfaceContract,
} from '@redcube/overlay-core';

function deriveStageRequirements(contract) {
  if (contract?.stage_requirements) {
    return contract.stage_requirements;
  }
  const stages = Array.isArray(contract?.stage_sequence?.stages)
    ? contract.stage_sequence.stages
    : [];
  const hardStops = Array.isArray(contract?.stage_sequence?.hard_stops)
    ? contract.stage_sequence.hard_stops
    : [];
  const derived = {};
  for (const stage of stages) {
    const hardStop = hardStops.find((item) => item?.stage_id === stage?.stage_id) || null;
    derived[stage.stage_id] = {
      requires_artifacts: Array.isArray(stage?.requires_stages) ? stage.requires_stages : [],
      requires_review_pass: Boolean(hardStop?.requires_review?.length),
    };
  }
  return derived;
}

export function buildDeckSurfaceBundle({ contract }) {
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

const SURFACE_VALIDATORS = {
  'contracts/stage-sequence.json': (content) =>
    Array.isArray(content?.stages)
    && content.stages.length > 0
    && content.stages.some((stage) => stage?.stage_id === 'storyline')
    && content.stages.some((stage) => stage?.stage_id === 'visual_director_review'),
  'contracts/stage-requirements.json': (content) =>
    Array.isArray(content?.render_html?.requires_artifacts)
    && content.render_html.requires_artifacts.includes('slide_blueprint')
    && content.render_html.requires_artifacts.includes('visual_direction')
    && Array.isArray(content?.screenshot_review?.requires_artifacts)
    && content.screenshot_review.requires_artifacts.includes('visual_director_review')
    && content.export_pptx?.requires_review_pass === true,
  'contracts/lifecycle-stage-contract.json': (content) =>
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
  'contracts/prompt-pack.json': (content) =>
    typeof content?.root === 'string'
    && content.root === 'prompts/ppt_deck'
    && typeof content?.routes?.render_html === 'string'
    && content.routes.render_html === 'prompts/ppt_deck/render_html.md'
    && content.routes.author_pptx_native === 'prompts/ppt_deck/author_pptx_native.md'
    && content.routes.repair_pptx_native === 'prompts/ppt_deck/repair_pptx_native.md'
    && typeof content?.routes?.visual_director_review === 'string'
    && content.routes.visual_director_review === 'prompts/ppt_deck/director_review.md'
    && typeof content?.stages?.render_html?.file === 'string'
    && content.stages.render_html.file === 'render_html.md'
    && content.stages.author_pptx_native?.file === 'author_pptx_native.md'
    && content.stages.repair_pptx_native?.file === 'repair_pptx_native.md'
    && typeof content?.stages?.visual_director_review?.file === 'string'
    && content.stages.visual_director_review.file === 'director_review.md'
    && content?.render_contract?.render_strategy === 'prompt_director_first'
    && content.render_contract.default_visual_route === 'render_html'
    && content.render_contract.native_ppt_proof_lane?.status === 'opt_in_proof_lane'
    && content.render_contract.native_ppt_proof_lane?.default_enabled === false
    && Array.isArray(content.render_contract.native_ppt_proof_lane?.replaces_routes)
    && content.render_contract.native_ppt_proof_lane.replaces_routes.join(',') === 'render_html,fix_html'
    && Array.isArray(content.render_contract.native_ppt_proof_lane?.preserved_gates)
    && content.render_contract.native_ppt_proof_lane.preserved_gates.join(',') === 'visual_director_review,screenshot_review,export_pptx'
    && content.render_contract.native_ppt_proof_lane?.review_input_surface === 'rendered_pptx_screenshots'
    && content?.render_contract?.shell_file === 'render_shell.html'
    && typeof content?.render_contract?.recipe_registry?.default === 'string',
  'contracts/review-surface.json': (content) =>
    Array.isArray(content?.required_checks)
    && content.required_checks.length > 0
    && content.required_checks.includes('director_intent_landed')
    && content.required_checks.includes('anti_template_ok')
    && content.rerun_from_stage
    && typeof content.rerun_from_stage === 'object'
    && content.rerun_from_stage.director_intent_landed === 'visual_director_review'
    && content.rerun_from_stage.anti_template_ok === 'visual_director_review',
  'contracts/layout-rules.json': (content) =>
    typeof content?.density_mode === 'string'
    && content.density_mode.length > 0
    && Array.isArray(content?.structured_families_require_anchor)
    && content.structured_families_require_anchor.length > 0
    && content.evidence_surface_rules?.require_public_source_label === true,
  'contracts/baseline-policy.json': (content) =>
    content?.modes?.draft_new?.baseline_required === false
    && content?.modes?.optimize_existing?.baseline_required === true,
  'contracts/export-bundle.json': (content) =>
    typeof content?.bundle_id === 'string'
    && content.bundle_id.length > 0
    && typeof content?.include_pptx === 'boolean',
  'contracts/delivery-contract.json': (content) =>
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
  'contracts/governance-surface.json': (content) =>
    validateGovernanceSurfaceContract(content)
    && content?.family_boundary?.family_kind === 'direct_delivery_capable'
    && content?.family_boundary?.overlay === 'ppt_deck',
  'contracts/hydrated-deliverable.json': (content) =>
    typeof content?.profile_id === 'string'
    && content.profile_id.length > 0
    && Array.isArray(content?.stage_sequence?.stages)
    && content.stage_sequence.stages.length > 0
    && content.stage_sequence.stages.some((stage) => stage?.stage_id === 'visual_director_review')
    && typeof content?.export_bundle?.bundle_id === 'string'
    && content?.lifecycle_stage_contract?.stage_model === 'direct_delivery_human_workline'
    && content?.lifecycle_stage_contract?.route_to_human_stage?.detailed_outline === 'plan'
    && content?.source_truth_contract?.authoritative_surface === 'shared_source_truth'
    && content?.source_truth_contract?.route_gate_rule === 'authoritative_fail_closed_in_audit_and_runtime_watch'
    && content?.delivery_contract?.required_export_route === 'export_pptx',
  'views/display-registry.json': (content) =>
    Array.isArray(content?.surfaces)
    && content.surfaces.some((surface) => surface?.id === 'source_index')
    && content.surfaces.some((surface) => surface?.id === 'visual_director_review')
    && content.surfaces.some((surface) => surface?.id === 'screenshot_review')
    && content.surfaces.some((surface) => surface?.id === 'export_pptx'),
};

export function validateDeckSurfaceArtifact(relativePath, content) {
  const validator = SURFACE_VALIDATORS[relativePath];
  if (!validator) {
    throw new Error(`Unknown deck surface artifact: ${relativePath}`);
  }

  return Boolean(validator(content));
}
