import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('runtime no longer owns xiaohongshu slide recipe compiler branches', () => {
  const runtime = read('packages/redcube-runtime/src/xiaohongshu-runtime.js');
  const pack = read('packages/redcube-pack-xiaohongshu/src/render-compiler.js');

  assert.equal(runtime.includes('function compileXhsRenderSlide('), false);
  assert.equal(runtime.includes("if (slide.recipe_id === 'xhs.hero_note')"), false);
  assert.equal(pack.includes('export function compileXhsRenderSlides'), true);
  assert.equal(pack.includes("if (slide.recipe_id === 'xhs.hero_note')"), true);
});

test('runtime no longer owns ppt slide recipe compiler branches', () => {
  const runtime = read('packages/redcube-runtime/src/ppt-deck-runtime.js');
  const pack = read('packages/redcube-pack-ppt/src/render-compiler.js');

  assert.equal(runtime.includes('function compilePptRenderSlide('), false);
  assert.equal(runtime.includes("if (slide.recipe_id === 'ppt.timeline_rail')"), false);
  assert.equal(pack.includes('export function compilePptRenderSlides'), true);
  assert.equal(pack.includes("if (slide.recipe_id === 'ppt.timeline_rail')"), true);
});

test('overlay render contracts use package-native compiler registry instead of render_pack.js path strings', () => {
  const pptOverlay = read('packages/redcube-overlay-ppt/src/profiles.js');
  const xhsOverlay = read('packages/redcube-overlay-xiaohongshu/src/contracts.js');
  const packRuntime = read('packages/redcube-pack-runtime/src/index.js');

  assert.equal(pptOverlay.includes("compiler_module:"), false);
  assert.equal(pptOverlay.includes("compiler_export:"), false);
  assert.equal(xhsOverlay.includes("compiler_module:"), false);
  assert.equal(xhsOverlay.includes("compiler_export:"), false);
  assert.equal(packRuntime.includes('render_pack.js'), false);
  assert.equal(packRuntime.includes('defaultPackCompilerModules'), true);
  assert.equal(packRuntime.includes('prompt_pack?.pack_id'), true);
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

test('runtime manifest declares pack-runtime dependency explicitly', () => {
  const runtimePackageJson = JSON.parse(read('packages/redcube-runtime/package.json'));

  assert.equal(runtimePackageJson.dependencies?.['@redcube/pack-runtime'], '0.1.0');
});

test('family runtime packages no longer import render-pack loader from runtime internals', () => {
  const pptFamily = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.js');
  const xhsFamily = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.js');

  assert.equal(pptFamily.includes("../../redcube-runtime/src/render-pack-compiler.js"), false);
  assert.equal(xhsFamily.includes("../../redcube-runtime/src/render-pack-compiler.js"), false);
  assert.equal(pptFamily.includes("@redcube/pack-runtime"), true);
  assert.equal(xhsFamily.includes("@redcube/pack-runtime"), true);
});
