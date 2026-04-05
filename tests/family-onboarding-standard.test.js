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
  const gatewayPackage = JSON.parse(read('packages/redcube-gateway/package.json'));

  assert.equal(registryIndex.includes('getDefaultOverlayRegistry'), true);
  assert.equal(registryIndex.includes('getDefaultOverlayCatalog'), true);
  assert.equal(registryPackage.name, '@redcube/overlay-registry');
  assert.equal(Boolean(gatewayPackage.dependencies?.['@redcube/overlay-ppt']), false);
  assert.equal(Boolean(gatewayPackage.dependencies?.['@redcube/overlay-xiaohongshu']), false);
});

test('CLI onboarding usage no longer hardcodes current overlay ids in deliverable create help', () => {
  const cliSource = read('apps/redcube-cli/src/cli.js');

  assert.equal(cliSource.includes('<ppt_deck|xiaohongshu>'), false);
  assert.equal(cliSource.includes('profile --action list'), true);
});
