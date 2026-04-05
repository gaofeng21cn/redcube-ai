import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('runtime no longer owns xiaohongshu slide recipe compiler branches', () => {
  const runtime = read('packages/redcube-runtime/src/xiaohongshu-runtime.js');
  const pack = read('prompts/xiaohongshu/render_pack.js');

  assert.equal(runtime.includes('function compileXhsRenderSlide('), false);
  assert.equal(runtime.includes("if (slide.recipe_id === 'xhs.hero_note')"), false);
  assert.equal(pack.includes('export function compileRenderSlides'), true);
  assert.equal(pack.includes("if (slide.recipe_id === 'xhs.hero_note')"), true);
});

test('runtime no longer owns ppt slide recipe compiler branches', () => {
  const runtime = read('packages/redcube-runtime/src/ppt-deck-runtime.js');
  const pack = read('prompts/ppt_deck/render_pack.js');

  assert.equal(runtime.includes('function compilePptRenderSlide('), false);
  assert.equal(runtime.includes("if (slide.recipe_id === 'ppt.timeline_rail')"), false);
  assert.equal(pack.includes('export function compileRenderSlides'), true);
  assert.equal(pack.includes("if (slide.recipe_id === 'ppt.timeline_rail')"), true);
});

test('runtime executor no longer imports local family runtime files directly', () => {
  const executors = read('packages/redcube-runtime/src/executors.js');

  assert.equal(executors.includes("./ppt-deck-runtime.js"), false);
  assert.equal(executors.includes("./xiaohongshu-runtime.js"), false);
  assert.equal(executors.includes("@redcube/runtime-family-ppt"), true);
  assert.equal(executors.includes("@redcube/runtime-family-xiaohongshu"), true);
});

test('@redcube/runtime manifest declares family runtime package dependencies explicitly', () => {
  const runtimePackageJson = JSON.parse(read('packages/redcube-runtime/package.json'));

  assert.equal(runtimePackageJson.dependencies?.['@redcube/runtime-family-ppt'], '0.1.0');
  assert.equal(runtimePackageJson.dependencies?.['@redcube/runtime-family-xiaohongshu'], '0.1.0');
});
