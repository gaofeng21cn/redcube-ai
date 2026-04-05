import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('ppt family runtime no longer owns slide planning and visual direction builders', () => {
  const runtime = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js');

  assert.equal(runtime.includes('function buildOutlineSlides('), false);
  assert.equal(runtime.includes('function buildSlideBlueprint('), false);
  assert.equal(runtime.includes('function buildVisualDirection('), false);
  assert.equal(runtime.includes('@redcube/pack-ppt'), true);
  assert.equal(runtime.includes('function buildRenderArtifact('), false);
});

test('xiaohongshu family runtime no longer owns note planning and visual presentation builders', () => {
  const runtime = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js');

  assert.equal(runtime.includes('function inferVisualPresentation('), false);
  assert.equal(runtime.includes('function buildPlanSlides('), false);
  assert.equal(runtime.includes('function buildVisualDirection('), false);
  assert.equal(runtime.includes('@redcube/pack-xiaohongshu'), true);
  assert.equal(runtime.includes('async function buildRenderHtml('), false);
});
