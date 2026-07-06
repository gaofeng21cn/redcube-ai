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
  const pptFamilyPackageJson = readJson('packages/redcube-runtime-family-ppt/package.json');
  const xhsFamilyPackageJson = readJson('packages/redcube-runtime-family-xiaohongshu/package.json');
  const posterFamilyPackageJson = readJson('packages/redcube-runtime-family-poster-onepager/package.json');

  assert.equal(existsSync(path.resolve('packages/redcube-pack-ppt')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-poster-onepager')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-runtime')), false);
  assert.equal(rootTsconfig.references.some((entry) => entry.path.includes('redcube-pack-')), false);
  assert.equal(Boolean(runtimePackageJson.dependencies?.['@redcube/pack-runtime']), false);
  assert.equal(Boolean(pptFamilyPackageJson.dependencies?.['@redcube/pack-runtime']), false);
  assert.equal(Boolean(xhsFamilyPackageJson.dependencies?.['@redcube/pack-runtime']), false);
  assert.equal(Boolean(posterFamilyPackageJson.dependencies?.['@redcube/pack-runtime']), false);
  assert.equal(Boolean(pptFamilyPackageJson.dependencies?.['@redcube/pack-ppt']), false);
  assert.equal(Boolean(xhsFamilyPackageJson.dependencies?.['@redcube/pack-xiaohongshu']), false);
  assert.equal(Boolean(posterFamilyPackageJson.dependencies?.['@redcube/pack-poster-onepager']), false);
});
