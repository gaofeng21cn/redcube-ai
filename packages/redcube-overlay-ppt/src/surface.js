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
    'contracts/prompt-pack.json',
    'contracts/review-surface.json',
    'contracts/layout-rules.json',
    'contracts/baseline-policy.json',
    'contracts/export-bundle.json',
    'contracts/hydrated-deliverable.json',
    'views/display-registry.json',
  ];
}

const SURFACE_VALIDATORS = {
  'contracts/stage-sequence.json': (content) =>
    Array.isArray(content?.stages)
    && content.stages.length > 0
    && content.stages.some((stage) => stage?.stage_id === 'storyline'),
  'contracts/stage-requirements.json': (content) =>
    Array.isArray(content?.render_html?.requires_artifacts)
    && content.render_html.requires_artifacts.includes('slide_blueprint')
    && content.render_html.requires_artifacts.includes('visual_direction')
    && content.export_pptx?.requires_review_pass === true,
  'contracts/prompt-pack.json': (content) =>
    typeof content?.root === 'string'
    && content.root === 'prompts/ppt_deck'
    && typeof content?.routes?.render_html === 'string'
    && content.routes.render_html === 'prompts/ppt_deck/render_html.md'
    && typeof content?.stages?.render_html?.file === 'string'
    && content.stages.render_html.file === 'render_html.md',
  'contracts/review-surface.json': (content) =>
    Array.isArray(content?.required_checks)
    && content.required_checks.length > 0
    && content.rerun_from_stage
    && typeof content.rerun_from_stage === 'object',
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
  'contracts/hydrated-deliverable.json': (content) =>
    typeof content?.profile_id === 'string'
    && content.profile_id.length > 0
    && Array.isArray(content?.stage_sequence?.stages)
    && content.stage_sequence.stages.length > 0
    && typeof content?.export_bundle?.bundle_id === 'string',
  'views/display-registry.json': (content) =>
    Array.isArray(content?.surfaces)
    && content.surfaces.some((surface) => surface?.id === 'source_index')
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
