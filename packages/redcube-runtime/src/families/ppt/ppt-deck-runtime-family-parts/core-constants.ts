// @ts-nocheck
export const PROMPT_PACK = Object.freeze({
  storyline: 'prompts/ppt_deck/storyline.md',
  detailed_outline: 'prompts/ppt_deck/detailed_outline.md',
  slide_blueprint: 'prompts/ppt_deck/slide_blueprint.md',
  visual_direction: 'prompts/ppt_deck/visual_direction.md',
  render_html: 'prompts/ppt_deck/render_html.md',
  author_pptx_native: 'prompts/ppt_deck/author_pptx_native.md',
  author_image_pages: 'prompts/ppt_deck/author_image_pages.md',
  fix_html: 'prompts/ppt_deck/fix_html.md',
  repair_pptx_native: 'prompts/ppt_deck/repair_pptx_native.md',
  repair_image_pages: 'prompts/ppt_deck/repair_image_pages.md',
  visual_director_review: 'prompts/ppt_deck/director_review.md',
  screenshot_review: 'prompts/ppt_deck/screenshot_review.md',
  export_pptx: 'prompts/ppt_deck/export_pptx.md',
});

export const STAGE_REQUIREMENTS = Object.freeze({
  storyline: { requires_artifacts: [] },
  detailed_outline: { requires_artifacts: ['storyline'] },
  slide_blueprint: { requires_artifacts: ['detailed_outline'] },
  visual_direction: { requires_artifacts: ['slide_blueprint'] },
  render_html: { requires_artifacts: ['slide_blueprint', 'visual_direction'] },
  author_pptx_native: { requires_artifacts: ['slide_blueprint', 'visual_direction'] },
  author_image_pages: { requires_artifacts: ['slide_blueprint', 'visual_direction'] },
  fix_html: { requires_artifacts: ['render_html', 'screenshot_review'] },
  repair_pptx_native: { requires_artifacts: ['author_pptx_native'] },
  repair_image_pages: { requires_artifacts: ['author_image_pages'] },
  visual_director_review: { requires_artifacts: [] },
  screenshot_review: { requires_artifacts: ['visual_director_review'] },
  export_pptx: { requires_artifacts: ['screenshot_review'], requires_review_pass: true },
});

export const CANVAS = Object.freeze({ width: 1152, height: 648, ratio: '16:9' });
export const SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID = 'ppt_deck_screenshot_mechanics:v4:audience-layout-legibility';
export const RENDER_HTML_BATCH_SIZE = 6;
export const TARGETED_RENDER_HTML_BATCH_SIZE = 1;
export const SCREENSHOT_REVIEW_BATCH_SIZE = 3;
export const RENDER_REFERENCE_SLIDE_WINDOW = 3;
export const BANNED_RENDER_TOKENS = ['renderSlide', 'layoutByType', 'cardsGrid', 'pageType'];
export const CREATIVE_MATERIALIZED_FROM = 'codex_cli_json_output';
export const MIN_REVIEW_QA_BLOCKS = 2;
export const MIN_REVIEW_PRIMARY_POINTS = 1;
export const PAGE_FIX_ROUTE = 'fix_html';
export const TARGETED_SCREENSHOT_MECHANICAL_ISSUES = new Set([
  'overflow_detected',
  'occlusion_detected',
  'visual_density_out_of_range',
  'edge_clearance_out_of_range',
  'block_content_overflow_detected',
  'title_typography_inconsistent',
  'page_number_consistency_failed',
  'operator_language_leak_detected',
  'title_safe_zone_obstructed',
  'table_font_below_minimum',
  'table_cell_fit_failed',
  'layout_density_too_sparse',
  'native_slot_fill_failed',
  'audience_label_below_readability_floor',
  'native_content_depth_failed',
  'native_grid_balance_failed',
]);
export const HARD_SCREENSHOT_BLOCKING_ISSUES = TARGETED_SCREENSHOT_MECHANICAL_ISSUES;
export const TARGETED_SCREENSHOT_RERUN_CHECKS = new Set([
  'ai_review_passed',
  'overflow_free',
  'occlusion_free',
  'visual_density_ok',
  'edge_clearance_ok',
  'block_content_fit_ok',
  'title_typography_ok',
  'page_number_consistency_ok',
  'external_audience_language_ok',
  'title_safe_zone_clear',
  'table_legibility_ok',
  'layout_density_ok',
  'slot_fill_ok',
  'audience_label_readability_ok',
  'content_depth_ok',
  'grid_balance_ok',
]);
export const ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE = Object.freeze({
  storyline: 'story_architecture',
  detailed_outline: 'story_architecture',
  slide_blueprint: 'story_architecture',
  visual_direction: 'visual_authorship',
  author_image_pages: 'visual_authorship',
  author_pptx_native: 'visual_authorship',
  fix_html: 'visual_authorship',
  repair_image_pages: 'visual_authorship',
  repair_pptx_native: 'visual_authorship',
});
export const DEFAULT_TYPOGRAPHY_PLAN = Object.freeze({
  cover_title: Object.freeze({ font_size: 56, line_height: 1.08, font_weight: 800 }),
  body_title: Object.freeze({ font_size: 44, line_height: 1.12, font_weight: 780 }),
  section_lead: Object.freeze({ font_size: 24, line_height: 1.4, font_weight: 650 }),
  card_title: Object.freeze({ font_size: 21, line_height: 1.18, font_weight: 720 }),
  card_body: Object.freeze({ font_size: 16.5, line_height: 1.45, font_weight: 600 }),
  meta_label: Object.freeze({ font_size: 12.5, line_height: 1.1, font_weight: 600 }),
  page_no: Object.freeze({ font_size: 18, line_height: 1.0, font_weight: 600 }),
});
export const PPT_PAGE_LIBRARY = Object.freeze([
  {
    page_type: 'cover_signal',
    layout_family: 'cover_signal',
    render_recipe_id: 'ppt.hero_signal',
    use_when: '封面页与讲课契约页',
  },
  {
    page_type: 'stakes_window',
    layout_family: 'multi_zone_compare',
    render_recipe_id: 'ppt.compare_zones',
    use_when: '讲为什么值得现在讲清',
  },
  {
    page_type: 'myth_fact_split',
    layout_family: 'multi_zone_compare',
    render_recipe_id: 'ppt.compare_zones',
    use_when: '讲常见误区与纠偏',
  },
  {
    page_type: 'mechanism_track',
    layout_family: 'timeline_band',
    render_recipe_id: 'ppt.timeline_rail',
    use_when: '讲步骤链路或机制主线',
  },
  {
    page_type: 'decision_gate',
    layout_family: 'judgement_ladder',
    render_recipe_id: 'ppt.judgement_ladder',
    use_when: '讲判断边界、停顿点与下一步动作',
  },
  {
    page_type: 'public_evidence',
    layout_family: 'multi_zone_compare',
    render_recipe_id: 'ppt.compare_zones',
    use_when: '讲公开证据与来源口径',
  },
  {
    page_type: 'ring_cross',
    layout_family: 'ring_cross',
    render_recipe_id: 'ppt.ring_cross',
    use_when: '讲四象限或四步动作框架',
  },
  {
    page_type: 'closure_peak',
    layout_family: 'summary_peak',
    render_recipe_id: 'ppt.summary_peak',
    use_when: '讲结尾带走点与收束页',
  },
]);
export const ALLOWED_RECIPE_IDS = new Set(PPT_PAGE_LIBRARY.map((item) => item.render_recipe_id));
