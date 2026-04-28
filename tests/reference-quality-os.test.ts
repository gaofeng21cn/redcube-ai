// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  buildReferenceQualityReport,
  createOverlayRegistry,
  listReferenceSamples,
  pptDeckOverlay,
  xiaohongshuOverlay,
} from './package-surfaces.ts';

function overlayRegistry() {
  return createOverlayRegistry({
    ppt_deck: pptDeckOverlay,
    xiaohongshu: xiaohongshuOverlay,
  });
}

test('reference-os exposes machine-readable sample catalog surface', () => {
  const catalog = listReferenceSamples({
    rootDir: path.resolve('tests', 'reference-samples'),
  });

  assert.equal(catalog.surface_kind, 'reference_sample_catalog');
  assert.equal(Array.isArray(catalog.approved_samples), true);
  assert.equal(catalog.approved_samples.length >= 5, true);
  assert.equal(Array.isArray(catalog.invalid_samples), true);
});

test('reference-os exposes machine-readable quality report surface', () => {
  const report = buildReferenceQualityReport({
    rootDir: path.resolve('tests', 'reference-samples'),
    overlayRegistry: overlayRegistry(),
  });

  assert.equal(report.surface_kind, 'reference_quality_report');
  assert.equal(report.ready, true);
  assert.equal(report.coverage.expected_profile_count, 5);
  assert.equal(report.coverage.missing_profiles.length, 0);
  assert.equal(Array.isArray(report.invalid_samples), true);
});
