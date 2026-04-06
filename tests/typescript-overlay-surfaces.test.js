import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('P17 slice 3: overlay-core exposes a TypeScript entrypoint and typed registry contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-overlay-core/src/index.ts')), true);
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

  assert.match(types, /interface DefaultOverlayModuleSpec/);
  assert.match(types, /interface OverlayCatalogSurface/);
  assert.doesNotMatch(types, /\bany\b/);
});
