// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';

const PYTHON_CACHE_ROOT = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-layouts-python-cache-'));

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

function pythonTestEnv() {
  return {
    ...process.env,
    PYTHONPATH: path.resolve('python'),
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONPYCACHEPREFIX: path.join(PYTHON_CACHE_ROOT, 'pycache'),
    PYTEST_ADDOPTS: `${process.env.PYTEST_ADDOPTS || ''} -p no:cacheprovider -o cache_dir=${path.join(PYTHON_CACHE_ROOT, 'pytest-cache')}`.trim(),
  };
}

function nativeMaterializerScript(inputFile, outputPptx, svgDir) {
  return `
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
slide_width = int(pptx.slide_width)
slide_height = int(pptx.slide_height)
emu_per_in = 914400
pptx_slides = []
overflows = []
for slide in pptx.slides:
    slide_shapes = []
    for shape in slide.shapes:
        record = {
            'name': shape.name,
            'left': int(shape.left),
            'top': int(shape.top),
            'width': int(shape.width),
            'height': int(shape.height),
            'text': getattr(shape, 'text', ''),
        }
        slide_shapes.append(record)
        right = record['left'] + record['width']
        bottom = record['top'] + record['height']
        if record['left'] < 0 or record['top'] < 0 or right > slide_width or bottom > slide_height:
            overflows.append({
                'slide_index': len(pptx_slides) + 1,
                'name': record['name'],
                'text': record['text'][:80],
                'right_in': round(right / emu_per_in, 4),
                'bottom_in': round(bottom / emu_per_in, 4),
            })
    pptx_slides.append(slide_shapes)
print(json.dumps({
    'slides': manifest['slides'],
    'officecli_gate': manifest['officecli_gate'],
    'pptx_slides': pptx_slides,
    'pptx_file': ${JSON.stringify(outputPptx)},
    'pptx_geometry': {
        'slide_width_in': round(slide_width / emu_per_in, 4),
        'slide_height_in': round(slide_height / emu_per_in, 4),
        'overflow_count': len(overflows),
        'overflows': overflows,
    },
}, ensure_ascii=False))
`;
}

function runNativeMaterializer(payload, workspacePrefix = 'redcube-native-materializer-') {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), workspacePrefix));
  const inputFile = path.join(workspaceRoot, 'input.json');
  const outputPptx = path.join(workspaceRoot, 'native.pptx');
  const svgDir = path.join(workspaceRoot, 'svg-ir');
  writeJson(inputFile, payload);
  const python = resolveTestPythonCommand();
  const stdout = execFileSync(
    python.command,
    [...(python.args || []), '-c', nativeMaterializerScript(inputFile, outputPptx, svgDir)],
    {
      cwd: path.resolve('.'),
      env: pythonTestEnv(),
      encoding: 'utf-8',
    },
  );
  return { workspaceRoot, outputPptx, ...JSON.parse(stdout) };
}

function runNativeMaterializerFailure(payload, workspacePrefix = 'redcube-native-materializer-fail-') {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), workspacePrefix));
  const inputFile = path.join(workspaceRoot, 'input.json');
  const outputPptx = path.join(workspaceRoot, 'native.pptx');
  const svgDir = path.join(workspaceRoot, 'svg-ir');
  writeJson(inputFile, payload);
  const python = resolveTestPythonCommand();
  try {
    execFileSync(
      python.command,
      [...(python.args || []), '-c', nativeMaterializerScript(inputFile, outputPptx, svgDir)],
      {
        cwd: path.resolve('.'),
        env: pythonTestEnv(),
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch (error) {
    return {
      workspaceRoot,
      status: error.status,
      stdout: String(error.stdout || ''),
      stderr: String(error.stderr || ''),
    };
  }
  throw new Error('native materializer unexpectedly accepted invalid AI shape plan');
}

function stableHash(data) {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function sha256Hex(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function writeTinyPng(file) {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8Dwn4GBgYGJAQoAABMIAgLQdUeRAAAAAElFTkSuQmCC',
    'base64',
  );
  writeFileSync(file, png);
  return { sha256: sha256Hex(png), dimensions: { width: 2, height: 2 } };
}

function pointText(item, fallback) {
  if (typeof item === 'string') return item.trim() || fallback;
  return String(item?.text || item?.body || item?.title || fallback).trim();
}

function contentCharCount(text) {
  return [...String(text || '')]
    .filter((char) => !/\s/.test(char) && !['，', '。', '、', ',', '.', ':', '：', ';', '；'].includes(char))
    .length;
}

function qualityPointText(text, index) {
  const normalized = String(text || '').trim();
  if (contentCharCount(normalized) >= 12) return normalized;
  return `${normalized || `Point ${index + 1}`} carries explicit review evidence`;
}

function slidePoints(slide, count = null) {
  const points = (Array.isArray(slide?.page_core_content) ? slide.page_core_content : [])
    .map((item, index) => pointText(item, `Point ${index + 1} carries complete audience evidence`))
    .filter((text) => text && !/^Label-only metadata/i.test(text));
  const filteredPoints = points.filter((text) => !text.startsWith('Point '));
  const normalized = filteredPoints.length > 0 ? filteredPoints : [
    '目标输入清楚，观众知道本页回答什么问题和验收口径。',
    '执行证据明确，能看见链路如何自主推进到产物。',
    '审查出口可复核，失败时会回到明确页面完成修复。',
    '导出证据闭合，PPTX、PDF 和 manifest 可以互相印证。',
  ];
  const wanted = count == null ? Math.max(2, Math.min(normalized.length, 4)) : count;
  return normalized.slice(0, wanted).map((text, index) => qualityPointText(text, index));
}

function panelRole(layoutFamily) {
  return {
    cover_signal: 'signal_panel',
    timeline_band: 'timeline_panel',
    judgement_ladder: 'judgement_step',
    ring_cross: 'axis_panel',
    summary_peak: 'takeaway_panel',
  }[layoutFamily] || 'compare_panel';
}

function slotGeometry(slotCount, index) {
  const gap = slotCount === 2 ? 0.72 : 0.48;
  const width = slotCount === 2 ? 6.15 : slotCount === 3 ? 3.95 : 2.9;
  const left = slotCount === 2 ? 1.15 : 0.95;
  return {
    left_in: left + (width + gap) * index,
    top_in: 3.2,
    width_in: width,
    height_in: 2.68,
  };
}

function layoutVisualIntent(layoutFamily) {
  return {
    cover_signal: {
      rhetorical_role: 'opening_signal',
      primary_grid: 'left_hero_right_signal_stack',
      visual_weight: 'hero_left_with_signal_stack',
      negative_space_strategy: 'right edge and lower field stay open around the opening signal',
      non_text_visual: 'signal hub with connector rail',
    },
    multi_zone_compare: {
      rhetorical_role: 'comparison',
      primary_grid: 'split_compare_with_bridge_rail',
      visual_weight: 'balanced_columns_with_center_bridge',
      negative_space_strategy: 'wide bridge gap separates the compared claims',
      non_text_visual: 'center bridge rail linking comparison zones',
    },
    timeline_band: {
      rhetorical_role: 'timeline',
      primary_grid: 'horizontal_timeline_with_milestone_nodes',
      visual_weight: 'lower_track',
      negative_space_strategy: 'upper narrative band stays open above the timeline',
      non_text_visual: 'horizontal timeline rail with milestone nodes',
    },
    judgement_ladder: {
      rhetorical_role: 'decision_gate',
      primary_grid: 'left_context_right_gate_ladder',
      visual_weight: 'right_ladder',
      negative_space_strategy: 'left context area stays open while gates climb on the right',
      non_text_visual: 'vertical gate ladder spine',
    },
    ring_cross: {
      rhetorical_role: 'system_map',
      primary_grid: 'radial_hub_and_four_axes',
      visual_weight: 'centered_radial',
      negative_space_strategy: 'corners stay open around the central hub',
      non_text_visual: 'center hub with radial axis connectors',
    },
    summary_peak: {
      rhetorical_role: 'synthesis',
      primary_grid: 'hero_takeaway_and_closure_band',
      visual_weight: 'top_heavy_takeaway',
      negative_space_strategy: 'lower right stays calm after the conclusion band',
      non_text_visual: 'takeaway band with closure rail',
    },
  }[layoutFamily] || {
    rhetorical_role: 'comparison',
    primary_grid: 'split_compare_with_bridge_rail',
    visual_weight: 'balanced_columns_with_center_bridge',
    negative_space_strategy: 'wide bridge gap separates the compared claims',
    non_text_visual: 'center bridge rail linking comparison zones',
  };
}

function structuralShapes(layoutFamily, slideId) {
  if (layoutFamily === 'cover_signal') {
    return [
      {
        shape_id: `${slideId}-ai-signal-hub`,
        kind: 'oval',
        role: 'signal_hub',
        quality_role: 'decorative',
        bounds: { left_in: 13.05, top_in: 2.7, width_in: 0.72, height_in: 0.72 },
        fill: '#B94624',
        line: 'none',
      },
      {
        shape_id: `${slideId}-ai-signal-connector`,
        kind: 'line',
        role: 'signal_connector',
        quality_role: 'decorative',
        bounds: { left_in: 13.38, top_in: 3.44, width_in: 0.06, height_in: 2.05 },
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
      bounds: { left_in: 1.1, top_in: 4.08, width_in: 13.3, height_in: 0.06 },
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
        bounds: { left_in: 3.0, top_in: 4.58, width_in: 9.5, height_in: 0.05 },
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
    bounds: { left_in: 1.1, top_in: 6.18, width_in: 13.15, height_in: 0.06 },
    line: '#B94624',
  }];
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

function createAiSlide({
  slideId = 'S01',
  title = 'Native PPTX materializer proof',
  layoutFamily = 'multi_zone_compare',
  core = 'AI authored spatial plan decides the layout; helper only materializes it.',
  points = null,
  slotCount = null,
  pointFontSize = 18,
  indexFontSize = 16,
  includeStructuralVisual = true,
  panelMutator = null,
  textMutator = null,
} = {}) {
  const primaryPoints = slidePoints({ page_core_content: points || [] }, slotCount);
  const desiredSlots = slotCount || Math.max(2, Math.min(primaryPoints.length, 4));
  const actualPanelCount = layoutFamily === 'summary_peak' ? Math.max(1, desiredSlots - 1) : desiredSlots;
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
      editable_text: core,
      bounds: { left_in: 0.95, top_in: 1.78, width_in: 12.3, height_in: 0.62 },
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
      editable_text: slideId.replace(/^S/, '').padStart(2, '0'),
      bounds: { left_in: 14.05, top_in: 7.95, width_in: 0.9, height_in: 0.44 },
      font_size: 18,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
      align: 'right',
    },
  ];
  if (includeStructuralVisual) {
    shapes.push(...structuralShapes(layoutFamily, slideId));
  }
  for (let index = 0; index < actualPanelCount; index += 1) {
    const basePanel = {
      shape_id: `${slideId}-slot-${index + 1}-panel`,
      kind: 'rounded_rect',
      role: panelRole(layoutFamily),
      quality_role: 'content',
      bounds: slotGeometry(actualPanelCount, index),
      fill: '#EFE6D6',
      line: '#D8C8B2',
    };
    shapes.push(panelMutator ? panelMutator(basePanel, index) : basePanel);
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
      editable_text: String(pointNumber).padStart(2, '0'),
      bounds: {
        left_in: base.left_in + 0.24,
        top_in: base.top_in + (overflowSummaryText ? 0.02 : 0.25),
        width_in: 0.78,
        height_in: 0.52,
      },
      font_size: indexFontSize,
      color: '#B94624',
      fill: 'none',
      line: 'none',
      bold: true,
    });
    const baseText = {
      shape_id: `${slideId}-slot-${pointNumber}-text`,
      kind: 'text_box',
      role: 'point_text',
      editable_text: primaryPoints[index] || `Point ${pointNumber} carries complete audience evidence.`,
      bounds: {
        left_in: base.left_in + (overflowSummaryText ? 1.05 : 0.28),
        top_in: base.top_in + (overflowSummaryText ? 0.02 : 0.82),
        width_in: base.width_in - (overflowSummaryText ? 1.4 : 0.56),
        height_in: overflowSummaryText ? 0.62 : 1.24,
      },
      font_size: pointFontSize,
      color: '#171C24',
      fill: 'none',
      line: 'none',
    };
    shapes.push(textMutator ? textMutator(baseText, index) : baseText);
  }
  return {
    slide_id: slideId,
    title,
    layout_family: layoutFamily,
    core_sentence: core,
    page_core_content: primaryPoints,
    layout_intent: layoutIntentForSlide({ slideId, layoutFamily, slotCount: desiredSlots, shapes }),
    native_shapes: shapes,
  };
}

function materializerPayload(slides, route = 'author_pptx_native') {
  return {
    editable_shape_plan: {
      contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
      route,
      slides,
    },
  };
}

function enrichFixtureSuitePayload(suite) {
  return materializerPayload(suite.editable_shape_plan.slides.map((slide, index) => createAiSlide({
    slideId: slide.slide_id,
    title: slide.title,
    layoutFamily: slide.layout_family,
    core: slide.core_sentence,
    points: slide.page_core_content,
    slotCount: Math.min(4, Math.max(3, slidePoints(slide).length)),
  })), suite.editable_shape_plan.route);
}

let benchmarkFixtureMaterializations = null;

function materializedBenchmarkFixture() {
  if (benchmarkFixtureMaterializations) {
    return benchmarkFixtureMaterializations;
  }
  const fixture = readJson(path.resolve('tests/fixtures/ppt-native-visual-benchmark/benchmark.json'));
  const suites = fixture.suites.map((suite) => ({
    suite,
    result: runNativeMaterializer(
      enrichFixtureSuitePayload(suite),
      `redcube-native-visual-benchmark-${suite.suite_id}-`,
    ),
  }));
  benchmarkFixtureMaterializations = { fixture, suites };
  return benchmarkFixtureMaterializations;
}

function contentShapes(slide, role = null) {
  return slide.native_shapes.filter((shape) => (
    shape.quality_role === 'content'
    && (!role || shape.role === role)
  ));
}

function buildRenderProvenance({ result, rendererKind, fixtureId }) {
  const pages = result.slides.map((slide, index) => ({
    slide_id: slide.slide_id,
    page_number: index + 1,
    layout_family: slide.layout_family,
    svg_ir_sha256: slide.redcube_svg_ir_sha256,
    materialized_shape_hash: stableHash(result.pptx_slides[index].map((shape) => ({
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
    page_count: pages.length,
    fixture_id: fixtureId,
    render_hash: stableHash({ rendererKind, pages }),
    pages,
  };
}

function repeatedCompositionSignatures(slides) {
  return slides
    .map((slide) => slide.metrics?.composition_signature)
    .filter(Boolean)
    .filter((signature, index, all) => all.indexOf(signature) !== index);
}

function assertMaterializedQuality({ fixture, suite, result, previewMetrics = [] }) {
  const slides = result.slides;
  const layoutFamilies = slides.map((slide) => slide.layout_family);
  const compositionSignatures = slides
    .map((slide) => slide.metrics?.composition_signature)
    .filter(Boolean);
  assert.equal(slides.length, suite.expected_page_count);
  assert.equal(result.pptx_slides.length, suite.expected_page_count);
  assert.deepEqual(layoutFamilies, suite.expected_layout_families);
  assert.equal(new Set(layoutFamilies).size >= fixture.suite_defaults.min_layout_family_count, true);
  assert.equal(compositionSignatures.length, slides.length);
  assert.equal(new Set(compositionSignatures).size >= Math.ceil(slides.length * 0.75), true);
  assert.deepEqual(repeatedCompositionSignatures(slides), []);
  assert.equal(slides.every((slide) => slide.layout_writer === 'officecli_pptx_materializer'), true);
  assert.equal(slides.every((slide) => slide.ai_first_spatial_plan.helper_template_layout_used === false), true);
  assert.equal(slides.every((slide) => slide.ai_first_spatial_plan.materializer === 'officecli_pptx_materializer'), true);
  assert.equal(slides.every((slide) => slide.shape_count >= 12), true);
  assert.equal(slides.every((slide) => slide.text_box_count >= 6), true);
  assert.equal(slides.every((slide) => slide.redcube_svg_ir_preflight.status === 'pass'), true);
  assert.equal(slides.every((slide) => /^[a-f0-9]{64}$/.test(slide.redcube_svg_ir_sha256)), true);
  assert.equal(slides.every((slide) => slide.checks.slot_fill_ok), true);
  assert.equal(slides.every((slide) => slide.checks.audience_label_readability_ok), true);
  assert.equal(slides.every((slide) => slide.checks.content_depth_ok), true);
  assert.equal(slides.every((slide) => slide.checks.grid_balance_ok), true);
  assert.equal(slides.every((slide) => slide.checks.occlusion_free), true);
  assert.equal(slides.every((slide) => slide.metrics.overlap_pairs === 0), true);
  assert.equal(slides.every((slide) => slide.metrics.occupied_ratio > fixture.suite_defaults.min_density), true);
  assert.equal(slides.every((slide) => slide.metrics.occupied_ratio < fixture.suite_defaults.max_density), true);
  assert.equal(slides.every((slide) => slide.checks.visual_structure_present), true);
  assert.equal(slides.every((slide) => slide.checks.non_text_visual_specific_ok), true);
  assert.equal(slides.every((slide) => slide.checks.mechanical_card_template_absent), true);
  assert.equal(slides.every((slide) => slide.metrics.structural_visual_count >= 1), true);
  assert.equal(result.officecli_gate.materializer, 'officecli_pptx_materializer');
  assert.equal(result.officecli_gate.save_before_close, true);
  assert.equal(result.officecli_gate.command_count >= slides.length * 12, true);
  assert.equal(result.officecli_gate.geometry_audit.ok, true);
  assert.equal(result.officecli_gate.geometry_audit.slide_width_in, 16);
  assert.equal(result.officecli_gate.geometry_audit.slide_height_in, 9);
  assert.equal(result.officecli_gate.geometry_audit.overflow_count, 0);
  assert.equal(result.pptx_geometry.slide_width_in, 16);
  assert.equal(result.pptx_geometry.slide_height_in, 9);
  assert.equal(result.pptx_geometry.overflow_count, 0);

  const shapeNames = result.pptx_slides.flatMap((pptxSlide) => pptxSlide.map((shape) => shape.name));
  for (const legacyAnchor of suite.expected_anchor_shapes) {
    assert.equal(shapeNames.includes(legacyAnchor), false, `${legacyAnchor} must not be helper-generated`);
  }
  assert.equal(shapeNames.some((name) => /-rule$|-decor-line$/i.test(name)), false);

  const visibleText = JSON.stringify(slides.flatMap((slide) => (
    slide.native_shapes.map((shape) => shape.text).filter(Boolean)
  )));
  for (const fragment of fixture.forbidden_visible_text_fragments) {
    assert.doesNotMatch(visibleText, new RegExp(fragment, 'i'));
  }
  for (const fragment of suite.expected_visible_text_fragments) {
    assert.match(visibleText, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  if (previewMetrics.length) {
    assert.equal(previewMetrics.length, suite.expected_page_count);
    assert.equal(previewMetrics.every((item) => item.sha256 && item.sha256 !== sha256Hex(Buffer.alloc(0))), true);
    assert.equal(previewMetrics.every((item) => item.dimensions.width > 0 && item.dimensions.height > 0), true);
  }
  const renderProvenance = buildRenderProvenance({
    result,
    rendererKind: fixture.expected_renderer_kind,
    fixtureId: `${fixture.fixture_id}:${suite.suite_id}`,
  });
  assert.equal(renderProvenance.page_count, suite.expected_page_count);
  assert.equal(renderProvenance.pages.every((page) => /^[a-f0-9]{64}$/.test(page.svg_ir_sha256)), true);
  assert.equal(renderProvenance.pages.every((page) => /^[a-f0-9]{64}$/.test(page.materialized_shape_hash)), true);
  assert.match(renderProvenance.render_hash, /^[a-f0-9]{64}$/);
  return {
    suite_id: suite.suite_id,
    route: suite.editable_shape_plan.route,
    page_count: slides.length,
    layout_family_count: new Set(layoutFamilies).size,
    editable_shape_count: result.pptx_slides.reduce((total, pptxSlide) => total + pptxSlide.length, 0),
    png_non_empty_pages: previewMetrics.length,
    field_leakage_count: 0,
    overlap_pairs: slides.reduce((total, slide) => total + slide.metrics.overlap_pairs, 0),
    density_min: Math.min(...slides.map((slide) => slide.metrics.occupied_ratio)),
    density_max: Math.max(...slides.map((slide) => slide.metrics.occupied_ratio)),
    edge_clearance_min: Math.min(...slides.flatMap((slide) => Object.values(slide.metrics.edge_clearance))),
    render_hash: renderProvenance.render_hash,
  };
}

test('native PPTX officecli materializer accepts only complete AI spatial plans', () => {
  const slides = [
    createAiSlide({ slideId: 'S01', layoutFamily: 'cover_signal', title: 'Native cover proof' }),
    createAiSlide({ slideId: 'S02', layoutFamily: 'multi_zone_compare', title: 'Native compare proof', slotCount: 2 }),
    createAiSlide({ slideId: 'S03', layoutFamily: 'timeline_band', title: 'Native timeline proof', slotCount: 3 }),
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
  assert.equal(result.slides.every((slide) => slide.issues.length === 0), true);
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
    textMutator: (shape, index) => (index === 1
      ? { ...shape, bounds: { left_in: 1.25, top_in: 4.02, width_in: 3.0, height_in: 1.1 } }
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

  const result = runNativeMaterializer(materializerPayload([missingSlot, labelOnly, overlapped, unbalanced]));
  const [slotSlide, contentSlide, overlapSlide, balanceSlide] = result.slides;

  assert.equal(slotSlide.checks.slot_fill_ok, false);
  assert.equal(slotSlide.metrics.expected_slot_count, 4);
  assert.equal(slotSlide.metrics.filled_slot_count, 3);
  assert.equal(slotSlide.issues.includes('native_slot_fill_failed'), true);

  assert.equal(contentSlide.checks.content_depth_ok, false);
  assert.equal(contentSlide.metrics.content_depth_failures.length, 4);
  assert.equal(contentSlide.issues.includes('native_content_depth_failed'), true);

  assert.equal(overlapSlide.checks.occlusion_free, false);
  assert.equal(overlapSlide.metrics.overlap_pairs > 0, true);
  assert.equal(overlapSlide.issues.includes('occlusion_detected'), true);

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
