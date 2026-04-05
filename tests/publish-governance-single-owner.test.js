import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('family runtimes no longer directly author canonical publish owner fields', () => {
  const pptRuntime = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js');
  const xhsRuntime = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js');

  assert.equal(pptRuntime.includes('approval_state:'), false);
  assert.equal(pptRuntime.includes('publish_state:'), false);
  assert.equal(xhsRuntime.includes('approval_state:'), false);
  assert.equal(xhsRuntime.includes('publish_state:'), false);
});

test('family runtimes no longer directly author publication projection file hints', () => {
  const pptRuntime = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js');
  const xhsRuntime = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js');

  assert.equal(pptRuntime.includes('publication_state_file'), false);
  assert.equal(pptRuntime.includes('publication-state.json'), false);
  assert.equal(xhsRuntime.includes('publication_state_file'), false);
  assert.equal(xhsRuntime.includes('publication-state.json'), false);
});

test('@redcube/governance remains the canonical publish truth owner surface', () => {
  const runtimeIndex = read('packages/redcube-runtime/src/index.js');
  const governanceReviewState = read('packages/redcube-governance/src/review-state.js');

  assert.equal(runtimeIndex.includes("from '@redcube/governance'"), true);
  assert.equal(governanceReviewState.includes('approve_publish'), true);
  assert.equal(governanceReviewState.includes('promote_publish'), true);
  assert.equal(governanceReviewState.includes('review_state.publish_state'), true);
});
