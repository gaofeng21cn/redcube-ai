import {
  test,
  assert,
  runReviewWithOverflowingBlock,
  runReviewWithUnframedHeader,
  runReviewWithOverflowingChildGroup,
} from './shared.js';

test('shared screenshot review blocks surfaced block content that spills out of its card', () => {
  const payload = runReviewWithOverflowingBlock();
  assert.equal(payload.status, 'block');
  assert.equal(payload.checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].issues.includes('block_content_overflow_detected'), true);
  assert.equal(Array.isArray(payload.slide_reviews[0].metrics.block_content_failures), true);
  assert.equal(payload.slide_reviews[0].metrics.block_content_failures.length > 0, true);
});

test('shared screenshot review does not treat unframed header groups as block content overflow', () => {
  const payload = runReviewWithUnframedHeader();
  assert.equal(payload.status, 'pass');
  assert.equal(payload.checks.block_content_fit_ok, true);
  assert.equal(payload.slide_reviews[0].checks.block_content_fit_ok, true);
  assert.equal(payload.slide_reviews[0].issues.includes('block_content_overflow_detected'), false);
  assert.deepEqual(payload.slide_reviews[0].metrics.block_content_failures, []);
});

test('shared screenshot review blocks surfaced parent groups whose child cards spill outside the group frame', () => {
  const payload = runReviewWithOverflowingChildGroup();
  assert.equal(payload.status, 'block');
  assert.equal(payload.checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].issues.includes('block_content_overflow_detected'), true);
  assert.equal(Array.isArray(payload.slide_reviews[0].metrics.block_content_failures), true);
  assert.equal(payload.slide_reviews[0].metrics.block_content_failures.length > 0, true);
});
