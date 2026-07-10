// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';
import {
  assertMaterializedQuality,
  createAiSlide,
  materializerPayload,
  pythonTestEnv,
  resolveTestPythonCommand,
  runNativeMaterializer,
  runNativeMaterializerFailure,
  runNativePlanValidation,
  sha256Hex,
  writeJson,
  writeTinyPng,
} from './helpers/ppt-native-python-layout-fixtures.ts';

let semanticMaterialization = null;

function materializedSemanticFixture() {
  if (semanticMaterialization) return semanticMaterialization;
  const slides = [
    createAiSlide({
      slideId: 'S01',
      title: 'Native semantic signal',
      layoutFamily: 'cover_signal',
      points: [
        'Opening signal establishes the audience decision.',
        'Editable evidence stays separate from the title.',
        'The signal composition remains visually specific.',
      ],
    }),
    createAiSlide({
      slideId: 'S02',
      layoutFamily: 'timeline_band',
      points: [
        'Source lock creates the first restart point.',
        'Native authoring produces editable package objects.',
        'Render proof closes the visible execution sequence.',
      ],
    }),
    createAiSlide({
      slideId: 'S03',
      layoutFamily: 'summary_peak',
      points: [
        'The final synthesis names the operating decision.',
        'The proof remains editable and independently reviewable.',
        'The route-back target stays explicit after evaluation.',
      ],
    }),
  ];
  const fixture = {
    expected_renderer_kind: 'libreoffice_headless',
    forbidden_visible_text_fragments: [],
    suite_defaults: {
      min_layout_family_count: 3,
      min_density: 0.12,
      max_density: 0.82,
    },
  };
  const suite = {
    suite_id: 'semantic_materializer_smoke',
    expected_page_count: slides.length,
    expected_layout_families: slides.map((slide) => slide.layout_family),
    expected_anchor_shapes: [],
    expected_visible_text_fragments: [
      'Opening signal establishes the audience decision.',
      'Render proof closes the visible execution sequence.',
      'The final synthesis names the operating decision.',
    ],
    editable_shape_plan: { route: 'author_pptx_native' },
  };
  semanticMaterialization = {
    fixture,
    suite,
    result: runNativeMaterializer(materializerPayload(slides), 'redcube-native-semantic-smoke-'),
  };
  return semanticMaterialization;
}

test('native PPTX shape quality flags missing slots, low content, overlap, and unbalanced grids', () => {
  const missingSlot = createAiSlide({
    slideId: 'S01',
    layoutFamily: 'multi_zone_compare',
    slotCount: 4,
    points: [
      '第一项说明任务入口和验收口径。',
      '第二项说明自主执行已经形成证据。',
      '第三项说明失败时会进入修复。',
      '第四项说明导出证据可复核。',
    ],
    panelMutator: (shape, index) => (index === 3 ? { ...shape, role: 'body_panel' } : shape),
  });
  const labelOnly = createAiSlide({
    slideId: 'S02',
    layoutFamily: 'ring_cross',
    slotCount: 4,
    points: ['定义', '事实', '执行', '发布'],
    textMutator: (shape) => ({
      ...shape,
      editable_text: shape.editable_text.replace(/ carries explicit review evidence$/, ''),
    }),
  });
  const overlapped = createAiSlide({
    slideId: 'S03',
    layoutFamily: 'judgement_ladder',
    slotCount: 3,
    textMutator: (shape, index) => (index === 0
      ? { ...shape, role: 'point_text_short' }
      : index === 1
        ? { ...shape, role: 'point_text_short', bounds: { left_in: 1.25, top_in: 4.02, width_in: 3.0, height_in: 1.1 } }
      : shape),
  });
  const unbalanced = createAiSlide({
    slideId: 'S04',
    layoutFamily: 'multi_zone_compare',
    slotCount: 3,
    panelMutator: (shape, index) => (index === 0
      ? { ...shape, bounds: { ...shape.bounds, width_in: 6.0 } }
        : { ...shape, bounds: { ...shape.bounds, width_in: 2.0 } }),
  });

  const missingSlotRejected = runNativeMaterializerFailure(materializerPayload([missingSlot]));
  assert.notEqual(missingSlotRejected.status, 0);
  assert.match(missingSlotRejected.stderr, /native PPTX manifest QA failed/);
  assert.match(missingSlotRejected.stderr, /native_slot_fill_failed/);

  const unbalancedRejected = runNativeMaterializerFailure(materializerPayload([unbalanced]));
  assert.notEqual(unbalancedRejected.status, 0);
  assert.match(unbalancedRejected.stderr, /native PPTX manifest QA failed/);
  assert.match(unbalancedRejected.stderr, /native_grid_balance_failed/);

  const contentPreflight = runNativePlanValidation(materializerPayload([labelOnly]));
  const overlapPreflight = runNativePlanValidation(materializerPayload([overlapped]));

  assert.equal(contentPreflight.ok, false);
  assert.equal(JSON.stringify(contentPreflight.failures).match(/ai_first_content_depth_too_low/g)?.length, 4);

  assert.equal(overlapPreflight.ok, false);
  assert.match(JSON.stringify(overlapPreflight.failures), /ai_first_text_box_overlap/);
});

test('native semantic shape smoke is materialized without helper templates', () => {
  const { fixture, suite, result } = materializedSemanticFixture();
  const report = assertMaterializedQuality({ fixture, suite, result });
  assert.equal(report.route, 'author_pptx_native');
  assert.equal(report.page_count, 3);
  assert.equal(report.layout_family_count, 3);
  assert.equal(report.field_leakage_count, 0);
  assert.equal(report.overlap_pairs, 0);
});

test('native render preview attachment records PNG manifest metrics without packaging screenshots into PPTX', () => {
  const { fixture, suite, result } = materializedSemanticFixture();
  const previewDir = path.join(result.workspaceRoot, 'previews');
  mkdirSync(previewDir, { recursive: true });
  const previewMetrics = result.slides.map((slide, index) => {
    const file = path.join(previewDir, `slide-${String(index + 1).padStart(2, '0')}.png`);
    return { file, ...writeTinyPng(file), slide_id: slide.slide_id };
  });
  assertMaterializedQuality({ fixture, suite, result, previewMetrics });

  const inputFile = path.join(result.workspaceRoot, 'attach-input.json');
  writeJson(inputFile, {
    slides: result.slides,
    render_proof: {
      renderer_kind: 'libreoffice_headless',
      renderer_pipeline: 'libreoffice_headless_pdf_png_v1',
      source_surface_kind: 'native_pptx',
      source_pptx_sha256: sha256Hex(readFileSync(result.outputPptx)),
      pdf_sha256: sha256Hex(Buffer.from('pdf-proof')),
      preview_screenshots: previewMetrics.map((item) => item.file),
      preview_png_hashes: previewMetrics.map((item) => ({
        file: item.file,
        sha256: item.sha256,
      })),
    },
  });
  const script = `
import json
from pathlib import Path
from redcube_ai.native_helpers.ppt_deck.native import attach_rendered_previews

payload = json.loads(Path(${JSON.stringify(inputFile)}).read_text(encoding='utf-8'))
print(json.dumps(attach_rendered_previews(payload['slides'], payload['render_proof']), ensure_ascii=False))
`;
  const python = resolveTestPythonCommand();
  const stdout = execFileSync(python.command, [...(python.args || []), '-c', script], {
    cwd: path.resolve('.'),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
  const attachedSlides = JSON.parse(stdout);

  assert.equal(attachedSlides.length, suite.expected_page_count);
  for (const [index, slide] of attachedSlides.entries()) {
    const expected = previewMetrics[index];
    assert.equal(slide.preview_screenshot_file, expected.file);
    assert.equal(slide.preview_screenshot_sha256, expected.sha256);
    assert.deepEqual(slide.preview_screenshot_dimensions, expected.dimensions);
    assert.equal(slide.synthetic_preview, false);
    assert.equal(slide.render_provenance.preview_screenshot_sha256, expected.sha256);
  }
  const outputBytes = readFileSync(result.outputPptx);
  for (const preview of previewMetrics) {
    assert.equal(outputBytes.includes(readFileSync(preview.file)), false);
  }
});
