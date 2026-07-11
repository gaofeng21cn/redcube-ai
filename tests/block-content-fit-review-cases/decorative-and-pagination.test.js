import {
  test,
  assert,
  runReviewWithDecorativeGroundOverlap,
  runReviewWithInconsistentPageNumbers,
} from './shared.js';

test('shared screenshot review ignores decorative ground containers for occlusion and density', () => {
  const payload = runReviewWithDecorativeGroundOverlap();
  assert.equal(payload.status, 'pass');
  assert.equal(payload.slide_reviews[0].checks.occlusion_free, true);
  assert.equal(payload.slide_reviews[0].checks.visual_density_ok, true);
  assert.deepEqual(payload.slide_reviews[0].metrics.overlaps, []);
  assert.equal(payload.slide_reviews[0].metrics.occupied_ratio < 0.82, true);
});

test('shared screenshot review blocks inconsistent page number syntax and styling across a full deck', () => {
  const payload = runReviewWithInconsistentPageNumbers();
  assert.equal(payload.status, 'block');
  assert.equal(payload.checks.page_number_consistency_ok, false);
  assert.equal(payload.slide_reviews[0].checks.page_number_consistency_ok, true);
  assert.equal(payload.slide_reviews[1].checks.page_number_consistency_ok, false);
  assert.equal(payload.slide_reviews[1].issues.includes('page_number_consistency_failed'), true);
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.syntax_family, 'current_total_slash');
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.reference.syntax_family, 'two_digit');
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.failures.includes('syntax_family'), true);
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.failures.includes('position'), true);
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.failures.includes('font_size'), true);
  assert.equal(payload.slide_reviews[1].metrics.page_number_audit.failures.includes('color'), true);
});
