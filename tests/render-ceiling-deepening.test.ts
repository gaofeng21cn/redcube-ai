// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readImplementation(file) {
  const source = read(file);
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? read(path.join(path.dirname(file), shell[1])) : source;
}

test('ppt family runtime uses upstream structured generation directly and no longer imports pack builders', () => {
  const runtime = read('packages/redcube-runtime/src/families/ppt/ppt-deck-runtime.ts');
  const runtimeCore = readImplementation('packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/core.ts');
  const executionAdapters = read('packages/redcube-runtime/src/families/ppt/ppt-deck-runtime-family-parts/execution-adapters.ts');

  assert.equal(runtime.includes('function buildOutlineSlides('), false);
  assert.equal(runtime.includes('function buildSlideBlueprint('), false);
  assert.equal(runtime.includes('function buildVisualDirection('), false);
  assert.equal(runtime.includes('@redcube/pack-ppt'), false);
  assert.equal(runtime.includes('../../redcube-runtime/src'), false);
  assert.equal(runtimeCore.includes("from './execution-adapters.js'"), true);
  assert.equal(executionAdapters.includes('generateStructuredArtifactViaCodexCli'), true);
  assert.equal(runtime.includes('function buildRenderArtifact('), false);
});

test('ppt family runtime keeps the public route entry while heavy stage builders move into family parts', () => {
  const runtime = read('packages/redcube-runtime/src/families/ppt/ppt-deck-runtime.ts');

  assert.equal(runtime.includes("from './ppt-deck-runtime-family-parts/core.js'"), true);
  assert.equal(runtime.includes('export async function runPptDeckRoute('), true);
  assert.equal(runtime.includes('async function buildRenderHtmlArtifact('), false);
  assert.equal(runtime.includes('async function buildDirectorReview('), false);
  assert.equal(runtime.includes('function buildExportArtifact('), false);
});

test('xiaohongshu family runtime keeps AI-first generation in runtime-family instead of pack imports', () => {
  const runtimeEntry = read('packages/redcube-runtime/src/families/xiaohongshu/index.ts');
  const runtime = read('packages/redcube-runtime/src/families/xiaohongshu/xiaohongshu-runtime.ts');
  const runtimeParts = read('packages/redcube-runtime/src/families/xiaohongshu/xiaohongshu-runtime-family-parts/index.ts');

  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/families/xiaohongshu/index.js')), false);
  assert.equal(runtimeEntry.includes("from './xiaohongshu-runtime.js'"), true);
  assert.equal(runtime.includes('function inferVisualPresentation('), false);
  assert.equal(runtime.includes('function buildPlanSlides('), false);
  assert.equal(runtime.includes('@redcube/pack-xiaohongshu'), false);
  assert.equal(runtime.includes('../../redcube-runtime/src'), false);
  assert.equal(runtime.includes("from './xiaohongshu-runtime-family-parts/index.js'"), true);
  assert.equal(runtimeParts.includes('generateStructuredArtifactViaCodexCli'), true);
});

test('xiaohongshu family runtime keeps the public route entry while heavy stage builders move into family parts', () => {
  const runtimeEntry = read('packages/redcube-runtime/src/families/xiaohongshu/index.ts');
  const runtime = read('packages/redcube-runtime/src/families/xiaohongshu/xiaohongshu-runtime.ts');

  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/families/xiaohongshu/index.js')), false);
  assert.equal(runtimeEntry.includes("from './xiaohongshu-runtime.js'"), true);
  assert.equal(runtime.includes("from './xiaohongshu-runtime-family-parts/index.js'"), true);
  assert.equal(runtime.includes('export async function runXiaohongshuRoute('), true);
  assert.equal(runtime.includes('async function buildStoryline('), false);
  assert.equal(runtime.includes('async function buildRenderHtml('), false);
  assert.equal(runtime.includes('async function buildScreenshotReview('), false);
  assert.equal(runtime.includes('function buildExportBundle('), false);
});

test('poster family runtime keeps AI-first generation in runtime-family without cross-package source imports', () => {
  const runtime = read('packages/redcube-runtime/src/families/poster-onepager/poster-onepager-runtime.ts');
  const runtimeCore = read('packages/redcube-runtime/src/families/poster-onepager/poster-onepager-runtime-parts/core.ts');
  const routeReviewHelpers = read('packages/redcube-runtime/src/families/poster-onepager/poster-onepager-runtime-parts/route-review-helpers.ts');

  assert.equal(runtime.includes('@redcube/pack-poster-onepager'), false);
  assert.equal(runtime.includes('../../redcube-runtime/src'), false);
  assert.equal(runtimeCore.includes('generateStructuredArtifact'), true);
  assert.equal(routeReviewHelpers.includes('generateStructuredArtifactViaCodexCli'), true);
});
