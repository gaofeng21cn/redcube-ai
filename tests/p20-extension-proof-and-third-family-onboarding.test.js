import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('P20.B: runtime executor resolves host-agent family runners through runtime-family-registry', () => {
  const executors = read('packages/redcube-runtime/src/executors.js');
  const runtimePackage = readJson('packages/redcube-runtime/package.json');

  assert.equal(executors.includes("@redcube/runtime-family-ppt"), false);
  assert.equal(executors.includes("@redcube/runtime-family-xiaohongshu"), false);
  assert.equal(executors.includes('canRunPptDeck('), false);
  assert.equal(executors.includes('canRunXiaohongshu('), false);
  assert.equal(executors.includes("@redcube/runtime-family-registry"), true);

  assert.equal(Boolean(runtimePackage.dependencies?.['@redcube/runtime-family-ppt']), false);
  assert.equal(Boolean(runtimePackage.dependencies?.['@redcube/runtime-family-xiaohongshu']), false);
  assert.equal(runtimePackage.dependencies?.['@redcube/runtime-family-registry'], '0.1.0');
});

test.todo('P20.C: overlay registry must expose poster_onepager as the third family candidate');
test.todo('P20.C: poster_onepager onboarding packages and prompt surface must exist as machine-readable truth');
