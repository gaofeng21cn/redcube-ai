// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAiSlide,
  materializerPayload,
  runNativeMaterializer,
  runNativeMaterializerFailure,
} from './helpers/ppt-native-python-layout-fixtures.ts';

test('native PPTX officecli materializer accepts complete AI spatial plans', () => {
  const slides = [
    createAiSlide({ slideId: 'S01', layoutFamily: 'cover_signal', title: 'Native cover proof' }),
    createAiSlide({ slideId: 'S02', layoutFamily: 'timeline_band', title: 'Native timeline proof', slotCount: 4 }),
  ];
  const result = runNativeMaterializer(materializerPayload(slides));
  assert.equal(result.slides.length, slides.length);
  assert.equal(result.pptx_slides.length, slides.length);
  assert.deepEqual(result.pptx_geometry.overflows, []);
  assert.equal(result.officecli_gate.materializer, 'officecli_pptx_materializer');
  const timeline = result.slides.find((slide) => slide.slide_id === 'S02');
  const timelineConnectors = timeline.native_shapes.filter((shape) => shape.role === 'timeline_connector');
  assert.equal(timeline.metrics.semantic_visual_evidence.some((item) => item.family === 'timeline'), true);
  assert.equal(timelineConnectors.length, 3);
  assert.equal(timelineConnectors.every((shape) => (
    shape.kind === 'connector'
    && shape.from_shape_id
    && shape.to_shape_id
    && [shape.head_end, shape.tail_end].some((value) => value && value !== 'none')
  )), true);
  assert.equal(
    result.slides.every((slide) => (
      slide.layout_writer === 'officecli_pptx_materializer'
      && slide.ai_first_spatial_plan?.helper_template_layout_used === false
      && slide.redcube_svg_ir_preflight?.status === 'pass'
      && slide.issues.length === 0
    )),
    true,
    JSON.stringify(result.slides.map((slide) => ({ slide_id: slide.slide_id, issues: slide.issues }))),
  );
});

test('native PPTX materializer fails closed on thin AI shape plans', () => {
  const failure = runNativeMaterializerFailure(materializerPayload([{
    slide_id: 'S01',
    title: 'Incomplete plan',
    layout_family: 'multi_zone_compare',
    native_shapes: [{ shape_id: 'S01-title', role: 'title', editable_text: 'Incomplete plan' }],
  }]));
  assert.notEqual(failure.status, 0);
  assert.match(failure.stderr, /native PPT AI-first editable_shape_plan failed/);
  assert.match(failure.stderr, /ai_first_shape_plan_too_thin|ai_first_shape_bounds_invalid/);
});
