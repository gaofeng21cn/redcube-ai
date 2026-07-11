import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('runtime consumes extracted governance and reference packages through manifest contracts', () => {
  const runtimePackageJson = readJson('packages/redcube-runtime/package.json');

  assert.equal(runtimePackageJson.dependencies?.['@redcube/governance'], '0.1.0');
  assert.equal(runtimePackageJson.dependencies?.['@redcube/reference-os'], undefined);
});
