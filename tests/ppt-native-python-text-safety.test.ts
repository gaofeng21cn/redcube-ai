// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAiSlide,
  materializerPayload,
  runNativeMaterializer,
  runNativePlanValidation,
} from './helpers/ppt-native-python-layout-fixtures.ts';

test('native PPTX preflight rejects narrow route labels that force awkward short-sentence wrapping', () => {
  const slideData = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '路径说明不能被窄框硬折行',
    core: '短路径说明应当通过更宽版心或更短文案保持横向节奏。',
    slotCount: 3,
  });
  slideData.layout_intent.rhetorical_role = 'system_map';
  slideData.layout_intent.non_text_visual = 'route flow connectors, input panel, gate stack, and takeaway band';
  slideData.native_shapes = [
    {
      shape_id: 'S01-title',
      kind: 'text_box',
      role: 'title',
      quality_role: 'content',
      editable_text: slideData.title,
      bounds: { left_in: 0.8, top_in: 0.5, width_in: 10.9, height_in: 1.0 },
      font_size: 38,
      color: '#111827',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-core',
      kind: 'text_box',
      role: 'core_sentence',
      quality_role: 'content',
      editable_text: slideData.core_sentence,
      bounds: { left_in: 0.85, top_in: 1.62, width_in: 11.8, height_in: 0.96 },
      font_size: 19,
      color: '#4B5563',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-input-panel',
      kind: 'rounded_rect',
      role: 'input_map_panel',
      quality_role: 'structural',
      bounds: { left_in: 0.9, top_in: 3.1, width_in: 2.95, height_in: 2.1 },
      fill: '#FFFFFF',
      line: '#BFDBFE',
    },
    {
      shape_id: 'S01-input-text',
      kind: 'text_box',
      role: 'body_sentence',
      quality_role: 'content',
      editable_text: '共同输入先锁定比较对象，避免把素材差异误判成路径差异。',
      bounds: { left_in: 1.15, top_in: 3.75, width_in: 2.35, height_in: 1.16 },
      font_size: 18,
      color: '#111827',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-route-1-label',
      kind: 'text_box',
      role: 'route_label',
      quality_role: 'content',
      editable_text: '网页稿路径验证同一结构可被浏览检查。',
      bounds: { left_in: 4.12, top_in: 4.72, width_in: 4.05, height_in: 1.05 },
      font_size: 18,
      color: '#0F172A',
      fill: 'none',
      line: 'none',
    },
    ...[0, 1, 2].map((index) => ({
      shape_id: `S01-route-${index + 1}-connector`,
      kind: 'connector',
      role: 'route_flow_connector',
      quality_role: 'structural',
      bounds: { left_in: 4.15, top_in: 3.08 + index * 0.24, width_in: 4.75, height_in: 0.04 },
      line: { color: '#2563EB', width_pt: 2, end_arrow: true },
      tailEnd: 'triangle',
      fill: 'none',
    })),
    {
      shape_id: 'S01-gate-panel',
      kind: 'rounded_rect',
      role: 'gate_stack_panel',
      quality_role: 'structural',
      bounds: { left_in: 9.7, top_in: 3.05, width_in: 4.4, height_in: 2.3 },
      fill: '#FFFFFF',
      line: '#5EEAD4',
    },
    {
      shape_id: 'S01-gate-card',
      kind: 'text_box',
      role: 'gate_card',
      quality_role: 'content',
      editable_text: '三道交付门全部通过才放行。',
      bounds: { left_in: 10.1, top_in: 3.72, width_in: 3.75, height_in: 1.12 },
      font_size: 18,
      color: '#0F766E',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-loop-band',
      kind: 'rounded_rect',
      role: 'takeaway_band',
      quality_role: 'structural',
      bounds: { left_in: 0.9, top_in: 6.28, width_in: 13.2, height_in: 1.3 },
      fill: '#111827',
      line: 'none',
    },
    {
      shape_id: 'S01-evidence-note',
      kind: 'text_box',
      role: 'evidence_item',
      quality_role: 'content',
      editable_text: '证据包同时保留演示文件、PDF、截图、形状清单、审查记录和导出记录。',
      bounds: { left_in: 1.2, top_in: 6.55, width_in: 9.5, height_in: 0.92 },
      font_size: 18,
      color: '#F9FAFB',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-page',
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      editable_text: '01',
      bounds: { left_in: 14.3, top_in: 8.05, width_in: 0.7, height_in: 0.4 },
      font_size: 16,
      color: '#94A3B8',
      fill: 'none',
      line: 'none',
    },
  ];

  const rejected = runNativePlanValidation(materializerPayload([slideData]));
  assert.equal(rejected.ok, false);
  assert.match(JSON.stringify(rejected.failures), /ai_first_route_label_unbalanced_wrap/);

  const fixed = {
    ...slideData,
    native_shapes: slideData.native_shapes.map((shape) => (
      shape.shape_id === 'S01-route-1-label'
        ? {
          ...shape,
          editable_text: '网页稿路径验证浏览检查。',
          bounds: { ...shape.bounds, width_in: 4.8 },
        }
        : shape.shape_id === 'S01-gate-card'
          ? {
            ...shape,
            editable_text: '三道交付门确认证据后放行。',
            bounds: { ...shape.bounds, width_in: 4.15 },
          }
        : shape
    )),
  };
  const accepted = runNativePlanValidation(materializerPayload([fixed]));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));
  const result = runNativeMaterializer(materializerPayload([fixed]));
  const [slide] = result.slides;
  assert.equal(slide.checks.short_label_wrap_ok, true);
  assert.equal(slide.metrics.short_label_wrap_failures.length, 0);
});

test('native PPTX preflight rejects filled text cards without explicit internal padding', () => {
  const slideData = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '卡片文本必须留出呼吸空间',
    core: '当文本框本身就是带底色卡片时，内边距也属于 AI 形状计划的可执行合同。',
    slotCount: 3,
  });
  slideData.native_shapes = slideData.native_shapes.map((shape) => {
    if (shape.shape_id !== 'S01-slot-1-text') return shape;
    return {
      ...shape,
      role: 'point_text',
      quality_role: 'content',
      editable_text: '同一输入必须被三条路线共同消费，并保留可复核证据。',
      fill: '#FFFFFF',
      line: '#CBD5E1',
      margin: '0.02in',
      bounds: {
        ...shape.bounds,
        left_in: 1.2,
        top_in: 4.02,
        width_in: 3.45,
        height_in: 1.24,
      },
      font_size: 18,
    };
  });

  const rejected = runNativePlanValidation(materializerPayload([slideData]));
  assert.equal(rejected.ok, false);
  const cardFailure = rejected.failures
    .flatMap((slide) => slide.failures || [])
    .find((failure) => failure.reason === 'ai_first_text_card_internal_padding_too_small');
  assert.equal(cardFailure.shape_id, 'S01-slot-1-text');
  assert.equal(cardFailure.required_inset_in, 0.15);
  assert.equal(cardFailure.current_margin_in, 0.02);

  const fixed = {
    ...slideData,
    native_shapes: slideData.native_shapes.map((shape) => (
      shape.shape_id === 'S01-slot-1-text'
        ? {
          ...shape,
          margin: '0.15in',
          bounds: { ...shape.bounds, width_in: 3.9, height_in: 1.42 },
        }
        : shape
    )),
  };
  const accepted = runNativePlanValidation(materializerPayload([fixed]));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));
  const result = runNativeMaterializer(materializerPayload([fixed]));
  const [slide] = result.slides;
  const cardShape = slide.native_shapes.find((shape) => shape.shape_id === 'S01-slot-1-text');
  assert.equal(cardShape.margin_in, 0.15);
  assert.equal(slide.checks.text_card_internal_padding_ok, true);
  assert.equal(slide.metrics.text_card_internal_padding_failures.length, 0);
});

test('native PPTX preflight accepts numeric margin_in as explicit filled text-card padding', () => {
  const slideData = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '数值 margin_in 也是明确的可执行内边距',
    core: 'AI shape plan may emit numeric margin_in instead of an Office-style margin string.',
    slotCount: 3,
  });
  slideData.native_shapes = slideData.native_shapes.map((shape) => {
    if (shape.shape_id !== 'S01-slot-1-text') return shape;
    return {
      ...shape,
      role: 'point_text',
      quality_role: 'content',
      editable_text: '同一输入必须被三条路线共同消费，并保留可复核证据。',
      fill: '#FFFFFF',
      line: '#CBD5E1',
      margin_in: 0.16,
      bounds: {
        ...shape.bounds,
        left_in: 1.2,
        top_in: 4.02,
        width_in: 3.9,
        height_in: 1.42,
      },
      font_size: 18,
    };
  });

  const accepted = runNativePlanValidation(materializerPayload([slideData]));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));
  const result = runNativeMaterializer(materializerPayload([slideData]));
  const [slide] = result.slides;
  const cardShape = slide.native_shapes.find((shape) => shape.shape_id === 'S01-slot-1-text');
  assert.equal(cardShape.margin_in, 0.16);
  assert.equal(slide.checks.text_card_internal_padding_ok, true);
  assert.equal(slide.metrics.text_card_internal_padding_failures.length, 0);
});
