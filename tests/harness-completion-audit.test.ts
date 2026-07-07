// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import {
  listDefaultRuntimeFamilyModules,
} from './package-surfaces.ts';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('harness audit keeps runtime package-scoped through direct default registry readback', () => {
  const runtimePackageJson = readJson('packages/redcube-runtime/package.json');

  assert.equal(runtimePackageJson.dependencies['@redcube/governance'], '0.1.0');
  assert.equal(runtimePackageJson.dependencies['@redcube/reference-os'], '0.1.0');
  assert.equal(Boolean(runtimePackageJson.dependencies['@redcube/runtime-family-registry']), false);
  assert.equal(Boolean(runtimePackageJson.dependencies['@redcube/pack-runtime']), false);
  assert.equal(Boolean(runtimePackageJson.dependencies['@redcube/runtime-family-ppt']), false);
  assert.equal(Boolean(runtimePackageJson.dependencies['@redcube/runtime-family-xiaohongshu']), false);
  assert.equal(Boolean(runtimePackageJson.dependencies['@redcube/runtime-family-poster-onepager']), false);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/ppt-deck-runtime.ts')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/xiaohongshu-runtime.ts')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/families/ppt/ppt-deck-runtime.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/families/xiaohongshu/xiaohongshu-runtime.ts')), true);
  assert.deepEqual(
    listDefaultRuntimeFamilyModules().map((entry) => entry.overlay_id),
    ['ppt_deck', 'xiaohongshu', 'poster_onepager'],
  );
});
