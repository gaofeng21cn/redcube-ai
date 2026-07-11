import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import {
  bounds,
  createNativeObjectWorkspace,
  createTemplatePptx,
  runNativeObjectMaterializer,
  runNativeObjectMaterializerFailure,
  shape,
} from './helpers/ppt-native-object-package-fixtures.js';
import { pythonTestEnv, resolveTestPythonCommand } from './helpers/ppt-native-python-layout-fixtures.js';

test('native PPT template preservation fails closed when any required surface changes', () => {
  const python = resolveTestPythonCommand();
  const stdout = execFileSync(python.command, [...(python.args || []), '-c', `
import copy
import json
from redcube_ai.native_helpers.ppt_deck.native_package import template_preservation

before = {
    'pptx_file': 'template.pptx',
    'canvas_emu': {'width': 12192000, 'height': 6858000},
    'template_part_hashes': {
        'ppt/slideMasters/slideMaster1.xml': 'master-hash',
        'ppt/slideLayouts/slideLayout1.xml': 'layout-hash',
        'ppt/theme/theme1.xml': 'theme-hash',
    },
    'part_counts': {'master': 1, 'layout': 1, 'theme': 1},
}
base_after = copy.deepcopy(before)
cases = {
    'canvas_preserved': lambda after: after.update(canvas_emu={'width': 12192001, 'height': 6858000}),
    'master_parts_preserved': lambda after: after['template_part_hashes'].update({'ppt/slideMasters/slideMaster1.xml': 'changed'}),
    'layout_parts_preserved': lambda after: after['template_part_hashes'].update({'ppt/slideLayouts/slideLayout1.xml': 'changed'}),
    'theme_parts_preserved': lambda after: after['template_part_hashes'].update({'ppt/theme/theme1.xml': 'changed'}),
}
rejected = {}
for label, mutate in cases.items():
    after = copy.deepcopy(base_after)
    mutate(after)
    try:
        template_preservation(before, after, 'fill_existing')
    except RuntimeError as exc:
        rejected[label] = str(exc)
print(json.dumps(rejected, sort_keys=True))
`], {
    cwd: process.cwd(),
    env: pythonTestEnv(),
    encoding: 'utf-8',
  });
  const rejected = JSON.parse(stdout);
  assert.deepEqual(Object.keys(rejected).sort(), [
    'canvas_preserved',
    'layout_parts_preserved',
    'master_parts_preserved',
    'theme_parts_preserved',
  ]);
  for (const [label, message] of Object.entries(rejected)) {
    assert.match(message, new RegExp(label));
  }
});

test('native PPT template fill preserves masters, layouts, theme, placeholders, and editable source objects', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-template-fill-');
  const templateFile = createTemplatePptx(workspaceRoot);
  const result = runNativeObjectMaterializer({
    workspaceRoot,
    payload: {
      template_intake: {
        source_pptx: templateFile,
        mode: 'fill_existing',
      },
      slides: [{
        slide_id: 'S01',
        background: '#F4F7FB',
        _editable_native_shapes: [
          shape('S01-filled-title', 'text_box', bounds(0.9, 1.2, 7.5, 0.8), {
            role: 'title',
            quality_role: 'content',
            editable_text: 'Template-aware editable fill',
            font_size: 28,
            fill: 'none',
            line: 'none',
          }),
        ],
      }],
    },
  });

  const preservation = result.template_preservation;
  assert.equal(preservation.mode, 'fill_existing');
  assert.equal(preservation.master_parts_preserved, true);
  assert.equal(preservation.layout_parts_preserved, true);
  assert.equal(preservation.theme_parts_preserved, true);
  assert.equal(preservation.canvas_preserved, true);
  assert.deepEqual(preservation.output_canvas_emu, preservation.source_canvas_emu);
  assert.deepEqual(result.package_readback.canvas_emu, preservation.source_canvas_emu);
  assert.deepEqual(preservation.changed_template_parts, []);
  assert.equal(result.package_readback.slide_count, 1);
  assert.ok(result.package_readback.placeholder_count >= 1);
  assert.equal(result.package_readback.slides[0].object_names.includes('TemplateAnchor'), true);
  assert.equal(result.package_readback.slides[0].object_names.includes('S01-filled-title'), true);
});

test('native PPT fill_existing requires each source slide to have one unique target', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-template-duplicate-target-');
  const templateFile = createTemplatePptx(workspaceRoot, 2);
  const failure = runNativeObjectMaterializerFailure({
    workspaceRoot,
    payload: {
      template_intake: { source_pptx: templateFile, mode: 'fill_existing' },
      slides: [
        { slide_id: 'S01', template_layout_binding: { target_slide_index: 1 }, _editable_native_shapes: [] },
        { slide_id: 'S02', template_layout_binding: { target_slide_index: 1 }, _editable_native_shapes: [] },
      ],
    },
  });

  assert.notEqual(failure.status, 0);
  assert.match(`${failure.stdout}\n${failure.stderr}`, /unique complete target_slide_index coverage/);
});

test('native PPT fill_existing rejects target indices outside the source deck', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-template-out-of-range-');
  const templateFile = createTemplatePptx(workspaceRoot, 2);
  const failure = runNativeObjectMaterializerFailure({
    workspaceRoot,
    payload: {
      template_intake: { source_pptx: templateFile, mode: 'fill_existing' },
      slides: [
        { slide_id: 'S01', template_layout_binding: { target_slide_index: 0 }, _editable_native_shapes: [] },
        { slide_id: 'S02', template_layout_binding: { target_slide_index: 2 }, _editable_native_shapes: [] },
      ],
    },
  });

  assert.notEqual(failure.status, 0);
  assert.match(`${failure.stdout}\n${failure.stderr}`, /unique complete target_slide_index coverage/);
});

test('native PPT template intake rejects identical source and output without deleting the source', () => {
  const { workspaceRoot } = createNativeObjectWorkspace('redcube-native-template-same-output-');
  const templateFile = createTemplatePptx(workspaceRoot);
  const original = readFileSync(templateFile);
  const failure = runNativeObjectMaterializerFailure({
    workspaceRoot,
    outputPptx: templateFile,
    payload: {
      template_intake: { source_pptx: templateFile, mode: 'fill_existing' },
      slides: [{ slide_id: 'S01', template_layout_binding: { target_slide_index: 1 }, _editable_native_shapes: [] }],
    },
  });

  assert.notEqual(failure.status, 0);
  assert.match(`${failure.stdout}\n${failure.stderr}`, /source_pptx and output_pptx must be different files/);
  assert.equal(existsSync(templateFile), true);
  assert.deepEqual(readFileSync(templateFile), original);
});
