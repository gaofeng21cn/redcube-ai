// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('ppt fix_html keeps operator revision brief as an explicit targeted-rerender input', () => {
  const source = [
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/render-revision.ts',
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/render.ts',
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/surface-operator-markdown.ts',
  ].map((file) => readFileSync(file, 'utf-8')).join('\n');
  assert.match(source, /operator_revision_brief|当前返修要求/);
  assert.match(source, /target_slide_ids|freshly_rendered_slide_ids|targeted/);
});
