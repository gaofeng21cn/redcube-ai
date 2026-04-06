import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

test('P16 slice 1: runtime exposes a TypeScript service entrypoint and typed boundary exports', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/types.ts')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('packages/redcube-runtime/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('packages/redcube-runtime/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-runtime/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.match(entry, /runDeliverableRoute/);
  assert.match(entry, /resolveExecutorAdapter/);
  assert.match(entry, /startRun/);
  assert.match(types, /interface RuntimeRunRecord/);
  assert.match(types, /interface RuntimeRunRouteResponse/);
});
