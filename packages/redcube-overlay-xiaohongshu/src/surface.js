export function buildXiaohongshuSurfaceBundle({ contract }) {
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

export function listXiaohongshuSurfaceArtifactPaths() {
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
    && content.stages.some((stage) => stage?.stage_id === 'research')
    && content.stages.some((stage) => stage?.stage_id === 'note'),
  'contracts/review-surface.json': (content) =>
    Array.isArray(content?.required_checks)
    && content.required_checks.includes('platform_copy_complete')
    && content.rerun_from_stage
    && typeof content.rerun_from_stage === 'object',
  'contracts/layout-rules.json': (content) =>
    typeof content?.density_mode === 'string'
    && content.density_mode.length > 0
    && typeof content?.max_cards_per_note === 'number',
  'contracts/baseline-policy.json': (content) =>
    content?.modes?.draft_new?.baseline_required === false
    && content?.modes?.optimize_existing?.baseline_required === true,
  'contracts/export-bundle.json': (content) =>
    typeof content?.bundle_id === 'string'
    && content.bundle_id.length > 0
    && content?.include_publish_manifest === true,
  'contracts/hydrated-deliverable.json': (content) =>
    content?.overlay === 'xiaohongshu'
    && content?.profile_id === 'standard_note'
    && Array.isArray(content?.stage_sequence?.stages),
  'views/display-registry.json': (content) =>
    Array.isArray(content?.surfaces)
    && content.surfaces.some((surface) => surface?.id === 'source_index')
    && content.surfaces.some((surface) => surface?.id === 'storyline')
    && content.surfaces.some((surface) => surface?.id === 'note'),
};

export function validateXiaohongshuSurfaceArtifact(relativePath, content) {
  const validator = SURFACE_VALIDATORS[relativePath];
  if (!validator) {
    throw new Error(`Unknown xiaohongshu surface artifact: ${relativePath}`);
  }

  return Boolean(validator(content));
}
