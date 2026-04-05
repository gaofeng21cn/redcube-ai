import { mergeContractLayers } from '@redcube/overlay-core';

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
      stage_id: 'screenshot_review',
      prompt_file: 'screenshot_review.md',
      output_artifact: 'quality_gate.json',
      requires_stages: ['render_html'],
    },
    {
      stage_id: 'export_pptx',
      prompt_file: 'export_pptx.md',
      output_artifact: 'publish_bundle.json',
      requires_stages: ['screenshot_review'],
    },
  ],
  hard_stops: [
    {
      stage_id: 'render_html',
      requires_stage_outputs: ['slide_blueprint', 'visual_direction'],
      rerun_from_stage: 'slide_blueprint',
    },
    {
      stage_id: 'export_pptx',
      requires_review: ['screenshot_review'],
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
    speaker_fit_ok: 'slide_blueprint',
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
  screenshot_review: {
    requires_artifacts: ['render_html'],
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
    screenshot_review: 'prompts/ppt_deck/screenshot_review.md',
    export_pptx: 'prompts/ppt_deck/export_pptx.md',
  },
  stages: {
    storyline: { file: 'storyline.md' },
    detailed_outline: { file: 'detailed_outline.md' },
    slide_blueprint: { file: 'slide_blueprint.md' },
    visual_direction: { file: 'visual_direction.md' },
    render_html: { file: 'render_html.md' },
    screenshot_review: { file: 'screenshot_review.md' },
    export_pptx: { file: 'export_pptx.md' },
  },
  render_contract: {
    render_strategy: 'prompt_director_first',
    shell_file: 'render_shell.html',
    compiler_module: 'render_pack.js',
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
  };

  return mergeContractLayers(familyContract, override);
}
