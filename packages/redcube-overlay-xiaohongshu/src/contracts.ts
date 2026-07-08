import { buildDeliverableRecord, buildSharedSourceTruthContract, buildUiUxProMaxHtmlCompanion } from '@redcube/overlay-core';

import type {
  XiaohongshuDeliverableRecord,
  XiaohongshuDeliverableRecordInput,
  XiaohongshuHydrateContractRequest,
  XiaohongshuHydratedContract,
  XiaohongshuSourceTruthContract,
  XiaohongshuStageDefinition,
  XiaohongshuTopicRecord,
  XiaohongshuTopicRecordInput,
} from './types.js';

const XIAOHONGSHU_SOURCE_TRUTH_CONTRACT = buildSharedSourceTruthContract({
  routeToConsumptionRole: {
    research: 'source_readiness',
    storyline: 'story_architecture',
    single_note_plan: 'story_architecture',
    visual_direction: 'visual_authorship',
    fix_html: 'visual_authorship',
  },
  requiredHydratedExportSurface: 'export_bundle',
}) as unknown as XiaohongshuSourceTruthContract;

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
    { stage_id: 'author_image_pages', prompt_file: 'author_image_pages.md', output_artifact: 'image_pages_bundle.json', requires_stages: ['single_note_plan', 'visual_direction'] },
    { stage_id: 'visual_director_review', prompt_file: 'director_review.md', output_artifact: 'director_review.json', requires_stages: ['author_image_pages'] },
    { stage_id: 'screenshot_review', prompt_file: 'screenshot_review.md', output_artifact: 'quality_gate.json', requires_stages: ['visual_director_review'] },
    { stage_id: 'repair_image_pages', prompt_file: 'repair_image_pages.md', output_artifact: 'image_pages_repair_bundle.json', requires_stages: ['author_image_pages', 'screenshot_review'] },
    { stage_id: 'publish_copy', prompt_file: 'publish_copy.md', output_artifact: 'publish_copy.json', requires_stages: ['screenshot_review'] },
    { stage_id: 'export_bundle', prompt_file: 'export_bundle.md', output_artifact: 'publish_bundle.json', requires_stages: ['publish_copy'] },
  ],
  alternate_stages: [
    { stage_id: 'render_html', prompt_file: 'render_html.md', output_artifact: 'render_bundle.json', requires_stages: ['single_note_plan', 'visual_direction'], lane_id: 'html_authoring', replaces_stage: 'author_image_pages' },
    { stage_id: 'fix_html', prompt_file: 'fix_html.md', output_artifact: 'fix_bundle.json', requires_stages: ['render_html', 'screenshot_review'], lane_id: 'html_authoring', replaces_stage: 'repair_image_pages' },
  ],
  hard_stops: [
    {
      stage_id: 'author_image_pages',
      requires_stage_outputs: ['single_note_plan', 'visual_direction'],
      rerun_from_stage: 'single_note_plan',
    },
    {
      stage_id: 'screenshot_review',
      requires_review: ['visual_director_review'],
      rerun_from_stage: 'visual_director_review',
    },
    {
      stage_id: 'repair_image_pages',
      requires_stage_outputs: ['author_image_pages', 'screenshot_review'],
      rerun_from_stage: 'screenshot_review',
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
    {
      stage_id: 'render_html',
      requires_stage_outputs: ['single_note_plan', 'visual_direction'],
      rerun_from_stage: 'single_note_plan',
    },
    {
      stage_id: 'fix_html',
      requires_stage_outputs: ['render_html', 'screenshot_review'],
      rerun_from_stage: 'screenshot_review',
    },
  ],
};

const STAGE_REQUIREMENTS = {
  research: { requires_artifacts: [] },
  storyline: { requires_artifacts: ['research'] },
  single_note_plan: { requires_artifacts: ['storyline'] },
  visual_direction: { requires_artifacts: ['single_note_plan'] },
  author_image_pages: { requires_artifacts: ['single_note_plan', 'visual_direction'] },
  repair_image_pages: { requires_artifacts: ['author_image_pages', 'screenshot_review'] },
  render_html: { requires_artifacts: ['single_note_plan', 'visual_direction'] },
  fix_html: { requires_artifacts: ['render_html', 'screenshot_review'] },
  visual_director_review: { requires_artifacts: ['author_image_pages'] },
  screenshot_review: { requires_artifacts: ['visual_director_review'] },
  publish_copy: { requires_artifacts: ['screenshot_review'], requires_review_pass: true },
  export_bundle: { requires_artifacts: ['publish_copy'], requires_review_pass: true },
};

const REVIEW_SURFACE = {
  required_checks: [
    'overflow_free',
    'occlusion_free',
    'visual_density_ok',
    'block_content_fit_ok',
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
    overflow_free: 'fix_html',
    occlusion_free: 'fix_html',
    visual_density_ok: 'visual_direction',
    block_content_fit_ok: 'repair_image_pages',
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
    width: 1086,
    height: 1448,
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
    author_image_pages: 'prompts/xiaohongshu/author_image_pages.md',
    repair_image_pages: 'prompts/xiaohongshu/repair_image_pages.md',
    render_html: 'prompts/xiaohongshu/render_html.md',
    fix_html: 'prompts/xiaohongshu/fix_html.md',
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
    author_image_pages: { file: 'author_image_pages.md' },
    repair_image_pages: { file: 'repair_image_pages.md' },
    render_html: { file: 'render_html.md' },
    fix_html: { file: 'fix_html.md' },
    visual_director_review: { file: 'director_review.md' },
    screenshot_review: { file: 'screenshot_review.md' },
    publish_copy: { file: 'publish_copy.md' },
    export_bundle: { file: 'export_bundle.md' },
  },
  render_contract: {
    render_strategy: 'image_first_page_authoring',
    default_visual_route: 'author_image_pages',
    image_generation: {
      default_model: 'gpt-image-2',
      size: '1086x1448',
      output_mode: 'full_page_png',
      canvas: { ...LAYOUT_RULES.canvas, width: 1086, height: 1448 },
      page_image_artifacts_required: true,
      default_style_profile: 'prompts/xiaohongshu/image-first-default-style-profile.json',
      built_in_style_reference_dir: 'prompts/xiaohongshu/style-references/medical-handdrawn-note-default',
      style_reference_dir_input: 'delivery_request.style_reference_dir',
      style_reference_override_semantics: 'operator_style_reference_dir_replaces_built_in_reference_manifest_for_visual_style_only',
      review_input_surface: 'image_page_png_manifest',
    },
    html_authoring_lane: {
      lane_id: 'html_authoring',
      status: 'explicit_selectable',
      routes: ['render_html', 'fix_html'],
      use_when: ['operator_explicitly_requests_html', 'historical_html_maintenance', 'deterministic_web_layout_needed'],
    },
    selectable_explicit_routes: ['render_html', 'fix_html'],
    explicit_route_policy: 'html_routes_require_operator_selection',
    shell_file: 'render_shell.html', ui_ux_quality_companion: buildUiUxProMaxHtmlCompanion({ family: 'xiaohongshu', canvas: LAYOUT_RULES.canvas }),
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
    { id: 'author_image_pages', kind: 'render_output', required_when: 'always' },
    { id: 'repair_image_pages', kind: 'render_output', required_when: 'review_rerun_required' },
    { id: 'render_html', kind: 'render_output', required_when: 'explicit_html_route' },
    { id: 'fix_html', kind: 'render_output', required_when: 'explicit_html_route' },
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
    author_image_pages: 'visual_authorship',
    repair_image_pages: 'visual_authorship',
    render_html: 'visual_authorship',
    fix_html: 'visual_authorship',
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
    deliverable_kind: 'xiaohongshu_note', prompt_pack_id: PROMPT_PACK.pack_id,
    route_sequence: STAGE_SEQUENCE.stages.map((stage) => stage.stage_id),
    visual_authoring_policy: {
      default_visual_route: 'author_image_pages',
      default_visual_policy: 'image_first',
      image_generation: PROMPT_PACK.render_contract.image_generation,
      html_design_companion: PROMPT_PACK.render_contract.ui_ux_quality_companion,
      route_selection_policy: {
        explicit_selection_required_for: PROMPT_PACK.render_contract.selectable_explicit_routes,
        style_reference_dir_input: PROMPT_PACK.render_contract.image_generation.style_reference_dir_input,
      },
    },
    runtime: {
      runner_id: 'families/xiaohongshu',
      owner: 'redcube_ai',
    },
  };
}

export function buildTopicRecord({ topicId, title }: XiaohongshuTopicRecordInput): XiaohongshuTopicRecord {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: 'xiaohongshu',
    deliverable_kind: 'xiaohongshu_note',
    status: 'draft',
    routes: (STAGE_SEQUENCE.stages as XiaohongshuStageDefinition[]).map((stage) => stage.stage_id),
  };
}

export function hydrateXiaohongshuContract({
  topicId,
  deliverableId,
  title,
  goal,
  profileId = 'standard_note',
}: XiaohongshuHydrateContractRequest): XiaohongshuHydratedContract {
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
  } as XiaohongshuHydratedContract;
}

export function buildXiaohongshuDeliverableRecord({
  topicId,
  deliverableId,
  title,
  goal,
  profileId,
  hydratedContract,
}: XiaohongshuDeliverableRecordInput): XiaohongshuDeliverableRecord {
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
    routes: contract.stage_sequence.stages.map((stage: XiaohongshuStageDefinition) => stage.stage_id),
  } as XiaohongshuDeliverableRecord;
}
