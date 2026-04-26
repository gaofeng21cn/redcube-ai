import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function readText(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function assertTsBackedCompatShell(file, target) {
  assert.equal(readText(file).trim(), `export * from '${target}';`);
}

test('P17 slice 3: overlay-core exposes a TypeScript entrypoint and typed registry contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-core/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-core/src/contracts.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-core/src/registry.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-core/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-core/tsconfig.json')), true);

  const pkg = readJson('packages/redcube-overlay-core/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-overlay-core/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-overlay-core/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-overlay-core/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.base.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-overlay-core'),
    true,
  );

  assert.match(entry, /buildDeliverableRecord/);
  assert.match(entry, /mergeContractLayers/);
  assert.match(entry, /hydrateDeliverableContract/);
  assert.match(entry, /createOverlayRegistry/);
  assert.doesNotMatch(entry, /\bJs\b/);
  assertTsBackedCompatShell('packages/redcube-overlay-core/src/index.js', './index.ts');
  assertTsBackedCompatShell('packages/redcube-overlay-core/src/contracts.js', './contracts.ts');
  assertTsBackedCompatShell('packages/redcube-overlay-core/src/registry.js', './registry.ts');

  assert.match(types, /interface OverlayDefinition/);
  assert.match(types, /interface OverlayRegistry/);
  assert.match(types, /interface HydratedDeliverableContract/);
  assert.doesNotMatch(types, /\bany\b/);
});

test('P17 slice 3: overlay-registry exposes a TypeScript entrypoint and typed default catalog contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-registry/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-registry/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-registry/tsconfig.json')), true);

  const pkg = readJson('packages/redcube-overlay-registry/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-overlay-registry/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-overlay-registry/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-overlay-registry/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.base.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-overlay-registry'),
    true,
  );

  assert.match(entry, /getDefaultOverlayRegistry/);
  assert.match(entry, /getDefaultOverlayCatalog/);
  assert.match(entry, /loadDefaultOverlayEntries/);
  assert.doesNotMatch(entry, /from '\.\/index\.js'/);
  assertTsBackedCompatShell('packages/redcube-overlay-registry/src/index.js', './index.ts');

  assert.match(types, /interface DefaultOverlayModuleSpec/);
  assert.match(types, /interface OverlayCatalogSurface/);
  assert.doesNotMatch(types, /\bany\b/);
});

test('P17 slice 4: overlay-xiaohongshu exposes a TypeScript entrypoint and typed overlay contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-xiaohongshu/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-xiaohongshu/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-xiaohongshu/tsconfig.json')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-xiaohongshu/src/gates.js')), false);

  const pkg = readJson('packages/redcube-overlay-xiaohongshu/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-overlay-xiaohongshu/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-overlay-xiaohongshu/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-overlay-xiaohongshu/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.base.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-overlay-xiaohongshu'),
    true,
  );

  assert.match(entry, /buildTopicRecord/);
  assert.match(entry, /buildXiaohongshuDeliverableRecord/);
  assert.match(entry, /hydrateXiaohongshuContract/);
  assert.match(entry, /evaluateStorylineGate/);
  assert.match(entry, /buildXiaohongshuSurfaceBundle/);
  assert.match(entry, /xiaohongshuOverlay/);

  assert.match(types, /interface XiaohongshuTopicRecord/);
  assert.match(types, /interface XiaohongshuDeliverableRecord/);
  assert.match(types, /interface XiaohongshuHydratedContract/);
  assert.match(types, /interface XiaohongshuStorylineGateReport/);
  assert.match(types, /interface XiaohongshuSurfaceArtifact/);
  assert.match(types, /interface XiaohongshuOverlayDefinition/);
  assert.doesNotMatch(types, /\bany\b/);
});

test('P17 slice 5: overlay-ppt exposes a TypeScript entrypoint and typed overlay contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-ppt/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-ppt/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-ppt/tsconfig.json')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-ppt/src/gates.js')), false);

  const pkg = readJson('packages/redcube-overlay-ppt/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-overlay-ppt/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-overlay-ppt/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-overlay-ppt/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.base.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-overlay-ppt'),
    true,
  );

  assert.match(entry, /buildDeckRecord/);
  assert.match(entry, /PPT_DECK_PROFILES/);
  assert.match(entry, /describePptDeckOverlay/);
  assert.match(entry, /hydratePptDeckContract/);
  assert.match(entry, /evaluateStoryboardGate/);
  assert.match(entry, /buildDeckSurfaceBundle/);
  assert.match(entry, /pptDeckOverlay/);

  assert.match(types, /interface PptDeckRecord/);
  assert.match(types, /interface PptDeckHydratedContract/);
  assert.match(types, /interface PptDeckStoryboardGateReport/);
  assert.match(types, /interface PptDeckSurfaceArtifact/);
  assert.match(types, /interface PptDeckOverlayDefinition/);
  assert.doesNotMatch(types, /\bany\b/);
});
