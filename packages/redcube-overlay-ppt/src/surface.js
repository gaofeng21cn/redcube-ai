export function buildDeckSurfaceBundle({ contract }) {
  return [
    {
      relativePath: 'contracts/stage-sequence.json',
      content: contract.stage_sequence,
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
