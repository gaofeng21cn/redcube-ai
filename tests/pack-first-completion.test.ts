// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('retired pack workspaces stay out of workspace and package manifests', () => {
  const rootTsconfig = readJson('tsconfig.json');
  const runtimePackageJson = readJson('packages/redcube-runtime/package.json');

  assert.equal(existsSync(path.resolve('packages/redcube-pack-ppt')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-poster-onepager')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-runtime')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-ppt')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-xiaohongshu')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-poster-onepager')), false);
  assert.equal(rootTsconfig.references.some((entry) => entry.path.includes('redcube-pack-')), false);
  assert.equal(rootTsconfig.references.some((entry) => entry.path.includes('redcube-runtime-family-')), false);
  assert.equal(Boolean(runtimePackageJson.dependencies?.['@redcube/pack-runtime']), false);
  assert.equal(Boolean(runtimePackageJson.dependencies?.['@redcube/runtime-family-ppt']), false);
  assert.equal(Boolean(runtimePackageJson.dependencies?.['@redcube/runtime-family-xiaohongshu']), false);
  assert.equal(Boolean(runtimePackageJson.dependencies?.['@redcube/runtime-family-poster-onepager']), false);
});
