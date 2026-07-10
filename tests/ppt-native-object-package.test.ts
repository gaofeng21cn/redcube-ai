// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { buildNativeShapePlanOutputContract } from '../packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/native-ppt-shape-plan-contract.ts';
import {
  createAiSlide,
  materializerPayload,
  pythonTestEnv,
  resolveTestPythonCommand,
  runNativeMaterializer,
} from './helpers/ppt-native-python-layout-fixtures.ts';
import {
  bounds,
  createNativeObjectWorkspace,
  relocateRelationshipBackedParts,
  runPackageReadback,
  runNativeObjectMaterializer,
  runNativeObjectMaterializerFailure,
  shape,
  validatePptx,
} from './helpers/ppt-native-object-package-fixtures.ts';

test('native PPT shape-plan contract exposes typed object, template, and presentation semantics', () => {
  const contract = buildNativeShapePlanOutputContract({
    aiFirstEditingContract: {},
    route: 'author_pptx_native',
  }).editable_shape_plan;
  const objectContract = contract.materializable_shape_kind_contract;
  for (const kind of ['text_box', 'shape', 'connector', 'picture', 'group', 'path', 'chart', 'table']) {
    assert.equal(objectContract.allowed_kind_values.includes(kind), true, kind);
  }
  assert.equal(objectContract.unknown_kind_policy, 'fail_fast_before_materialization');
  assert.equal(objectContract.object_specific_fields.picture[0], 'source_file | source_data_uri');
  assert.deepEqual(contract.template_intake_contract.supported_modes, ['replace_slides', 'fill_existing']);
  assert.equal(contract.template_intake_contract.source_canvas_must_be_preserved, true);
  assert.equal(contract.template_intake_contract.fill_existing_requires_complete_target_coverage, true);
  assert.equal(contract.presentation_semantics_contract.package_readback_required, true);
});

test('native PPT materializer rejects malformed OfficeCLI JSON instead of treating it as zero issues', () => {
  const python = resolveTestPythonCommand();
  const result = spawnSync(python.command, [...(python.args || []), '-c', `
import subprocess
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.materializer import parse_json_output

completed = subprocess.CompletedProcess(['officecli'], 0, stdout='{not-json', stderr='')
parse_json_output(completed)
`], {
    cwd: process.cwd(),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /invalid JSON/);
});

test('native PPT materializer rejects empty OfficeCLI JSON output', () => {
  const python = resolveTestPythonCommand();
  const result = spawnSync(python.command, [...(python.args || []), '-c', `
import subprocess
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.materializer import parse_json_output

completed = subprocess.CompletedProcess(['officecli'], 0, stdout='', stderr='')
parse_json_output(completed)
`], {
    cwd: process.cwd(),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /empty JSON/);
});

test('typed native pictures are structural visuals without role-name disguise', () => {
  const python = resolveTestPythonCommand();
  const stdout = execFileSync(python.command, [...(python.args || []), '-c', `
import json
from redcube_ai.native_helpers.ppt_deck.native_layouts_parts.rules import structural_visual_shape

print(json.dumps({
    kind: structural_visual_shape({'kind': kind, 'role': 'evidence_picture', 'quality_role': 'structural'})
    for kind in ['picture', 'image']
}))
`], {
    cwd: process.cwd(),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
  assert.deepEqual(JSON.parse(stdout), { picture: true, image: true });
});

test('real build_deck preserves native table metrics and body font size in the manifest', () => {
  const slide = createAiSlide({ slideId: 'S01', layoutFamily: 'multi_zone_compare', slotCount: 2 });
  slide.native_shapes = slide.native_shapes.filter((item) => item.shape_id !== 'S01-slot-1-panel');
  slide.native_shapes.push(shape('S01-table-proof', 'table', bounds(1.15, 3.2, 6.15, 2.68), {
    role: 'compare_panel',
    quality_role: 'content',
    layout_zone_id: 'matrix_zone',
    materialization_intent: 'native_data_object',
    data: [['Metric', 'Value'], ['Quality', 'Pass']],
    body_font_size: 16,
    metrics: { max_cell_blank_ratio: 0.12 },
  }));

  const result = runNativeMaterializer(materializerPayload([slide]), 'redcube-native-object-build-deck-');
  const table = result.slides[0].native_shapes.find((item) => item.shape_id === 'S01-table-proof');
  assert.equal(table.body_font_size, 16);
  assert.equal(table.metrics.min_font_pt, 16);
  assert.equal(table.metrics.max_cell_blank_ratio, 0.12);
  assert.deepEqual(table.data, [['Metric', 'Value'], ['Quality', 'Pass']]);
});

test('native PPT materializer writes distinct editable objects and semantic package readback', () => {
  const { workspaceRoot } = createNativeObjectWorkspace();
  const pictureFile = path.resolve('assets/branding/redcube-ai-logo.png');
  const result = runNativeObjectMaterializer({
    workspaceRoot,
    payload: {
      slides: [{
        slide_id: 'S01',
        background: '#FFFFFF',
        speaker_notes: 'Explain the object families, then reveal the data chart.',
        transition: {
          type: 'push',
          direction: 'left',
          duration_ms: 650,
          advance_time_ms: 4000,
          advance_click: false,
        },
        animation_timeline: [{
          target_shape_id: 'S01-title',
          effect: 'fade',
          class: 'entrance',
          trigger: 'afterPrevious',
          duration_ms: 450,
          delay_ms: 100,
        }],
        _editable_native_shapes: [
          shape('S01-title', 'text_box', bounds(0.7, 0.25, 6.4, 1.3), {
            role: 'title',
            quality_role: 'content',
            paragraphs: [{
              text: 'Native object package proof',
              runs: [
                { text: 'Native object', bold: true, color: '#17324D' },
                { text: ' package proof', color: '#17324D' },
              ],
            }, {
              text: 'Editable OOXML objects remain distinct.',
              bullet: true,
            }],
            font_size: 26,
            fill: 'none',
            line: 'none',
          }),
          shape('S01-diamond', 'shape', bounds(0.8, 1.75, 1.5, 1.0), {
            preset: 'diamond', fill: '#D7E8F5', line: '#17324D',
          }),
          shape('S01-picture', 'picture', bounds(3.8, 1.65, 1.6, 1.25), {
            source_file: pictureFile, alt: 'RedCube AI logo', crop: '0,0,0,0',
          }),
          shape('S01-chart', 'chart', bounds(0.8, 3.0, 4.8, 2.6), {
            materialization_intent: 'native_data_object',
            chart_type: 'column',
            categories: ['North, East', 'South'],
            series: [{ name: 'Actual', values: [3, 8], color: '#2563EB' }],
            title: 'Quarterly result',
          }),
          shape('S01-table', 'table', bounds(6.0, 3.0, 3.3, 2.4), {
            materialization_intent: 'native_data_object',
            data: [['Metric', 'Value'], ['Quality', 'Pass'], ['Objects', '8']],
            first_row: true,
            header_fill: '#17324D',
            header_color: '#FFFFFF',
            header_font: 'Aptos Display',
            header_font_size: 15,
            body_font_size: 13,
          }),
          shape('S01-group', 'group', bounds(6.0, 1.65, 3.3, 1.1), {
            children: [
              shape('S01-group-a', 'rect', bounds(6.0, 1.65, 1.45, 1.0), { fill: '#E2E8F0', line: 'none' }),
              shape('S01-group-b', 'oval', bounds(7.8, 1.65, 1.0, 1.0), { fill: '#F59E0B', line: 'none' }),
            ],
          }),
          shape('S01-path', 'path', bounds(9.75, 1.65, 2.1, 1.2), {
            fill: '#DCFCE7', line: '#166534',
            path_points: [[0, 1], [0.5, 0], [1, 1], [0.75, 0.72], [0.25, 0.72]],
            closed: true,
          }),
          shape('S01-connector', 'connector', bounds(2.45, 2.2, 7.1, 0.08), {
            line: '#17324D', tail_end: 'triangle',
            from_shape_id: 'S01-diamond',
            to_shape_id: 'S01-path',
          }),
        ],
      }],
    },
  });

  assert.equal(result.package_readback.slide_count, 1);
  for (const kind of ['text_box', 'shape', 'connector', 'picture', 'chart', 'table', 'group', 'path']) {
    assert.ok(result.package_readback.object_type_counts[kind] >= 1, `${kind} missing: ${JSON.stringify(result.package_readback)}`);
  }
  assert.equal(result.package_readback.notes_slide_count, 1);
  assert.equal(result.package_readback.transition_count, 1);
  assert.equal(result.package_readback.animation_count, 1);
  assert.ok(result.package_readback.timing_node_count >= 1);
  assert.equal(result.package_readback.relationship_type_counts.chart, 1);
  assert.equal(result.package_readback.relationship_type_counts.image, 1);
  assert.equal(result.package_readback.relationship_type_counts.notesSlide, 1);
  assert.ok(result.package_readback.part_counts.chart >= 1);
  assert.ok(result.package_readback.part_counts.media >= 1);
  assert.ok(result.package_readback.part_counts.notes >= 1);
  assert.equal(result.package_readback.slides[0].speaker_notes.includes('object families'), true);
  assert.equal(result.package_readback.slides[0].transition.type, 'push');
  assert.equal(result.package_readback.slides[0].transition.direction, 'left');
  assert.equal(result.package_readback.slides[0].transition.duration_ms, 650);
  assert.equal(result.package_readback.slides[0].animation_targets.includes('S01-title'), true);
  const titleObject = result.package_readback.slides[0].objects.find((item) => item.name === 'S01-title');
  assert.deepEqual(result.package_readback.slides[0].animations, [{
    target_object_id: titleObject.object_id,
    target_shape_name: 'S01-title',
    effect: 'fade',
    class: 'entrance',
    trigger: 'afterPrevious',
    duration_ms: 450,
    delay_ms: 100,
    preset_id: 10,
  }]);
  assert.ok(titleObject.paragraph_count >= 2);
  assert.ok(titleObject.run_count >= 2);
  assert.equal(titleObject.bullet_count, 1);
  const byName = Object.fromEntries(result.package_readback.slides[0].objects.map((item) => [item.name, item]));
  assert.equal(byName['S01-chart'].series_count, 1);
  assert.equal(byName['S01-chart'].category_count, 2);
  assert.deepEqual(byName['S01-chart'].categories, ['North, East', 'South']);
  assert.deepEqual(byName['S01-chart'].series, [{ name: 'Actual', values: [3, 8] }]);
  assert.equal(byName['S01-table'].row_count, 3);
  assert.equal(byName['S01-table'].column_count, 2);
  assert.deepEqual(byName['S01-table'].data, [['Metric', 'Value'], ['Quality', 'Pass'], ['Objects', '8']]);
  assert.deepEqual(byName['S01-table'].cells[0], {
    row: 1,
    column: 1,
    text: 'Metric',
    font: 'Aptos Display',
    font_size_pt: 15,
    bold: true,
    color: '#FFFFFF',
    fill: '#17324D',
  });
  assert.equal(byName['S01-table'].cells[2].font_size_pt, 13);
  assert.ok(byName['S01-picture'].embedded_size_bytes > 0);
  assert.equal(byName['S01-picture'].alt, 'RedCube AI logo');
  assert.equal(byName['S01-picture'].alt_text, 'RedCube AI logo');
  assert.equal(byName['S01-picture'].has_alt, true);
  assert.deepEqual(byName['S01-picture'].crop, { left: 0, top: 0, right: 0, bottom: 0 });
  assert.equal(byName['S01-group'].child_object_count, 2);
  assert.ok(byName['S01-path'].path_segment_count >= 5);
  assert.equal(byName['S01-connector'].tail_end, 'triangle');
  assert.equal(byName['S01-connector'].from_shape_name, 'S01-diamond');
  assert.equal(byName['S01-connector'].to_shape_name, 'S01-path');

  relocateRelationshipBackedParts(result.outputPptx);
  assert.equal(validatePptx(result.outputPptx).success, true);
  const relocated = runPackageReadback(result.outputPptx);
  assert.equal(relocated.schema_version, 1);
  assert.equal(relocated.evidence_source, 'pptx_package_readback');
  assert.match(relocated.pptx_sha256, /^[a-f0-9]{64}$/);
  assert.equal(relocated.slides[0].slide_part, 'ppt/scenes/semantic-slide.xml');
  assert.equal(relocated.slides[0].notes_part, 'ppt/speakerNotes/semantic-notes.xml');
  assert.equal(relocated.notes_slide_count, 1);
  assert.equal(relocated.transition_count, 1);
  assert.equal(relocated.animation_count, 1);
  assert.ok(relocated.timing_node_count >= 1);
  assert.equal(relocated.relationship_type_counts.chart, 1);
  assert.equal(relocated.relationship_type_counts.image, 1);
  assert.equal(relocated.relationship_type_counts.notesSlide, 1);
  assert.equal(relocated.slides[0].notes_relationship_resolved, true);
  assert.match(relocated.slides[0].notes_content_type, /presentationml\.notesSlide/);
  const relocatedByName = Object.fromEntries(relocated.slides[0].objects.map((item) => [item.name, item]));
  assert.equal(relocatedByName['S01-chart'].relationship_target, 'ppt/dataObjects/semantic-chart.xml');
  assert.match(relocatedByName['S01-chart'].content_type, /drawingml\.chart/);
  assert.equal(relocatedByName['S01-chart'].series_count, 1);
  assert.equal(relocatedByName['S01-picture'].relationship_target.startsWith('ppt/assets/'), true);
  assert.match(relocatedByName['S01-picture'].content_type, /^image\//);
  assert.equal(relocatedByName['S01-connector'].from_shape_name, 'S01-diamond');
  assert.equal(relocatedByName['S01-connector'].to_shape_name, 'S01-path');
  for (const kind of ['text_box', 'shape', 'connector', 'picture', 'chart', 'table', 'group', 'path']) {
    assert.ok(relocated.object_type_counts[kind] >= 1, `relocated ${kind} missing`);
  }
});

test('native PPT charts reject series whose value count does not match categories', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-chart-length-');
  const failure = runNativeObjectMaterializerFailure({
    workspaceRoot,
    payload: {
      slides: [{
        slide_id: 'S01',
        _editable_native_shapes: [shape('S01-chart', 'chart', bounds(1, 1, 8, 4), {
          materialization_intent: 'native_data_object',
          categories: ['A', 'B'],
          series: [{ name: 'Actual', values: [1] }],
        })],
      }],
    },
  });

  assert.notEqual(failure.status, 0);
  assert.match(`${failure.stdout}\n${failure.stderr}`, /series 1 value count must match categories/);
});

test('native PPT materializer fails fast instead of degrading unknown kinds to rectangles', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-object-unknown-');
  const failure = runNativeObjectMaterializerFailure({
    workspaceRoot,
    payload: {
      slides: [{
        slide_id: 'S01',
        _editable_native_shapes: [shape('S01-unknown', 'magic_widget', bounds(1, 1, 2, 1), { fill: '#FF0000' })],
      }],
    },
  });
  assert.notEqual(failure.status, 0);
  assert.match(`${failure.stdout}\n${failure.stderr}`, /unsupported native PPT object kind: magic_widget/);
});
