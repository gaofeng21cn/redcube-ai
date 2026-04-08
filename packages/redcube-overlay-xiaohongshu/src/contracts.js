import { buildDeliverableRecord } from '@redcube/overlay-core';

const SOURCE_TRUTH_CONSUMPTION_FIELDS = Object.freeze([
  'authoritative_source_kind',
  'consumption_role',
  'input_mode',
  'confidence',
  'material_count',
  'material_ids',
  'source_labels',
  'source_audit_status',
  'source_audit_blocking_reasons',
]);

const SOURCE_TRUTH_FIELD_WHITELIST = Object.freeze({
  source_index: ['sources[].status', 'sources[].relative_path', 'sources[].kind'],
  extracted_materials: ['materials[].material_id', 'materials[].excerpt', 'materials[].content_text'],
  source_brief: ['brief_text', 'input_mode', 'confidence'],
});

const XIAOHONGSHU_SOURCE_TRUTH_CONTRACT = Object.freeze({
  authoritative_surface: 'shared_source_truth',
  authoritative_gate: 'topics/<topic>/canonical/source-audit.json',
  authoritative_artifacts: ['source_index', 'extracted_materials', 'source_audit', 'source_brief'],
  route_gate_rule: 'authoritative_fail_closed_in_audit_and_runtime_watch',
  hydration_model: {
    hydrated_contract_surface: 'contracts/hydrated-deliverable.json',
    runtime_injection_surface: 'shared_source_truth',
    static_contract_written_at_create_deliverable: true,
  },
  readable_shared_source_truth_fields: SOURCE_TRUTH_FIELD_WHITELIST,
  consumption_summary_fields: SOURCE_TRUTH_CONSUMPTION_FIELDS,
  route_to_consumption_role: {
    research: 'source_readiness',
    storyline: 'story_architecture',
    single_note_plan: 'story_architecture',
    visual_direction: 'visual_authorship',
  },
  required_hydrated_export_surface: 'export_bundle',
});

const XIAOHONGSHU_DELIVERY_CONTRACT = Object.freeze({
  authoritative_projection_surface: 'getPublicationProjection',
  authoritative_review_surface: 'getReviewState',
  required_export_route: 'export_bundle',
  required_export_bundle_id: 'xiaohongshu_standard_bundle',
  export_artifact_field: 'export_bundle',
  delivery_state_field: 'export_bundle.delivery_state',
  projection_model: 'human_publication',
  human_gate: {
    required: true,
    mutation_surfaces: ['approve_publish', 'promote_publish'],
  },
  projection_states: {
    ready_for_export: 'approval_pending',
    output_ready: 'approval_pending',
    approved: 'approved_pending_publish',
    published: 'published',
  },
});

const STAGE_SEQUENCE = {
  flow_id: 'xiaohongshu_official_flow',
  stages: [
    { stage_id: 'research', prompt_file: 'research.md', output_artifact: 'research.json', requires_stages: [] },
    { stage_id: 'storyline', prompt_file: 'storyline.md', output_artifact: 'storyline.json', requires_stages: ['research'] },
    { stage_id: 'single_note_plan', prompt_file: 'single_note_plan.md', output_artifact: 'single_note_plan.json', requires_stages: ['storyline'] },
    { stage_id: 'visual_direction', prompt_file: 'visual_direction.md', output_artifact: 'visual_direction.json', requires_stages: ['single_note_plan'] },
    { stage_id: 'render_html', prompt_file: 'render_html.md', output_artifact: 'render_bundle.json', requires_stages: ['single_note_plan', 'visual_direction'] },
    { stage_id: 'visual_director_review', prompt_file: 'director_review.md', output_artifact: 'director_review.json', requires_stages: ['render_html'] },
    { stage_id: 'screenshot_review', prompt_file: 'screenshot_review.md', output_artifact: 'quality_gate.json', requires_stages: ['visual_director_review'] },
    { stage_id: 'publish_copy', prompt_file: 'publish_copy.md', output_artifact: 'publish_copy.json', requires_stages: ['screenshot_review'] },
    { stage_id: 'export_bundle', prompt_file: 'export_bundle.md', output_artifact: 'publish_bundle.json', requires_stages: ['publish_copy'] },
  ],
  hard_stops: [
    {
      stage_id: 'render_html',
      requires_stage_outputs: ['single_note_plan', 'visual_direction'],
      rerun_from_stage: 'single_note_plan',
    },
    {
      stage_id: 'screenshot_review',
      requires_review: ['visual_director_review'],
      rerun_from_stage: 'visual_director_review',
    },
    {
      stage_id: 'publish_copy',
      requires_review: ['screenshot_review'],
      rerun_from_stage: 'screenshot_review',
    },
    {
      stage_id: 'export_bundle',
      requires_review: ['publish_copy'],
      rerun_from_stage: 'publish_copy',
    },
  ],
};

const STAGE_REQUIREMENTS = {
  research: { requires_artifacts: [] },
  storyline: { requires_artifacts: ['research'] },
  single_note_plan: { requires_artifacts: ['storyline'] },
  visual_direction: { requires_artifacts: ['single_note_plan'] },
  render_html: { requires_artifacts: ['single_note_plan', 'visual_direction'] },
  visual_director_review: { requires_artifacts: ['render_html'] },
  screenshot_review: { requires_artifacts: ['visual_director_review'] },
  publish_copy: { requires_artifacts: ['screenshot_review'], requires_review_pass: true },
  export_bundle: { requires_artifacts: ['publish_copy'], requires_review_pass: true },
};

const REVIEW_SURFACE = {
  required_checks: [
    'overflow_free',
    'occlusion_free',
    'visual_density_ok',
    'cover_density_ok',
    'director_intent_landed',
    'anti_template_ok',
    'platform_copy_complete',
    'cta_clear',
  ],
  artifact_stage: 'screenshot_review',
  artifact_file: 'quality_gate.json',
  conditional_checks: {
    optimize_existing: ['baseline_comparison_passed'],
  },
  rerun_from_stage: {
    overflow_free: 'render_html',
    occlusion_free: 'render_html',
    visual_density_ok: 'visual_direction',
    cover_density_ok: 'single_note_plan',
    director_intent_landed: 'visual_director_review',
    anti_template_ok: 'visual_director_review',
    platform_copy_complete: 'publish_copy',
    cta_clear: 'publish_copy',
    baseline_comparison_passed: 'visual_direction',
  },
};

const LAYOUT_RULES = {
  density_mode: 'mobile_note_stack',
  canvas: {
    ratio: '3:4',
    width: 448,
    height: 597,
    scrollbars_forbidden: true,
  },
  max_primary_points_per_slide: 4,
  slides_data_rule: 'independent_content',
  forbidden_template_routes: ['renderSlide', 'layoutByType', 'cardsGrid', 'pageType'],
  forbid_external_images: true,
  forbid_left_right_compare: true,
  require_cover_hook: true,
  require_public_source_label: true,
};

const BASELINE_POLICY = {
  modes: {
    draft_new: { baseline_required: false },
    optimize_existing: {
      baseline_required: true,
      approved_baseline_only: true,
      required_review: 'baseline_comparison_passed',
    },
  },
};

const PROMPT_PACK = {
  pack_id: 'xiaohongshu_mainline_v1',
  root: 'prompts/xiaohongshu',
  routes: {
    research: 'prompts/xiaohongshu/research.md',
    storyline: 'prompts/xiaohongshu/storyline.md',
    single_note_plan: 'prompts/xiaohongshu/single_note_plan.md',
    visual_direction: 'prompts/xiaohongshu/visual_direction.md',
    render_html: 'prompts/xiaohongshu/render_html.md',
    visual_director_review: 'prompts/xiaohongshu/director_review.md',
    screenshot_review: 'prompts/xiaohongshu/screenshot_review.md',
    publish_copy: 'prompts/xiaohongshu/publish_copy.md',
    export_bundle: 'prompts/xiaohongshu/export_bundle.md',
  },
  stages: {
    research: { file: 'research.md' },
    storyline: { file: 'storyline.md' },
    single_note_plan: { file: 'single_note_plan.md' },
    visual_direction: { file: 'visual_direction.md' },
    render_html: { file: 'render_html.md' },
    visual_director_review: { file: 'director_review.md' },
    screenshot_review: { file: 'screenshot_review.md' },
    publish_copy: { file: 'publish_copy.md' },
    export_bundle: { file: 'export_bundle.md' },
  },
  render_contract: {
    render_strategy: 'prompt_director_first',
    shell_file: 'render_shell.html',
    recipe_registry: {
      cover_note: 'xhs.hero_note',
      myth_compare: 'xhs.split_contrast',
      sequence_stack: 'xhs.staggered_steps',
      process_track: 'xhs.track_rail',
      evidence_strip: 'xhs.evidence_bands',
      action_checklist: 'xhs.checklist_close',
      default: 'xhs.annotated_cards',
    },
  },
};

const EXPORT_BUNDLE = {
  bundle_id: 'xiaohongshu_standard_bundle',
  include_cover_assets: true,
  include_caption: true,
  include_publish_manifest: true,
  review_required_before_export: true,
};

const DISPLAY_REGISTRY = {
  surfaces: [
    { id: 'source_index', kind: 'research_surface', required_when: 'always' },
    { id: 'storyline', kind: 'stage_artifact', required_when: 'always' },
    { id: 'single_note_plan', kind: 'stage_artifact', required_when: 'always' },
    { id: 'visual_direction', kind: 'stage_artifact', required_when: 'always' },
    { id: 'render_html', kind: 'render_output', required_when: 'always' },
    { id: 'visual_director_review', kind: 'review_output', required_when: 'always' },
    { id: 'screenshot_review', kind: 'review_output', required_when: 'always' },
    { id: 'publish_copy', kind: 'publish_copy', required_when: 'always' },
    { id: 'export_bundle', kind: 'delivery_bundle', required_when: 'approved_for_export' },
    { id: 'series_publish_cadence', kind: 'series_surface', required_when: 'series_mode' },
    { id: 'path_mapping', kind: 'series_surface', required_when: 'series_mode' },
    { id: 'delivery_overview', kind: 'series_surface', required_when: 'series_mode' },
  ],
};

const LIFECYCLE_MODEL = {
  macro_lifecycle: [
    'source_readiness',
    'story_architecture',
    'visual_authorship',
    'delivery_packaging',
  ],
  route_to_stage: {
    research: 'source_readiness',
    storyline: 'story_architecture',
    single_note_plan: 'story_architecture',
    visual_direction: 'visual_authorship',
    render_html: 'visual_authorship',
    publish_copy: 'delivery_packaging',
    export_bundle: 'delivery_packaging',
  },
  review_overlay_routes: {
    visual_director_review: 'visual_director_review',
    screenshot_review: 'screenshot_review',
  },
  research_ownership: {
    semantic_role: 'shared_source_readiness_augmentation',
    trigger_conditions: [
      'source_truth_missing_or_thin',
      'source_audit_not_sufficient',
      'task_requires_public_evidence_or_background',
      'current_source_truth_cannot_support_story_or_visual_judgement',
    ],
  },
};

export function describeXiaohongshuOverlay() {
  return {
    overlay_id: 'xiaohongshu',
    default_profile_id: 'standard_note',
    profiles: ['standard_note'],
    deliverable_kind: 'xiaohongshu_note',
    prompt_pack_id: PROMPT_PACK.pack_id,
    route_sequence: STAGE_SEQUENCE.stages.map((stage) => stage.stage_id),
    packages: {
      overlay: '@redcube/overlay-xiaohongshu',
      runtime_family: '@redcube/runtime-family-xiaohongshu',
      pack: '@redcube/pack-xiaohongshu',
    },
  };
}

export function buildTopicRecord({ topicId, title }) {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: 'xiaohongshu',
    deliverable_kind: 'xiaohongshu_note',
    status: 'draft',
    routes: STAGE_SEQUENCE.stages.map((stage) => stage.stage_id),
  };
}

export function hydrateXiaohongshuContract({
  topicId,
  deliverableId,
  title,
  goal,
  profileId = 'standard_note',
}) {
  return {
    schema_version: 1,
    overlay: 'xiaohongshu',
    profile_id: String(profileId || '').trim(),
    deliverable_kind: 'xiaohongshu_note',
    topic_id: String(topicId || '').trim(),
    deliverable_id: String(deliverableId || '').trim(),
    title: String(title || '').trim(),
    goal: String(goal || '').trim(),
    stage_sequence: STAGE_SEQUENCE,
    stage_requirements: STAGE_REQUIREMENTS,
    review_surface: REVIEW_SURFACE,
    layout_rules: LAYOUT_RULES,
    baseline_policy: BASELINE_POLICY,
    prompt_pack: PROMPT_PACK,
    export_bundle: EXPORT_BUNDLE,
    display_registry: DISPLAY_REGISTRY,
    lifecycle_model: LIFECYCLE_MODEL,
    source_truth_contract: XIAOHONGSHU_SOURCE_TRUTH_CONTRACT,
    delivery_contract: XIAOHONGSHU_DELIVERY_CONTRACT,
  };
}

export function buildXiaohongshuDeliverableRecord({
  topicId,
  deliverableId,
  title,
  goal,
  profileId,
  hydratedContract,
}) {
  const contract = hydratedContract || hydrateXiaohongshuContract({
    topicId,
    deliverableId,
    title,
    goal,
    profileId,
  });
  const deliverable = buildDeliverableRecord({
    topicId,
    deliverableId,
    overlay: 'xiaohongshu',
    kind: 'xiaohongshu_note',
    title,
  });
  return {
    ...deliverable,
    deliverable_kind: 'xiaohongshu_note',
    profile_id: String(profileId || contract.profile_id || '').trim(),
    goal: String(goal || contract.goal || '').trim(),
    hydrated_contract_ref: 'contracts/hydrated-deliverable.json',
    routes: contract.stage_sequence.stages.map((stage) => stage.stage_id),
  };
}
