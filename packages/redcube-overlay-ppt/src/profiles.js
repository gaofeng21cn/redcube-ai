import { mergeContractLayers } from '@redcube/overlay-core';

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

const PPT_SOURCE_TRUTH_CONTRACT = Object.freeze({
  authoritative_surface: 'shared_source_truth',
  authoritative_gate: 'topics/<topic>/canonical/source-readiness-pack.json',
  authoritative_gate_inputs: ['source_audit', 'source_readiness_pack'],
  authoritative_artifacts: ['source_index', 'extracted_materials', 'source_audit', 'source_brief', 'source_readiness_pack'],
  readiness_target: 'planning_ready',
  pass_condition: 'source_audit.status=pass && source_readiness_pack.readiness.planning_ready=true',
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
    detailed_outline: 'story_architecture',
    slide_blueprint: 'story_architecture',
    visual_direction: 'visual_authorship',
    author_pptx_native: 'visual_authorship',
    fix_html: 'visual_authorship',
    repair_pptx_native: 'visual_authorship',
  },
  required_hydrated_export_surface: 'export_pptx',
});

const PPT_DELIVERY_CONTRACT_BASE = Object.freeze({
  authoritative_projection_surface: 'getPublicationProjection',
  authoritative_review_surface: 'getReviewState',
  required_export_route: 'export_pptx',
  export_artifact_field: 'export_bundle',
  delivery_state_field: 'export_bundle.delivery_state',
  projection_model: 'direct_delivery',
  human_gate: {
    required: false,
    mutation_surfaces: [],
  },
  operator_handoff: {
    owner_surface: 'required_export_artifact.delivery_state',
    handoff_ready_state: 'output_ready',
    gate_surfaces: ['auditDeliverable', 'runtimeWatch', 'getReviewState', 'getPublicationProjection'],
    reopen_mutation_surface: 'request_changes',
    closeout_mutation_surface: 'promote_baseline',
  },
  projection_states: {
    ready_for_export: 'export_ready',
    output_ready: 'output_ready',
  },
});

const NATIVE_PPT_PROOF_LANE = Object.freeze({
  lane_id: 'ppt_deck_native_ppt_authoring_v0',
  status: 'opt_in_proof_lane',
  default_enabled: false,
  runnable_routes: ['author_pptx_native', 'repair_pptx_native'],
  replaces_routes: ['render_html', 'fix_html'],
  preserved_upstream_routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction'],
  preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
  ai_first_editing_contract: {
    contract_id: 'ppt_native_ai_first_editing_contract_v1',
    creative_owner: 'llm_agent',
    editable_shape_plan_required: true,
    editable_shape_manifest_required: true,
    python_helper_role: 'execute_validate_export_only',
    template_substitution_allowed: false,
    preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
  },
  unit_repair_scope: {
    repair_route: 'repair_pptx_native',
    scope: 'page',
    target_source: 'screenshot_review.blocked_slide_ids',
    passed_slides_reused: true,
    preserved_slide_policy: 'do_not_reauthor_passed_slides',
  },
  authoring_artifact: 'native_pptx_file',
  editable_artifact_required: true,
  review_input_surface: 'rendered_pptx_screenshots',
  export_contract_delta: {
    source_artifact_field: 'export_bundle.source_pptx',
    shape_manifest_field: 'export_bundle.native_ppt_shape_manifest',
    repair_log_field: 'export_bundle.native_ppt_repair_log',
  },
});

const FAMILY_STAGE_SEQUENCE = {
  flow_id: 'ppt_deck_standard_flow',
  stages: [
    {
      stage_id: 'storyline',
      prompt_file: 'storyline.md',
      output_artifact: 'storyline.json',
      requires_stages: [],
    },
    {
      stage_id: 'detailed_outline',
      prompt_file: 'detailed_outline.md',
      output_artifact: 'detailed_outline.json',
      requires_stages: ['storyline'],
    },
    {
      stage_id: 'slide_blueprint',
      prompt_file: 'slide_blueprint.md',
      output_artifact: 'slide_blueprint.json',
      requires_stages: ['detailed_outline'],
    },
    {
      stage_id: 'visual_direction',
      prompt_file: 'visual_direction.md',
      output_artifact: 'visual_direction.json',
      requires_stages: ['slide_blueprint'],
    },
    {
      stage_id: 'render_html',
      prompt_file: 'render_html.md',
      output_artifact: 'render_bundle.json',
      requires_stages: ['slide_blueprint', 'visual_direction'],
    },
    {
      stage_id: 'visual_director_review',
      prompt_file: 'director_review.md',
      output_artifact: 'director_review.json',
      requires_stages: ['render_html'],
    },
    {
      stage_id: 'screenshot_review',
      prompt_file: 'screenshot_review.md',
      output_artifact: 'quality_gate.json',
      requires_stages: ['visual_director_review'],
    },
    {
      stage_id: 'fix_html',
      prompt_file: 'fix_html.md',
      output_artifact: 'fix_bundle.json',
      requires_stages: ['render_html', 'screenshot_review'],
    },
    {
      stage_id: 'export_pptx',
      prompt_file: 'export_pptx.md',
      output_artifact: 'publish_bundle.json',
      requires_stages: ['screenshot_review'],
    },
  ],
  alternate_stages: [
    {
      stage_id: 'author_pptx_native',
      prompt_file: 'author_pptx_native.md',
      output_artifact: 'native_ppt_bundle.json',
      requires_stages: ['slide_blueprint', 'visual_direction'],
      lane_id: NATIVE_PPT_PROOF_LANE.lane_id,
      replaces_stage: 'render_html',
    },
    {
      stage_id: 'repair_pptx_native',
      prompt_file: 'repair_pptx_native.md',
      output_artifact: 'native_ppt_repair_bundle.json',
      requires_stages: ['author_pptx_native', 'screenshot_review'],
      lane_id: NATIVE_PPT_PROOF_LANE.lane_id,
      replaces_stage: 'fix_html',
    },
  ],
  hard_stops: [
    {
      stage_id: 'render_html',
      requires_stage_outputs: ['slide_blueprint', 'visual_direction'],
      rerun_from_stage: 'slide_blueprint',
    },
    {
      stage_id: 'screenshot_review',
      requires_review: ['visual_director_review'],
      rerun_from_stage: 'visual_director_review',
    },
    {
      stage_id: 'fix_html',
      requires_stage_outputs: ['render_html', 'screenshot_review'],
      rerun_from_stage: 'screenshot_review',
    },
    {
      stage_id: 'export_pptx',
      requires_review: ['screenshot_review'],
      rerun_from_stage: 'screenshot_review',
    },
    {
      stage_id: 'author_pptx_native',
      requires_stage_outputs: ['slide_blueprint', 'visual_direction'],
      rerun_from_stage: 'slide_blueprint',
    },
    {
      stage_id: 'repair_pptx_native',
      requires_stage_outputs: ['author_pptx_native', 'screenshot_review'],
      rerun_from_stage: 'screenshot_review',
    },
  ],
};

const FAMILY_REVIEW_SURFACE = {
  required_checks: [
    'overflow_free',
    'occlusion_free',
    'visual_density_ok',
    'speaker_fit_ok',
    'edge_clearance_ok',
    'block_content_fit_ok',
    'title_typography_ok',
    'director_intent_landed',
    'anti_template_ok',
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
    speaker_fit_ok: 'slide_blueprint',
    edge_clearance_ok: 'fix_html',
    block_content_fit_ok: 'fix_html',
    title_typography_ok: 'fix_html',
    director_intent_landed: 'visual_director_review',
    anti_template_ok: 'visual_director_review',
    baseline_comparison_passed: 'visual_direction',
  },
};

const FAMILY_LAYOUT_RULES = {
  density_mode: 'balanced_deck',
  max_primary_points_per_slide: 5,
  canvas: {
    ratio: '16:9',
    width: 1152,
    height: 648,
    scrollbars_forbidden: true,
  },
  slides_data_rule: 'independent_content',
  forbidden_template_routes: ['renderSlide', 'layoutByType', 'cardsGrid', 'pageType'],
  structured_families_require_anchor: [
    'central_axis',
    'judgement_ladder',
    'timeline_band',
    'multi_zone_compare',
    'ring_cross',
  ],
  evidence_surface_rules: {
    require_public_source_label: true,
    forbidden_internal_labels: [
      '本目录参考材料',
      '来源索引',
      '内部资料',
    ],
    separate_fact_from_interpretation: true,
  },
};

const FAMILY_BASELINE_POLICY = {
  modes: {
    draft_new: {
      baseline_required: false,
    },
    optimize_existing: {
      baseline_required: true,
      approved_baseline_only: true,
      required_review: 'baseline_comparison_passed',
    },
  },
};

const FAMILY_STAGE_REQUIREMENTS = {
  storyline: {
    requires_artifacts: [],
  },
  detailed_outline: {
    requires_artifacts: ['storyline'],
  },
  slide_blueprint: {
    requires_artifacts: ['detailed_outline'],
  },
  visual_direction: {
    requires_artifacts: ['slide_blueprint'],
  },
  render_html: {
    requires_artifacts: ['slide_blueprint', 'visual_direction'],
  },
  author_pptx_native: {
    requires_artifacts: ['slide_blueprint', 'visual_direction'],
  },
  fix_html: {
    requires_artifacts: ['render_html', 'screenshot_review'],
  },
  repair_pptx_native: {
    requires_artifacts: ['author_pptx_native', 'screenshot_review'],
  },
  visual_director_review: {
    requires_artifacts: ['render_html'],
  },
  screenshot_review: {
    requires_artifacts: ['visual_director_review'],
  },
  export_pptx: {
    requires_artifacts: ['screenshot_review'],
    requires_review_pass: true,
  },
};

const FAMILY_PROMPT_PACK = {
  pack_id: 'ppt_deck_mainline_v1',
  root: 'prompts/ppt_deck',
  routes: {
    storyline: 'prompts/ppt_deck/storyline.md',
    detailed_outline: 'prompts/ppt_deck/detailed_outline.md',
    slide_blueprint: 'prompts/ppt_deck/slide_blueprint.md',
    visual_direction: 'prompts/ppt_deck/visual_direction.md',
    render_html: 'prompts/ppt_deck/render_html.md',
    author_pptx_native: 'prompts/ppt_deck/author_pptx_native.md',
    fix_html: 'prompts/ppt_deck/fix_html.md',
    repair_pptx_native: 'prompts/ppt_deck/repair_pptx_native.md',
    visual_director_review: 'prompts/ppt_deck/director_review.md',
    screenshot_review: 'prompts/ppt_deck/screenshot_review.md',
    export_pptx: 'prompts/ppt_deck/export_pptx.md',
  },
  stages: {
    storyline: { file: 'storyline.md' },
    detailed_outline: { file: 'detailed_outline.md' },
    slide_blueprint: { file: 'slide_blueprint.md' },
    visual_direction: { file: 'visual_direction.md' },
    render_html: { file: 'render_html.md' },
    author_pptx_native: { file: 'author_pptx_native.md' },
    fix_html: { file: 'fix_html.md' },
    repair_pptx_native: { file: 'repair_pptx_native.md' },
    visual_director_review: { file: 'director_review.md' },
    screenshot_review: { file: 'screenshot_review.md' },
    export_pptx: { file: 'export_pptx.md' },
  },
  render_contract: {
    render_strategy: 'prompt_director_first',
    default_visual_route: 'render_html',
    native_ppt_proof_lane: NATIVE_PPT_PROOF_LANE,
    shell_file: 'render_shell.html',
    recipe_registry: {
      cover_hero: 'ppt.hero_signal',
      multi_zone_compare: 'ppt.compare_zones',
      timeline_band: 'ppt.timeline_rail',
      judgement_ladder: 'ppt.judgement_ladder',
      ring_cross: 'ppt.ring_cross',
      central_axis: 'ppt.central_axis',
      summary_peak: 'ppt.summary_peak',
      default: 'ppt.compare_zones',
    },
  },
};

const FAMILY_EXPORT_BUNDLE = {
  bundle_id: 'ppt_deck_bundle',
  include_pptx: true,
  include_pdf: true,
  include_presenter_notes: true,
  include_backup_slides: false,
  review_required_before_export: true,
};

const FAMILY_DISPLAY_REGISTRY = {
  surfaces: [
    {
      id: 'source_index',
      kind: 'research_surface',
      required_when: 'research_needed',
    },
    {
      id: 'storyline',
      kind: 'stage_artifact',
      required_when: 'always',
    },
    {
      id: 'detailed_outline',
      kind: 'stage_artifact',
      required_when: 'always',
    },
    {
      id: 'slide_blueprint',
      kind: 'stage_artifact',
      required_when: 'always',
    },
    {
      id: 'visual_direction',
      kind: 'stage_artifact',
      required_when: 'always',
    },
    {
      id: 'render_html',
      kind: 'render_output',
      required_when: 'always',
    },
    {
      id: 'visual_director_review',
      kind: 'review_output',
      required_when: 'always',
    },
    {
      id: 'screenshot_review',
      kind: 'review_output',
      required_when: 'always',
    },
    {
      id: 'export_pptx',
      kind: 'delivery_bundle',
      required_when: 'approved_for_export',
    },
  ],
};

const FAMILY_LIFECYCLE_MODEL = {
  macro_lifecycle: [
    'source_readiness',
    'story_architecture',
    'visual_authorship',
    'delivery_packaging',
  ],
  route_to_stage: {
    storyline: 'story_architecture',
    detailed_outline: 'story_architecture',
    slide_blueprint: 'story_architecture',
    visual_direction: 'visual_authorship',
    render_html: 'visual_authorship',
    author_pptx_native: 'visual_authorship',
    fix_html: 'visual_authorship',
    repair_pptx_native: 'visual_authorship',
    export_pptx: 'delivery_packaging',
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

const DIRECT_DELIVERY_LIFECYCLE_STAGE_CONTRACT = {
  stage_model: 'direct_delivery_human_workline',
  human_workline: [
    'source_readiness',
    'storyline',
    'plan',
    'visual',
    'delivery',
  ],
  macro_lifecycle: FAMILY_LIFECYCLE_MODEL.macro_lifecycle,
  human_to_macro_stage: {
    source_readiness: 'source_readiness',
    storyline: 'story_architecture',
    plan: 'story_architecture',
    visual: 'visual_authorship',
    delivery: 'delivery_packaging',
  },
  review_overlay_within: 'visual',
  operator_handoff_within: 'delivery',
  closeout_within: 'delivery',
  delivery_contains: [
    'required_export_route',
    'required_export_bundle_id',
    'operator_handoff',
    'closeout',
  ],
  route_to_human_stage: {
    storyline: 'storyline',
    detailed_outline: 'plan',
    slide_blueprint: 'plan',
    visual_direction: 'visual',
    render_html: 'visual',
    author_pptx_native: 'visual',
    fix_html: 'visual',
    repair_pptx_native: 'visual',
    visual_director_review: 'visual',
    screenshot_review: 'visual',
    export_pptx: 'delivery',
  },
};

const PPT_DECK_PROFILE_OVERRIDES = {
  lecture_student: {
    review_surface: {
      required_checks: [
        ...FAMILY_REVIEW_SURFACE.required_checks,
        'term_explained_on_first_use',
        'teaching_progression_clear',
      ],
      rerun_from_stage: {
        term_explained_on_first_use: 'storyline',
        teaching_progression_clear: 'detailed_outline',
      },
    },
    layout_rules: {
      density_mode: 'teaching_spread',
      max_primary_points_per_slide: 4,
    },
    export_bundle: {
      bundle_id: 'lecture_student_bundle',
      include_presenter_notes: true,
      include_backup_slides: false,
    },
  },
  lecture_peer: {
    review_surface: {
      required_checks: [
        ...FAMILY_REVIEW_SURFACE.required_checks,
        'novelty_position_clear',
        'method_boundary_explicit',
      ],
      rerun_from_stage: {
        novelty_position_clear: 'storyline',
        method_boundary_explicit: 'detailed_outline',
      },
    },
    layout_rules: {
      density_mode: 'peer_dense',
      max_primary_points_per_slide: 5,
    },
    export_bundle: {
      bundle_id: 'lecture_peer_bundle',
      include_presenter_notes: true,
      include_backup_slides: true,
    },
  },
  executive_briefing: {
    review_surface: {
      required_checks: [
        ...FAMILY_REVIEW_SURFACE.required_checks,
        'decision_implication_clear',
        'conclusion_up_front',
      ],
      rerun_from_stage: {
        decision_implication_clear: 'storyline',
        conclusion_up_front: 'storyline',
      },
    },
    layout_rules: {
      density_mode: 'executive_scan',
      max_primary_points_per_slide: 3,
    },
    export_bundle: {
      bundle_id: 'executive_briefing_bundle',
      include_presenter_notes: false,
      include_backup_slides: false,
    },
  },
  defense_deck: {
    review_surface: {
      required_checks: [
        ...FAMILY_REVIEW_SURFACE.required_checks,
        'claim_evidence_traceable',
        'backup_qa_ready',
      ],
      rerun_from_stage: {
        claim_evidence_traceable: 'detailed_outline',
        backup_qa_ready: 'slide_blueprint',
      },
    },
    layout_rules: {
      density_mode: 'defense_trace',
      max_primary_points_per_slide: 5,
    },
    export_bundle: {
      bundle_id: 'defense_deck_bundle',
      include_presenter_notes: true,
      include_backup_slides: true,
    },
  },
};

export const PPT_DECK_PROFILES = Object.freeze({
  lecture_student: { profile_id: 'lecture_student' },
  lecture_peer: { profile_id: 'lecture_peer' },
  executive_briefing: { profile_id: 'executive_briefing' },
  defense_deck: { profile_id: 'defense_deck' },
});

export function describePptDeckOverlay() {
  return {
    overlay_id: 'ppt_deck',
    default_profile_id: 'lecture_student',
    profiles: Object.keys(PPT_DECK_PROFILES),
    deliverable_kind: 'ppt_deck',
    prompt_pack_id: FAMILY_PROMPT_PACK.pack_id,
    route_sequence: FAMILY_STAGE_SEQUENCE.stages.map((stage) => stage.stage_id),
    visual_authoring_policy: {
      default_visual_route: FAMILY_PROMPT_PACK.render_contract.default_visual_route,
      native_ppt_proof_lane: FAMILY_PROMPT_PACK.render_contract.native_ppt_proof_lane,
    },
    packages: {
      overlay: '@redcube/overlay-ppt',
      runtime_family: '@redcube/runtime-family-ppt',
      pack: '@redcube/pack-ppt',
    },
  };
}

export function hydratePptDeckContract({
  overlay = 'ppt_deck',
  topicId,
  deliverableId,
  title,
  goal,
  profileId,
}) {
  const profile = String(profileId || '').trim();
  const override = PPT_DECK_PROFILE_OVERRIDES[profile];
  if (!override) {
    throw new Error(`Unknown profile_id for overlay ppt_deck: ${profile}`);
  }

  const familyContract = {
    schema_version: 1,
    overlay,
    profile_id: profile,
    deliverable_kind: 'ppt_deck',
    topic_id: String(topicId || '').trim(),
    deliverable_id: String(deliverableId || '').trim(),
    title: String(title || '').trim(),
    goal: String(goal || '').trim(),
    stage_sequence: FAMILY_STAGE_SEQUENCE,
    review_surface: FAMILY_REVIEW_SURFACE,
    layout_rules: FAMILY_LAYOUT_RULES,
    baseline_policy: FAMILY_BASELINE_POLICY,
    stage_requirements: FAMILY_STAGE_REQUIREMENTS,
    prompt_pack: FAMILY_PROMPT_PACK,
    export_bundle: FAMILY_EXPORT_BUNDLE,
    display_registry: FAMILY_DISPLAY_REGISTRY,
    lifecycle_model: FAMILY_LIFECYCLE_MODEL,
    lifecycle_stage_contract: DIRECT_DELIVERY_LIFECYCLE_STAGE_CONTRACT,
    source_truth_contract: PPT_SOURCE_TRUTH_CONTRACT,
  };

  const merged = mergeContractLayers(familyContract, override);
  return {
    ...merged,
    delivery_contract: {
      ...PPT_DELIVERY_CONTRACT_BASE,
      required_export_bundle_id: String(merged?.export_bundle?.bundle_id || '').trim(),
    },
  };
}
