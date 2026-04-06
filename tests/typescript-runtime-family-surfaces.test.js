import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('P17 slice 6: runtime-family-xiaohongshu exposes a TypeScript entrypoint and typed runtime-family contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-xiaohongshu/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-xiaohongshu/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-xiaohongshu/tsconfig.json')), true);

  const pkg = readJson('packages/redcube-runtime-family-xiaohongshu/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-runtime-family-xiaohongshu/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-runtime-family-xiaohongshu/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-runtime-family-xiaohongshu/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.base.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-runtime-family-xiaohongshu'),
    true,
  );

  assert.match(entry, /canRunXiaohongshu/);
  assert.match(entry, /runXiaohongshuRoute/);

  assert.match(types, /type XhsRuntimeRoute/);
  assert.match(types, /interface XhsRuntimeContract/);
  assert.match(types, /interface XhsRuntimeRunRequest/);
  assert.match(types, /type XhsRuntimeRouteResult/);
  assert.match(types, /XhsPlanArtifact/);
  assert.match(types, /XhsVisualDirectionArtifact/);
  assert.match(types, /XhsRenderArtifact/);
  assert.doesNotMatch(types, /\bany\b/);
});
