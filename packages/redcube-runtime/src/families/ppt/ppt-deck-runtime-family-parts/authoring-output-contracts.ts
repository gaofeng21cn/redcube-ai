// @ts-nocheck
function claimSpineLockOutputContract() {
  return [
    {
      claim_id: 'CLM-001',
      claim_text: '<stable claim carrying declared source refs>',
      source_refs: ['<declared source ref>'],
      first_use_naming: {
        full_visible_name: '<full audience-facing name>',
        accepted_abbreviation: '<accepted abbreviation or null>',
        first_use_slide_id: '<slide id>',
      },
      introduction_slide_id: '<slide id>',
      proof_slide_ids: ['<slide id>'],
      resolution_slide_id: '<slide id>',
      forbidden_drift: ['<meaning or wording drift that later stages must not introduce>'],
    },
  ];
}

export function storylineOutputContract() {
  return {
    speaker: '<string>',
    audience: '<string>',
    style: '<string>',
    core_metaphor: '<string>',
    hook: ['<string>'],
    journey: ['<string>', '<string>', '<string>'],
    resolution: ['<string>'],
    claim_spine_lock: claimSpineLockOutputContract(),
    manuscript_evidence_table: [
      {
        manuscript_label: '第一篇',
        research_question: '<string>',
        primary_endpoint: '<string>',
        method_or_model: '<string>',
        key_numeric_results: ['<string with source numeric evidence>', '<string with source numeric evidence>'],
        main_conclusion: '<string>',
        boundary: '<string>',
      },
    ],
  };
}

export function detailedOutlineOutputContract() {
  return {
    claim_spine_lock: claimSpineLockOutputContract(),
    chapter_structure: [
      { chapter_id: 'C1', title: '<string>', slide_range: '01-03' },
    ],
    slides: [
      {
        slide_id: 'S01',
        slide_no: 1,
        chapter_id: 'C1',
        page_type: 'cover_signal',
        layout_family: 'cover_signal',
        title: '<string>',
        page_goal: '<string>',
        page_objective: '<string>',
        core_sentence: '<string>',
        evidence_points: ['<string>', '<string>'],
        public_sources: ['<string>'],
        page_core_content: ['<string>', '<string>'],
        visual_anchor_tracks: ['<string>', '<string>'],
        speaker_notes: '<string>',
        transition_sentence: '<string>',
        render_recipe_id: 'ppt.hero_signal',
      },
    ],
  };
}

export function slideBlueprintOutputContract() {
  return {
    chapter_goal: '<string>',
    claim_spine_lock: claimSpineLockOutputContract(),
    slides: detailedOutlineOutputContract().slides,
  };
}

export function visualDirectionOutputContract() {
  return {
    visual_manifest: '<string>',
    what_it_is: ['<string>', '<string>'],
    what_it_is_not: ['<string>', '<string>'],
    palette: {
      canvas: '#F7F8FC',
      ink: '#0F172A',
      accent: '#2563EB',
      accentSoft: '#DBEAFE',
      success: '#0F766E',
    },
    typography_plan: {
      cover_title: { font_size: 56, line_height: 1.08, font_weight: 800 },
      body_title: { font_size: 44, line_height: 1.12, font_weight: 780 },
      section_lead: { font_size: 24, line_height: 1.4, font_weight: 650 },
      card_title: { font_size: 21, line_height: 1.18, font_weight: 720 },
      card_body: { font_size: 16.5, line_height: 1.45, font_weight: 600 },
      meta_label: { font_size: 12.5, line_height: 1.1, font_weight: 600 },
      page_no: { font_size: 18, line_height: 1.0, font_weight: 600 },
    },
    continuity_constraints: ['<string>', '<string>'],
    rhythm_curve: [{ slide_id: '<slide_id from current slide_blueprint>', role: '<visual role>' }],
    peak_pages: ['<slide_id from current slide_blueprint>'],
    page_family_ceiling: {
      '<layout_family from current slide_blueprint>': '<AI-authored reuse ceiling>',
    },
    forbidden_regressions: ['<string>', '<string>'],
    final_instruction_to_html_generator: ['<string>', '<string>'],
  };
}

export function renderHtmlOutputContract() {
  return {
    slides: [
      {
        slide_id: 'S01',
        content_html: '<div data-slide-root="true" data-slide-id="S01">...</div>',
      },
    ],
    render_summary: ['<string>', '<string>'],
  };
}

export function renderHtmlSummaryOutputContract() {
  return {
    render_summary: ['<string>', '<string>'],
  };
}

export function directorReviewOutputContract() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    peak_pages_landed: true,
    memory_hook_present: true,
    homogeneous_layout_risk: 0.22,
    weak_pages: ['S06'],
    review_summary: '<string>',
    rewrite_action: 'none | revise_render_html',
  };
}

export function screenshotReviewSlideBatchOutputContract() {
  return {
    slide_reviews: [
      {
        slide_id: 'S01',
        judgement: 'pass',
        visual_findings: ['<string>'],
        recommended_fix: 'none',
      },
    ],
  };
}

export function screenshotReviewSummaryOutputContract() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    weak_pages: ['S06'],
    review_summary: '<string>',
    visual_memory_proposal: {
      status: 'skip | proposal_candidate',
      reason: '<string>',
      candidate: {
        reusable_pattern: '<string; required only for proposal_candidate>',
        stage_scope: '<string; required only for proposal_candidate>',
        applicability: '<string; required only for proposal_candidate>',
        caveat: '<string; required only for proposal_candidate>',
        evidence_slide_ids: ['<reviewed slide id>'],
        evidence_findings: ['<visible review finding supporting the reusable pattern>'],
      },
    },
  };
}
