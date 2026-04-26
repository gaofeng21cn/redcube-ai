// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readImplementation(file) {
  const source = read(file);
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? read(path.join(path.dirname(file), shell[1])) : source;
}

test('runtime no longer exports local reference implementation directly', () => {
  const runtimeIndex = readImplementation('packages/redcube-runtime/src/index.ts');
  const runtimePackageJson = JSON.parse(read('packages/redcube-runtime/package.json'));

  assert.equal(runtimeIndex.includes("./reference-samples.js"), false);
  assert.equal(runtimeIndex.includes("./relative-quality.js"), false);
  assert.equal(runtimeIndex.includes("@redcube/reference-os"), true);
  assert.equal(runtimePackageJson.dependencies?.['@redcube/reference-os'], '0.1.0');
});

test('runtime no longer exports local governance implementation directly', () => {
  const runtimeIndex = readImplementation('packages/redcube-runtime/src/index.ts');
  const deliverableRoutes = read('packages/redcube-runtime/src/deliverable-routes.ts');
  const deliverableRouteLocal = read('packages/redcube-runtime/src/deliverable-route-local.ts');
  const runtimePackageJson = JSON.parse(read('packages/redcube-runtime/package.json'));

  assert.equal(runtimeIndex.includes("./review-state.js"), false);
  assert.equal(runtimeIndex.includes("./reviews.js"), false);
  assert.equal(runtimeIndex.includes("@redcube/governance"), true);
  assert.equal(deliverableRoutes.includes("./review-state.js"), false);
  assert.equal(deliverableRouteLocal.includes("@redcube/governance"), true);
  assert.equal(runtimePackageJson.dependencies?.['@redcube/governance'], '0.1.0');
});
