import { mergeContractLayers } from '@redcube/overlay-core';

const FAMILY_STAGE_SEQUENCE = {
  flow_id: 'ppt_deck_standard_flow',
  stages: [
    {
      stage_id: 'storyline',
      output_artifact: 'storyline.json',
    },
    {
      stage_id: 'detailed_outline',
      output_artifact: 'detailed_outline.json',
    },
    {
      stage_id: 'slide_blueprint',
      output_artifact: 'slide_blueprint.json',
    },
    {
      stage_id: 'visual_direction',
      output_artifact: 'visual_direction.json',
    },
    {
      stage_id: 'render_html',
      output_artifact: 'render_bundle.json',
    },
    {
      stage_id: 'screenshot_review',
      output_artifact: 'quality_gate.json',
    },
    {
      stage_id: 'export_pptx',
      output_artifact: 'publish_bundle.json',
    },
  ],
  hard_stops: [
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

const FAMILY_EXPORT_BUNDLE = {
  bundle_id: 'ppt_deck_bundle',
  include_pptx: true,
  include_pdf: true,
  include_presenter_notes: true,
  include_backup_slides: false,
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
    export_bundle: FAMILY_EXPORT_BUNDLE,
    display_registry: FAMILY_DISPLAY_REGISTRY,
  };

  return mergeContractLayers(familyContract, override);
}
