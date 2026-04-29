// @ts-nocheck
import {
  test,
  assert,
  runReviewWithOverflowingBlock,
  runReviewWithDecorativeGroundOverlap,
  runReviewWithInconsistentPageNumbers,
  runReviewWithUnframedHeader,
  runReviewWithOverflowingChildGroup,
  runReviewWithUntaggedTakeawayText,
  runReviewWithAdjacentReadableBlocksTooClose,
} from './shared.ts';

test('shared screenshot review blocks visible audience-facing text that is not covered by a qa block', () => {
  const payload = runReviewWithUntaggedTakeawayText();
  assert.equal(payload.status, 'block');
  assert.equal(payload.checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].issues.includes('block_content_overflow_detected'), true);
  assert.equal(Array.isArray(payload.slide_reviews[0].metrics.block_content_failures), true);
  assert.equal(
    payload.slide_reviews[0].metrics.block_content_failures.some((failure) => failure.overflow_reason === 'untagged_text_block'),
    true,
  );
});

test('shared screenshot review blocks adjacent readable qa blocks with unsafe clearance', () => {
  const payload = runReviewWithAdjacentReadableBlocksTooClose();
  assert.equal(payload.status, 'block');
  assert.equal(payload.checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].checks.block_content_fit_ok, false);
  assert.equal(payload.slide_reviews[0].issues.includes('block_content_overflow_detected'), true);
  assert.equal(
    payload.slide_reviews[0].metrics.block_content_failures.some(
      (failure) => failure.overflow_reason === 'adjacent_readable_blocks_too_close',
    ),
    true,
  );
});
