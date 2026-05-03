// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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

test('native Python layout writer extracts audience text and emits distinct layout families without true render', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-layouts-'));
  const inputFile = path.join(workspaceRoot, 'input.json');
  const outputPptx = path.join(workspaceRoot, 'native.pptx');
  const svgDir = path.join(workspaceRoot, 'svg-ir');
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
  writeJson(inputFile, {
    editable_shape_plan: {
      contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
      route: 'author_pptx_native',
      slides,
    },
  });

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
print(json.dumps({'slides': manifest, 'pptx_slides': pptx_slides}, ensure_ascii=False))
`;
  const python = resolveTestPythonCommand();
  const stdout = execFileSync(python.command, [...(python.args || []), '-c', script], {
    cwd: path.resolve('.'),
    env: { ...process.env, PYTHONPATH: path.resolve('python') },
    encoding: 'utf-8',
  });
  const result = JSON.parse(stdout);
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
