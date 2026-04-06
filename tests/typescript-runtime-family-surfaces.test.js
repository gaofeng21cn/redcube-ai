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

test('P17 slice 7: runtime-family-ppt exposes a TypeScript entrypoint and typed runtime-family contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-ppt/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-ppt/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-ppt/tsconfig.json')), true);

  const pkg = readJson('packages/redcube-runtime-family-ppt/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-runtime-family-ppt/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-runtime-family-ppt/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-runtime-family-ppt/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.base.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-runtime-family-ppt'),
    true,
  );

  assert.match(entry, /canRunPptDeck/);
  assert.match(entry, /runPptDeckRoute/);

  assert.match(types, /type PptRuntimeRoute/);
  assert.match(types, /interface PptRuntimeContract/);
  assert.match(types, /interface PptRuntimeRunRequest/);
  assert.match(types, /type PptRuntimeRouteResult/);
  assert.match(types, /PptBlueprintArtifact/);
  assert.match(types, /PptVisualDirectionArtifact/);
  assert.match(types, /PptRenderArtifact/);
  assert.doesNotMatch(types, /\bany\b/);
});

test('P20.C: runtime-family-poster-onepager exposes a TypeScript entrypoint and typed runtime-family contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-poster-onepager/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-poster-onepager/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-poster-onepager/tsconfig.json')), true);

  const pkg = readJson('packages/redcube-runtime-family-poster-onepager/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-runtime-family-poster-onepager/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-runtime-family-poster-onepager/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-runtime-family-poster-onepager/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.base.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-runtime-family-poster-onepager'),
    true,
  );

  assert.match(entry, /canRunPosterOnepager/);
  assert.match(entry, /runPosterOnepagerRoute/);

  assert.match(types, /type PosterRuntimeRoute/);
  assert.match(types, /interface PosterRuntimeContract/);
  assert.match(types, /interface PosterRuntimeRunRequest/);
  assert.match(types, /type PosterRuntimeRouteResult/);
  assert.match(types, /PosterBlueprintArtifact/);
  assert.match(types, /PosterVisualDirectionArtifact/);
  assert.match(types, /PosterRenderArtifact/);
  assert.doesNotMatch(types, /\bany\b/);
});
