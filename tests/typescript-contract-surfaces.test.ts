// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

test('P15 slice 1: runtime-protocol exposes a TypeScript entrypoint and typed contract exports', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-protocol/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-protocol/src/types.ts')), true);

  const packageJson = JSON.parse(readFileSync(path.resolve('packages/redcube-runtime-protocol/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('packages/redcube-runtime-protocol/src/index.ts'), 'utf-8');

  assert.equal(packageJson.types, './dist/index.d.ts');
  assert.match(entry, /export type/);
  assert.match(entry, /WorkspaceContract/);
  assert.match(entry, /RunRecord/);
});
