#!/usr/bin/env node
// @ts-nocheck
import { createHash } from 'node:crypto';
import fs from 'node:fs';

function usage() {
  console.error('Usage: build-fixture-input.ts <benchmark.json> <output.json> [suite_id]');
}

const [, , fixturePath, outputPath, requestedSuiteId = 'data_charts'] = process.argv;
if (!fixturePath || !outputPath) {
  usage();
  process.exit(2);
}

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function contentCharCount(text) {
  return [...safeText(text)]
    .filter((char) => !/\s/.test(char) && !['，', '。', '、', ',', '.', ':', '：', ';', '；'].includes(char))
    .length;
}

function qualityPointText(text, index) {
  const normalized = safeText(text, `Point ${index + 1}`);
  if (contentCharCount(normalized) >= 12) {
    return normalized;
  }
  return `${normalized} carries explicit review evidence`;
}

function slidePoints(slide, slotCount = null) {
  const values = [];
  for (const item of Array.isArray(slide.page_core_content) ? slide.page_core_content : []) {
    if (typeof item === 'string') {
      values.push(item);
    } else if (item && typeof item === 'object') {
      const text = safeText(item.text || item.editable_text || item.body || item.title);
      if (text) values.push(text);
    }
  }
  while (values.length < (slotCount ?? 4)) {
    values.push(`Evidence point ${values.length + 1} remains editable in native PPT.`);
  }
  return values
    .slice(0, Math.max(slotCount ?? values.length, 1))
    .map((text, index) => qualityPointText(text, index));
}

function slotGeometry(total, index) {
  if (total <= 2) {
    const width = 6.35;
    return { left_in: 1.05 + index * 6.95, top_in: 3.0, width_in: width, height_in: 3.25 };
  }
  if (total === 3) {
    return { left_in: 1.05 + index * 4.65, top_in: 3.0, width_in: 4.1, height_in: 3.25 };
  }
  const row = Math.floor(index / 2);
  const col = index % 2;
  return { left_in: 1.05 + col * 6.95, top_in: 2.78 + row * 2.45, width_in: 6.25, height_in: 1.8 };
}

function panelRole(layoutFamily) {
  return {
    cover_signal: 'signal_panel',
    multi_zone_compare: 'compare_panel',
    timeline_band: 'timeline_panel',
    judgement_ladder: 'judgement_step',
    ring_cross: 'axis_panel',
    summary_peak: 'takeaway_panel',
  }[layoutFamily] || 'structured_note_panel';
}

function layoutVisualIntent(layoutFamily) {
  const byFamily = {
    cover_signal: {
      rhetorical_role: 'establish central thesis and signal hierarchy',
      primary_grid: 'hero-left evidence-right',
      visual_weight: 'high title mass with one anchored signal cluster',
      negative_space_strategy: 'open lower-right field balances dense hero copy',
      non_text_visual: 'signal spine and hero anchor',
    },
    multi_zone_compare: {
      rhetorical_role: 'compare operating zones with separable evidence blocks',
      primary_grid: 'three-column comparison rail',
      visual_weight: 'balanced zones with one dominant structural rail',
      negative_space_strategy: 'gutters separate comparable evidence lanes',
      non_text_visual: 'comparison rail with linked evidence zones',
    },
    timeline_band: {
      rhetorical_role: 'show sequence and stage cadence',
      primary_grid: 'horizontal timeline band',
      visual_weight: 'linear progression with emphasized milestone nodes',
      negative_space_strategy: 'vertical whitespace isolates the cadence band',
      non_text_visual: 'timeline band with milestone connectors',
    },
    judgement_ladder: {
      rhetorical_role: 'rank evidence into a decision ladder',
      primary_grid: 'center ladder with supporting steps',
      visual_weight: 'vertical decision spine anchors step panels',
      negative_space_strategy: 'side whitespace keeps the decision spine legible',
      non_text_visual: 'decision ladder spine',
    },
    ring_cross: {
      rhetorical_role: 'synthesize dependencies around a central hub',
      primary_grid: 'hub-and-spoke cross',
      visual_weight: 'central hub balances surrounding evidence',
      negative_space_strategy: 'radial whitespace prevents spoke collision',
      non_text_visual: 'central hub with cross-axis connectors',
    },
    summary_peak: {
      rhetorical_role: 'close with final synthesis and next action',
      primary_grid: 'takeaway peak over supporting evidence',
      visual_weight: 'single takeaway band dominates secondary notes',
      negative_space_strategy: 'lower summary field stays open for action text',
      non_text_visual: 'takeaway band and synthesis peak',
    },
  };
  return byFamily[layoutFamily] || byFamily.multi_zone_compare;
}

function structuralShapes(layoutFamily, slideId) {
  if (layoutFamily === 'cover_signal') {
    return [
      {
        shape_id: `${slideId}-ai-signal-hub`,
        kind: 'oval',
        role: 'signal_hub',
        quality_role: 'decorative',
        bounds: { left_in: 14.26, top_in: 2.7, width_in: 0.72, height_in: 0.72 },
        fill: '#B94624',
        line: 'none',
      },
      {
        shape_id: `${slideId}-ai-signal-connector`,
        kind: 'line',
        role: 'signal_connector',
        quality_role: 'decorative',
        bounds: { left_in: 14.6, top_in: 3.44, width_in: 0.06, height_in: 2.05 },
        line: '#B94624',
      },
    ];
  }
  if (layoutFamily === 'timeline_band') {
    return [{
      shape_id: `${slideId}-ai-timeline-rail`,
      kind: 'line',
      role: 'timeline_rail',
      quality_role: 'decorative',
      bounds: { left_in: 1.1, top_in: 2.98, width_in: 13.3, height_in: 0.06 },
      line: '#B94624',
    }];
  }
  if (layoutFamily === 'judgement_ladder') {
    return [{
      shape_id: `${slideId}-ai-gate-ladder-spine`,
      kind: 'line',
      role: 'gate_ladder_spine',
      quality_role: 'decorative',
      bounds: { left_in: 7.58, top_in: 2.7, width_in: 0.08, height_in: 4.92 },
      line: '#B94624',
    }];
  }
  if (layoutFamily === 'ring_cross') {
    return [
      {
        shape_id: `${slideId}-ai-center-hub`,
        kind: 'oval',
        role: 'center_hub',
        quality_role: 'decorative',
        bounds: { left_in: 7.28, top_in: 4.1, width_in: 1.0, height_in: 1.0 },
        fill: '#B94624',
        line: 'none',
      },
      {
        shape_id: `${slideId}-ai-axis-cross-horizontal`,
        kind: 'line',
        role: 'axis_connector',
        quality_role: 'decorative',
        bounds: { left_in: 7.31, top_in: 4.58, width_in: 0.32, height_in: 0.05 },
        line: '#B94624',
      },
    ];
  }
  if (layoutFamily === 'summary_peak') {
    return [{
      shape_id: `${slideId}-ai-takeaway-band`,
      kind: 'rect',
      role: 'takeaway_band',
      quality_role: 'decorative',
      bounds: { left_in: 0.92, top_in: 4.52, width_in: 13.6, height_in: 0.18 },
      fill: '#B94624',
      line: 'none',
    }];
  }
  return [{
    shape_id: `${slideId}-ai-bridge-rail`,
    kind: 'line',
    role: 'bridge_connector_rail',
    quality_role: 'decorative',
    bounds: { left_in: 1.1, top_in: 7.78, width_in: 13.15, height_in: 0.06 },
    line: '#B94624',
  }];
}

function templateLayoutGrammar() {
  const catalog = [
    ['cover_signal', 'hero signal board with explicit claim and evidence field'],
    ['multi_zone_compare', 'comparison board with separated editable evidence zones'],
    ['timeline_band', 'timeline band with milestone evidence outside the rail'],
    ['judgement_ladder', 'decision ladder with structured step evidence'],
    ['ring_cross', 'hub and axis synthesis map with bounded evidence'],
    ['summary_peak', 'closing synthesis board with proof and takeaway field'],
  ].map(([archetypeId, layoutDescription]) => ({
    archetype_id: archetypeId,
    use_when: `Use for ${archetypeId.replace(/_/g, ' ')} fixture slides when the AI plan chooses this composition.`,
    layout_description: layoutDescription,
    required_zones: ['title_zone', 'claim_zone', 'body_zone'],
    content_schema: {
      required_shape_roles: ['title', 'core_sentence', 'point_text'],
      required_shape_role_groups: [
        'title_text',
        'core_claim_text',
        'content_container',
        'audience_body_text',
        'structural_visual',
      ],
      min_filled_required_zone_share: 1,
      max_audience_text_shapes: 12,
      min_body_font_pt: 18,
    },
    prohibited: [
      'helper-selected template fallback',
      'shape coordinates without a semantic zone',
      'structural rails crossing readable text',
    ],
  }));
  return {
    grammar_id: 'native_ppt_proof_template_layout_grammar_v1',
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
      rule: 'Fixture coordinates are valid only after explicit template-profile and semantic-zone selection.',
    },
    archetype_catalog: catalog,
  };
}

function designSpecLock() {
  return {
    spec_id: 'native_ppt_proof_ai_first_design_lock_v1',
    owner: 'llm_agent',
    motif: 'warm accent rail with bounded evidence zones',
    layout_archetypes: [
      'cover_signal',
      'multi_zone_compare',
      'timeline_band',
      'judgement_ladder',
      'ring_cross',
      'summary_peak',
    ],
    palette: {
      canvas: '#F6F2EA',
      ink: '#171C24',
      muted: '#5B6570',
      accent: '#B94624',
      panel: '#EFE6D6',
    },
    typography: {
      title_pt_min: 36,
      body_pt_min: 18,
      point_index_pt_min: 16,
    },
    grid: {
      edge_margin_in_min: 0.6,
      inter_block_gap_in_min: 0.32,
    },
    layout_rhythm: {
      repeated_concrete_composition_limit: 2,
      required_distinct_composition_share: 0.75,
    },
    professional_design_brief: {
      design_register: 'native PPT proof fixture design system',
      reference_style_family: 'editorial business proof deck with explicit template zones',
      first_glance_hierarchy: 'action title, core claim, then bounded evidence shapes',
      template_profile_strategy: 'select a named archetype before assigning coordinates',
      capacity_strategy: 'bind every content shape to a semantic zone with 18pt body floor',
      forbidden_amateur_patterns: [
        'generic equal-card grid without structural intent',
        'decorative title underline as the only motif',
        'unbounded text placed directly on rails',
      ],
    },
    borrowed_principles: [
      'ppt_master_style_spec_lock',
      'template_layout_grammar',
      'template_profile',
      'semantic_layout_selection',
      'reference_deck_analysis',
      'per_page_visual_plan',
      'layout_rhythm',
      'rendered_quality_gate',
    ],
    qa_gates: ['bounds', 'font_floor', 'text_fit', 'structural_visual', 'layout_variety'],
  };
}

function templateLayoutBindingForSlide(slideId, layoutFamily) {
  return {
    selected_archetype: layoutFamily,
    archetype_instance_id: `${slideId}-${layoutFamily}`,
    rhythm_role: layoutFamily === 'summary_peak' ? 'close' : layoutFamily,
    zone_gap_in_min: 0.32,
    zone_inset_in_min: 0.15,
    zones: [
      {
        zone_id: 'title_zone',
        semantic_role: 'action_title',
        intended_content: 'slide title and visual opening accent',
        bounds: { left_in: 0.65, top_in: 0.4, width_in: 13.4, height_in: 1.35 },
        min_font_pt: 36,
        safe_inset_in: 0.15,
      },
      {
        zone_id: 'claim_zone',
        semantic_role: 'core_claim',
        intended_content: 'one sentence claim directly below the title',
        bounds: { left_in: 0.75, top_in: 1.55, width_in: 13.3, height_in: 1.35 },
        min_font_pt: 18,
        safe_inset_in: 0.15,
      },
      {
        zone_id: 'body_zone',
        semantic_role: 'bounded_evidence',
        intended_content: 'editable panels, point indexes, and body evidence text',
        bounds: { left_in: 0.7, top_in: 2.55, width_in: 14.35, height_in: 5.25 },
        min_font_pt: 18,
        safe_inset_in: 0.15,
      },
    ],
  };
}

function deckLayoutRhythmPlan(slides) {
  return {
    owner: 'llm_agent',
    required: true,
    slides: slides.map((slide, index) => ({
      slide_id: slide.slide_id,
      rhetorical_role: slide.layout_intent.rhetorical_role,
      selected_archetype: slide.template_layout_binding.selected_archetype,
      rhythm_role: slide.template_layout_binding.rhythm_role,
      primary_grid: slide.layout_intent.primary_grid,
      composition_signature_budget: slide.layout_intent.composition_signature,
      proof_object: slide.layout_intent.non_text_visual,
      sequence_index: index + 1,
    })),
  };
}

function explicitQualityRole(shape) {
  const role = safeText(shape.role);
  if (shape.quality_role) {
    return shape;
  }
  if (role === 'page_number' || role === 'page_no' || role === 'footer' || role === 'cover_meta') {
    return { ...shape, quality_role: 'auxiliary' };
  }
  if (role === 'title' || role === 'core_sentence' || role === 'point_index' || role === 'point_text') {
    return { ...shape, quality_role: 'content' };
  }
  return shape;
}

function withLayoutZone(shape) {
  const role = safeText(shape.role);
  if (shape.layout_zone_id || shape.quality_role === 'decorative' || shape.quality_role === 'auxiliary') {
    return shape;
  }
  if (role === 'title') {
    return { ...shape, layout_zone_id: 'title_zone' };
  }
  if (role === 'core_sentence') {
    return { ...shape, layout_zone_id: 'claim_zone' };
  }
  return { ...shape, layout_zone_id: 'body_zone' };
}

function layoutIntentForSlide({ slideId, layoutFamily, slotCount, shapes }) {
  const visualIntent = layoutVisualIntent(layoutFamily);
  const signatureRoles = new Set([
    'title',
    'core_sentence',
    'compare_panel',
    'signal_panel',
    'timeline_panel',
    'judgement_step',
    'axis_panel',
    'takeaway_panel',
    'structured_note_panel',
    'chart',
    'table',
    'metric_grid',
  ]);
  const signaturePayload = shapes
    .filter((shape) => signatureRoles.has(String(shape.role || '')))
    .map((shape) => {
      const bounds = shape.bounds || {};
      return {
        role: shape.role,
        kind: shape.kind,
        x: Math.round((Number(bounds.left_in || 0) * 72) / 36),
        y: Math.round((Number(bounds.top_in || 0) * 72) / 36),
        w: Math.round((Number(bounds.width_in || 0) * 72) / 36),
        h: Math.round((Number(bounds.height_in || 0) * 72) / 36),
      };
    })
    .sort((left, right) => (
      String(left.role).localeCompare(String(right.role))
      || left.y - right.y
      || left.x - right.x
      || left.w - right.w
      || left.h - right.h
    ));
  const digest = createHash('sha256').update(JSON.stringify(signaturePayload)).digest('hex').slice(0, 12);
  const roleSummary = [...new Set(signaturePayload.map((item) => item.role))]
    .sort()
    .map((role) => `${role}:${signaturePayload.filter((item) => item.role === role).length}`)
    .join('-') || 'empty';
  return {
    rhetorical_role: visualIntent.rhetorical_role,
    composition_signature: `native-composition:${digest}:${roleSummary}`,
    primary_grid: `${visualIntent.primary_grid}__slots_${slotCount}`,
    visual_weight: visualIntent.visual_weight,
    negative_space_strategy: `${visualIntent.negative_space_strategy} (${slideId})`,
    non_text_visual: visualIntent.non_text_visual,
    forbidden_template_reuse_checked: true,
  };
}

function buildAiSlide(slide) {
  const slideId = safeText(slide.slide_id, 'S01');
  const layoutFamily = safeText(slide.layout_family, 'multi_zone_compare');
  const title = safeText(slide.title, 'Native PPT proof');
  const core = safeText(
    slide.core_sentence,
    'AI authored spatial plan decides the layout; helper only materializes it.',
  );
  const points = slidePoints(slide);
  const desiredSlots = Math.min(4, Math.max(3, points.length));
  const actualPanelCount = desiredSlots;
  const shapes = [
    {
      shape_id: `${slideId}-top-band`,
      kind: 'rect',
      role: 'background_accent',
      quality_role: 'decorative',
      bounds: { left_in: 0, top_in: 0, width_in: 16, height_in: 0.22 },
      fill: '#B94624',
      line: 'none',
    },
    {
      shape_id: `${slideId}-title`,
      kind: 'text_box',
      role: 'title',
      quality_role: 'content',
      layout_zone_id: 'title_zone',
      editable_text: title,
      bounds: { left_in: 0.9, top_in: 0.54, width_in: 12.7, height_in: layoutFamily === 'cover_signal' ? 1.12 : 1.02 },
      font_size: layoutFamily === 'cover_signal' ? 56 : 44,
      color: '#171C24',
      fill: 'none',
      line: 'none',
      bold: true,
    },
    {
      shape_id: `${slideId}-core`,
      kind: 'text_box',
      role: 'core_sentence',
      quality_role: 'content',
      layout_zone_id: 'claim_zone',
      editable_text: core,
      bounds: { left_in: 0.95, top_in: 1.78, width_in: 12.3, height_in: 0.98 },
      font_size: 20,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: `${slideId}-side-anchor`,
      kind: 'rect',
      role: 'accent_anchor',
      quality_role: 'decorative',
      bounds: { left_in: 0.52, top_in: 0.72, width_in: 0.1, height_in: 2.3 },
      fill: '#B94624',
      line: 'none',
    },
    {
      shape_id: `${slideId}-dot`,
      kind: 'oval',
      role: 'accent_dot',
      quality_role: 'decorative',
      bounds: { left_in: 14.25, top_in: 0.68, width_in: 0.32, height_in: 0.32 },
      fill: '#B94624',
      line: 'none',
    },
    {
      shape_id: `${slideId}-page`,
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      editable_text: slideId.replace(/^[A-Z]+/, '').padStart(2, '0'),
      bounds: { left_in: 14.05, top_in: 7.95, width_in: 0.9, height_in: 0.44 },
      font_size: 18,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
      align: 'right',
    },
    ...structuralShapes(layoutFamily, slideId),
  ];
  for (let index = 0; index < actualPanelCount; index += 1) {
    shapes.push({
      shape_id: `${slideId}-slot-${index + 1}-panel`,
      kind: 'rounded_rect',
      role: panelRole(layoutFamily),
      quality_role: 'content',
      bounds: slotGeometry(actualPanelCount, index),
      fill: '#EFE6D6',
      line: '#D8C8B2',
    });
  }
  for (let index = 0; index < desiredSlots; index += 1) {
    const overflowSummaryText = layoutFamily === 'summary_peak' && index >= actualPanelCount;
    const base = overflowSummaryText
      ? { left_in: 1.15, top_in: 6.25, width_in: 12.9, height_in: 0.78 }
      : slotGeometry(Math.max(actualPanelCount, desiredSlots), Math.min(index, actualPanelCount - 1));
    const pointNumber = index + 1;
    shapes.push({
      shape_id: `${slideId}-slot-${pointNumber}-index`,
      kind: 'text_box',
      role: 'point_index',
      quality_role: 'content',
      layout_zone_id: 'body_zone',
      editable_text: String(pointNumber).padStart(2, '0'),
      bounds: {
        left_in: base.left_in + 0.24,
        top_in: base.top_in + (overflowSummaryText ? 0.02 : 0.25),
        width_in: 0.78,
        height_in: 0.52,
      },
      font_size: 16,
      color: '#B94624',
      fill: 'none',
      line: 'none',
      bold: true,
    });
    shapes.push({
      shape_id: `${slideId}-slot-${pointNumber}-text`,
      kind: 'text_box',
      role: 'point_text',
      quality_role: 'content',
      layout_zone_id: 'body_zone',
      editable_text: points[index] || `Point ${pointNumber} carries complete audience evidence.`,
      bounds: {
        left_in: base.left_in + (overflowSummaryText ? 1.05 : 0.28),
        top_in: base.top_in + (overflowSummaryText ? 0.02 : 0.82),
        width_in: base.width_in - (overflowSummaryText ? 1.4 : 0.56),
        height_in: overflowSummaryText ? 0.92 : 1.44,
      },
      font_size: 18,
      color: '#171C24',
      fill: 'none',
      line: 'none',
    });
  }
  return {
    slide_id: slideId,
    title,
    layout_family: layoutFamily,
    core_sentence: core,
    page_core_content: points,
    layout_intent: layoutIntentForSlide({ slideId, layoutFamily, slotCount: desiredSlots, shapes }),
    template_layout_binding: templateLayoutBindingForSlide(slideId, layoutFamily),
    native_shapes: shapes.map((shape) => withLayoutZone(explicitQualityRole(shape))),
  };
}

const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const suite = (fixture.suites || []).find((item) => item.suite_id === requestedSuiteId)
  || (fixture.suites || [fixture])[0];
if (!suite?.editable_shape_plan?.slides) {
  throw new Error(`Fixture suite ${requestedSuiteId} does not include editable_shape_plan.slides`);
}
const slides = suite.editable_shape_plan.slides.map(buildAiSlide);
const payload = {
  fixture_id: fixture.fixture_id,
  suite_id: suite.suite_id,
  route: 'author_pptx_native',
  editable_shape_plan: {
    contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
    route: suite.editable_shape_plan.route || 'author_pptx_native',
    design_spec_lock: designSpecLock(),
    template_layout_grammar: templateLayoutGrammar(),
    deck_layout_rhythm_plan: deckLayoutRhythmPlan(slides),
    slides,
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
