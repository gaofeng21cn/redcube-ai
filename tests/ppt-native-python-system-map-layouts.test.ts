// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAiSlide,
  materializerPayload,
  runNativeMaterializer,
  runNativePlanValidation,
} from './helpers/ppt-native-python-layout-fixtures.ts';

test('native PPTX quality accepts AI-first system map route-gate-evidence layouts', () => {
  const slideData = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '从生成到交付：三路径闭环判断',
    core: '真实交付不能只看文件是否存在，还要同时核对共同输入、路径执行、交付门覆盖和可追踪证据包。',
    slotCount: 3,
  });
  slideData.layout_intent.rhetorical_role = 'system_map';
  slideData.layout_intent.non_text_visual = 'shared input panel, three route lanes, gate stack, and evidence band';
  slideData.native_shapes = [
    {
      shape_id: 'S01-bg',
      kind: 'rect',
      role: 'canvas_background',
      quality_role: 'decorative',
      bounds: { left_in: 0, top_in: 0, width_in: 16, height_in: 9 },
      fill: '#F7F9FC',
      line: 'none',
    },
    {
      shape_id: 'S01-title',
      kind: 'text_box',
      role: 'title',
      quality_role: 'content',
      editable_text: slideData.title,
      bounds: { left_in: 0.8, top_in: 0.5, width_in: 10.9, height_in: 0.98 },
      font_size: 44,
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
      bounds: { left_in: 0.85, top_in: 1.55, width_in: 12.4, height_in: 0.98 },
      font_size: 20,
      color: '#4B5563',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-input-panel',
      kind: 'rounded_rect',
      role: 'input_map_panel',
      quality_role: 'structural',
      bounds: { left_in: 0.85, top_in: 3.0, width_in: 3.25, height_in: 2.9 },
      fill: '#FFFFFF',
      line: '#BFDBFE',
    },
    {
      shape_id: 'S01-document-icon',
      kind: 'rect',
      role: 'document_map_icon',
      quality_role: 'structural',
      bounds: { left_in: 1.15, top_in: 3.25, width_in: 0.65, height_in: 0.82 },
      fill: '#2563EB',
      line: 'none',
    },
    {
      shape_id: 'S01-input-title',
      kind: 'text_box',
      role: 'panel_title',
      quality_role: 'content',
      editable_text: '共同起点',
      bounds: { left_in: 1.0, top_in: 4.05, width_in: 2.1, height_in: 0.62 },
      font_size: 20,
      color: '#111827',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-input-body',
      kind: 'text_box',
      role: 'body_sentence',
      quality_role: 'content',
      editable_text: '同源素材进入三条路径，保证比较对象一致。',
      bounds: { left_in: 1.08, top_in: 4.62, width_in: 2.62, height_in: 1.1 },
      font_size: 18,
      color: '#374151',
      fill: 'none',
      line: 'none',
    },
    ...[0, 1, 2].flatMap((index) => {
      const top = 3.0 + index * 1.02;
      return [
        {
          shape_id: `S01-route-${index + 1}-panel`,
          kind: 'rounded_rect',
          role: 'route_flow_lane',
          quality_role: 'structural',
          bounds: { left_in: 4.6, top_in: top, width_in: 4.35, height_in: 0.9 },
          fill: index === 0 ? '#DBEAFE' : '#FFFFFF',
          line: '#93C5FD',
        },
        {
          shape_id: `S01-route-${index + 1}-label`,
          kind: 'text_box',
          role: 'route_label',
          quality_role: 'content',
          editable_text: ['图像化呈现', '网页预览', '原生演示页'][index],
          bounds: { left_in: 4.82, top_in: top + 0.12, width_in: 1.78, height_in: 0.62 },
          font_size: 18,
          color: '#2563EB',
          fill: 'none',
          line: 'none',
        },
        {
          shape_id: `S01-route-${index + 1}-note`,
          kind: 'text_box',
          role: 'evidence_item',
          quality_role: 'content',
          layout_zone_id: 'matrix_zone',
          editable_text: ['视觉页成形可审', '截图问题可复核', '文件导出可编辑'][index],
          bounds: { left_in: 6.72, top_in: top + 0.08, width_in: 2.05, height_in: 0.8 },
          font_size: 18,
          color: '#374151',
          fill: 'none',
          line: 'none',
        },
        {
          shape_id: `S01-route-${index + 1}-connector`,
          kind: 'connector',
          role: 'route_gate_connector',
          quality_role: 'structural',
          layout_zone_id: 'matrix_zone',
          from_shape_id: 'S01-input-panel',
          to_shape_id: 'S01-gate-panel',
          tail_end: 'triangle',
          bounds: { left_in: 8.9, top_in: top + 0.98, width_in: 0.75, height_in: 0.04 },
          line: '#0F766E',
        },
      ];
    }),
    {
      shape_id: 'S01-gate-panel',
      kind: 'rounded_rect',
      role: 'gate_stack_panel',
      quality_role: 'structural',
      bounds: { left_in: 10.05, top_in: 2.9, width_in: 4.45, height_in: 3.04 },
      fill: '#FFFFFF',
      line: '#5EEAD4',
    },
    {
      shape_id: 'S01-gate-title',
      kind: 'text_box',
      role: 'panel_title',
      quality_role: 'content',
      layout_zone_id: 'matrix_zone',
      editable_text: '三道交付门',
      bounds: { left_in: 10.35, top_in: 3.12, width_in: 2.4, height_in: 0.68 },
      font_size: 20,
      color: '#0F766E',
      fill: 'none',
      line: 'none',
    },
    ...[0, 1, 2].flatMap((index) => [
      {
        shape_id: `S01-gate-${index + 1}-marker`,
        kind: 'oval',
        role: 'gate_marker',
        quality_role: 'structural',
        editable_text: String(index + 1),
        bounds: { left_in: 10.38, top_in: 3.84 + index * 0.72, width_in: 0.42, height_in: 0.42 },
        font_size: 16,
        fill: '#0F766E',
        line: 'none',
      },
      {
        shape_id: `S01-gate-${index + 1}-text`,
        kind: 'text_box',
        role: 'evidence_item',
        quality_role: 'content',
        layout_zone_id: 'matrix_zone',
        editable_text: ['视觉结构可读', '截图问题可复核', '文件导出可交付'][index],
        bounds: { left_in: 11.02, top_in: 3.74 + index * 0.72, width_in: 3.12, height_in: 0.8 },
        font_size: 18,
        color: '#111827',
        fill: 'none',
        line: 'none',
      },
    ]),
    {
      shape_id: 'S01-evidence-band',
      kind: 'rounded_rect',
      role: 'evidence_band',
      quality_role: 'structural',
      layout_zone_id: 'signal_zone',
      bounds: { left_in: 0.72, top_in: 6.28, width_in: 14.26, height_in: 1.96 },
      fill: '#111827',
      line: 'none',
    },
    {
      shape_id: 'S01-evidence-title',
      kind: 'text_box',
      role: 'panel_title',
      quality_role: 'content',
      layout_zone_id: 'signal_zone',
      editable_text: '底部证据包要同时说明什么',
      bounds: { left_in: 1.0, top_in: 6.5, width_in: 4.1, height_in: 0.68 },
      font_size: 20,
      color: '#F9FAFB',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-evidence-body',
      kind: 'text_box',
      role: 'takeaway',
      quality_role: 'content',
      layout_zone_id: 'signal_zone',
      editable_text: '完整证据包包括演示文件、PDF、PNG 截图、形状清单、审查记录和导出记录；缺一项就不能说闭环完成。',
      bounds: { left_in: 1.0, top_in: 7.34, width_in: 13.2, height_in: 0.84 },
      font_size: 18,
      color: '#F9FAFB',
      fill: 'none',
      line: 'none',
    },
    ...['1 个素材包', '3 条路径', '门禁 3/3'].map((text, index) => ({
      shape_id: `S01-metric-${index + 1}`,
      kind: 'text_box',
      role: 'metric',
      quality_role: 'content',
      editable_text: text,
      bounds: { left_in: 5.45 + index * 1.96, top_in: 6.5, width_in: 1.78, height_in: 0.8 },
      font_size: 18,
      color: index === 4 ? '#5EEAD4' : '#E5E7EB',
      fill: 'none',
      line: 'none',
    })),
    {
      shape_id: 'S01-page',
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      editable_text: '01',
      bounds: { left_in: 14.3, top_in: 8.08, width_in: 0.6, height_in: 0.36 },
      font_size: 16,
      color: '#94A3B8',
      fill: 'none',
      line: 'none',
      align: 'right',
    },
  ];

  const result = runNativeMaterializer(materializerPayload([slideData]));
  const [slide] = result.slides;
  assert.equal(slide.metrics.layout_variant, 'system_map');
  assert.equal(slide.checks.slot_fill_ok, true);
  assert.equal(slide.checks.occlusion_free, true);
  assert.equal(slide.checks.grid_balance_ok, true);
  assert.equal(slide.checks.content_depth_ok, true);
  assert.equal(slide.issues.length, 0, JSON.stringify(slide.issues));
  assert.equal(slide.metrics.overlap_pairs, 0);
  assert.equal(slide.metrics.structural_text_collision_count, 0);
});

test('native PPTX plan preflight and manifest QA reject connector rails crossing readable text', () => {
  const slideData = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '连接线不能穿过正文',
    core: '专业原生 PPT 要把流程线和正文排在不同视觉通道里。',
    slotCount: 2,
  });
  slideData.layout_intent.rhetorical_role = 'system_map';
  slideData.layout_intent.non_text_visual = 'route connectors that avoid labels and content text';
  slideData.native_shapes = slideData.native_shapes.filter((shape) => (
    !String(shape.role || '').includes('bridge_connector')
    && shape.shape_id !== 'S01-matrix-evidence'
  ));
  slideData.native_shapes.push(
    {
      shape_id: 'S01-route-label',
      kind: 'text_box',
      role: 'route_label',
      quality_role: 'content',
      layout_zone_id: 'signal_zone',
      editable_text: '三条生成链路各完成 1 次真实产出，才进入同一放行判断。',
      bounds: { left_in: 1.2, top_in: 6.32, width_in: 6.0, height_in: 0.9 },
      font_size: 18,
      color: '#171C24',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-rail-through-label',
      kind: 'connector',
      role: 'horizontal_route_connector',
      quality_role: 'structural',
      layout_zone_id: 'signal_zone',
      bounds: { left_in: 1.05, top_in: 6.68, width_in: 6.4, height_in: 0.06 },
      line: { color: '#2563EB', width_pt: 2, end_arrow: true },
      tailEnd: 'triangle',
      fill: 'none',
    },
  );

  const rejected = runNativePlanValidation(materializerPayload([slideData]));
  assert.equal(rejected.ok, false);
  assert.match(JSON.stringify(rejected.failures), /ai_first_structural_text_collision/);

  const fixed = {
    ...slideData,
    native_shapes: slideData.native_shapes.map((shape) => (
      shape.shape_id === 'S01-rail-through-label'
        ? { ...shape, bounds: { ...shape.bounds, top_in: 7.38 } }
        : shape
    )),
  };
  const accepted = runNativePlanValidation(materializerPayload([fixed]));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));
  const result = runNativeMaterializer(materializerPayload([fixed]));
  const [slide] = result.slides;
  assert.equal(slide.checks.occlusion_free, true);
  assert.equal(slide.metrics.structural_text_collision_count, 0);
});

const DEFAULT_SYSTEM_MAP_POINTS = [
  '共同输入先锁定比较对象',
  '三条路径各自产出可检查文件',
  '放行门和证据包同时闭合',
];

function systemMapText(shapeId, role, editableText, bounds, fontSize = 18, color = '#111827', qualityRole = 'content') {
  return {
    shape_id: shapeId,
    kind: 'text_box',
    role,
    quality_role: qualityRole,
    editable_text: editableText,
    bounds,
    font_size: fontSize,
    color,
    fill: 'none',
    line: 'none',
  };
}

function systemMapSlide({
  title,
  core,
  points = DEFAULT_SYSTEM_MAP_POINTS,
  compositionSignature,
  nonTextVisual,
  primaryGrid = 'input_routes_gate_takeaway',
  visualWeight = 'centered_route_map',
  negativeSpaceStrategy = 'labels sit above connector rails with a separate bottom band',
  titleFontSize = 38,
  coreFontSize = 20,
  sourcePanelId = 'S01-input-panel',
  sourcePanelRole = 'input_map_panel',
  sourcePanelBounds = { left_in: 0.9, top_in: 3.1, width_in: 2.95, height_in: 2.1 },
  sourceTextId = 'S01-input-text',
  sourceTextRole = 'body_sentence',
  sourceText = '共同输入先锁定比较对象，避免把素材差异误判成路径差异。',
  sourceTextBounds = { left_in: 1.15, top_in: 3.75, width_in: 2.35, height_in: 1.28 },
  connectorRole = 'horizontal_route_connector',
  bottomRole = 'evidence_band',
}) {
  return {
    slide_id: 'S01',
    title,
    layout_family: 'workflow_map',
    core_sentence: core,
    page_core_content: points,
    layout_intent: {
      rhetorical_role: 'system_map',
      composition_signature: compositionSignature,
      primary_grid: primaryGrid,
      visual_weight: visualWeight,
      negative_space_strategy: negativeSpaceStrategy,
      non_text_visual: nonTextVisual,
      forbidden_template_reuse_checked: true,
    },
    native_shapes: [
      systemMapText('S01-title', 'title', title, { left_in: 0.8, top_in: 0.5, width_in: 10.9, height_in: 1.0 }, titleFontSize),
      systemMapText('S01-core', 'core_sentence', core, { left_in: 0.85, top_in: 1.62, width_in: 11.8, height_in: 0.96 }, coreFontSize, '#4B5563'),
      {
        shape_id: sourcePanelId,
        kind: 'rounded_rect',
        role: sourcePanelRole,
        quality_role: 'structural',
        bounds: sourcePanelBounds,
        fill: sourcePanelRole === 'source_map_panel' ? '#DBEAFE' : '#FFFFFF',
        line: sourcePanelRole === 'source_map_panel' ? '#2563EB' : '#BFDBFE',
      },
      systemMapText(sourceTextId, sourceTextRole, sourceText, sourceTextBounds),
      ...[0, 1, 2].map((index) => ({
        shape_id: `S01-route-${index + 1}-connector`,
        kind: 'connector',
        role: connectorRole,
        quality_role: 'structural',
        from_shape_id: sourcePanelId,
        to_shape_id: 'S01-gate-panel',
        tail_end: 'triangle',
        bounds: { left_in: 4.15, top_in: 3.92 + index * 0.52, width_in: 4.75, height_in: 0.04 },
        line: { color: '#2563EB', width_pt: 2, end_arrow: true },
        fill: 'none',
      })),
      systemMapText('S01-route-label', 'route_label', '三路文件汇入同一放行判断。', { left_in: 4.25, top_in: 2.7, width_in: 4.55, height_in: 0.9 }, 18, '#2563EB'),
      {
        shape_id: 'S01-gate-panel',
        kind: 'rounded_rect',
        role: 'gate_stack_panel',
        quality_role: 'structural',
        bounds: { left_in: 9.7, top_in: 3.05, width_in: 4.4, height_in: 2.3 },
        fill: '#FFFFFF',
        line: '#5EEAD4',
      },
      systemMapText('S01-gate-card', 'gate_card', '视觉审查、截图审查和演示文稿导出三道门全部通过才放行。', { left_in: 10.1, top_in: 3.72, width_in: 3.35, height_in: 1.12 }, 18, '#0F766E'),
      {
        shape_id: bottomRole === 'takeaway_band' ? 'S01-loop-band' : 'S01-evidence-band',
        kind: 'rounded_rect',
        role: bottomRole,
        quality_role: 'structural',
        bounds: { left_in: 0.9, top_in: 6.28, width_in: 13.2, height_in: 1.3 },
        fill: '#111827',
        line: 'none',
      },
      systemMapText('S01-evidence-note', 'evidence_item', '证据包同时保留演示文件、PDF、截图、形状清单、审查记录和导出记录。', { left_in: 1.2, top_in: 6.55, width_in: 9.5, height_in: 0.92 }, 18, '#F9FAFB'),
      systemMapText('S01-page', 'page_number', '01', { left_in: 14.3, top_in: 8.05, width_in: 0.7, height_in: 0.4 }, 16, '#94A3B8', 'auxiliary'),
    ],
  };
}

test('native PPTX system-map QA counts horizontal connectors as route lanes', () => {
  const slideData = systemMapSlide({
    title: '三线闭环用同一套证据放行',
    core: '原生可编辑 PPT 的系统图要能看见输入、路径、放行门和证据出口。',
    compositionSignature: 'native-composition:test-horizontal-connectors-only',
    primaryGrid: 'input_to_routes_to_gate_to_evidence',
    negativeSpaceStrategy: 'connector lanes use empty gutters while labels sit above the lines',
    nonTextVisual: 'shared input panel, horizontal route connectors, gate stack, and evidence band',
  });

  const accepted = runNativePlanValidation(materializerPayload([slideData]));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));
  const result = runNativeMaterializer(materializerPayload([slideData]));
  const [slide] = result.slides;
  assert.equal(slide.metrics.layout_variant, 'system_map');
  assert.equal(slide.checks.grid_balance_ok, true);
  assert.equal(slide.metrics.grid_balance_failures.length, 0);
  assert.equal(slide.checks.occlusion_free, true);
  assert.equal(slide.metrics.structural_text_collision_count, 0);
});

test('native PPTX system-map QA accepts route flow connectors and takeaway bands as recognized structure', () => {
  const slideData = systemMapSlide({
    title: '可靠闭环要看同源执行证据',
    core: '同一输入、三路执行、交付门齐全和证据可复核必须同时成立。',
    points: [
      '同一输入先固定',
      '三条路线各自执行',
      '三道交付门同时放行',
    ],
    compositionSignature: 'native-composition:test-route-flow-connectors-takeaway-band',
    negativeSpaceStrategy: 'labels sit above connector rails with a separate bottom takeaway band',
    nonTextVisual: 'route flow connectors, input panel, gate stack, and takeaway band',
    titleFontSize: 40,
    sourceText: '同一份准备资料先固定，后续判断才有可比基础。',
    sourceTextBounds: { left_in: 1.15, top_in: 3.75, width_in: 2.35, height_in: 1.1 },
    connectorRole: 'route_flow_connector',
    bottomRole: 'takeaway_band',
  });

  const accepted = runNativePlanValidation(materializerPayload([slideData]));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));
  const result = runNativeMaterializer(materializerPayload([slideData]));
  const [slide] = result.slides;
  assert.equal(slide.metrics.layout_variant, 'system_map');
  assert.equal(slide.checks.grid_balance_ok, true);
  assert.equal(slide.metrics.grid_balance_failures.length, 0);
  assert.equal(slide.metrics.structural_visual_roles.includes('route_flow_connector'), true);
  assert.equal(slide.metrics.structural_visual_roles.includes('takeaway_band'), true);
});

test('native PPTX preflight rejects text boxes that bleed out of their visual panel safe area', () => {
  const slideData = systemMapSlide({
    title: '卡片文本必须留出安全内边距',
    core: '原生可编辑 PPT 不能只验证外框在页面内，还要验证文本在视觉容器内。',
    points: ['文本必须在卡片里', '路径说明必须保持均衡', '交付门需要可读'],
    compositionSignature: 'native-composition:test-panel-safe-area',
    visualWeight: 'balanced_system_map',
    negativeSpaceStrategy: 'route labels sit inside wide lanes and panels keep text inset',
    nonTextVisual: 'input panel, route flow connectors, gate stack, and takeaway band',
    coreFontSize: 19,
    sourcePanelId: 'S01-source-panel',
    sourcePanelRole: 'source_map_panel',
    sourcePanelBounds: { left_in: 0.82, top_in: 3.25, width_in: 2.82, height_in: 2.68 },
    sourceTextId: 'S01-source-label',
    sourceTextRole: 'route_label',
    sourceText: '同一份资料先进入三条成稿路径，确保后续判断有共同起点。',
    sourceTextBounds: { left_in: 0.88, top_in: 4.72, width_in: 2.92, height_in: 1.2 },
    connectorRole: 'route_flow_connector',
    bottomRole: 'takeaway_band',
  });

  const rejected = runNativePlanValidation(materializerPayload([slideData]));
  assert.equal(rejected.ok, false);
  assert.match(JSON.stringify(rejected.failures), /ai_first_text_panel_safe_area_violation/);

  const fixed = {
    ...slideData,
    native_shapes: slideData.native_shapes.map((shape) => (
      shape.shape_id === 'S01-source-label'
        ? {
          ...shape,
          role: 'body_sentence',
          editable_text: '同一份资料进入三条路径，保证判断起点一致。',
          bounds: { left_in: 1.08, top_in: 4.42, width_in: 2.24, height_in: 1.32 },
        }
        : shape
    )),
  };
  const accepted = runNativePlanValidation(materializerPayload([fixed]));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));
  const result = runNativeMaterializer(materializerPayload([fixed]));
  const [slide] = result.slides;
  assert.equal(slide.checks.panel_text_safe_area_ok, true);
  assert.equal(slide.metrics.panel_text_safe_area_failures.length, 0);
});
