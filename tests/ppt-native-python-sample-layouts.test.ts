// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAiSlide,
  materializerPayload,
  runNativePlanValidation,
} from './helpers/ppt-native-python-layout-fixtures.ts';

test('native PPTX one-slide sample preflight rejects overloaded general board layouts', () => {
  const overloaded = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'cover_signal',
    title: '一份资料，三条生成路径，一个闭环判断',
    core: '判断交付闭环，要同时看同一输入、三条路径执行，以及三项交付门是否全部通过。',
    slotCount: 3,
  });
  overloaded.template_layout_binding = {
    ...overloaded.template_layout_binding,
    selected_archetype: 'executive_status_board',
    zones: [
      ...overloaded.template_layout_binding.zones,
      {
        zone_id: 'takeaway_zone',
        semantic_role: 'takeaway',
        bounds: { left_in: 0.85, top_in: 6.5, width_in: 14.3, height_in: 1.8 },
        intended_content: 'separate takeaway',
        min_font_pt: 18,
        safe_inset_in: 0.15,
      },
    ],
  };
  overloaded.native_shapes.push(
    {
      shape_id: 'S01-evidence-axis',
      kind: 'line',
      role: 'evidence_axis',
      quality_role: 'structural',
      layout_zone_id: 'evidence_zone',
      bounds: { left_in: 1.2, top_in: 6.24, width_in: 13.25, height_in: 0.04 },
      fill: 'none',
      line: '#2563EB',
    },
    {
      shape_id: 'S01-takeaway-panel',
      kind: 'rounded_rect',
      role: 'takeaway_panel',
      quality_role: 'content',
      layout_zone_id: 'takeaway_zone',
      bounds: { left_in: 0.95, top_in: 6.58, width_in: 13.95, height_in: 1.6 },
      fill: '#FFFFFF',
      line: '#99F6E4',
    },
    {
      shape_id: 'S01-takeaway-text',
      kind: 'text_box',
      role: 'takeaway',
      quality_role: 'content',
      layout_zone_id: 'takeaway_zone',
      editable_text: '课堂带走点：这项证据只支持最小路线演化验证，不能外推到复杂多主题或长期缓存稳定性。',
      bounds: { left_in: 1.2, top_in: 6.78, width_in: 13.35, height_in: 1.25 },
      font_size: 20,
      color: '#171C24',
      fill: 'none',
      line: 'none',
    },
  );
  const payload = materializerPayload([overloaded]);
  payload.native_ppt_sample_layout_profile = {
    required: true,
    allowed_sample_archetypes: ['sample_status_proof_board', 'sample_decision_proof_split'],
    forbidden_archetypes: ['executive_status_board', 'decision_dashboard', 'professional_system_map'],
  };
  const rejected = runNativePlanValidation(payload);
  assert.equal(rejected.ok, false);
  const failures = JSON.stringify(rejected.failures);
  assert.match(failures, /ai_first_native_sample_archetype_not_capacity_safe/);
  assert.match(failures, /ai_first_native_sample_forbidden_general_archetype/);
});

test('native PPTX one-slide sample accepts capacity-safe status proof board', () => {
  const sample = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'cover_signal',
    title: '三条生成路线，怎样才算闭环？',
    core: '同一输入完成三条路线，并留下文件、截图和审阅记录，才算最小闭环成立。',
    points: [
      '同一资料包控制输入。',
      '三条路线各有真实产物。',
      '截图、审阅、导出齐备。',
    ],
    slotCount: 3,
  });
  sample.template_layout_binding = {
    selected_archetype: 'sample_status_proof_board',
    archetype_instance_id: 'S01-sample-status-proof-board',
    rhythm_role: 'opening_sample',
    zone_gap_in_min: 0.32,
    zone_inset_in_min: 0.15,
    zones: [
      { zone_id: 'title_zone', semantic_role: 'title', bounds: { left_in: 0.85, top_in: 0.45, width_in: 14.3, height_in: 1.2 }, intended_content: 'title', min_font_pt: 36, safe_inset_in: 0.15 },
      { zone_id: 'claim_zone', semantic_role: 'claim', bounds: { left_in: 0.85, top_in: 1.72, width_in: 14.3, height_in: 1.1 }, intended_content: 'claim', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'status_zone', semantic_role: 'status', bounds: { left_in: 0.85, top_in: 3.05, width_in: 14.3, height_in: 2.4 }, intended_content: 'three status cards', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'proof_zone', semantic_role: 'proof', bounds: { left_in: 0.85, top_in: 6.0, width_in: 14.3, height_in: 1.5 }, intended_content: 'proof band', min_font_pt: 18, safe_inset_in: 0.15 },
    ],
  };
  sample.layout_intent.primary_grid = 'sample_status_proof_board';
  sample.layout_intent.non_text_visual = 'proof band with status board cards';
  sample.native_shapes = sample.native_shapes
    .filter((shape) => !['takeaway', 'takeaway_panel', 'page_number'].includes(shape.role) && shape.shape_id !== 'S01-evidence-summary')
    .map((shape) => {
      if (shape.role === 'title') {
        return { ...shape, layout_zone_id: 'title_zone', bounds: { left_in: 0.95, top_in: 0.58, width_in: 13.5, height_in: 0.96 }, font_size: 36 };
      }
      if (shape.role === 'core_sentence') {
        return { ...shape, layout_zone_id: 'claim_zone', bounds: { left_in: 0.95, top_in: 1.9, width_in: 13.5, height_in: 0.9 }, font_size: 18 };
      }
      if (shape.role === 'signal_hub') {
        return { ...shape, role: 'proof_hub', layout_zone_id: 'proof_zone', bounds: { left_in: 1.2, top_in: 6.32, width_in: 0.46, height_in: 0.46 } };
      }
      if (shape.role === 'signal_connector') {
        return { ...shape, role: 'proof_connector', layout_zone_id: 'proof_zone', bounds: { left_in: 1.75, top_in: 6.52, width_in: 0.74, height_in: 0.04 } };
      }
      if (shape.role === 'signal_panel') {
        const index = Number(String(shape.shape_id || '').match(/slot-(\d+)/)?.[1] || 1) - 1;
        return {
          ...shape,
          role: 'content_panel',
          layout_zone_id: 'status_zone',
          bounds: { left_in: [0.95, 5.8, 10.65][index] || shape.bounds.left_in, top_in: 3.18, width_in: 4.4, height_in: 2.08 },
        };
      }
      if (shape.role === 'point_index') {
        const index = Number(String(shape.shape_id || '').match(/slot-(\d+)/)?.[1] || 1) - 1;
        return {
          ...shape,
          layout_zone_id: 'status_zone',
          bounds: { ...shape.bounds, left_in: ([0.95, 5.8, 10.65][index] || shape.bounds.left_in) + 0.24, top_in: 3.45 },
        };
      }
      if (shape.role === 'point_text') {
        const index = Number(String(shape.shape_id || '').match(/slot-(\d+)/)?.[1] || 1) - 1;
        const concisePoints = [
          '同源输入材料已固定可复核',
          '三条路线产物均可检查留证',
          '截图审阅导出证据齐备可查',
        ];
        return {
          ...shape,
          layout_zone_id: 'status_zone',
          editable_text: concisePoints[index] || shape.editable_text,
          bounds: { left_in: ([0.95, 5.8, 10.65][index] || shape.bounds.left_in) + 0.24, top_in: shape.bounds.top_in - 0.04, width_in: 3.92, height_in: 1.1 },
          font_size: 18,
          margin: '0.08in',
        };
      }
      if (shape.role === 'evidence_item') {
        if (shape.shape_id === 'S01-evidence-summary') {
          return null;
        }
        return { ...shape, role: 'evidence_item', quality_role: 'content', layout_zone_id: 'proof_zone', editable_text: '文件、截图、审阅记录三项齐备。', bounds: { left_in: 2.7, top_in: 6.34, width_in: 11.8, height_in: 0.88 }, font_size: 18 };
      }
      return shape;
    })
    .filter(Boolean);
  sample.native_shapes.push(
    {
      shape_id: 'S01-input-hub',
      kind: 'oval',
      role: 'input_hub',
      quality_role: 'structural',
      layout_zone_id: 'status_zone',
      bounds: { left_in: 7.38, top_in: 3.12, width_in: 0.72, height_in: 0.72 },
      fill: '#DBEAFE',
      line: '#2563EB',
    },
    {
      shape_id: 'S01-flow-left',
      kind: 'connector',
      role: 'flow_connector',
      quality_role: 'structural',
      layout_zone_id: 'status_zone',
      bounds: { left_in: 4.92, top_in: 3.56, width_in: 2.3, height_in: 0.04 },
      fill: 'none',
      line: '#2563EB',
    },
    {
      shape_id: 'S01-flow-right',
      kind: 'connector',
      role: 'merge_connector',
      quality_role: 'structural',
      layout_zone_id: 'status_zone',
      bounds: { left_in: 8.32, top_in: 3.56, width_in: 2.3, height_in: 0.04 },
      fill: 'none',
      line: '#2563EB',
    },
    {
      shape_id: 'S01-page',
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      editable_text: '01',
      bounds: { left_in: 14.2, top_in: 8.08, width_in: 0.55, height_in: 0.32 },
      font_size: 12,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
    },
  );
  const payload = materializerPayload([sample]);
  payload.editable_shape_plan.template_layout_grammar.archetype_catalog.unshift({
    archetype_id: 'sample_status_proof_board',
    use_when: 'one slide native visual sample',
    layout_description: 'title, claim, three status cards, and one proof band only',
    required_zones: ['title_zone', 'claim_zone', 'status_zone', 'proof_zone'],
    content_schema: {
      required_shape_roles: ['title', 'core_sentence', 'input_hub', 'flow_connector', 'content_panel', 'point_text', 'proof_band', 'evidence_item'],
      required_shape_role_groups: ['title_text', 'core_claim_text', 'input_hub', 'flow_connector', 'content_container', 'audience_body_text', 'structural_visual', 'evidence_or_metric_text'],
      min_filled_required_zone_share: 1,
    },
    prohibited: ['takeaway_zone', 'takeaway_panel'],
  });
  payload.native_ppt_sample_layout_profile = {
    required: true,
    allowed_sample_archetypes: ['sample_status_proof_board', 'sample_decision_proof_split'],
    forbidden_archetypes: ['executive_status_board', 'decision_dashboard', 'professional_system_map'],
    archetype_contracts: [
      {
        archetype_id: 'sample_status_proof_board',
        zone_floor_in: {
          title_zone: 1.15,
          claim_zone: 1.05,
          status_zone: 2.1,
          proof_zone: 1.35,
        },
      },
    ],
  };
  const accepted = runNativePlanValidation(payload);
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));
});

test('native PPTX one-slide sample accepts compact two-archetype grammar', () => {
  const sample = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'cover_signal',
    title: '三条生成路线，怎样才算闭环？',
    core: '同一输入完成三条路线，并留下文件、截图和审阅记录，才算最小闭环成立。',
    points: [
      '同源输入已固定。',
      '三条路线有产物。',
      '截图审阅导出齐备。',
    ],
    slotCount: 3,
  });
  sample.template_layout_binding = {
    selected_archetype: 'sample_status_proof_board',
    archetype_instance_id: 'S01-sample-status-proof-board',
    rhythm_role: 'opening_sample',
    zone_gap_in_min: 0.32,
    zone_inset_in_min: 0.15,
    zones: [
      { zone_id: 'title_zone', semantic_role: 'title', bounds: { left_in: 0.85, top_in: 0.45, width_in: 14.3, height_in: 1.2 }, intended_content: 'title', min_font_pt: 36, safe_inset_in: 0.15 },
      { zone_id: 'claim_zone', semantic_role: 'claim', bounds: { left_in: 0.85, top_in: 1.72, width_in: 14.3, height_in: 1.1 }, intended_content: 'claim', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'status_zone', semantic_role: 'status', bounds: { left_in: 0.85, top_in: 3.05, width_in: 14.3, height_in: 2.4 }, intended_content: 'three status cards', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'proof_zone', semantic_role: 'proof', bounds: { left_in: 0.85, top_in: 6.0, width_in: 14.3, height_in: 1.5 }, intended_content: 'proof band', min_font_pt: 18, safe_inset_in: 0.15 },
    ],
  };
  sample.layout_intent.primary_grid = 'sample_status_proof_board';
  sample.layout_intent.non_text_visual = 'input hub with route cards and proof band';
  sample.native_shapes = [
    {
      shape_id: 'S01-title',
      kind: 'text_box',
      role: 'title',
      quality_role: 'content',
      layout_zone_id: 'title_zone',
      editable_text: '三条生成路线，怎样才算闭环？',
      bounds: { left_in: 0.95, top_in: 0.58, width_in: 13.5, height_in: 0.96 },
      font_size: 36,
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-claim',
      kind: 'text_box',
      role: 'core_sentence',
      quality_role: 'content',
      layout_zone_id: 'claim_zone',
      editable_text: '同一输入完成三条路线，并留下文件、截图和审阅记录。',
      bounds: { left_in: 0.95, top_in: 1.9, width_in: 13.5, height_in: 0.9 },
      font_size: 18,
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-input-hub',
      kind: 'oval',
      role: 'input_hub',
      quality_role: 'structural',
      layout_zone_id: 'status_zone',
      bounds: { left_in: 7.38, top_in: 3.12, width_in: 0.72, height_in: 0.72 },
      fill: '#DBEAFE',
      line: '#2563EB',
    },
    ...[0.95, 5.8, 10.65].flatMap((left, index) => ([
      {
        shape_id: `S01-card-${index + 1}`,
        kind: 'rounded_rect',
        role: 'content_panel',
        quality_role: 'content',
        layout_zone_id: 'status_zone',
        bounds: { left_in: left, top_in: 3.18, width_in: 4.4, height_in: 2.08 },
        fill: '#FFFFFF',
        line: '#99F6E4',
      },
      {
        shape_id: `S01-text-${index + 1}`,
        kind: 'text_box',
        role: 'point_text',
        quality_role: 'content',
        layout_zone_id: 'status_zone',
        editable_text: ['同源输入材料已经固定可复核', '三条生成路线产物均可检查', '截图审阅导出证据齐备可查'][index],
        bounds: { left_in: left + 0.24, top_in: 3.74, width_in: 3.92, height_in: 1.1 },
        font_size: 18,
        fill: 'none',
        line: 'none',
      },
    ])),
    {
      shape_id: 'S01-flow-left',
      kind: 'connector',
      role: 'flow_connector',
      quality_role: 'structural',
      layout_zone_id: 'status_zone',
      bounds: { left_in: 4.92, top_in: 3.28, width_in: 2.3, height_in: 0.04 },
      fill: 'none',
      line: '#2563EB',
    },
    {
      shape_id: 'S01-flow-right',
      kind: 'connector',
      role: 'flow_connector',
      quality_role: 'structural',
      layout_zone_id: 'status_zone',
      bounds: { left_in: 8.32, top_in: 3.28, width_in: 2.3, height_in: 0.04 },
      fill: 'none',
      line: '#2563EB',
    },
    {
      shape_id: 'S01-proof-band',
      kind: 'rounded_rect',
      role: 'proof_band',
      quality_role: 'structural',
      layout_zone_id: 'proof_zone',
      bounds: { left_in: 1.05, top_in: 6.2, width_in: 13.95, height_in: 1.06 },
      fill: '#0F766E',
      line: 'none',
    },
    {
      shape_id: 'S01-proof-text',
      kind: 'text_box',
      role: 'evidence_item',
      quality_role: 'content',
      layout_zone_id: 'proof_zone',
      editable_text: '文件、截图、审阅记录三项齐备。',
      bounds: { left_in: 1.6, top_in: 6.34, width_in: 12.2, height_in: 0.72 },
      font_size: 18,
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-page',
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      editable_text: '01',
      bounds: { left_in: 14.2, top_in: 8.08, width_in: 0.55, height_in: 0.32 },
      font_size: 12,
      fill: 'none',
      line: 'none',
    },
  ];
  const payload = materializerPayload([sample]);
  payload.editable_shape_plan.authoring_mode = 'native_visual_sample_compact';
  payload.editable_shape_plan.template_layout_grammar.archetype_catalog = [
    {
      archetype_id: 'sample_status_proof_board',
      use_when: 'one slide native visual sample',
      layout_description: 'title, claim, three status cards, and one proof band only',
      required_zones: ['title_zone', 'claim_zone', 'status_zone', 'proof_zone'],
      content_schema: {
        required_shape_roles: ['title', 'core_sentence', 'input_hub', 'flow_connector', 'content_panel', 'point_text', 'proof_band', 'evidence_item'],
        required_shape_role_groups: ['title_text', 'core_claim_text', 'input_hub', 'flow_connector', 'content_container', 'audience_body_text', 'structural_visual', 'evidence_or_metric_text'],
        min_filled_required_zone_share: 1,
      },
      prohibited: ['takeaway_zone', 'takeaway_panel'],
    },
    {
      archetype_id: 'sample_decision_proof_split',
      use_when: 'one slide native decision proof sample',
      layout_description: 'title, claim, decision panel, proof stack, and takeaway band',
      required_zones: ['title_zone', 'claim_zone', 'decision_zone', 'proof_zone', 'takeaway_zone'],
      content_schema: {
        required_shape_roles: ['title', 'core_sentence', 'decision_rail', 'content_panel', 'point_text', 'proof_band', 'metric', 'takeaway'],
        required_shape_role_groups: ['title_text', 'core_claim_text', 'decision_rail', 'content_container', 'audience_body_text', 'structural_visual', 'evidence_or_metric_text', 'takeaway_text'],
        min_filled_required_zone_share: 1,
      },
      prohibited: ['three equal status cards plus separate proof and takeaway bands'],
    },
  ];
  payload.editable_shape_plan.design_spec_lock.layout_archetypes = [
    'sample_status_proof_board',
    'sample_decision_proof_split',
  ];
  payload.editable_shape_plan.slides[0] = sample;
  payload.native_ppt_sample_layout_profile = {
    required: true,
    allowed_sample_archetypes: ['sample_status_proof_board', 'sample_decision_proof_split'],
    forbidden_archetypes: ['executive_status_board', 'decision_dashboard', 'professional_system_map'],
  };
  const accepted = runNativePlanValidation(payload);
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));
});

test('native PPTX one-slide sample requires visible input-to-route-to-proof flow', () => {
  const sample = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'cover_signal',
    title: '三条路线，汇入闭环证据',
    core: '同一输入先分流到三条路线，再汇入审查与导出证据。',
    points: [
      '同一资料包控制输入。',
      '三条路线各有真实产物。',
      '截图、审阅、导出齐备。',
    ],
    slotCount: 3,
  });
  sample.template_layout_binding = {
    selected_archetype: 'sample_status_proof_board',
    archetype_instance_id: 'S01-sample-status-proof-board',
    rhythm_role: 'opening_sample',
    zone_gap_in_min: 0.32,
    zone_inset_in_min: 0.15,
    zones: [
      { zone_id: 'title_zone', semantic_role: 'title', bounds: { left_in: 0.85, top_in: 0.45, width_in: 14.3, height_in: 1.2 }, intended_content: 'title', min_font_pt: 36, safe_inset_in: 0.15 },
      { zone_id: 'claim_zone', semantic_role: 'claim', bounds: { left_in: 0.85, top_in: 1.72, width_in: 14.3, height_in: 1.1 }, intended_content: 'claim', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'status_zone', semantic_role: 'status', bounds: { left_in: 0.85, top_in: 3.05, width_in: 14.3, height_in: 2.4 }, intended_content: 'input hub and three status cards', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'proof_zone', semantic_role: 'proof', bounds: { left_in: 0.85, top_in: 6.0, width_in: 14.3, height_in: 1.5 }, intended_content: 'proof band', min_font_pt: 18, safe_inset_in: 0.15 },
    ],
  };
  sample.layout_intent.primary_grid = 'sample_status_proof_board';
  sample.layout_intent.non_text_visual = 'input hub with flow connectors into three status cards and proof band';
  sample.native_shapes = sample.native_shapes
    .filter((shape) => !['takeaway', 'takeaway_panel', 'page_number'].includes(shape.role) && !['signal_connector'].includes(shape.role) && shape.shape_id !== 'S01-evidence-note')
    .map((shape) => {
      if (shape.role === 'title') {
        return { ...shape, layout_zone_id: 'title_zone', bounds: { left_in: 0.95, top_in: 0.58, width_in: 13.5, height_in: 0.96 }, font_size: 36 };
      }
      if (shape.role === 'core_sentence') {
        return { ...shape, layout_zone_id: 'claim_zone', bounds: { left_in: 0.95, top_in: 1.9, width_in: 13.5, height_in: 0.9 }, font_size: 18 };
      }
      if (shape.role === 'signal_hub') {
        return { ...shape, role: 'proof_band', quality_role: 'structural', layout_zone_id: 'proof_zone', bounds: { left_in: 1.05, top_in: 6.2, width_in: 13.95, height_in: 1.06 }, fill: '#0F766E', line: 'none' };
      }
      if (shape.role === 'signal_connector') {
        return { ...shape, role: 'proof_connector', quality_role: 'structural', layout_zone_id: 'proof_zone', bounds: { left_in: 7.75, top_in: 6.06, width_in: 0.04, height_in: 0.3 }, line: '#2563EB' };
      }
      if (shape.role === 'signal_panel') {
        const index = Number(String(shape.shape_id || '').match(/slot-(\d+)/)?.[1] || 1) - 1;
        return {
          ...shape,
          role: 'content_panel',
          layout_zone_id: 'status_zone',
          bounds: { left_in: [0.95, 5.8, 10.65][index] || shape.bounds.left_in, top_in: 3.18, width_in: 4.4, height_in: 2.08 },
        };
      }
      if (shape.role === 'point_index') {
        const index = Number(String(shape.shape_id || '').match(/slot-(\d+)/)?.[1] || 1) - 1;
        return {
          ...shape,
          layout_zone_id: 'status_zone',
          bounds: { ...shape.bounds, left_in: ([0.95, 5.8, 10.65][index] || shape.bounds.left_in) + 0.24, top_in: 3.45 },
        };
      }
      if (shape.role === 'point_text') {
        const index = Number(String(shape.shape_id || '').match(/slot-(\d+)/)?.[1] || 1) - 1;
        const concisePoints = [
          '同源输入材料已固定可复核',
          '三条路线产物均可检查留证',
          '截图审阅导出证据齐备可查',
        ];
        return {
          ...shape,
          layout_zone_id: 'status_zone',
          editable_text: concisePoints[index] || shape.editable_text,
          bounds: { left_in: ([0.95, 5.8, 10.65][index] || shape.bounds.left_in) + 0.24, top_in: shape.bounds.top_in - 0.04, width_in: 3.92, height_in: 1.1 },
          font_size: 18,
          margin: '0.08in',
        };
      }
      if (shape.role === 'evidence_item') {
        if (shape.shape_id === 'S01-evidence-summary') return null;
        return { ...shape, role: 'evidence_item', quality_role: 'content', layout_zone_id: 'proof_zone', editable_text: '文件、截图、审阅记录三项齐备。', bounds: { left_in: 1.6, top_in: 6.34, width_in: 12.2, height_in: 0.72 }, font_size: 18 };
      }
      return shape;
    })
    .filter(Boolean);
  sample.native_shapes.push(
    {
      shape_id: 'S01-input-hub',
      kind: 'oval',
      role: 'input_hub',
      quality_role: 'structural',
      layout_zone_id: 'status_zone',
      bounds: { left_in: 7.38, top_in: 3.12, width_in: 0.72, height_in: 0.72 },
      fill: '#DBEAFE',
      line: '#2563EB',
    },
    {
      shape_id: 'S01-flow-left',
      kind: 'connector',
      role: 'flow_connector',
      quality_role: 'structural',
      layout_zone_id: 'status_zone',
      bounds: { left_in: 4.92, top_in: 3.56, width_in: 2.3, height_in: 0.04 },
      fill: 'none',
      line: '#2563EB',
    },
    {
      shape_id: 'S01-flow-right',
      kind: 'connector',
      role: 'merge_connector',
      quality_role: 'structural',
      layout_zone_id: 'status_zone',
      bounds: { left_in: 8.32, top_in: 3.56, width_in: 2.3, height_in: 0.04 },
      fill: 'none',
      line: '#2563EB',
    },
    {
      shape_id: 'S01-proof-text',
      kind: 'text_box',
      role: 'evidence_item',
      quality_role: 'content',
      layout_zone_id: 'proof_zone',
      editable_text: '文件、截图、审阅记录三项齐备。',
      bounds: { left_in: 1.6, top_in: 6.34, width_in: 12.2, height_in: 0.72 },
      font_size: 18,
    },
    {
      shape_id: 'S01-page',
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      editable_text: '01',
      bounds: { left_in: 14.2, top_in: 8.08, width_in: 0.55, height_in: 0.32 },
      font_size: 12,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
    },
  );
  const payload = materializerPayload([sample]);
  payload.editable_shape_plan.template_layout_grammar.archetype_catalog.unshift({
    archetype_id: 'sample_status_proof_board',
    use_when: 'one slide native visual sample',
    layout_description: 'title, claim, input hub, three status cards, flow connectors, and one proof band only',
    required_zones: ['title_zone', 'claim_zone', 'status_zone', 'proof_zone'],
    content_schema: {
      required_shape_roles: ['title', 'core_sentence', 'input_hub', 'flow_connector', 'content_panel', 'point_text', 'proof_band', 'evidence_item'],
      required_shape_role_groups: ['title_text', 'core_claim_text', 'input_hub', 'flow_connector', 'content_container', 'audience_body_text', 'structural_visual', 'evidence_or_metric_text'],
      min_filled_required_zone_share: 1,
    },
    prohibited: ['takeaway_zone', 'takeaway_panel'],
  });
  payload.native_ppt_sample_layout_profile = {
    required: true,
    allowed_sample_archetypes: ['sample_status_proof_board', 'sample_decision_proof_split'],
    forbidden_archetypes: ['executive_status_board', 'decision_dashboard', 'professional_system_map'],
    archetype_contracts: [
      {
        archetype_id: 'sample_status_proof_board',
        zone_floor_in: {
          title_zone: 1.15,
          claim_zone: 1.05,
          status_zone: 2.1,
          proof_zone: 1.35,
        },
      },
    ],
  };
  const accepted = runNativePlanValidation(payload);
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));

  const missingFlow = JSON.parse(JSON.stringify(payload));
  missingFlow.editable_shape_plan.slides[0].native_shapes = missingFlow.editable_shape_plan.slides[0].native_shapes
    .filter((shape) => !['input_hub', 'flow_connector', 'merge_connector'].includes(shape.role));
  const rejected = runNativePlanValidation(missingFlow);
  assert.equal(rejected.ok, false);
  assert.match(JSON.stringify(rejected.failures), /ai_first_native_sample_flow_structure_missing/);
});

test('native PPTX one-slide sample rejects compressed cards and extra proof-zone notes', () => {
  const sample = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'cover_signal',
    title: '三条生成通道，如何判断真正闭环',
    core: '先看同一份输入，再看三条通道、三个交付门和样片记录是否同时成立。',
    points: [
      '图像通道先检查页面视觉是否可读。',
      '网页通道确认结构能被截图复核。',
      '演示文稿通道生成可编辑样片。',
    ],
    slotCount: 3,
  });
  sample.template_layout_binding = {
    selected_archetype: 'sample_status_proof_board',
    archetype_instance_id: 'S01-sample-status-proof-board-r31',
    rhythm_role: 'opening proof',
    zone_gap_in_min: 0.32,
    zone_inset_in_min: 0.15,
    zones: [
      { zone_id: 'title_zone', semantic_role: 'title', bounds: { left_in: 0.75, top_in: 0.55, width_in: 14.5, height_in: 1.15 }, intended_content: 'audience-facing title', min_font_pt: 36, safe_inset_in: 0.15 },
      { zone_id: 'claim_zone', semantic_role: 'core_claim', bounds: { left_in: 0.75, top_in: 1.86, width_in: 14.5, height_in: 1.25 }, intended_content: 'one-sentence closed-loop judgment claim', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'status_zone', semantic_role: 'three_route_status', bounds: { left_in: 0.75, top_in: 3.28, width_in: 14.5, height_in: 2.52 }, intended_content: 'input hub, three route status cards, and separated flow connectors', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'proof_zone', semantic_role: 'single_proof_band', bounds: { left_in: 0.75, top_in: 6.1, width_in: 14.5, height_in: 1.55 }, intended_content: 'one compact proof sentence and visible proof band', min_font_pt: 18, safe_inset_in: 0.15 },
    ],
  };
  sample.layout_intent.primary_grid = 'top_claim_middle_three_routes_bottom_proof';
  sample.layout_intent.non_text_visual = 'input_hub, three flow connectors, three merge connectors, and one proof_band make the causal path visible';
  sample.native_shapes = [
    {
      shape_id: 'S01-title',
      kind: 'text_box',
      role: 'title',
      quality_role: 'content',
      layout_zone_id: 'title_zone',
      editable_text: '三条生成通道，如何判断真正闭环',
      bounds: { left_in: 0.95, top_in: 0.64, width_in: 12.7, height_in: 0.78 },
      font_size: 38,
      color: '#171C24',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-core',
      kind: 'text_box',
      role: 'core_sentence',
      quality_role: 'content',
      layout_zone_id: 'claim_zone',
      editable_text: '先看同一份输入，再看三条通道、三个交付门和样片记录是否同时成立。',
      bounds: { left_in: 0.95, top_in: 1.94, width_in: 13.95, height_in: 1.25 },
      font_size: 20,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-input-hub',
      kind: 'rounded_rect',
      role: 'input_hub',
      quality_role: 'structural',
      layout_zone_id: 'status_zone',
      bounds: { left_in: 5.8, top_in: 3.42, width_in: 4.4, height_in: 0.78 },
      fill: '#DBEAFE',
      line: '#2563EB',
    },
    {
      shape_id: 'S01-input-label',
      kind: 'text_box',
      role: 'route_label',
      quality_role: 'content',
      layout_zone_id: 'status_zone',
      editable_text: '共同输入',
      bounds: { left_in: 5.9, top_in: 3.49, width_in: 4.2, height_in: 1.05 },
      font_size: 18,
    },
    ...[0, 1, 2].flatMap((index) => {
      const left = [0.95, 5.82, 10.7][index];
      return [
        {
          shape_id: `S01-card-${index + 1}-panel`,
          kind: 'rounded_rect',
          role: 'content_panel',
          quality_role: 'content',
          layout_zone_id: 'status_zone',
          bounds: { left_in: left, top_in: 4.55, width_in: 4.35, height_in: index === 1 ? 1.1 : 1.05 },
          fill: '#EFE6D6',
          line: '#D8C8B2',
        },
        {
          shape_id: `S01-card-${index + 1}-text`,
          kind: 'text_box',
          role: 'point_text',
          quality_role: 'content',
          layout_zone_id: 'status_zone',
          editable_text: ['图像通道先检查页面视觉是否可读。', '网页通道确认结构能被截图复核。', '演示文稿通道生成可编辑样片。'][index],
          bounds: { left_in: left + 0.22, top_in: index === 1 ? 4.6 : 4.58, width_in: 3.91, height_in: 1.05 },
          font_size: 18,
        },
      ];
    }),
    {
      shape_id: 'S01-proof-band',
      kind: 'rounded_rect',
      role: 'proof_band',
      quality_role: 'structural',
      layout_zone_id: 'proof_zone',
      bounds: { left_in: 0.95, top_in: 6.5, width_in: 14.1, height_in: 0.94 },
      fill: '#0F766E',
      line: 'none',
    },
    {
      shape_id: 'S01-proof-text',
      kind: 'text_box',
      role: 'evidence_item',
      quality_role: 'content',
      layout_zone_id: 'proof_zone',
      editable_text: '证据同时覆盖交付门、文件和审阅记录。',
      bounds: { left_in: 1.15, top_in: 6.46, width_in: 8, height_in: 1.05 },
      font_size: 18,
    },
    {
      shape_id: 'S01-boundary-note',
      kind: 'text_box',
      role: 'boundary_note',
      quality_role: 'content',
      layout_zone_id: 'proof_zone',
      editable_text: '最小边界：1 个主题、3 条通道、每条 1 次迭代、1 页样片。',
      bounds: { left_in: 9.35, top_in: 6.46, width_in: 5.45, height_in: 1.05 },
      font_size: 18,
    },
    {
      shape_id: 'S01-page-number',
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      editable_text: '01',
      bounds: { left_in: 14.72, top_in: 8.14, width_in: 0.42, height_in: 0.34 },
      font_size: 12,
    },
  ];
  const payload = materializerPayload([sample]);
  payload.editable_shape_plan.template_layout_grammar.archetype_catalog.unshift({
    archetype_id: 'sample_status_proof_board',
    use_when: 'one slide native visual sample',
    layout_description: 'title, claim, input hub, three status cards, flow connectors, and one proof band only',
    required_zones: ['title_zone', 'claim_zone', 'status_zone', 'proof_zone'],
    content_schema: {
      required_shape_roles: ['title', 'core_sentence', 'input_hub', 'flow_connector', 'content_panel', 'point_text', 'proof_band', 'evidence_item'],
      required_shape_role_groups: ['title_text', 'core_claim_text', 'input_hub', 'flow_connector', 'content_container', 'audience_body_text', 'structural_visual', 'evidence_or_metric_text'],
      min_filled_required_zone_share: 1,
    },
    prohibited: ['takeaway_zone', 'takeaway_panel', 'boundary_note'],
  });
  payload.native_ppt_sample_layout_profile = {
    required: true,
    allowed_sample_archetypes: ['sample_status_proof_board', 'sample_decision_proof_split'],
    forbidden_archetypes: ['executive_status_board', 'decision_dashboard', 'professional_system_map'],
    archetype_contracts: [
      {
        archetype_id: 'sample_status_proof_board',
        zone_floor_in: {
          title_zone: 1.15,
          claim_zone: 1.05,
          status_zone: 2.1,
          proof_zone: 1.35,
        },
      },
    ],
  };

  const rejected = runNativePlanValidation(payload);
  assert.equal(rejected.ok, false);
  const failures = JSON.stringify(rejected.failures);
  assert.match(failures, /ai_first_native_sample_status_card_too_small/);
  assert.match(failures, /ai_first_native_sample_too_many_proof_text_blocks/);
  assert.match(failures, /ai_first_native_sample_boundary_note_forbidden/);
});

test('native PPTX one-slide sample rejects long wrapped status card text before render', () => {
  const sample = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'cover_signal',
    title: '三种生成方式共用同一张检查单',
    core: '同一输入必须形成可检查页面，并通过审阅与导出门。',
    points: [
      '同源输入同时进入三条生成路径并保留完整证据链。',
      '每条路径都要产出可检查页面并通过截图审阅。',
      '三个交付门全部覆盖才算闭环而不是文件存在。',
    ],
    slotCount: 3,
  });
  sample.template_layout_binding = {
    selected_archetype: 'sample_status_proof_board',
    archetype_instance_id: 'S01-sample-status-proof-board-long-text',
    rhythm_role: 'opening',
    zone_gap_in_min: 0.32,
    zone_inset_in_min: 0.15,
    zones: [
      { zone_id: 'title_zone', semantic_role: 'title', bounds: { left_in: 0.75, top_in: 0.45, width_in: 14.5, height_in: 1.15 }, intended_content: 'audience-facing title only', min_font_pt: 36, safe_inset_in: 0.15 },
      { zone_id: 'claim_zone', semantic_role: 'core_claim', bounds: { left_in: 0.75, top_in: 1.82, width_in: 14.5, height_in: 1.15 }, intended_content: 'one-sentence claim', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'status_zone', semantic_role: 'status_board', bounds: { left_in: 0.75, top_in: 3.25, width_in: 14.5, height_in: 2.85 }, intended_content: 'input hub, cards, and connector lanes', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'proof_zone', semantic_role: 'proof_band', bounds: { left_in: 0.75, top_in: 6.48, width_in: 14.5, height_in: 1.35 }, intended_content: 'one compact evidence sentence', min_font_pt: 18, safe_inset_in: 0.15 },
    ],
  };
  sample.layout_intent.primary_grid = 'top_claim_three_status_to_bottom_proof';
  sample.layout_intent.non_text_visual = 'shared input splits to three route cards and closes into one proof band';
  sample.native_shapes = sample.native_shapes
    .filter((shape) => !['takeaway', 'takeaway_panel', 'page_number'].includes(shape.role) && !['signal_connector'].includes(shape.role) && shape.shape_id !== 'S01-evidence-note')
    .map((shape) => {
      const index = Number(String(shape.shape_id || '').match(/slot-(\d+)/)?.[1] || 1) - 1;
      const left = [1.0, 5.82, 10.65][index] || 1.0;
      if (shape.role === 'title') {
        return { ...shape, layout_zone_id: 'title_zone', bounds: { left_in: 0.95, top_in: 0.55, width_in: 12.7, height_in: 0.95 }, font_size: 38 };
      }
      if (shape.role === 'core_sentence') {
        return { ...shape, layout_zone_id: 'claim_zone', bounds: { left_in: 0.92, top_in: 1.88, width_in: 13.65, height_in: 1.0 }, font_size: 20 };
      }
      if (shape.role === 'signal_panel') {
        return { ...shape, role: 'content_panel', layout_zone_id: 'status_zone', bounds: { left_in: left, top_in: 4.12, width_in: 4.35, height_in: 1.62 } };
      }
      if (shape.role === 'point_text') {
        const longPoints = [
          '同源输入同时进入三条生成路径并保留完整可追踪证据链记录。',
          '每条路径都要产出可检查页面并通过截图审阅和导出复核。',
          '三个交付门全部覆盖并留下人工可复核记录才算闭环成立。',
        ];
        return { ...shape, layout_zone_id: 'status_zone', editable_text: longPoints[index] || shape.editable_text, bounds: { left_in: left + 0.25, top_in: 4.32, width_in: 3.85, height_in: 1.05 }, font_size: 18 };
      }
      if (shape.role === 'point_index') {
        return null;
      }
      if (shape.role === 'evidence_item' && shape.shape_id === 'S01-evidence-summary') {
        return { ...shape, role: 'evidence_item', layout_zone_id: 'proof_zone', editable_text: '文件、截图和审阅记录同步存在。', bounds: { left_in: 1.25, top_in: 6.66, width_in: 13.5, height_in: 0.72 }, font_size: 18 };
      }
      return shape;
    })
    .filter(Boolean);
  sample.native_shapes.push(
    { shape_id: 'S01-input-hub', kind: 'rounded_rect', role: 'input_hub', quality_role: 'structural', layout_zone_id: 'status_zone', bounds: { left_in: 5.9, top_in: 3.38, width_in: 4.35, height_in: 0.88 }, fill: '#DBEAFE', line: '#2563EB' },
    { shape_id: 'S01-input-hub-label', kind: 'text_box', role: 'route_label', quality_role: 'content', layout_zone_id: 'status_zone', editable_text: '同一准备材料', bounds: { left_in: 5.96, top_in: 3.3, width_in: 4.22, height_in: 1.05 }, font_size: 18 },
    { shape_id: 'S01-flow-left', kind: 'connector', role: 'flow_connector', quality_role: 'structural', layout_zone_id: 'status_zone', bounds: { left_in: 2.85, top_in: 4.03, width_in: 4.95, height_in: 0.12 }, fill: 'none', line: '#2563EB' },
    { shape_id: 'S01-flow-right', kind: 'connector', role: 'flow_connector', quality_role: 'structural', layout_zone_id: 'status_zone', bounds: { left_in: 8.2, top_in: 4.03, width_in: 4.95, height_in: 0.12 }, fill: 'none', line: '#2563EB' },
    { shape_id: 'S01-proof-band', kind: 'rounded_rect', role: 'proof_band', quality_role: 'structural', layout_zone_id: 'proof_zone', bounds: { left_in: 0.98, top_in: 6.64, width_in: 14.04, height_in: 0.92 }, fill: '#0F766E', line: 'none' },
    { shape_id: 'S01-page-no', kind: 'text_box', role: 'page_number', quality_role: 'auxiliary', editable_text: '01', bounds: { left_in: 0.85, top_in: 7.95, width_in: 0.8, height_in: 0.5 }, font_size: 12 },
  );
  const payload = materializerPayload([sample]);
  payload.editable_shape_plan.template_layout_grammar.archetype_catalog.unshift({
    archetype_id: 'sample_status_proof_board',
    use_when: 'one slide native visual sample',
    layout_description: 'title, claim, input hub, three status cards, flow connectors, and one proof band only',
    required_zones: ['title_zone', 'claim_zone', 'status_zone', 'proof_zone'],
    content_schema: {
      required_shape_roles: ['title', 'core_sentence', 'input_hub', 'flow_connector', 'content_panel', 'point_text', 'proof_band', 'evidence_item'],
      required_shape_role_groups: ['title_text', 'core_claim_text', 'input_hub', 'flow_connector', 'content_container', 'audience_body_text', 'structural_visual', 'evidence_or_metric_text'],
      min_filled_required_zone_share: 1,
    },
    prohibited: ['takeaway_zone', 'takeaway_panel', 'boundary_note'],
  });
  payload.native_ppt_sample_layout_profile = {
    required: true,
    allowed_sample_archetypes: ['sample_status_proof_board', 'sample_decision_proof_split'],
    forbidden_archetypes: ['executive_status_board', 'decision_dashboard', 'professional_system_map'],
    capacity_rules: {
      status_card_text_box_height_in_min: 0.96,
      status_card_point_text_max_estimated_lines: 2,
      status_card_point_text_max_cjk_chars: 22,
    },
    archetype_contracts: [
      {
        archetype_id: 'sample_status_proof_board',
        zone_floor_in: {
          title_zone: 1.15,
          claim_zone: 1.05,
          status_zone: 2.1,
          proof_zone: 1.35,
        },
      },
    ],
  };

  const rejected = runNativePlanValidation(payload);
  assert.equal(rejected.ok, false);
  const failures = JSON.stringify(rejected.failures);
  assert.match(failures, /ai_first_native_sample_status_text_wrap_too_deep|ai_first_native_sample_status_text_too_long/);
});

test('native PPTX one-slide sample rejects connectors drawn outside their declared zone', () => {
  const sample = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'cover_signal',
    title: '三种生成方式共用同一张检查单',
    core: '可靠的视觉生成方式，必须从同一份准备材料出发，产出可检查交付物，并完整通过关键交付门。',
    points: [
      '同源输入同时进入三条生成路径。',
      '每条路径都要产出可检查页面。',
      '三个交付门全部覆盖才算闭环。',
    ],
    slotCount: 3,
  });
  sample.template_layout_binding = {
    selected_archetype: 'sample_status_proof_board',
    archetype_instance_id: 'S01-sample-status-proof-board-r32',
    rhythm_role: 'opening',
    zone_gap_in_min: 0.32,
    zone_inset_in_min: 0.15,
    zones: [
      { zone_id: 'title_zone', semantic_role: 'title', bounds: { left_in: 0.75, top_in: 0.45, width_in: 14.5, height_in: 1.15 }, intended_content: 'audience-facing title only', min_font_pt: 36, safe_inset_in: 0.15 },
      { zone_id: 'claim_zone', semantic_role: 'core_claim', bounds: { left_in: 0.75, top_in: 1.82, width_in: 14.5, height_in: 1.15 }, intended_content: 'one-sentence claim', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'status_zone', semantic_role: 'status_board', bounds: { left_in: 0.75, top_in: 3.25, width_in: 14.5, height_in: 2.85 }, intended_content: 'input hub, cards, and connector lanes', min_font_pt: 18, safe_inset_in: 0.15 },
      { zone_id: 'proof_zone', semantic_role: 'proof_band', bounds: { left_in: 0.75, top_in: 6.48, width_in: 14.5, height_in: 1.35 }, intended_content: 'one compact evidence sentence', min_font_pt: 18, safe_inset_in: 0.15 },
    ],
  };
  sample.layout_intent.primary_grid = 'top_claim_three_status_to_bottom_proof';
  sample.layout_intent.non_text_visual = 'shared input splits to three route cards and closes into one proof band';
  sample.native_shapes = sample.native_shapes
    .filter((shape) => !['takeaway', 'takeaway_panel', 'page_number'].includes(shape.role))
    .map((shape) => {
      const index = Number(String(shape.shape_id || '').match(/slot-(\d+)/)?.[1] || 1) - 1;
      const left = [1.0, 5.82, 10.65][index] || 1.0;
      if (shape.role === 'title') {
        return { ...shape, layout_zone_id: 'title_zone', bounds: { left_in: 0.95, top_in: 0.55, width_in: 12.7, height_in: 0.95 }, font_size: 38 };
      }
      if (shape.role === 'core_sentence') {
        return { ...shape, layout_zone_id: 'claim_zone', bounds: { left_in: 0.92, top_in: 1.88, width_in: 13.65, height_in: 0.92 }, font_size: 20 };
      }
      if (shape.role === 'signal_panel') {
        return { ...shape, role: 'content_panel', layout_zone_id: 'status_zone', bounds: { left_in: left, top_in: 4.42, width_in: 4.35, height_in: 1.45 } };
      }
      if (shape.role === 'point_index') {
        return { ...shape, layout_zone_id: 'status_zone', bounds: { left_in: left + 0.24, top_in: 4.62, width_in: 0.78, height_in: 0.52 } };
      }
      if (shape.role === 'point_text') {
        return { ...shape, layout_zone_id: 'status_zone', bounds: { left_in: left + 0.25, top_in: 4.62, width_in: 3.85, height_in: 1.05 }, font_size: 18 };
      }
      if (shape.role === 'evidence_item' && shape.shape_id === 'S01-evidence-summary') {
        return { ...shape, role: 'evidence_item', layout_zone_id: 'proof_zone', editable_text: '证据同时覆盖文件、截图和审阅记录。', bounds: { left_in: 1.25, top_in: 6.55, width_in: 13.5, height_in: 1.05 }, font_size: 18 };
      }
      return shape;
    })
    .filter(Boolean);
  sample.native_shapes.push(
    { shape_id: 'S01-input-hub', kind: 'rounded_rect', role: 'input_hub', quality_role: 'structural', layout_zone_id: 'status_zone', bounds: { left_in: 5.9, top_in: 3.38, width_in: 4.35, height_in: 0.88 }, fill: '#DBEAFE', line: '#2563EB' },
    { shape_id: 'S01-input-hub-label', kind: 'text_box', role: 'route_label', quality_role: 'content', layout_zone_id: 'status_zone', editable_text: '同一准备材料', bounds: { left_in: 5.96, top_in: 3.3, width_in: 4.22, height_in: 1.05 }, font_size: 18 },
    { shape_id: 'S01-merge-left', kind: 'connector', role: 'merge_connector', quality_role: 'structural', layout_zone_id: 'proof_zone', bounds: { left_in: 3.15, top_in: 6.14, width_in: 3.85, height_in: 0.34 }, fill: 'none', line: '#2563EB' },
    { shape_id: 'S01-merge-right', kind: 'connector', role: 'merge_connector', quality_role: 'structural', layout_zone_id: 'proof_zone', bounds: { left_in: 8.95, top_in: 6.14, width_in: 3.85, height_in: 0.34 }, fill: 'none', line: '#2563EB' },
    { shape_id: 'S01-proof-band', kind: 'rounded_rect', role: 'proof_band', quality_role: 'structural', layout_zone_id: 'proof_zone', bounds: { left_in: 0.98, top_in: 6.64, width_in: 14.04, height_in: 0.92 }, fill: '#0F766E', line: 'none' },
    { shape_id: 'S01-page-no', kind: 'text_box', role: 'page_number', quality_role: 'auxiliary', editable_text: '01', bounds: { left_in: 0.85, top_in: 7.95, width_in: 0.8, height_in: 0.5 }, font_size: 12 },
  );
  const payload = materializerPayload([sample]);
  payload.editable_shape_plan.template_layout_grammar.archetype_catalog.unshift({
    archetype_id: 'sample_status_proof_board',
    use_when: 'one slide native visual sample',
    layout_description: 'title, claim, input hub, three status cards, flow connectors, and one proof band only',
    required_zones: ['title_zone', 'claim_zone', 'status_zone', 'proof_zone'],
    content_schema: {
      required_shape_roles: ['title', 'core_sentence', 'input_hub', 'flow_connector', 'content_panel', 'point_text', 'proof_band', 'evidence_item'],
      required_shape_role_groups: ['title_text', 'core_claim_text', 'input_hub', 'flow_connector', 'content_container', 'audience_body_text', 'structural_visual', 'evidence_or_metric_text'],
      min_filled_required_zone_share: 1,
    },
    prohibited: ['takeaway_zone', 'takeaway_panel', 'boundary_note'],
  });
  payload.native_ppt_sample_layout_profile = {
    required: true,
    allowed_sample_archetypes: ['sample_status_proof_board', 'sample_decision_proof_split'],
    forbidden_archetypes: ['executive_status_board', 'decision_dashboard', 'professional_system_map'],
    archetype_contracts: [
      {
        archetype_id: 'sample_status_proof_board',
        zone_floor_in: {
          title_zone: 1.15,
          claim_zone: 1.05,
          status_zone: 2.1,
          proof_zone: 1.35,
        },
      },
    ],
  };

  const rejected = runNativePlanValidation(payload);
  assert.equal(rejected.ok, false);
  const failures = JSON.stringify(rejected.failures);
  assert.match(failures, /ai_first_shape_outside_template_layout_zone/);
  assert.match(failures, /S01-merge-left/);
  assert.match(failures, /S01-merge-right/);
});
