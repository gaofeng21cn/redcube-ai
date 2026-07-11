import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('retired package and MCP surfaces stay out of workspace and package manifests', () => {
  const rootTsconfig = readJson('tsconfig.json');
  const runtimePackageJson = readJson('packages/redcube-runtime/package.json');
  const retiredWorkspaces = [
    'apps/redcube-mcp',
    'packages/redcube-pack-ppt',
    'packages/redcube-pack-xiaohongshu',
    'packages/redcube-pack-poster-onepager',
    'packages/redcube-pack-runtime',
    'packages/redcube-runtime-family-ppt',
    'packages/redcube-runtime-family-xiaohongshu',
    'packages/redcube-runtime-family-poster-onepager',
    'packages/redcube-runtime-family-registry',
    'packages/redcube-overlay-registry',
  ];
  const retiredRuntimeDependencies = [
    '@redcube/pack-runtime',
    '@redcube/runtime-family-ppt',
    '@redcube/runtime-family-xiaohongshu',
    '@redcube/runtime-family-poster-onepager',
    '@redcube/runtime-family-registry',
  ];

  for (const workspace of retiredWorkspaces) {
    assert.equal(existsSync(path.resolve(workspace)), false, workspace);
    assert.equal(rootTsconfig.references.some((entry) => entry.path === `./${workspace}`), false, workspace);
  }
  for (const dependency of retiredRuntimeDependencies) {
    assert.equal(Boolean(runtimePackageJson.dependencies?.[dependency]), false, dependency);
  }
});
