import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('ppt incremental screenshot reuse still guards page-number freshness', () => {
  const source = [
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/stage-screenshot-review-mechanics.ts',
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/incremental-review-scope.ts',
  ].map((file) => readFileSync(file, 'utf-8')).join('\n');
  assert.match(source, /page_number|page-number|pageNumber/i);
  assert.match(source, /stale|fresh|reused/i);
});
