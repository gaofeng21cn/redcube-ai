import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('gateway actions no longer hardcode overlay family packages directly', () => {
  const createDeliverable = read('packages/redcube-gateway/src/actions/create-deliverable.js');
  const auditDeliverable = read('packages/redcube-gateway/src/actions/audit-deliverable.js');

  assert.equal(createDeliverable.includes("@redcube/overlay-ppt"), false);
  assert.equal(createDeliverable.includes("@redcube/overlay-xiaohongshu"), false);
  assert.equal(auditDeliverable.includes("@redcube/overlay-ppt"), false);
  assert.equal(auditDeliverable.includes("@redcube/overlay-xiaohongshu"), false);
  assert.equal(createDeliverable.includes('@redcube/overlay-registry'), true);
  assert.equal(auditDeliverable.includes('@redcube/overlay-registry'), true);
});

test('overlay registry package exports default registry entrypoint', () => {
  const registryIndex = read('packages/redcube-overlay-registry/src/index.js');
  const registryPackage = JSON.parse(read('packages/redcube-overlay-registry/package.json'));

  assert.equal(registryIndex.includes('getDefaultOverlayRegistry'), true);
  assert.equal(registryPackage.name, '@redcube/overlay-registry');
});
