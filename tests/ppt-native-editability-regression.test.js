import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  pythonTestEnv,
  resolveTestPythonCommand,
} from './helpers/ppt-native-python-layout-fixtures.js';
import {
  bounds,
  createNativeObjectWorkspace,
  runPackageReadback,
  runNativeObjectMaterializer,
  runNativeObjectMaterializerFailure,
  shape,
} from './helpers/ppt-native-object-package-fixtures.js';

test('native object and inline hyperlinks preserve exact targets through package readback', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-hyperlinks-');
  const text = 'Read the source and continue';
  const result = runNativeObjectMaterializer({
    workspaceRoot,
    payload: { slides: [{
      slide_id: 'S01',
      _editable_native_shapes: [shape('S01-links', 'text_box', bounds(0.8, 1, 9, 1), {
        text, font_size: 24, fill: 'none', line: 'none',
        link: 'https://example.com/deck',
        paragraphs: [{ text, runs: [
          { text: 'Read the ' },
          { text: 'source', link: 'https://openai.com/research', bold: true },
          { text: ' and ' },
          { text: 'continue', link: 'slide[1]' },
        ] }],
      })],
    }] },
  });
  const readback = runPackageReadback(result.outputPptx);
  const links = readback.slides[0].objects.find((object) => object.name === 'S01-links').hyperlinks;
  assert.equal(links.object, 'https://example.com/deck');
  assert.equal(links.runs.find((run) => run.text === 'source').link, 'https://openai.com/research');
  assert.equal(links.runs.find((run) => run.text === 'continue').link, 'slide[1]');
});

test('invalid hyperlink targets fail before replacing an existing native artifact', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-link-preflight-');
  const outputPptx = path.join(workspaceRoot, 'existing.pptx');
  const original = Buffer.from('existing artifact must remain untouched');
  writeFileSync(outputPptx, original);
  for (const link of ['javascript:alert(1)', 'file:///private/example', 'slide[2]', 'relative/path']) {
    const result = runNativeObjectMaterializerFailure({
      workspaceRoot, outputPptx,
      payload: { slides: [{ slide_id: 'S01', _editable_native_shapes: [
        shape('S01-link', 'text_box', bounds(1, 1, 5, 1), { text: 'Source', font_size: 24, link }),
      ] }] },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /native PPT hyperlink/);
    assert.deepEqual(readFileSync(outputPptx), original);
  }
});

test('native quality-debt mode preserves a readable candidate while strict validation rejects overflow', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-quality-debt-');
  const payload = { slides: [{ slide_id: 'S01', _editable_native_shapes: [
    shape('S01-overflow', 'text_box', bounds(1, 1, 2, 0.3), {
      text: 'This intentionally overloaded candidate needs a larger text frame before it can pass review.',
      font_size: 30, fill: 'none', line: 'none',
    }),
  ] }] };
  const strict = runNativeObjectMaterializerFailure({ workspaceRoot, payload });
  assert.notEqual(strict.status, 0);
  assert.match(strict.stderr, /officecli quality gate failed/);
  const candidate = runNativeObjectMaterializer({ workspaceRoot, payload: { ...payload, allow_quality_debt: true } });
  assert.equal(candidate.package_readback.slide_count, 1);
  assert.equal(candidate.quality_debt.reason, 'native_materialized_visual_quality');
  assert.equal(candidate.quality_debt.issues.length > 0, true);
  assert.equal(candidate.quality_debt.blocks_stage_transition, false);
  assert.equal(candidate.quality_debt.blocks_visual_ready_claim, true);
  assert.equal(candidate.quality_debt.blocks_export_ready_claim, true);
});

test('native PPT edit task survives package readback and true rerender', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-editability-');
  const result = runNativeObjectMaterializer({
    workspaceRoot,
    payload: {
      slides: [{
        slide_id: 'S01',
        background: '#FFFFFF',
        speaker_notes: 'Baseline speaker notes.',
        _editable_native_shapes: [
          shape('S01-title', 'text_box', bounds(0.8, 0.4, 8.8, 0.7), {
            role: 'title',
            quality_role: 'content',
            text: 'Baseline operating result',
            font_size: 28,
            fill: 'none',
            line: 'none',
          }),
          shape('S01-node-a', 'shape', bounds(0.8, 1.7, 2.2, 1.0), {
            preset: 'roundRect',
            text: 'Source',
            font_size: 16,
            fill: '#D7E8F5',
            line: '#17324D',
          }),
          shape('S01-node-b', 'shape', bounds(5.2, 1.7, 2.2, 1.0), {
            preset: 'roundRect',
            text: 'Decision',
            font_size: 16,
            fill: '#E2E8F0',
            line: '#17324D',
          }),
          shape('S01-flow', 'connector', bounds(3.0, 2.15, 2.2, 0.08), {
            line: '#17324D',
            tail_end: 'triangle',
            from_shape_id: 'S01-node-a',
            to_shape_id: 'S01-node-b',
          }),
          shape('S01-chart', 'chart', bounds(0.8, 3.2, 6.6, 3.2), {
            materialization_intent: 'native_data_object',
            chart_type: 'column',
            categories: ['North', 'South'],
            series: [{ name: 'Actual', values: [3, 8], color: '#2563EB' }],
            title: 'Regional result',
          }),
        ],
      }],
    },
  });
  const baseline = runPackageReadback(result.outputPptx);
  const proofDir = path.join(workspaceRoot, 'editability-proof');
  const python = resolveTestPythonCommand();
  const edit = spawnSync(python.command, [
    ...(python.args || []),
    'tools/native-ppt-proof/run-editability-regression.py',
    result.outputPptx,
    proofDir,
  ], {
    cwd: process.cwd(),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
  assert.equal(edit.status, 0, `${edit.stdout}\n${edit.stderr}`);

  const proof = JSON.parse(edit.stdout);
  const edited = proof.package_readback;
  const byName = Object.fromEntries(edited.slides[0].objects.map((item) => [item.name, item]));
  assert.notEqual(edited.pptx_sha256, baseline.pptx_sha256);
  assert.equal(byName['S01-chart'].categories_raw, 'North,South,West');
  assert.equal(byName['S01-chart'].categories_readback, 'delimiter_ambiguous');
  assert.deepEqual(byName['S01-chart'].series, [{ name: 'Reforecast', values: [5, 9, 12] }]);
  assert.equal(byName['S01-title'].text, 'Updated operating result');
  assert.equal(byName['S01-node-a'].fill, '#0F766E');
  assert.deepEqual(byName['S01-node-a'].bounds_emu, {
    left: 1371600,
    top: 2011680,
    width: 2011680,
    height: 914400,
  });
  assert.equal(byName['S01-flow'].from_shape_name, 'S01-node-a');
  assert.equal(byName['S01-flow'].to_shape_name, 'S01-node-b');
  assert.equal(edited.slides[0].speaker_notes, 'Updated speaker notes for the reforecast.');
  assert.equal(proof.render_proof.renderer_pipeline, 'libreoffice_headless_pdf_png_v1');
  assert.equal(proof.render_proof.synthetic_preview, false);
  assert.equal(proof.render_proof.source_pptx_sha256, edited.pptx_sha256);
  assert.equal(proof.render_proof.slide_count, 1);
  assert.equal(proof.render_proof.preview_screenshots.length, 1);
  assert.equal(existsSync(proof.render_proof.pdf_file), true);
  assert.equal(existsSync(proof.render_proof.preview_screenshots[0]), true);
});
