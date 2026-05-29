// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';
import {
  assertMaterializedQuality,
  createAiSlide,
  materializedBenchmarkFixture,
  materializerPayload,
  pythonTestEnv,
  resolveTestPythonCommand,
  runNativeMaterializer,
  runNativePlanValidation,
  sha256Hex,
  writeJson,
  writeTinyPng,
} from './helpers/ppt-native-python-layout-fixtures.ts';

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

  const result = runNativeMaterializer(materializerPayload([missingSlot, unbalanced]));
  const contentPreflight = runNativePlanValidation(materializerPayload([labelOnly]));
  const overlapPreflight = runNativePlanValidation(materializerPayload([overlapped]));
  const [slotSlide, balanceSlide] = result.slides;

  assert.equal(slotSlide.checks.slot_fill_ok, false);
  assert.equal(slotSlide.metrics.expected_slot_count, 4);
  assert.equal(slotSlide.metrics.filled_slot_count, 3);
  assert.equal(slotSlide.issues.includes('native_slot_fill_failed'), true);

  assert.equal(contentPreflight.ok, false);
  assert.equal(JSON.stringify(contentPreflight.failures).match(/ai_first_content_depth_too_low/g)?.length, 4);

  assert.equal(overlapPreflight.ok, false);
  assert.match(JSON.stringify(overlapPreflight.failures), /ai_first_text_box_overlap/);

  assert.equal(balanceSlide.checks.grid_balance_ok, false);
  assert.equal(balanceSlide.metrics.grid_balance_failures[0].reason, 'panel_area_ratio_out_of_range');
  assert.equal(balanceSlide.issues.includes('native_grid_balance_failed'), true);
});

test('native PPT visual benchmark fixture is materialized from AI shapes without helper templates', () => {
  const { fixture, suites } = materializedBenchmarkFixture();
  assert.equal(fixture.route_policy.native_default_route, false);
  assert.equal(fixture.route_policy.comparison_only, true);
  assert.equal(fixture.suites.length, 4);
  const reportRows = suites.map(({ suite, result }) => assertMaterializedQuality({ fixture, suite, result }));
  const requiredFields = fixture.quality_comparison_report.required_record_fields;
  assert.equal(reportRows.every((row) => requiredFields.every((field) => Object.hasOwn(row, field))), true);
  assert.equal(reportRows.every((row) => row.route === 'author_pptx_native'), true);
  assert.equal(reportRows.every((row) => row.page_count >= 6 && row.page_count <= 10), true);
  assert.equal(reportRows.every((row) => row.layout_family_count >= fixture.suite_defaults.min_layout_family_count), true);
  assert.equal(reportRows.every((row) => row.field_leakage_count === 0), true);
  assert.equal(reportRows.every((row) => row.overlap_pairs === 0), true);
});

test('native render preview attachment records PNG manifest metrics without packaging screenshots into PPTX', () => {
  const { fixture, suites } = materializedBenchmarkFixture();
  for (const { suite, result } of suites) {
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
  }
});
