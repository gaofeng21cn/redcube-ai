// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  bounds,
  createNativeObjectWorkspace,
  createTemplatePptx,
  runNativeObjectMaterializer,
  runNativeObjectMaterializerFailure,
  shape,
} from './helpers/ppt-native-object-package-fixtures.ts';

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
