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

const POSTER_SOURCE_TRUTH_CONTRACT = Object.freeze({
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
    storyline: 'story_architecture',
    poster_blueprint: 'story_architecture',
    visual_direction: 'visual_authorship',
  },
  required_hydrated_export_surface: 'export_bundle',
  poster_guarded_boundary: {
    profile_id: 'knowledge_poster',
    academic_contract_active: false,
  },
});

const POSTER_DELIVERY_CONTRACT = Object.freeze({
  authoritative_projection_surface: 'getPublicationProjection',
  authoritative_review_surface: 'getReviewState',
  required_export_route: 'export_bundle',
  required_export_bundle_id: 'poster_onepager_bundle',
  export_artifact_field: 'export_bundle',
  delivery_state_field: 'export_bundle.delivery_state',
  projection_model: 'direct_delivery',
  human_gate: {
    required: false,
    mutation_surfaces: [],
  },
  projection_states: {
    ready_for_export: 'export_ready',
    output_ready: 'output_ready',
  },
});

const STAGE_SEQUENCE = {
  flow_id: 'poster_onepager_mainline_flow',
  stages: [
    { stage_id: 'storyline', prompt_file: 'storyline.md', output_artifact: 'storyline.json', requires_stages: [] },
    { stage_id: 'poster_blueprint', prompt_file: 'poster_blueprint.md', output_artifact: 'poster_blueprint.json', requires_stages: ['storyline'] },
    { stage_id: 'visual_direction', prompt_file: 'visual_direction.md', output_artifact: 'visual_direction.json', requires_stages: ['poster_blueprint'] },
    { stage_id: 'render_html', prompt_file: 'render_html.md', output_artifact: 'render_bundle.json', requires_stages: ['poster_blueprint', 'visual_direction'] },
    { stage_id: 'visual_director_review', prompt_file: 'director_review.md', output_artifact: 'director_review.json', requires_stages: ['render_html'] },
    { stage_id: 'screenshot_review', prompt_file: 'screenshot_review.md', output_artifact: 'quality_gate.json', requires_stages: ['visual_director_review'] },
    { stage_id: 'export_bundle', prompt_file: 'export_bundle.md', output_artifact: 'publish_bundle.json', requires_stages: ['screenshot_review'] }
  ],
  hard_stops: [
    {
      stage_id: 'render_html',
      requires_stage_outputs: ['poster_blueprint', 'visual_direction'],
      rerun_from_stage: 'poster_blueprint'
    },
    {
      stage_id: 'screenshot_review',
      requires_review: ['visual_director_review'],
      rerun_from_stage: 'visual_director_review'
    },
    {
      stage_id: 'export_bundle',
      requires_review: ['screenshot_review'],
      rerun_from_stage: 'screenshot_review'
    }
  ]
};

const STAGE_REQUIREMENTS = {
  storyline: { requires_artifacts: [] },
  poster_blueprint: { requires_artifacts: ['storyline'] },
  visual_direction: { requires_artifacts: ['poster_blueprint'] },
  render_html: { requires_artifacts: ['poster_blueprint', 'visual_direction'] },
  visual_director_review: { requires_artifacts: ['render_html'] },
  screenshot_review: { requires_artifacts: ['visual_director_review'] },
  export_bundle: { requires_artifacts: ['screenshot_review'], requires_review_pass: true },
};

const REVIEW_SURFACE = {
  required_checks: [
    'overflow_free',
    'occlusion_free',
    'visual_density_ok',
    'director_intent_landed',
    'anti_template_ok',
    'message_hierarchy_clear',
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
    director_intent_landed: 'visual_director_review',
    anti_template_ok: 'visual_director_review',
    message_hierarchy_clear: 'poster_blueprint',
    baseline_comparison_passed: 'visual_direction',
  },
};

const LAYOUT_RULES = {
  density_mode: 'single_page_poster',
  canvas: {
    ratio: '4:5',
    width: 1080,
    height: 1350,
    scrollbars_forbidden: true,
  },
  max_primary_points_per_poster: 4,
  slides_data_rule: 'single_poster_content',
  forbidden_template_routes: ['renderSlide', 'layoutByType', 'cardsGrid', 'pageType'],
  require_public_source_label: true,
  require_single_primary_headline: true,
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
  pack_id: 'poster_onepager_mainline_v1',
  root: 'prompts/poster_onepager',
  routes: {
    storyline: 'prompts/poster_onepager/storyline.md',
    poster_blueprint: 'prompts/poster_onepager/poster_blueprint.md',
    visual_direction: 'prompts/poster_onepager/visual_direction.md',
    render_html: 'prompts/poster_onepager/render_html.md',
    visual_director_review: 'prompts/poster_onepager/director_review.md',
    screenshot_review: 'prompts/poster_onepager/screenshot_review.md',
    export_bundle: 'prompts/poster_onepager/export_bundle.md',
  },
  stages: {
    storyline: { file: 'storyline.md' },
    poster_blueprint: { file: 'poster_blueprint.md' },
    visual_direction: { file: 'visual_direction.md' },
    render_html: { file: 'render_html.md' },
    visual_director_review: { file: 'director_review.md' },
    screenshot_review: { file: 'screenshot_review.md' },
    export_bundle: { file: 'export_bundle.md' },
  },
  render_contract: {
    render_strategy: 'prompt_director_first',
    shell_file: 'render_shell.html',
    recipe_registry: {
      hero_band: 'poster.hero_band',
      evidence_columns: 'poster.evidence_columns',
      pathway_strip: 'poster.pathway_strip',
      action_footer: 'poster.action_footer',
      default: 'poster.evidence_columns',
    },
  },
};

const EXPORT_BUNDLE = {
  bundle_id: 'poster_onepager_bundle',
  include_html: true,
  include_png: true,
  include_manifest: true,
  review_required_before_export: true,
};

const DISPLAY_REGISTRY = {
  surfaces: [
    { id: 'storyline', kind: 'stage_artifact', required_when: 'always' },
    { id: 'poster_blueprint', kind: 'stage_artifact', required_when: 'always' },
    { id: 'visual_direction', kind: 'stage_artifact', required_when: 'always' },
    { id: 'render_html', kind: 'render_output', required_when: 'always' },
    { id: 'visual_director_review', kind: 'review_output', required_when: 'always' },
    { id: 'screenshot_review', kind: 'review_output', required_when: 'always' },
    { id: 'export_bundle', kind: 'delivery_bundle', required_when: 'approved_for_export' },
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
    storyline: 'story_architecture',
    poster_blueprint: 'story_architecture',
    visual_direction: 'visual_authorship',
    render_html: 'visual_authorship',
    export_bundle: 'delivery_packaging',
  },
  review_overlay_routes: {
    visual_director_review: 'visual_director_review',
    screenshot_review: 'screenshot_review',
  },
};

export function describePosterOnepagerOverlay() {
  return {
    overlay_id: 'poster_onepager',
    default_profile_id: 'knowledge_poster',
    profiles: ['knowledge_poster'],
    route_sequence: STAGE_SEQUENCE.stages.map((stage) => stage.stage_id),
    deliverable_kind: 'poster_onepager',
    prompt_pack_id: PROMPT_PACK.pack_id,
    packages: {
      overlay: '@redcube/overlay-poster-onepager',
      runtime_family: '@redcube/runtime-family-poster-onepager',
      pack: '@redcube/pack-poster-onepager',
    },
  };
}

export function hydratePosterOnepagerContract({ topicId, deliverableId, title, goal, profileId = 'knowledge_poster' }) {
  return {
    schema_version: 1,
    overlay: 'poster_onepager',
    profile_id: String(profileId || '').trim(),
    deliverable_kind: 'poster_onepager',
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
    source_truth_contract: POSTER_SOURCE_TRUTH_CONTRACT,
    delivery_contract: POSTER_DELIVERY_CONTRACT,
  };
}

export function buildPosterOnepagerDeliverableRecord({ topicId, deliverableId, title, goal, profileId, hydratedContract }) {
  const contract = hydratedContract || hydratePosterOnepagerContract({
    topicId,
    deliverableId,
    title,
    goal,
    profileId,
  });
  const deliverable = buildDeliverableRecord({
    topicId,
    deliverableId,
    overlay: 'poster_onepager',
    kind: 'poster_onepager',
    title,
  });
  return {
    ...deliverable,
    deliverable_kind: 'poster_onepager',
    profile_id: String(profileId || contract.profile_id || '').trim(),
    goal: String(goal || contract.goal || '').trim(),
    hydrated_contract_ref: 'contracts/hydrated-deliverable.json',
    poster_ratio: '4:5',
    routes: contract.stage_sequence.stages.map((stage) => stage.stage_id),
  };
}
