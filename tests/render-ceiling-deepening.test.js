import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('ppt family runtime uses upstream structured generation directly and no longer imports pack builders', () => {
  const runtime = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js');

  assert.equal(runtime.includes('function buildOutlineSlides('), false);
  assert.equal(runtime.includes('function buildSlideBlueprint('), false);
  assert.equal(runtime.includes('function buildVisualDirection('), false);
  assert.equal(runtime.includes('@redcube/pack-ppt'), false);
  assert.equal(runtime.includes('../../redcube-runtime/src'), false);
  assert.equal(runtime.includes('generateStructuredArtifactViaCodexCli'), true);
  assert.equal(runtime.includes('function buildRenderArtifact('), false);
});

test('ppt family runtime keeps the public route entry while heavy stage builders move into family parts', () => {
  const runtime = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js');

  assert.equal(runtime.includes("from './ppt-deck-runtime-family-parts/index.js'"), true);
  assert.equal(runtime.includes('export async function runPptDeckRoute('), true);
  assert.equal(runtime.includes('async function buildRenderHtmlArtifact('), false);
  assert.equal(runtime.includes('async function buildDirectorReview('), false);
  assert.equal(runtime.includes('function buildExportArtifact('), false);
});

test('xiaohongshu family runtime keeps AI-first generation in runtime-family instead of pack imports', () => {
  const runtime = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js');

  assert.equal(runtime.includes('function inferVisualPresentation('), false);
  assert.equal(runtime.includes('function buildPlanSlides('), false);
  assert.equal(runtime.includes('@redcube/pack-xiaohongshu'), false);
  assert.equal(runtime.includes('../../redcube-runtime/src'), false);
  assert.equal(runtime.includes('generateStructuredArtifactViaCodexCli'), true);
});

test('poster family runtime keeps AI-first generation in runtime-family without cross-package source imports', () => {
  const runtime = read('packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime.js');

  assert.equal(runtime.includes('@redcube/pack-poster-onepager'), false);
  assert.equal(runtime.includes('../../redcube-runtime/src'), false);
  assert.equal(runtime.includes('generateStructuredArtifactViaCodexCli'), true);
});
