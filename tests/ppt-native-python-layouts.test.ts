// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function resolveTestPythonCommand() {
  const explicitTestPython = String(process.env.REDCUBE_TEST_PYTHON || '').trim();
  return explicitTestPython
    ? { command: explicitTestPython, args: [] }
    : resolveRedCubePythonCommand();
}

function runNativeLayoutWriter(payload, workspacePrefix = 'redcube-native-layouts-') {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), workspacePrefix));
  const inputFile = path.join(workspaceRoot, 'input.json');
  const outputPptx = path.join(workspaceRoot, 'native.pptx');
  const svgDir = path.join(workspaceRoot, 'svg-ir');
  writeJson(inputFile, payload);

  const script = `
import json
from pathlib import Path
from redcube_ai.native_helpers.ppt_deck.native import evaluate_native_slide_quality, normalize_slide_data
from redcube_ai.native_helpers.ppt_deck.native_layouts import build_deck
from pptx import Presentation

payload = json.loads(Path(${JSON.stringify(inputFile)}).read_text(encoding='utf-8'))
manifest = build_deck(
    normalize_slide_data(payload),
    Path(${JSON.stringify(outputPptx)}),
    Path(${JSON.stringify(svgDir)}),
    set(),
    evaluate_native_slide_quality,
)
pptx = Presentation(${JSON.stringify(outputPptx)})
pptx_slides = []
for slide in pptx.slides:
    pptx_slides.append([
        {
            'name': shape.name,
            'left': int(shape.left),
            'top': int(shape.top),
            'width': int(shape.width),
            'height': int(shape.height),
            'text': getattr(shape, 'text', ''),
        }
        for shape in slide.shapes
    ])
print(json.dumps({'slides': manifest, 'pptx_slides': pptx_slides, 'pptx_file': ${JSON.stringify(outputPptx)}}, ensure_ascii=False))
`;
  const python = resolveTestPythonCommand();
  const stdout = execFileSync(python.command, [...(python.args || []), '-c', script], {
    cwd: path.resolve('.'),
    env: { ...process.env, PYTHONPATH: path.resolve('python') },
    encoding: 'utf-8',
  });
  return { workspaceRoot, outputPptx, ...JSON.parse(stdout) };
}

function stableHash(data) {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function buildLibreOfficeRenderProvenance({ result, rendererKind, fixtureId }) {
  const pageReferences = result.slides.map((slide, index) => ({
    slide_id: slide.slide_id,
    page_number: index + 1,
    layout_family: slide.layout_family,
    svg_ir_sha256: slide.redcube_svg_ir_sha256,
    drawingml_shape_hash: stableHash(result.pptx_slides[index].map((shape) => ({
      name: shape.name,
      left: shape.left,
      top: shape.top,
      width: shape.width,
      height: shape.height,
      text: shape.text,
    }))),
  }));
  return {
    renderer_kind: rendererKind,
    source_surface_kind: 'native_pptx',
    page_count: pageReferences.length,
    fixture_id: fixtureId,
    render_hash: stableHash({
      renderer_kind: rendererKind,
      pptx_file: result.pptx_file,
      pages: pageReferences,
    }),
    pages: pageReferences,
  };
}

test('native Python layout writer extracts audience text and emits distinct layout families without true render', () => {
  const slides = [
    ['S01', 'cover_signal', 'ppt.hero_signal'],
    ['S02', 'multi_zone_compare', 'ppt.compare_zones'],
    ['S03', 'timeline_band', 'ppt.timeline_rail'],
    ['S04', 'judgement_ladder', 'ppt.judgement_ladder'],
    ['S05', 'ring_cross', 'ppt.ring_cross'],
    ['S06', 'summary_peak', 'ppt.summary_peak'],
  ].map(([slideId, layoutFamily, recipeId], index) => ({
    slide_id: slideId,
    title: `Native ${layoutFamily}`,
    layout_family: layoutFamily,
    render_recipe_id: recipeId,
    core_sentence: `Core sentence ${index + 1}`,
    page_core_content: [
      { label: `Label-only metadata ${index + 1}` },
      { label: '不会显示的字段名', text: `Audience point ${index + 1}A` },
      { label: '仍然不显示字段名', text: `Audience point ${index + 1}B` },
      `Audience point ${index + 1}C`,
    ],
    native_shapes: [
      { shape_id: `${slideId}-title`, role: 'title', editable_text: `Native ${layoutFamily}` },
    ],
  }));
  const result = runNativeLayoutWriter({
    editable_shape_plan: {
      contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
      route: 'author_pptx_native',
      slides,
    },
  });
  const layoutFamilies = result.slides.map((slide) => slide.layout_family);
  assert.deepEqual(layoutFamilies, slides.map((slide) => slide.layout_family));
  assert.equal(
    result.slides.every((slide) => slide.layout_writer === `${slide.layout_family}_native_writer`),
    true,
  );
  assert.equal(result.slides.every((slide) => slide.shape_count >= 5), true);
  assert.equal(result.slides.every((slide) => slide.text_box_count >= 3), true);
  assert.equal(result.slides.every((slide) => slide.redcube_svg_ir_preflight.status === 'pass'), true);
  assert.equal(result.pptx_slides.length, slides.length);
  const geometrySignatures = result.pptx_slides.map((pptxSlide) => (
    pptxSlide
      .filter((shape) => /-(hero-block|zone-1-panel|timeline-rail|gate-1-panel|center-hub|summary-peak)$/.test(shape.name))
      .map((shape) => `${shape.name}:${shape.left},${shape.top},${shape.width},${shape.height}`)
      .join('|')
  ));
  assert.equal(geometrySignatures.every(Boolean), true);
  assert.equal(new Set(geometrySignatures).size, slides.length);
  assert.match(geometrySignatures[0], /S01-hero-block/);
  assert.match(geometrySignatures[1], /S02-zone-1-panel/);
  assert.match(geometrySignatures[2], /S03-timeline-rail/);
  assert.match(geometrySignatures[3], /S04-gate-1-panel/);
  assert.match(geometrySignatures[4], /S05-center-hub/);
  assert.match(geometrySignatures[5], /S06-summary-peak/);
  const visibleText = JSON.stringify(result.slides.flatMap((slide) => (
    slide.native_shapes.map((shape) => shape.text).filter(Boolean)
  )));
  assert.doesNotMatch(visibleText, /\{\s*"?label"?\s*:/i);
  assert.doesNotMatch(visibleText, /\{\s*'?label'?\s*:/i);
  assert.doesNotMatch(visibleText, /\{\s*"?text"?\s*:/i);
  assert.doesNotMatch(visibleText, /\{\s*'?text'?\s*:/i);
  assert.doesNotMatch(visibleText, /editable_text/i);
  assert.doesNotMatch(visibleText, /Label-only metadata/i);
  assert.match(visibleText, /Audience point 1A/);
});

test('native PPT visual benchmark fixture captures six-page layout, shape, leakage, metrics, and render provenance contract', () => {
  const fixture = readJson(path.resolve('tests/fixtures/ppt-native-visual-benchmark/benchmark.json'));
  const result = runNativeLayoutWriter(fixture, 'redcube-native-visual-benchmark-');
  const slides = result.slides;
  const layoutFamilies = slides.map((slide) => slide.layout_family);

  assert.equal(slides.length, fixture.expected_page_count);
  assert.equal(result.pptx_slides.length, fixture.expected_page_count);
  assert.deepEqual(layoutFamilies, fixture.expected_layout_families);
  assert.equal(new Set(layoutFamilies).size, fixture.expected_layout_families.length);
  assert.equal(slides.every((slide) => slide.layout_writer === `${slide.layout_family}_native_writer`), true);

  const shapeNames = result.pptx_slides.flatMap((pptxSlide) => pptxSlide.map((shape) => shape.name));
  for (const anchorShape of fixture.expected_anchor_shapes) {
    assert.equal(shapeNames.includes(anchorShape), true, `${anchorShape} should exist in DrawingML output`);
  }

  assert.equal(slides.every((slide) => slide.shape_count >= fixture.min_shape_count), true);
  assert.equal(slides.every((slide) => slide.text_box_count >= fixture.min_text_box_count), true);
  assert.equal(slides.every((slide) => slide.redcube_svg_ir_preflight.status === 'pass'), true);
  assert.equal(slides.every((slide) => /^[a-f0-9]{64}$/.test(slide.redcube_svg_ir_sha256)), true);
  assert.equal(slides.every((slide) => slide.checks.overflow_free), true);
  assert.equal(slides.every((slide) => slide.checks.occlusion_free), true);
  assert.equal(slides.every((slide) => slide.checks.visual_density_ok), true);
  assert.equal(slides.every((slide) => slide.checks.edge_clearance_ok), true);
  assert.equal(slides.every((slide) => slide.metrics.primary_points >= 3), true);
  assert.equal(slides.every((slide) => slide.metrics.overlap_pairs === 0), true);
  assert.equal(slides.every((slide) => slide.metrics.occupied_ratio > 0.18), true);
  assert.equal(slides.every((slide) => slide.metrics.occupied_ratio < 0.82), true);

  const geometrySignatures = result.pptx_slides.map((pptxSlide, index) => {
    const anchorShape = fixture.expected_anchor_shapes[index];
    const shape = pptxSlide.find((candidate) => candidate.name === anchorShape);
    return shape ? `${shape.name}:${shape.left},${shape.top},${shape.width},${shape.height}` : '';
  });
  assert.equal(geometrySignatures.every(Boolean), true);
  assert.equal(new Set(geometrySignatures).size, fixture.expected_page_count);

  const visibleText = JSON.stringify(slides.flatMap((slide) => (
    slide.native_shapes.map((shape) => shape.text).filter(Boolean)
  )));
  for (const fragment of fixture.forbidden_visible_text_fragments) {
    assert.doesNotMatch(visibleText, new RegExp(fragment, 'i'));
  }
  assert.doesNotMatch(visibleText, /\{\s*["']?(label|text)["']?\s*:/i);
  assert.match(visibleText, /Executive signal holds across channels/);
  assert.match(visibleText, /Gate four authorizes scale/);
  assert.match(visibleText, /Primary outcome is ready/);

  const renderProvenance = buildLibreOfficeRenderProvenance({
    result,
    rendererKind: fixture.expected_renderer_kind,
    fixtureId: fixture.fixture_id,
  });
  assert.equal(renderProvenance.renderer_kind, 'libreoffice_headless');
  assert.equal(renderProvenance.page_count, fixture.expected_page_count);
  assert.equal(renderProvenance.pages.length, fixture.expected_page_count);
  assert.equal(renderProvenance.pages.every((page) => /^[a-f0-9]{64}$/.test(page.svg_ir_sha256)), true);
  assert.equal(renderProvenance.pages.every((page) => /^[a-f0-9]{64}$/.test(page.drawingml_shape_hash)), true);
  assert.match(renderProvenance.render_hash, /^[a-f0-9]{64}$/);
});
