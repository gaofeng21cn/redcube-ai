import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readImplementation(file) {
  const source = read(file);
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? read(path.join(path.dirname(file), shell[1])) : source;
}

function readGovernanceReviewStateSurface() {
  return [
    read('packages/redcube-governance/src/review-state.ts'),
    read('packages/redcube-governance/src/review-state-parts/mutations.ts'),
    read('packages/redcube-governance/src/review-state-parts/projection.ts'),
  ].join('\n');
}

test('family runtimes no longer directly author canonical publish owner fields', () => {
  const pptRuntime = read('packages/redcube-runtime/src/families/ppt/ppt-deck-runtime.ts');
  const xhsRuntime = read('packages/redcube-runtime/src/families/xiaohongshu/xiaohongshu-runtime.ts');

  assert.equal(pptRuntime.includes('approval_state:'), false);
  assert.equal(pptRuntime.includes('publish_state:'), false);
  assert.equal(xhsRuntime.includes('approval_state:'), false);
  assert.equal(xhsRuntime.includes('publish_state:'), false);
});

test('family runtimes no longer directly author publication projection file hints', () => {
  const pptRuntime = read('packages/redcube-runtime/src/families/ppt/ppt-deck-runtime.ts');
  const xhsRuntime = read('packages/redcube-runtime/src/families/xiaohongshu/xiaohongshu-runtime.ts');

  assert.equal(pptRuntime.includes('publication_state_file'), false);
  assert.equal(pptRuntime.includes('publication-state.json'), false);
  assert.equal(xhsRuntime.includes('publication_state_file'), false);
  assert.equal(xhsRuntime.includes('publication-state.json'), false);
});

test('@redcube/governance remains the canonical publish truth owner surface', () => {
  const runtimeIndex = readImplementation('packages/redcube-runtime/src/index.ts');
  const governanceReviewState = readGovernanceReviewStateSurface();

  assert.equal(runtimeIndex.includes("from '@redcube/governance'"), true);
  assert.equal(governanceReviewState.includes('approve_publish'), true);
  assert.equal(governanceReviewState.includes('promote_publish'), true);
  assert.equal(governanceReviewState.includes('review_state.publish_state'), true);
});
