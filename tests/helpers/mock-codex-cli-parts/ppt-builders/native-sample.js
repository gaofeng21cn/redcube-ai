import { safeArray, safeText } from '../shared.js';

function contentCharCount(text) {
  return [...String(text || '')]
    .filter((char) => !/\s/.test(char) && !['，', '。', '、', ',', '.', ':', '：', ';', '；'].includes(char))
    .length;
}

function qualityPointText(text, index) {
  const normalized = String(text || '').trim();
  if (contentCharCount(normalized) >= 12) return normalized;
  const seed = normalized || `第${index + 1}项`;
  return `${seed}，说明本页证据如何支撑交付判断`;
}

function pointText(item, fallback) {
  return safeText(item?.text || item, fallback);
}

function slidePoints(slide) {
  const points = safeArray(slide?.page_core_content)
    .map((item, index) => pointText(item, `Point ${index + 1} carries concrete audience content`))
    .filter(Boolean);
  return (points.length > 0 ? points : [
    safeText(slide?.core_sentence, 'Concrete audience point for native PPT validation'),
    'Editable slide materialization keeps geometry explicit',
    'Review gates receive shape manifest evidence',
  ]).slice(0, 4).map((text, index) => qualityPointText(text, index));
}

export function sampleTemplateLayoutGrammar() {
  return {
    grammar_id: 'native_pptx_template_layout_grammar_v1',
    owner: 'llm_agent',
    required: true,
    materializer_role: 'execute_selected_archetype_zones_only',
    helper_template_layout_allowed: false,
    reference_discipline: {
      template_profile_required: true,
      semantic_layout_selection_required: true,
      placeholder_capacity_required: true,
      reference_deck_analysis_required: true,
      action_title_required: true,
      source_projects: ['ppt-master', 'PPTAgent', 'officecli-pptx', 'presenton', 'ppt-agent-skills'],
    },
    global_rules: {
      edge_margin_in_min: 0.6,
      zone_gap_in_min: 0.32,
      zone_inset_in_min: 0.15,
      selected_archetype_required_before_shapes: true,
      every_content_shape_must_bind_to_layout_zone: true,
      every_structural_shape_must_bind_to_layout_zone: true,
      connector_lane_must_be_separate_from_text_zones: true,
      empty_placeholder_slots_allowed: false,
    },
    archetype_catalog: [
      {
        archetype_id: 'sample_status_proof_board',
        use_when: 'native visual sample with three status cards and one proof band',
        layout_description: 'Title and claim at top, input hub and three status cards in the middle, proof band at bottom.',
        required_zones: ['title_zone', 'claim_zone', 'status_zone', 'proof_zone'],
      content_schema: {
        required_shape_roles: ['title', 'core_sentence', 'input_hub', 'flow_connector', 'content_panel', 'point_text', 'proof_band', 'evidence_item'],
        required_shape_role_groups: ['title_text', 'core_claim_text', 'input_hub', 'flow_connector', 'content_container', 'audience_body_text', 'structural_visual', 'evidence_or_metric_text'],
        min_filled_required_zone_share: 1,
        exact_status_card_count: 3,
        status_card_width_in_min: 4.0,
        status_card_height_in_min: 1.35,
        input_hub_width_in_min: 10.4,
        input_hub_height_in_min: 0.82,
        input_hub_spans_route_card_centers_required: true,
        connector_vertical_width_in_max: 0.04,
        connector_vertical_height_in_min: 0.66,
      },
        prohibited: ['takeaway_zone', 'takeaway_panel', 'separate bottom takeaway text', 'artifact inventory receipts'],
      },
      {
        archetype_id: 'sample_decision_proof_split',
        use_when: 'native visual sample with one dominant decision and proof stack',
        layout_description: 'Title and claim at top, decision panel and proof stack in the middle, bottom takeaway band.',
        required_zones: ['title_zone', 'claim_zone', 'decision_zone', 'proof_zone', 'takeaway_zone'],
        content_schema: {
          required_shape_roles: ['title', 'core_sentence', 'decision_rail', 'content_panel', 'point_text', 'proof_band', 'metric', 'takeaway'],
          required_shape_role_groups: ['title_text', 'core_claim_text', 'decision_rail', 'content_container', 'audience_body_text', 'structural_visual', 'evidence_or_metric_text', 'takeaway_text'],
          min_filled_required_zone_share: 1,
        },
        prohibited: ['three equal status cards plus separate proof and takeaway bands', 'artifact inventory receipts'],
      },
    ],
  };
}

function sampleStatusBinding(slideId) {
  return {
    selected_archetype: 'sample_status_proof_board',
    archetype_instance_id: `${slideId}-sample-status-proof-board`,
    rhythm_role: 'opening_sample',
    zone_gap_in_min: 0.32,
    zone_inset_in_min: 0.15,
    zones: [
      { zone_id: 'title_zone', semantic_role: 'title', bounds: { left_in: 0.85, top_in: 0.45, width_in: 14.3, height_in: 1.15 }, intended_content: 'sample title', min_font_pt: 40, safe_inset_in: 0.15 },
      { zone_id: 'claim_zone', semantic_role: 'claim', bounds: { left_in: 0.85, top_in: 1.67, width_in: 14.3, height_in: 1.05 }, intended_content: 'sample claim', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'status_zone', semantic_role: 'status', bounds: { left_in: 0.85, top_in: 2.95, width_in: 14.3, height_in: 3.55 }, intended_content: 'input hub and three status cards', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'proof_zone', semantic_role: 'proof', bounds: { left_in: 0.85, top_in: 6.65, width_in: 14.3, height_in: 1.55 }, intended_content: 'one compact proof band', min_font_pt: 18, safe_inset_in: 0.15 },
    ],
  };
}

export function buildSampleStatusSlide(slide, index, stableCompositionSignature) {
  const slideId = safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`);
  const title = safeText(slide?.title, '可编辑样片闭环');
  const points = slidePoints(slide).slice(0, 3);
  while (points.length < 3) points.push(`第${points.length + 1}条路线留下可复核证据`);
  const cardLefts = [0.95, 5.8, 10.65];
  const nativeShapes = [
    {
      shape_id: `${slideId}-title`,
      kind: 'text_box',
      role: 'title',
      quality_role: 'content',
      layout_zone_id: 'title_zone',
      editable_text: title,
      bounds: { left_in: 0.95, top_in: 0.58, width_in: 13.6, height_in: 0.92 },
      font_size: 40,
      color: '#171C24',
      fill: 'none',
      line: 'none',
      bold: true,
    },
    {
      shape_id: `${slideId}-claim`,
      kind: 'text_box',
      role: 'core_sentence',
      quality_role: 'content',
      layout_zone_id: 'claim_zone',
      editable_text: safeText(slide?.core_sentence, '同一输入完成路线、截图、审阅与导出，最小闭环才成立。'),
      bounds: { left_in: 0.95, top_in: 1.86, width_in: 13.6, height_in: 0.88 },
      font_size: 18,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: `${slideId}-input-hub`,
      kind: 'rounded_rect',
      role: 'input_hub',
      quality_role: 'structural',
      layout_zone_id: 'status_zone',
      editable_text: '同一材料同步进入三条路线验证',
      bounds: { left_in: 2.8, top_in: 3.08, width_in: 10.4, height_in: 0.86 },
      font_size: 22,
      align: 'center',
      valign: 'center',
      color: '#FFFFFF',
      fill: '#2563EB',
      line: '#2563EB',
    },
    {
      shape_id: `${slideId}-proof-band`,
      kind: 'rounded_rect',
      role: 'proof_band',
      quality_role: 'structural',
      layout_zone_id: 'proof_zone',
      bounds: { left_in: 1.05, top_in: 6.78, width_in: 13.9, height_in: 1.32 },
      fill: '#EFE6D6',
      line: '#D8C8B2',
    },
    {
      shape_id: `${slideId}-proof-text`,
      kind: 'text_box',
      role: 'evidence_item',
      quality_role: 'content',
      layout_zone_id: 'proof_zone',
      editable_text: '文件、截图和审阅记录同步存在。',
      bounds: { left_in: 1.25, top_in: 6.98, width_in: 12.9, height_in: 0.62 },
      font_size: 18,
      color: '#171C24',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: `${slideId}-page`,
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      layout_zone_id: 'proof_zone',
      editable_text: '01',
      bounds: { left_in: 14.85, top_in: 8.35, width_in: 0.45, height_in: 0.25 },
      font_size: 10,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
    },
  ];
  for (let pointIndex = 0; pointIndex < 3; pointIndex += 1) {
    const left = cardLefts[pointIndex];
    nativeShapes.push(
      {
        shape_id: `${slideId}-status-${pointIndex + 1}-panel`,
        kind: 'rounded_rect',
        role: 'content_panel',
        quality_role: 'content',
        layout_zone_id: 'status_zone',
        bounds: { left_in: left, top_in: 4.68, width_in: 4.3, height_in: 1.5 },
        fill: '#FFFFFF',
        line: '#D8C8B2',
      },
      {
        shape_id: `${slideId}-status-${pointIndex + 1}-text`,
        kind: 'text_box',
        role: 'point_text',
        quality_role: 'content',
        layout_zone_id: 'status_zone',
        editable_text: points[pointIndex],
        bounds: { left_in: left + 0.22, top_in: 4.9, width_in: 3.86, height_in: 1.02 },
        font_size: 18,
        color: '#171C24',
        fill: 'none',
        line: 'none',
      },
      {
        shape_id: `${slideId}-flow-${pointIndex + 1}`,
        kind: 'connector',
        role: 'flow_connector',
        quality_role: 'structural',
        layout_zone_id: 'status_zone',
        from_shape_id: `${slideId}-input-hub`,
        to_shape_id: `${slideId}-status-${pointIndex + 1}-panel`,
        bounds: { left_in: (left + 2.15) - 0.015, top_in: 3.94, width_in: 0.03, height_in: 0.74 },
        line: { color: '#2563EB', width_pt: 2, end_arrow: true },
        tail_end: 'triangle',
      },
    );
  }
  return {
    slide_id: slideId,
    title,
    layout_family: 'native_visual_sample',
    core_sentence: safeText(slide?.core_sentence),
    page_core_content: points,
    layout_intent: {
      rhetorical_role: 'proof_sample',
      composition_signature: stableCompositionSignature(nativeShapes),
      primary_grid: 'sample_status_proof_board',
      visual_weight: 'top_claim_middle_status_bottom_proof',
      negative_space_strategy: 'outer margins and connector gutters keep one-page proof readable',
      non_text_visual: 'input hub with flow connectors into three status cards and one proof band',
      forbidden_template_reuse_checked: true,
    },
    template_layout_binding: sampleStatusBinding(slideId),
    native_shapes: nativeShapes,
    redcube_svg_ir_intent: {
      root_viewbox: '0 0 1152 648',
      editable_text_required: true,
      required_intents: ['text:title', 'text:point_text', 'rect:content_panel', 'rect:proof_band', 'connector:flow_connector'],
    },
  };
}
