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
