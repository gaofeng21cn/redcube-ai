// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function unzipPptxEntries(file) {
  const script = `
import json
import zipfile
from pathlib import Path

pptx_file = Path(${JSON.stringify(file)})
with zipfile.ZipFile(pptx_file) as archive:
    entries = {
        name: archive.read(name).decode('utf-8', errors='replace')
        for name in archive.namelist()
        if name.endswith('.xml')
    }
print(json.dumps(entries, ensure_ascii=False))
`;
  const python = resolveTestPythonCommand();
  const stdout = execFileSync(python.command, [...(python.args || []), '-c', script], {
    cwd: path.resolve('.'),
    env: { ...process.env, PYTHONPATH: path.resolve('python') },
    encoding: 'utf-8',
  });
  return JSON.parse(stdout);
}

function writeTinyPng(file) {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8Dwn4GBgYGJAQoAABMIAgLQdUeRAAAAAElFTkSuQmCC',
    'base64',
  );
  writeFileSync(file, png);
  return { sha256: sha256Hex(png), dimensions: { width: 2, height: 2 } };
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

function suitePayload(suite) {
  return {
    editable_shape_plan: suite.editable_shape_plan,
  };
}

function assertBenchmarkSuiteQuality({ fixture, suite, result, previewMetrics = [] }) {
  const defaults = fixture.suite_defaults;
  const slides = result.slides;
  const layoutFamilies = slides.map((slide) => slide.layout_family);

  assert.equal(slides.length, suite.expected_page_count);
  assert.equal(result.pptx_slides.length, suite.expected_page_count);
  assert.equal(slides.length >= defaults.expected_page_count_min, true);
  assert.equal(slides.length <= defaults.expected_page_count_max, true);
  assert.deepEqual(layoutFamilies, suite.expected_layout_families);
  assert.equal(new Set(layoutFamilies).size >= defaults.min_layout_family_count, true);
  assert.equal(slides.every((slide) => slide.layout_writer === `${slide.layout_family}_native_writer`), true);

  const shapeNames = result.pptx_slides.flatMap((pptxSlide) => pptxSlide.map((shape) => shape.name));
  for (const anchorShape of suite.expected_anchor_shapes) {
    assert.equal(shapeNames.includes(anchorShape), true, `${suite.suite_id}: ${anchorShape} should exist`);
  }

  assert.equal(slides.every((slide) => slide.shape_count >= defaults.min_shape_count), true);
  assert.equal(slides.every((slide) => slide.text_box_count >= defaults.min_text_box_count), true);
  assert.equal(slides.every((slide) => slide.metrics.block_count >= defaults.min_content_shape_count), true);
  assert.equal(slides.every((slide) => slide.metrics.decorative_shape_count >= defaults.min_decorative_shape_count), true);
  assert.equal(slides.every((slide) => slide.metrics.shape_kind_count >= defaults.min_shape_kind_count), true);
  assert.equal(slides.every((slide) => slide.metrics.role_count >= 8), true);
  assert.equal(slides.every((slide) => slide.metrics.layout_richness_score >= defaults.min_layout_richness_score), true);
  assert.equal(slides.every((slide) => slide.checks.layout_richness_ok), true);
  assert.equal(slides.every((slide) => slide.redcube_svg_ir_preflight.status === 'pass'), true);
  assert.equal(slides.every((slide) => /^[a-f0-9]{64}$/.test(slide.redcube_svg_ir_sha256)), true);
  assert.equal(slides.every((slide) => slide.checks.overflow_free), true);
  assert.equal(slides.every((slide) => slide.checks.occlusion_free), true);
  assert.equal(slides.every((slide) => slide.checks.visual_density_ok), true);
  assert.equal(slides.every((slide) => slide.checks.edge_clearance_ok), true);
  assert.equal(slides.every((slide) => slide.metrics.primary_points >= 3), true);
  assert.equal(slides.every((slide) => slide.metrics.overlap_pairs === 0), true);
  assert.equal(slides.every((slide) => slide.metrics.occupied_ratio > defaults.min_density), true);
  assert.equal(slides.every((slide) => slide.metrics.occupied_ratio < defaults.max_density), true);

  const editableShapeCount = result.pptx_slides.reduce((total, pptxSlide) => total + pptxSlide.length, 0);
  assert.equal(editableShapeCount >= defaults.min_editable_shape_count * suite.expected_page_count, true);

  const geometrySignatures = result.pptx_slides.map((pptxSlide, index) => {
    const anchorShape = suite.expected_anchor_shapes[index];
    const shape = pptxSlide.find((candidate) => candidate.name === anchorShape);
    return shape ? `${shape.name}:${shape.left},${shape.top},${shape.width},${shape.height}` : '';
  });
  assert.equal(geometrySignatures.every(Boolean), true);
  assert.equal(new Set(geometrySignatures).size, suite.expected_page_count);

  const visibleText = JSON.stringify(slides.flatMap((slide) => (
    slide.native_shapes.map((shape) => shape.text).filter(Boolean)
  )));
  for (const fragment of fixture.forbidden_visible_text_fragments) {
    assert.doesNotMatch(visibleText, new RegExp(fragment, 'i'));
  }
  assert.doesNotMatch(visibleText, /\{\s*["']?(label|text)["']?\s*:/i);
  for (const fragment of suite.expected_visible_text_fragments) {
    assert.match(visibleText, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  if (previewMetrics.length) {
    assert.equal(previewMetrics.length, suite.expected_page_count);
    assert.equal(previewMetrics.every((item) => item.sha256 && item.sha256 !== sha256Hex(Buffer.alloc(0))), true);
    assert.equal(previewMetrics.every((item) => item.dimensions.width > 0 && item.dimensions.height > 0), true);
  }

  const renderProvenance = buildLibreOfficeRenderProvenance({
    result,
    rendererKind: fixture.expected_renderer_kind,
    fixtureId: `${fixture.fixture_id}:${suite.suite_id}`,
  });
  assert.equal(renderProvenance.renderer_kind, fixture.expected_renderer_kind);
  assert.equal(renderProvenance.page_count, suite.expected_page_count);
  assert.equal(renderProvenance.pages.length, suite.expected_page_count);
  assert.equal(renderProvenance.pages.every((page) => /^[a-f0-9]{64}$/.test(page.svg_ir_sha256)), true);
  assert.equal(renderProvenance.pages.every((page) => /^[a-f0-9]{64}$/.test(page.drawingml_shape_hash)), true);
  assert.match(renderProvenance.render_hash, /^[a-f0-9]{64}$/);

  return {
    suite_id: suite.suite_id,
    route: suite.editable_shape_plan.route,
    page_count: slides.length,
    layout_family_count: new Set(layoutFamilies).size,
    editable_shape_count: editableShapeCount,
    png_non_empty_pages: previewMetrics.length,
    field_leakage_count: 0,
    overlap_pairs: slides.reduce((total, slide) => total + slide.metrics.overlap_pairs, 0),
    density_min: Math.min(...slides.map((slide) => slide.metrics.occupied_ratio)),
    density_max: Math.max(...slides.map((slide) => slide.metrics.occupied_ratio)),
    edge_clearance_min: Math.min(...slides.flatMap((slide) => Object.values(slide.metrics.edge_clearance))),
    render_hash: renderProvenance.render_hash,
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

test('native PPT visual benchmark fixture captures four domain suites with layout, shape, leakage, metrics, and render provenance contract', () => {
  const fixture = readJson(path.resolve('tests/fixtures/ppt-native-visual-benchmark/benchmark.json'));
  assert.equal(fixture.route_policy.native_default_route, false);
  assert.equal(fixture.route_policy.comparison_only, true);
  assert.equal(fixture.suites.length, 4);
  assert.deepEqual(fixture.suites.map((suite) => suite.suite_label), [
    '商业汇报',
    '学术讲座',
    '数据图表型',
    '中文长文本型',
  ]);

  const reportRows = fixture.suites.map((suite) => {
    const result = runNativeLayoutWriter(suitePayload(suite), `redcube-native-visual-benchmark-${suite.suite_id}-`);
    return assertBenchmarkSuiteQuality({ fixture, suite, result });
  });

  const requiredFields = fixture.quality_comparison_report.required_record_fields;
  assert.equal(reportRows.every((row) => requiredFields.every((field) => Object.hasOwn(row, field))), true);
  assert.equal(reportRows.every((row) => row.route === 'author_pptx_native'), true);
  assert.equal(reportRows.every((row) => row.page_count >= 6 && row.page_count <= 10), true);
  assert.equal(reportRows.every((row) => row.layout_family_count >= fixture.suite_defaults.min_layout_family_count), true);
  assert.equal(reportRows.every((row) => row.editable_shape_count >= fixture.suite_defaults.min_editable_shape_count * row.page_count), true);
  assert.equal(reportRows.every((row) => row.field_leakage_count === 0), true);
  assert.equal(reportRows.every((row) => row.overlap_pairs === 0), true);
  assert.equal(reportRows.every((row) => /^[a-f0-9]{64}$/.test(row.render_hash)), true);

  const dataSuite = fixture.suites.find((suite) => suite.suite_id === 'data_charts');
  const dataResult = runNativeLayoutWriter(suitePayload(dataSuite), 'redcube-native-visual-benchmark-data-charts-structured-');
  const dataSlide = dataResult.slides.find((slide) => slide.slide_id === 'D02');
  assert.equal(dataSlide.metrics.chart_count, 1);
  assert.equal(dataSlide.metrics.chart_bounds.length, 1);
  assert.equal(dataSlide.metrics.axis_label_count, 3);
  assert.equal(dataSlide.metrics.legend_label_count, 1);
  assert.equal(dataSlide.metrics.numeric_label_overflow_count, 0);
  assert.equal(dataSlide.metrics.table_count, 1);
  assert.equal(dataSlide.metrics.table_bounds.length, 1);
  assert.equal(dataSlide.metrics.table_cell_fit_ok, true);
  assert.deepEqual(dataSlide.metrics.table_cell_fit_failures, []);
  assert.equal(dataSlide.metrics.metric_grid_count, 1);
  assert.equal(dataSlide.metrics.metric_grid_bounds.length, 1);
  assert.match(dataSlide.metrics.coordinate_determinism_hash, /^[a-f0-9]{64}$/);

  const pptxEntries = unzipPptxEntries(dataResult.outputPptx);
  const slide2 = pptxEntries['ppt/slides/slide2.xml'];
  assert.match(slide2, /D02-growth-chart/);
  assert.match(slide2, /D02-operating-table/);
  assert.match(slide2, /graphicFrame/);
  assert.equal(Object.keys(pptxEntries).some((name) => /^ppt\/charts\/chart\d+\.xml$/.test(name)), true);
  assert.equal(Object.values(pptxEntries).some((xml) => xml.includes('<c:barChart>')), true);
  assert.equal(slide2.includes('<a:tbl>'), true);
});

test('native render preview attachment records PNG manifest metrics for every benchmark suite without packaging screenshots into PPTX', () => {
  const fixture = readJson(path.resolve('tests/fixtures/ppt-native-visual-benchmark/benchmark.json'));
  for (const suite of fixture.suites) {
    const result = runNativeLayoutWriter(suitePayload(suite), `redcube-native-render-preview-${suite.suite_id}-`);
    const previewDir = path.join(result.workspaceRoot, 'previews');
    mkdirSync(previewDir, { recursive: true });
    const previewMetrics = result.slides.map((slide, index) => {
      const file = path.join(previewDir, `slide-${String(index + 1).padStart(2, '0')}.png`);
      return { file, ...writeTinyPng(file), slide_id: slide.slide_id };
    });
    assertBenchmarkSuiteQuality({ fixture, suite, result, previewMetrics });

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
      env: { ...process.env, PYTHONPATH: path.resolve('python') },
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
      assert.deepEqual(slide.render_provenance.preview_screenshot_dimensions, expected.dimensions);
    }
    const outputBytes = readFileSync(result.outputPptx);
    for (const preview of previewMetrics) {
      assert.equal(outputBytes.includes(readFileSync(preview.file)), false);
    }
  }
});
