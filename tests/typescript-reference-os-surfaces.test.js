import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

test('reference-os exposes a TypeScript contract entrypoint and types file', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-reference-os/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-reference-os/src/types.ts')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('packages/redcube-reference-os/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('packages/redcube-reference-os/src/index.ts'), 'utf-8');
  const runtimeEntry = readFileSync(path.resolve('packages/redcube-reference-os/src/index.js'), 'utf-8');

  assert.equal(pkg.types, './dist/index.d.ts');
  assert.equal(runtimeEntry.trim(), "export * from './index.ts';");
  assert.match(entry, /buildReferenceQualityReport/);
  assert.match(entry, /buildReferencePromotionReport/);
  assert.match(entry, /buildReferenceReplacementReport/);
  assert.match(entry, /ReferenceQualityReport/);
});
