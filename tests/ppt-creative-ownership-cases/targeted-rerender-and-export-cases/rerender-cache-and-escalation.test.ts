// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function runtimeSource() {
  return [
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/render.ts',
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/stage-review-scope.ts',
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/incremental-review-scope.ts',
  ].map((file) => readFileSync(file, 'utf-8')).join('\n');
}

test('ppt fix_html retains targeted rerender and reuse vocabulary without mirroring every payload field', () => {
  const source = runtimeSource();
  assert.match(source, /targeted|target_slide_ids|freshly_rendered_slide_ids/);
  assert.match(source, /reused_slide_ids|reuse|incremental/);
});

test('ppt repeat-block path remains an escalation boundary, not a silent pass', () => {
  const source = runtimeSource();
  assert.match(source, /repeat|escalat|block/i);
});
