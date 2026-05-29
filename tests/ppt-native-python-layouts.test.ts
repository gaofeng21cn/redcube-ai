// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import {
  createAiSlide,
  materializerPayload,
  runNativeMaterializer,
  runNativeMaterializerFailure,
  runNativePlanValidation,
} from './helpers/ppt-native-python-layout-fixtures.ts';

test('native PPTX officecli materializer accepts only complete AI spatial plans', () => {
  const slides = [
    createAiSlide({ slideId: 'S01', layoutFamily: 'cover_signal', title: 'Native cover proof' }),
    createAiSlide({ slideId: 'S02', layoutFamily: 'multi_zone_compare', title: 'Native compare proof', slotCount: 4 }),
    createAiSlide({ slideId: 'S03', layoutFamily: 'timeline_band', title: 'Native timeline proof', slotCount: 4 }),
    createAiSlide({ slideId: 'S04', layoutFamily: 'judgement_ladder', title: 'Native ladder proof', slotCount: 4 }),
    createAiSlide({ slideId: 'S05', layoutFamily: 'ring_cross', title: 'Native ring proof', slotCount: 4 }),
    createAiSlide({ slideId: 'S06', layoutFamily: 'summary_peak', title: 'Native summary proof', slotCount: 3 }),
  ];
  const result = runNativeMaterializer(materializerPayload(slides));
  assert.equal(result.slides.length, slides.length);
  assert.equal(result.pptx_slides.length, slides.length);
  assert.equal(result.slides.every((slide) => slide.layout_writer === 'officecli_pptx_materializer'), true);
  assert.equal(result.slides.every((slide) => slide.ai_first_spatial_plan.helper_template_layout_used === false), true);
  assert.equal(result.slides.every((slide) => slide.redcube_svg_ir_preflight.status === 'pass'), true);
  assert.equal(result.slides.every((slide) => slide.issues.length === 0), true, JSON.stringify(result.slides.map((slide) => ({
    slide_id: slide.slide_id,
    issues: slide.issues,
    panel_text_safe_area_failures: slide.metrics?.panel_text_safe_area_failures,
    overlaps: slide.metrics?.overlaps,
  }))));
  assert.equal(result.officecli_gate.materializer, 'officecli_pptx_materializer');
  assert.equal(result.officecli_gate.expected_text_fragments.includes('Native cover proof'), true);
  assert.equal(result.officecli_gate.geometry_audit.ok, true);
  assert.equal(result.pptx_geometry.slide_width_in, 16);
  assert.equal(result.pptx_geometry.slide_height_in, 9);
  assert.deepEqual(result.pptx_geometry.overflows, []);
  assert.equal(result.slides.every((slide) => typeof slide.metrics.composition_signature === 'string'), true);
  assert.equal(new Set(result.slides.map((slide) => slide.metrics.composition_signature)).size >= 5, true);
});

test('native PPTX officecli materializer rejects incomplete or unreadable AI shape plans', () => {
  const missingBounds = runNativeMaterializerFailure(materializerPayload([{
    slide_id: 'S01',
    title: 'Incomplete plan',
    layout_family: 'multi_zone_compare',
    native_shapes: [{ shape_id: 'S01-title', role: 'title', editable_text: 'Incomplete plan' }],
  }]));
  assert.notEqual(missingBounds.status, 0);
  assert.match(missingBounds.stderr, /native PPT AI-first editable_shape_plan failed/);
  assert.match(missingBounds.stderr, /ai_first_shape_plan_too_thin/);
  assert.match(missingBounds.stderr, /ai_first_shape_bounds_invalid/);

  const unreadableIndex = createAiSlide({ slideId: 'S02', indexFontSize: 12.5 });
  const unreadable = runNativeMaterializerFailure(materializerPayload([unreadableIndex]));
  assert.notEqual(unreadable.status, 0);
  assert.match(unreadable.stderr, /ai_first_point_index_too_small/);

  const mechanicalCards = createAiSlide({
    slideId: 'S03',
    layoutFamily: 'multi_zone_compare',
    includeStructuralVisual: false,
  });
  const mechanical = runNativeMaterializerFailure(materializerPayload([mechanicalCards]));
  assert.notEqual(mechanical.status, 0);
  assert.match(mechanical.stderr, /ai_first_visual_structure_missing/);
  assert.match(mechanical.stderr, /ai_first_mechanical_card_template_detected/);
});

test('native PPTX quality roles keep auxiliary metadata out of body QA while preserving structural gates', () => {
  const auxiliarySlide = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: 'Auxiliary text is not body content',
    slotCount: 2,
  });
  auxiliarySlide.native_shapes.push(
    {
      shape_id: 'S01-cover-meta',
      kind: 'text_box',
      role: 'cover_meta',
      quality_role: 'auxiliary',
      editable_text: '2026-05-28',
      bounds: { left_in: 12.3, top_in: 0.52, width_in: 2.2, height_in: 0.32 },
      font_size: 12,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: 'S01-page-no',
      kind: 'text_box',
      role: 'page_no',
      quality_role: 'auxiliary',
      editable_text: '01',
      bounds: { left_in: 14.25, top_in: 8.18, width_in: 0.55, height_in: 0.28 },
      font_size: 12,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
      align: 'right',
    },
    {
      shape_id: 'S01-speaker',
      kind: 'text_box',
      role: 'speaker_identity',
      quality_role: 'auxiliary',
      layout_zone_id: 'takeaway_zone',
      editable_text: '教学型讲者',
      bounds: { left_in: 12.2, top_in: 7.85, width_in: 1.6, height_in: 0.36 },
      font_size: 12,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
    },
  );
  const result = runNativeMaterializer(materializerPayload([auxiliarySlide]));
  const [slide] = result.slides;
  assert.equal(slide.checks.body_text_readability_ok, true);
  assert.deepEqual(slide.metrics.body_text_font_failures, []);
  assert.deepEqual(slide.metrics.block_content_failures, []);
  assert.equal(slide.metrics.structural_visual_count >= 1, true);
  assert.equal(slide.checks.visual_structure_present, true);

  const noStructuralVisual = {
    ...auxiliarySlide,
    native_shapes: auxiliarySlide.native_shapes.filter((shape) => !String(shape.role || '').includes('bridge_connector')),
  };
  const rejected = runNativeMaterializerFailure(materializerPayload([noStructuralVisual]));
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /ai_first_visual_structure_missing/);
});

test('native PPTX materializer accepts AI-first content panels with structural flow instead of decorative filler', () => {
  const structuralFlowSlide = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '同一输入下比较三条路线',
    core: '先固定输入，再观察可见产物、复核证据和导出闭环。',
    slotCount: 4,
  });
  structuralFlowSlide.native_shapes = [
    ...structuralFlowSlide.native_shapes
      .filter((shape) => shape.quality_role !== 'decorative'),
    {
      shape_id: 'S01-flow-left',
      kind: 'connector',
      role: 'flow_connector',
      quality_role: 'structural',
      layout_zone_id: 'matrix_zone',
      bounds: { left_in: 4.96, top_in: 3.06, width_in: 0.34, height_in: 0.05 },
      line: '#2563EB',
      fill: 'none',
    },
    {
      shape_id: 'S01-flow-right',
      kind: 'connector',
      role: 'flow_connector',
      quality_role: 'structural',
      layout_zone_id: 'matrix_zone',
      bounds: { left_in: 9.34, top_in: 3.06, width_in: 0.34, height_in: 0.05 },
      line: '#2563EB',
      fill: 'none',
    },
  ]
    .map((shape) => {
      if (shape.role === 'compare_panel') {
        return {
          ...shape,
          role: 'content_panel',
          editable_text: `可见内容槽：${shape.shape_id}`,
          font_size: 18,
        };
      }
      if (shape.role === 'point_text') {
        return {
          ...shape,
          role: 'takeaway',
          editable_text: shape.editable_text,
        };
      }
      return shape;
    });

  const result = runNativeMaterializer(materializerPayload([structuralFlowSlide]));
  const [slide] = result.slides;
  assert.equal(slide.checks.visual_structure_present, true);
  assert.equal(slide.checks.slot_fill_ok, true);
  assert.equal(slide.checks.content_depth_ok, true);
  assert.equal(slide.metrics.layout_variant, 'content_four_panel');
  assert.equal(slide.metrics.structural_visual_count >= 2, true);
  assert.equal(slide.metrics.structural_visual_roles.includes('flow_connector'), true);
  assert.equal(slide.metrics.visual_support_shape_count >= 2, true);
  assert.equal(slide.metrics.audience_content_slot_count >= 3, true);
  assert.equal(slide.issues.includes('native_visual_structure_missing'), false);
});

test('native PPTX officecli writer maps AI line objects and mid vertical alignment', () => {
  const slideData = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: 'OfficeCLI writer schema mapping',
    core: 'Writer adapter maps AI style objects without taking layout ownership.',
    slotCount: 3,
  });
  slideData.native_shapes = slideData.native_shapes.map((shape) => {
    if (shape.role === 'title' || shape.role === 'core_sentence' || shape.role === 'point_text') {
      return {
        ...shape,
        vertical_align: 'mid',
      };
    }
    if (shape.role === 'compare_panel') {
      return {
        ...shape,
        role: 'content_panel',
        line: {
          color: '#BFDBFE',
          width_pt: 1.2,
        },
      };
    }
    if (shape.role === 'bridge_connector_rail') {
      return {
        ...shape,
        kind: 'connector',
        line: {
          color: '#2563EB',
          width_pt: 2.4,
          begin_arrow: false,
          end_arrow: true,
        },
      };
    }
    return shape;
  });

  const result = runNativeMaterializer(materializerPayload([slideData]));
  const [slide] = result.slides;
  assert.equal(slide.officecli_gate, undefined);
  assert.equal(result.officecli_gate.materializer, 'officecli_pptx_materializer');
  assert.equal(result.officecli_gate.geometry_audit.ok, true);
  assert.equal(slide.native_shapes.some((shape) => shape.line === '#BFDBFE'), true);
  const unzip = execFileSync('unzip', ['-p', join(result.workspaceRoot, 'native.pptx'), 'ppt/slides/slide1.xml'], {
    encoding: 'utf-8',
  });
  assert.match(unzip, /<p:cxnSp>/);
});

test('native PPTX quality accepts content panels paired with separate point text and short evidence labels', () => {
  const slideData = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '三条生成路径，怎样才算真实闭环？',
    core: '真实闭环要看三条路径是否共用同一资料、完成 3/3 交付门，并留下可复核证据。',
    slotCount: 3,
    panelMutator: (shape) => ({
      ...shape,
      role: 'content_panel',
      editable_text: '',
    }),
  });
  slideData.native_shapes.push(
    {
      shape_id: 'S01-evidence-1',
      kind: 'text_box',
      role: 'evidence_item',
      quality_role: 'content',
      editable_text: '演示文稿文件',
      bounds: { left_in: 0.72, top_in: 6.55, width_in: 1.95, height_in: 0.9 },
      font_size: 18,
    },
    {
      shape_id: 'S01-evidence-2',
      kind: 'text_box',
      role: 'evidence_item',
      quality_role: 'content',
      editable_text: '形状清单',
      bounds: { left_in: 2.9, top_in: 6.55, width_in: 1.45, height_in: 0.9 },
      font_size: 18,
    },
  );

  const result = runNativeMaterializer(materializerPayload([slideData]));
  const [slide] = result.slides;

  assert.equal(slide.metrics.layout_variant, 'content_three_panel');
  assert.equal(slide.metrics.expected_slot_count, 3);
  assert.equal(slide.metrics.filled_slot_count, 3);
  assert.equal(slide.checks.slot_fill_ok, true);
  assert.equal(slide.checks.content_depth_ok, true);
  assert.equal(slide.metrics.content_depth_failures.length, 0);
});

test('native PPTX materializer blocks CJK title boxes that are too short for wrapped title text', () => {
  const titleOverflow = createAiSlide({
    slideId: 'S01',
    title: '三条生成路线，先看同一份输入',
    layoutFamily: 'multi_zone_compare',
  });
  titleOverflow.native_shapes = titleOverflow.native_shapes.map((shape) => (
    shape.role === 'title'
      ? {
          ...shape,
          bounds: { left_in: 0.75, top_in: 0.62, width_in: 8.2, height_in: 1.25 },
          font_size: 46,
        }
      : shape
  ));
  const rejected = runNativeMaterializerFailure(materializerPayload([titleOverflow]));
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /ai_first_text_capacity_exceeded/);
  assert.match(rejected.stderr, /S01-title/);

  titleOverflow.native_shapes = titleOverflow.native_shapes.map((shape) => (
    shape.role === 'title'
      ? {
          ...shape,
          bounds: { ...shape.bounds, height_in: 1.75 },
        }
      : shape.role === 'core_sentence'
        ? {
            ...shape,
            bounds: { ...shape.bounds, top_in: 2.5 },
          }
      : shape
  ));
  const accepted = runNativeMaterializer(materializerPayload([titleOverflow]));
  assert.deepEqual(accepted.slides[0].metrics.block_content_failures, []);
});

test('native PPTX plan preflight reports tiny text boxes and zero-thickness connectors before materialization', () => {
  const invalid = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '同一输入下比较三条路线',
    core: '先固定输入，再观察可见产物、复核证据和导出闭环。',
    slotCount: 3,
  });
  invalid.native_shapes = invalid.native_shapes.map((shape) => {
    if (shape.role === 'point_text') {
      return {
        ...shape,
        bounds: { ...shape.bounds, height_in: 0.34 },
      };
    }
    if (shape.kind === 'line') {
      return {
        ...shape,
        bounds: { ...shape.bounds, height_in: 0 },
      };
    }
    return shape;
  });

  const result = runNativePlanValidation(materializerPayload([invalid]));
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'ai_first_shape_plan_preflight');
  assert.equal(result.failure_count > 0, true);
  const reasons = JSON.stringify(result.failures);
  assert.match(reasons, /ai_first_text_box_height_below_readability_floor|ai_first_text_capacity_exceeded/);
  assert.match(reasons, /ai_first_shape_bounds_invalid|ai_first_connector_thickness_too_small/);
});

test('native PPTX plan preflight blocks sentence-length lead boxes below readability floor', () => {
  const invalid = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '同一输入下比较三条路线',
    core: '先固定输入，再观察可见产物、复核证据和导出闭环。',
    slotCount: 3,
  });
  invalid.native_shapes = invalid.native_shapes.map((shape) => (
    shape.role === 'core_sentence'
      ? {
          ...shape,
          font_size: 24,
          bounds: { ...shape.bounds, height_in: 0.78 },
        }
      : shape
  ));

  const rejected = runNativePlanValidation(materializerPayload([invalid]));
  assert.equal(rejected.ok, false);
  assert.match(JSON.stringify(rejected.failures), /ai_first_text_box_height_below_readability_floor/);
  assert.match(JSON.stringify(rejected.failures), /minimum_height_in.*0\.95/);

  invalid.native_shapes = invalid.native_shapes.map((shape) => (
    shape.role === 'core_sentence'
      ? {
          ...shape,
          bounds: { ...shape.bounds, height_in: 0.95 },
        }
      : shape
  ));
  const accepted = runNativePlanValidation(materializerPayload([invalid]));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));
});

test('native PPTX plan preflight estimates wrapped CJK point text like officecli', () => {
  const invalid = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '同一输入下比较三条路线',
    core: '先固定输入，再观察可见产物、复核证据和导出闭环。',
    slotCount: 3,
  });
  invalid.native_shapes = invalid.native_shapes.map((shape) => (
    shape.role === 'point_text'
      ? {
          ...shape,
          editable_text: '演示文稿路线把同一事实组织成课堂可用的可编辑页面。',
          bounds: { ...shape.bounds, width_in: 2.04, height_in: 0.86 },
          font_size: 18,
        }
      : shape
  ));

  const rejected = runNativePlanValidation(materializerPayload([invalid]));
  assert.equal(rejected.ok, false);
  assert.match(JSON.stringify(rejected.failures), /ai_first_text_capacity_exceeded/);
  assert.match(JSON.stringify(rejected.failures), /suggested_height_in/);
});

test('native PPTX plan preflight reports text overlaps, missing page numbers, and thin content', () => {
  const invalid = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '同一输入下比较三条路线',
    core: '先固定输入，再观察可见产物、复核证据和导出闭环。',
    slotCount: 3,
  });
  invalid.native_shapes = invalid.native_shapes
    .filter((shape) => shape.role !== 'page_number')
    .map((shape) => {
      if (shape.shape_id === 'S01-slot-2-text') {
        return {
          ...shape,
          editable_text: '标签',
          bounds: { ...shape.bounds, left_in: 1.45, top_in: 3.9, height_in: 1.0 },
        };
      }
      if (shape.shape_id === 'S01-slot-1-text') {
        return {
          ...shape,
          bounds: { ...shape.bounds, left_in: 1.35, top_in: 3.88, height_in: 1.0 },
        };
      }
      return shape;
    });

  const rejected = runNativePlanValidation(materializerPayload([invalid]));
  const failures = JSON.stringify(rejected.failures);
  assert.equal(rejected.ok, false);
  assert.match(failures, /ai_first_text_box_overlap/);
  assert.match(failures, /ai_first_content_depth_too_low/);
  assert.match(failures, /ai_first_page_number_missing/);
});

test('native PPTX content depth ignores auxiliary badges and compact evidence labels', () => {
  const slideData = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '三条生成路径，怎样才算真实闭环？',
    core: '真实闭环要看三条路径是否共用同一资料、完成 3/3 交付门，并留下可复核证据。',
    slotCount: 3,
  });
  slideData.native_shapes.push(
    {
      shape_id: 'S01-speaker',
      kind: 'text_box',
      role: 'speaker_identity',
      quality_role: 'content',
      editable_text: '教学型讲者',
      bounds: { left_in: 12.0, top_in: 0.7, width_in: 1.4, height_in: 0.64 },
      font_size: 18,
    },
    {
      shape_id: 'S01-panel-title',
      kind: 'text_box',
      role: 'panel_title',
      quality_role: 'content',
      editable_text: '证据包',
      bounds: { left_in: 10.5, top_in: 6.5, width_in: 1.3, height_in: 0.68 },
      font_size: 20,
    },
    {
      shape_id: 'S01-short-evidence',
      kind: 'text_box',
      role: 'point_text_short',
      quality_role: 'content',
      editable_text: 'PPTX',
      bounds: { left_in: 12.0, top_in: 6.5, width_in: 1.0, height_in: 0.64 },
      font_size: 18,
    },
  );
  slideData.native_shapes = slideData.native_shapes.map((shape) => (
    shape.shape_id === 'S01-speaker'
      ? {
          ...shape,
          quality_role: 'auxiliary',
          layout_zone_id: 'takeaway_zone',
          bounds: { ...shape.bounds, left_in: 12.45, top_in: 7.1 },
        }
      : ['S01-panel-title', 'S01-short-evidence'].includes(shape.shape_id)
        ? {
            ...shape,
            layout_zone_id: 'takeaway_zone',
          }
      : shape
  ));

  const accepted = runNativePlanValidation(materializerPayload([slideData]));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));

  const result = runNativeMaterializer(materializerPayload([slideData]));
  const [slide] = result.slides;
  assert.equal(slide.checks.content_depth_ok, true);
  assert.equal(slide.metrics.content_depth_failures.length, 0);
});

test('native PPTX layout intent allows cards when structural visual is specific', () => {
  const structuralCards = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: '同一输入下比较三条路线',
    core: '先固定输入，再观察可见产物、复核证据和导出闭环。',
    slotCount: 3,
  });
  structuralCards.layout_intent.non_text_visual = 'shared hub with route cards, connector rails, merge rail, and verification band';
  const accepted = runNativePlanValidation(materializerPayload([structuralCards]));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));

  const genericCards = createAiSlide({
    slideId: 'S02',
    layoutFamily: 'multi_zone_compare',
    title: '同一输入下比较三条路线',
    core: '先固定输入，再观察可见产物、复核证据和导出闭环。',
    slotCount: 3,
  });
  genericCards.layout_intent.non_text_visual = 'three editable cards';
  const rejected = runNativePlanValidation(materializerPayload([genericCards]));
  assert.equal(rejected.ok, false);
  assert.match(JSON.stringify(rejected.failures), /ai_first_non_text_visual_too_generic/);
});

test('native PPTX route rejects shape plans without top-level design spec lock', () => {
  const missingSpecLock = materializerPayload([
    createAiSlide({ slideId: 'S01', layoutFamily: 'multi_zone_compare', title: 'Missing spec lock' }),
  ]);
  delete missingSpecLock.editable_shape_plan.design_spec_lock;
  const rejected = runNativeMaterializerFailure(missingSpecLock);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /ai_first_design_spec_lock_missing/);
});

test('native PPTX route rejects thin design spec locks before materialization', () => {
  const thinSpecLock = materializerPayload([
    createAiSlide({ slideId: 'S01', layoutFamily: 'multi_zone_compare', title: 'Thin spec lock' }),
  ]);
  thinSpecLock.editable_shape_plan.design_spec_lock = {
    spec_id: 'thin_spec_lock_v1',
    owner: 'llm_agent',
    motif: 'generic cards',
    layout_archetypes: ['cards', 'split', 'timeline'],
    qa_gates: ['bounds'],
  };
  const rejected = runNativeMaterializerFailure(thinSpecLock);
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /ai_first_design_spec_lock_missing/);
  assert.match(rejected.stderr, /palette\.background_or_canvas\+ink\+accent/);
  assert.match(rejected.stderr, /typography\.body_pt_min>=18/);
  assert.match(rejected.stderr, /professional_design_brief\.design_register/);
  assert.match(rejected.stderr, /borrowed_principles\.template_layout_grammar/);
  assert.match(rejected.stderr, /qa_gates\.layout_variety/);

  const validation = runNativePlanValidation(thinSpecLock);
  assert.equal(validation.ok, false);
  assert.equal(validation.stage, 'normalize_slide_data');
  assert.equal(
    validation.failures.some((failure) => (
      failure.reason === 'ai_first_design_spec_lock_missing'
      && failure.missing_fields.includes('professional_design_brief.design_register')
      && failure.missing_fields.includes('borrowed_principles.template_profile')
      && failure.missing_fields.includes('borrowed_principles.semantic_layout_selection')
      && failure.missing_fields.includes('borrowed_principles.reference_deck_analysis')
    )),
    true,
  );
});

test('native PPTX route rejects shape plans without template layout grammar and zone bindings', () => {
  const missingGrammar = materializerPayload([
    createAiSlide({ slideId: 'S01', layoutFamily: 'multi_zone_compare', title: 'Missing template grammar' }),
  ]);
  delete missingGrammar.editable_shape_plan.template_layout_grammar;
  const grammarRejected = runNativeMaterializerFailure(missingGrammar);
  assert.notEqual(grammarRejected.status, 0);
  assert.match(grammarRejected.stderr, /ai_first_template_layout_grammar_missing/);

  const missingBinding = materializerPayload([
    createAiSlide({ slideId: 'S02', layoutFamily: 'ring_cross', title: 'Missing template binding' }),
  ]);
  delete missingBinding.editable_shape_plan.slides[0].template_layout_binding;
  delete missingBinding.editable_shape_plan.slides[0].native_shapes[0].layout_zone_id;
  const bindingRejected = runNativePlanValidation(missingBinding);
  assert.equal(bindingRejected.ok, false);
  assert.match(JSON.stringify(bindingRejected.failures), /ai_first_template_layout_binding_missing|ai_first_shape_layout_zone_binding_missing/);
});

test('native PPTX route rejects shallow archetype catalogs and shapes outside declared zones', () => {
  const shallowCatalog = materializerPayload([
    createAiSlide({ slideId: 'S01', layoutFamily: 'multi_zone_compare', title: 'Shallow archetype contract' }),
  ]);
  shallowCatalog.editable_shape_plan.template_layout_grammar.archetype_catalog = [
    { archetype_id: 'risk_control_matrix' },
    { archetype_id: 'executive_status_board' },
    { archetype_id: 'decision_dashboard' },
  ];
  const catalogRejected = runNativePlanValidation(shallowCatalog);
  assert.equal(catalogRejected.ok, false);
  assert.equal(catalogRejected.stage, 'normalize_slide_data');
  assert.match(JSON.stringify(catalogRejected.failures), /ai_first_template_layout_grammar_missing/);
  assert.match(JSON.stringify(catalogRejected.failures), /ai_first_template_layout_archetype_incomplete/);

  const outsideZone = materializerPayload([
    createAiSlide({ slideId: 'S02', layoutFamily: 'multi_zone_compare', title: 'Zone containment' }),
  ]);
  outsideZone.editable_shape_plan.slides[0].native_shapes = outsideZone.editable_shape_plan.slides[0].native_shapes.map((shape) => (
    shape.role === 'point_text'
      ? {
          ...shape,
          layout_zone_id: 'matrix_zone',
          bounds: { ...shape.bounds, left_in: 14.5, top_in: 7.7, width_in: 1.2, height_in: 0.8 },
        }
      : shape
  ));
  const zoneRejected = runNativePlanValidation(outsideZone);
  assert.equal(zoneRejected.ok, false);
  const zoneFailure = zoneRejected.failures
    .flatMap((slide) => slide.failures || [])
    .find((failure) => failure.reason === 'ai_first_shape_outside_template_layout_zone');
  assert.equal(zoneFailure.shape_id, 'S02-slot-1-text');
  assert.equal(zoneFailure.required_zone_inset_in, 0.02);
  assert.equal(zoneFailure.zone_safe_bounds.left_in > zoneFailure.zone_bounds.left_in, true);
  assert.equal(zoneFailure.required_delta_in.right > 0, true);
  assert.match(JSON.stringify(zoneRejected.failures), /ai_first_shape_outside_template_layout_zone/);
});

test('native PPTX plan preflight rejects helper-inferred design defaults', () => {
  const missingDesignFields = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: 'AI plan must own every visual decision',
    core: '字体、角色和可见样式必须来自 AI plan，而不是执行 helper 的默认值。',
    slotCount: 3,
  });
  missingDesignFields.native_shapes = missingDesignFields.native_shapes.map((shape) => {
    if (shape.shape_id === 'S01-slot-1-text') {
      const { font_size: _fontSize, quality_role: _qualityRole, ...rest } = shape;
      return rest;
    }
    if (shape.shape_id === 'S01-slot-1-panel') {
      const { fill: _fill, line: _line, ...rest } = shape;
      return rest;
    }
    return shape;
  });

  const rejected = runNativePlanValidation(materializerPayload([missingDesignFields]));
  assert.equal(rejected.ok, false);
  const failures = JSON.stringify(rejected.failures);
  assert.match(failures, /ai_first_quality_role_missing_or_invalid/);
  assert.match(failures, /ai_first_font_size_missing/);
  assert.match(failures, /ai_first_visible_style_missing|ai_first_non_text_shape_invisible/);
});

test('native PPTX authoring rejects blueprint-only slides as a shape-plan substitute', () => {
  const payload = materializerPayload([
    createAiSlide({ slideId: 'S01', layoutFamily: 'multi_zone_compare', title: 'Blueprint is not the native plan' }),
  ]);
  payload.blueprint = {
    slides: payload.editable_shape_plan.slides,
  };
  payload.editable_shape_plan.slides = [];

  const rejected = runNativePlanValidation(payload);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.stage, 'normalize_slide_data');
  assert.match(JSON.stringify(rejected.failures), /ai_first_shape_plan_normalization_failed/);

  const materializerRejected = runNativeMaterializerFailure(payload);
  assert.notEqual(materializerRejected.status, 0);
  assert.match(materializerRejected.stderr, /editable_shape_plan\.slides/);
  assert.match(materializerRejected.stderr, /cannot substitute/);
});

test('native PPTX plan preflight reports panel safe-area geometry deltas for exact repair', () => {
  const panelBleed = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: 'Panel safe area diagnostics',
    core: 'Panel text must carry precise repair bounds.',
    slotCount: 3,
  });
  panelBleed.native_shapes = panelBleed.native_shapes.map((shape) => {
    if (shape.shape_id === 'S01-slot-1-panel') {
      return {
        ...shape,
        role: 'content_panel',
        bounds: { left_in: 1.0, top_in: 3.2, width_in: 3.9, height_in: 2.5 },
      };
    }
    if (shape.shape_id === 'S01-slot-1-text') {
      return {
        ...shape,
        layout_zone_id: 'signal_zone',
        bounds: { left_in: 1.05, top_in: 3.32, width_in: 3.75, height_in: 1.0 },
      };
    }
    return shape;
  });

  const rejected = runNativePlanValidation(materializerPayload([panelBleed]));
  assert.equal(rejected.ok, false);
  const panelFailure = rejected.failures
    .flatMap((slide) => slide.failures || [])
    .find((failure) => failure.reason === 'ai_first_text_panel_safe_area_violation');
  assert.equal(panelFailure.shape_id, 'S01-slot-1-text');
  assert.equal(panelFailure.panel_shape_id, 'S01-slot-1-panel');
  assert.equal(panelFailure.required_inset_in, 0.15);
  assert.equal(panelFailure.panel_safe_bounds.left_in, 1.15);
  assert.equal(panelFailure.shape_bounds.left_in, 1.05);
  assert.equal(panelFailure.required_delta_in.left > 0, true);
});

test('native PPTX plan preflight accepts panel text fitted exactly on safe-area boundary', () => {
  const boundaryFit = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    title: 'Panel safe area boundary fit',
    core: 'Panel text may fit exactly on the declared safe area boundary.',
    slotCount: 3,
  });
  boundaryFit.native_shapes = boundaryFit.native_shapes.map((shape) => {
    if (shape.shape_id === 'S01-slot-1-panel') {
      return {
        ...shape,
        role: 'content_panel',
        layout_zone_id: 'matrix_zone',
        bounds: { left_in: 1.0, top_in: 4.98, width_in: 3.9, height_in: 1.35 },
      };
    }
    if (shape.shape_id === 'S01-slot-1-text') {
      return {
        ...shape,
        layout_zone_id: 'matrix_zone',
        bounds: { left_in: 1.15, top_in: 5.13, width_in: 3.6, height_in: 1.05 },
      };
    }
    return shape;
  });

  const accepted = runNativePlanValidation(materializerPayload([boundaryFit]));
  assert.equal(accepted.ok, true, JSON.stringify(accepted.failures));
  const result = runNativeMaterializer(materializerPayload([boundaryFit]));
  const [slide] = result.slides;
  assert.equal(slide.checks.panel_text_safe_area_ok, true);
  assert.deepEqual(slide.metrics.panel_text_safe_area_failures, []);
});

test('native PPTX route rejects archetype declarations that are not fulfilled by slide roles and filled zones', () => {
  const missingRoleGroup = materializerPayload([
    createAiSlide({ slideId: 'S03', layoutFamily: 'summary_peak', title: 'Declared archetype without proof role' }),
  ]);
  missingRoleGroup.editable_shape_plan.slides[0].native_shapes = missingRoleGroup.editable_shape_plan.slides[0].native_shapes
    .filter((shape) => !String(shape.role || '').includes('takeaway'));
  const roleRejected = runNativePlanValidation(missingRoleGroup);
  assert.equal(roleRejected.ok, false);
  assert.match(JSON.stringify(roleRejected.failures), /ai_first_template_layout_required_role_group_missing/);

  const unfilledZones = materializerPayload([
    createAiSlide({ slideId: 'S04', layoutFamily: 'multi_zone_compare', title: 'Declared archetype with empty zones' }),
  ]);
  unfilledZones.editable_shape_plan.slides[0].native_shapes = unfilledZones.editable_shape_plan.slides[0].native_shapes
    .filter((shape) => !['signal_zone', 'takeaway_zone'].includes(shape.layout_zone_id));
  const zoneCoverageRejected = runNativePlanValidation(unfilledZones);
  assert.equal(zoneCoverageRejected.ok, false);
  assert.match(JSON.stringify(zoneCoverageRejected.failures), /ai_first_template_layout_required_zone_coverage_too_low/);
});

test('native PPTX quality gate blocks operator-facing proof language in visible text', () => {
  const leaked = createAiSlide({
    slideId: 'S01',
    title: 'Native PPT live product-entry proof',
    core: '这页把 product-entry proof lane 讲给观众看，属于内部验证口径泄漏。',
    points: [
      'product-entry 只是内部入口，不应作为观众可见的页面概念。',
      'live proof 是测试标签，必须改写成可复核交付闭环。',
    ],
  });
  const result = runNativeMaterializer(materializerPayload([leaked]));
  const [slide] = result.slides;
  assert.equal(slide.checks.external_audience_language_ok, false);
  assert.equal(slide.issues.includes('operator_language_leak_detected'), true);
  assert.deepEqual(slide.metrics.operator_language_fragments, [
    'live proof',
    'product-entry',
    'proof lane',
  ]);
});
