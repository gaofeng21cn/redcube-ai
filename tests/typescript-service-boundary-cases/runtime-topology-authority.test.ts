// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(file, 'utf-8');
}

test('codex runtime topology is authored by runtime-protocol and not duplicated in overlay or retired wrappers', () => {
  const protocolTopology = read('packages/redcube-runtime-protocol/src/runtime-topology.ts');
  const overlayCore = read('packages/redcube-overlay-core/src/contracts.ts');

  assert.match(protocolTopology, /const CODEX_RUNTIME_TOPOLOGY = Object\.freeze/);
  assert.match(protocolTopology, /export function buildCodexRuntimeTopology/);

  assert.equal(existsSync('packages/redcube-hermes-substrate'), false);

  assert.match(overlayCore, /from '@redcube\/runtime-protocol'/);
  assert.doesNotMatch(overlayCore, /from '@redcube\/hermes-substrate'/);
});
