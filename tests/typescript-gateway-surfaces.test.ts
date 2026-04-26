// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('gateway exposes a TypeScript entrypoint and typed product surface contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-gateway/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-gateway/src/types.ts')), true);

  const packageJson = JSON.parse(read('packages/redcube-gateway/package.json'));
  const types = read('packages/redcube-gateway/src/types.ts');
  const entry = read('packages/redcube-gateway/src/index.ts');

  assert.equal(packageJson.types, './dist/index.d.ts');
  assert.match(types, /export interface WorkspaceDoctorResponse/);
  assert.match(types, /export interface DeliverableCreateResponse/);
  assert.match(types, /export interface RouteRunResponse/);
  assert.match(entry, /export function createDeliverable/);
  assert.match(entry, /export function getDeliverable/);
  assert.match(entry, /export function runDeliverableRoute/);
});
