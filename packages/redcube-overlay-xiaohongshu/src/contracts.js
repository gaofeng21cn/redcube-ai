export function buildTopicRecord({ topicId, title }) {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: 'xiaohongshu',
    deliverable_kind: 'xiaohongshu_note',
    status: 'draft',
    routes: ['research', 'storyline', 'note'],
  };
}

function buildXiaohongshuStageSequence() {
  return {
    flow_id: 'xiaohongshu_standard_flow',
    stages: [
      {
        stage_id: 'research',
        output_artifact: 'brief.json',
      },
      {
        stage_id: 'storyline',
        output_artifact: 'storyline.json',
      },
      {
        stage_id: 'note',
        output_artifact: 'publish_bundle.json',
      },
    ],
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
    stage_sequence: buildXiaohongshuStageSequence(),
    review_surface: {
      required_checks: [
        'cover_density_ok',
        'platform_copy_complete',
        'cta_clear',
      ],
      rerun_from_stage: {
        cover_density_ok: 'note',
        platform_copy_complete: 'storyline',
        cta_clear: 'storyline',
      },
    },
    layout_rules: {
      density_mode: 'mobile_card_stack',
      max_cards_per_note: 10,
      require_cover_hook: true,
    },
    baseline_policy: {
      modes: {
        draft_new: { baseline_required: false },
        optimize_existing: {
          baseline_required: true,
          approved_baseline_only: true,
          required_review: 'relative_quality_review',
        },
      },
    },
    export_bundle: {
      bundle_id: 'xiaohongshu_standard_bundle',
      include_cover_assets: true,
      include_caption: true,
      include_publish_manifest: true,
    },
    display_registry: {
      surfaces: [
        { id: 'source_index', kind: 'research_surface', required_when: 'research_needed' },
        { id: 'storyline', kind: 'stage_artifact', required_when: 'always' },
        { id: 'note', kind: 'render_output', required_when: 'always' },
      ],
    },
  };
}
