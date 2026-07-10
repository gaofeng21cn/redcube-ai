// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { benchmarkSuitePayload } from './helpers/ppt-native-python-layout-fixtures.ts';

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

test('native proof fixture builder preserves authored native_shapes byte-for-byte', () => {
  const workspace = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-fixture-preservation-'));
  const fixtureFile = path.join(workspace, 'fixture.json');
  const outputFile = path.join(workspace, 'output.json');
  const authoredShapes = [
    {
      shape_id: 'sentinel-chart',
      kind: 'chart',
      role: 'data_chart',
      quality_role: 'structural',
      layout_zone_id: 'body_zone',
      bounds: { left_in: 1, top_in: 2.5, width_in: 8, height_in: 4.5 },
      materialization_intent: 'native_data_object',
      chart_type: 'column',
      categories: ['Q1', 'Q2'],
      series: [{ name: 'Actual', values: [42, 55] }],
    },
    {
      shape_id: 'sentinel-connector',
      kind: 'connector',
      role: 'dependency_connector',
      quality_role: 'structural',
      bounds: { left_in: 9.4, top_in: 3.5, width_in: 2.2, height_in: 0.08 },
      tail_end: 'triangle',
      line: '#1E2761',
    },
  ];
  writeJson(fixtureFile, {
    fixture_id: 'fixture_preservation_test',
    suites: [{
      suite_id: 'sentinel',
      editable_shape_plan: {
        route: 'author_pptx_native',
        slides: [{
          slide_id: 'S01',
          title: 'Sentinel slide',
          layout_family: 'relationship_graph',
          page_core_content: ['The authored chart and connector must survive unchanged.'],
          layout_intent: {
            rhetorical_role: 'show dependency evidence',
            composition_signature: 'sentinel-relationship-graph',
            primary_grid: 'graph-left-data-right',
            visual_weight: 'relationship graph',
            negative_space_strategy: 'open connector lanes',
            non_text_visual: 'chart and directed relationship connector',
          },
          template_layout_binding: {
            selected_archetype: 'relationship_graph',
          },
          native_shapes: authoredShapes,
        }],
      },
    }],
  });

  execFileSync(process.execPath, [
    '--experimental-strip-types',
    'tools/native-ppt-proof/build-fixture-input.ts',
    fixtureFile,
    outputFile,
    'sentinel',
  ], {
    cwd: path.resolve('.'),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const output = JSON.parse(readFileSync(outputFile, 'utf-8'));
  assert.deepEqual(output.editable_shape_plan.slides[0].native_shapes, authoredShapes);
});

test('canonical native PPT benchmark declares heterogeneous semantic pages and package expectations', () => {
  const fixture = JSON.parse(readFileSync(
    path.resolve('tests/fixtures/ppt-native-visual-benchmark/benchmark.json'),
    'utf-8',
  ));
  const suites = fixture.suites || [];
  const slides = suites.flatMap((suite) => suite.editable_shape_plan?.slides || []);
  const semanticFamilies = new Set(slides.map((slide) => slide.semantic_composition).filter(Boolean));
  const objectKinds = new Set(slides.flatMap((slide) => (
    (slide.native_shapes || []).map((shape) => shape.kind)
  )));

  for (const family of [
    'relationship_graph',
    'timeline',
    'decision_ladder',
    'data_chart',
    'data_table',
    'image_evidence',
  ]) {
    assert.equal(semanticFamilies.has(family), true, `missing semantic composition: ${family}`);
  }
  for (const kind of ['chart', 'table', 'picture', 'connector']) {
    assert.equal(objectKinds.has(kind), true, `missing authored object kind: ${kind}`);
  }
  const evidencePicture = slides
    .flatMap((slide) => slide.native_shapes || [])
    .find((shape) => shape.kind === 'picture' && shape.role === 'evidence_picture');
  assert.equal(evidencePicture.source_file, 'assets/branding/redcube-ai-overview-v2.png');
  assert.equal(evidencePicture.source_data_uri, undefined);
  assert.equal(readFileSync(path.resolve(evidencePicture.source_file)).byteLength >= 4096, true);
  assert.match(evidencePicture.alt, /RedCube AI source-to-deliverable workflow/);
  const chartSlide = slides.find((slide) => slide.slide_id === 'D04');
  const insightConnector = chartSlide.native_shapes.find(
    (shape) => shape.shape_id === 'D04-evidence-to-insight',
  );
  assert.equal(insightConnector.kind, 'connector');
  assert.equal(insightConnector.role, 'evidence_to_insight_connector');
  assert.equal(insightConnector.tail_end, 'triangle');
  assert.deepEqual(insightConnector.bounds, {
    left_in: 11.21,
    top_in: 4.73,
    width_in: 0.44,
    height_in: 0.06,
  });
  assert.equal(slides.every((slide) => String(slide.speaker_notes || '').trim()), true);
  assert.equal(slides.some((slide) => slide.transition?.type), true);
  assert.equal(suites.every((suite) => suite.package_expectations?.required_object_counts), true);
  assert.equal(suites.every((suite) => suite.package_expectations.required_object_counts.connector >= 8), true);
});

test('native benchmark test helper preserves every authored slide shape plan', () => {
  const fixture = JSON.parse(readFileSync(
    path.resolve('tests/fixtures/ppt-native-visual-benchmark/benchmark.json'),
    'utf-8',
  ));
  for (const suite of fixture.suites || []) {
    const payload = benchmarkSuitePayload(suite);
    assert.deepEqual(
      payload.editable_shape_plan.slides.map((slide) => slide.native_shapes),
      suite.editable_shape_plan.slides.map((slide) => slide.native_shapes),
      suite.suite_id,
    );
  }
});
