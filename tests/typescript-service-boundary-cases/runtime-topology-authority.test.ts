// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(file, 'utf-8');
}

test('codex runtime topology is authored by runtime-protocol and not duplicated in substrate or overlay', () => {
  const protocolTopology = read('packages/redcube-runtime-protocol/src/runtime-topology.ts');
  const hermesSubstrate = read('packages/redcube-hermes-substrate/src/index.impl.ts');
  const overlayCore = read('packages/redcube-overlay-core/src/contracts.ts');

  assert.match(protocolTopology, /const CODEX_RUNTIME_TOPOLOGY = Object\.freeze/);
  assert.match(protocolTopology, /export function buildCodexRuntimeTopology/);

  assert.doesNotMatch(hermesSubstrate, /const CODEX_RUNTIME_TOPOLOGY = Object\.freeze/);
  assert.match(hermesSubstrate, /buildCodexRuntimeTopology as buildProtocolCodexRuntimeTopology/);
  assert.match(hermesSubstrate, /return buildProtocolCodexRuntimeTopology\(\)/);

  assert.match(overlayCore, /from '@redcube\/runtime-protocol'/);
  assert.doesNotMatch(overlayCore, /from '@redcube\/hermes-substrate'/);
});
