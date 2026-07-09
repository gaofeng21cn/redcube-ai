// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('ppt screenshot review capture remains the export source boundary', () => {
  const screenshotReview = readFileSync(
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/stage-screenshot-review.ts',
    'utf-8',
  );
  const exportSource = readFileSync(
    'packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/export.ts',
    'utf-8',
  );
  assert.match(screenshotReview, /screenshots_dir|review_capture|capture/);
  assert.match(exportSource, /screenshot|review_capture|pptx/i);
});
