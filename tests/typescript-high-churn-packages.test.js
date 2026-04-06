import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('P17 slice 1: pack-xiaohongshu exposes a TypeScript pack entrypoint and typed high-churn contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu/tsconfig.json')), true);

  const pkg = readJson('packages/redcube-pack-xiaohongshu/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-pack-xiaohongshu/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-pack-xiaohongshu/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-pack-xiaohongshu/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.base.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-pack-xiaohongshu'),
    true,
  );

  assert.match(entry, /buildXhsPlanSlides/);
  assert.match(entry, /buildXhsVisualDirection/);
  assert.match(entry, /buildXhsRenderHtml/);
  assert.match(entry, /compileXhsRenderSlides/);

  assert.match(types, /interface XhsPlanSlide/);
  assert.match(types, /interface XhsVisualDirectionArtifact/);
  assert.match(types, /interface XhsRenderSlide/);
  assert.doesNotMatch(types, /\bany\b/);
});

test('P17 slice 2: pack-ppt exposes a TypeScript pack entrypoint and typed high-churn contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-pack-ppt/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-ppt/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-ppt/tsconfig.json')), true);

  const pkg = readJson('packages/redcube-pack-ppt/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-pack-ppt/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-pack-ppt/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-pack-ppt/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.base.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-pack-ppt'),
    true,
  );

  assert.match(entry, /buildPptOutlineSlides/);
  assert.match(entry, /buildPptDetailedOutline/);
  assert.match(entry, /buildPptSlideBlueprint/);
  assert.match(entry, /buildPptVisualDirection/);
  assert.match(entry, /buildPptRenderArtifact/);
  assert.match(entry, /compilePptRenderSlides/);

  assert.match(types, /interface PptOutlineSlide/);
  assert.match(types, /interface PptBlueprintArtifact/);
  assert.match(types, /interface PptVisualDirectionArtifact/);
  assert.match(types, /interface PptRenderSlide/);
  assert.doesNotMatch(types, /\bany\b/);
});


test('P17 slice 6: runtime-family-xiaohongshu exposes a TypeScript runtime entrypoint and typed family contracts', () => {
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

test('P17 slice 7: runtime-family-ppt exposes a TypeScript runtime entrypoint and typed family contracts', () => {
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
