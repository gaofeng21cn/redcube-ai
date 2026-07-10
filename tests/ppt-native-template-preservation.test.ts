// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bounds,
  createNativeObjectWorkspace,
  createTemplatePptx,
  runNativeObjectMaterializer,
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
  assert.deepEqual(preservation.changed_template_parts, []);
  assert.equal(result.package_readback.slide_count, 1);
  assert.ok(result.package_readback.placeholder_count >= 1);
  assert.equal(result.package_readback.slides[0].object_names.includes('TemplateAnchor'), true);
  assert.equal(result.package_readback.slides[0].object_names.includes('S01-filled-title'), true);
});
