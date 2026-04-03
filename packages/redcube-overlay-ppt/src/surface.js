const STANDARD_FLOW = [
  'storyline',
  'detailed_outline',
  'slide_blueprint',
  'visual_direction',
  'render_html',
  'screenshot_review',
  'export_pptx',
];

const DISPLAY_SURFACES = [
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
];

export function buildDeckSurfaceBundle({ title }) {
  const deliverableTitle = String(title || '').trim();

  return [
    {
      relativePath: 'contracts/stage-sequence.json',
      content: {
        schema_version: 1,
        overlay: 'ppt_deck',
        deliverable_title: deliverableTitle,
        standard_flow: STANDARD_FLOW,
        research_entry_gate: {
          required_surface: 'source_index',
          required_when: 'research_needed',
          rerun_from_stage: 'intake',
        },
        hard_stops: [
          {
            from_stage: 'render_html',
            reason: 'screenshot_review_required_before_export',
            rerun_from_stage: 'screenshot_review',
          },
        ],
      },
    },
    {
      relativePath: 'contracts/review-surface.json',
      content: {
        schema_version: 1,
        overlay: 'ppt_deck',
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
      },
    },
    {
      relativePath: 'contracts/layout-rules.json',
      content: {
        schema_version: 1,
        overlay: 'ppt_deck',
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
      },
    },
    {
      relativePath: 'contracts/baseline-policy.json',
      content: {
        schema_version: 1,
        overlay: 'ppt_deck',
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
      },
    },
    {
      relativePath: 'views/display-registry.json',
      content: {
        schema_version: 1,
        overlay: 'ppt_deck',
        surfaces: DISPLAY_SURFACES,
      },
    },
  ];
}

export function listDeckSurfaceArtifactPaths() {
  return buildDeckSurfaceBundle({ title: '' }).map(({ relativePath }) => relativePath);
}
