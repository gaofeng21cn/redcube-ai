import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';

test('CLI option parsing preserves unknown long-option values with node:util tokenization', () => {
  const parsed = parseArgs({
    args: ['--workspace-root', '/tmp/ws', '--json', '--unknown', 'value'],
    options: {
      'workspace-root': { type: 'string' },
      json: { type: 'boolean' },
      unknown: { type: 'string' },
    },
    strict: false,
    allowPositionals: true,
  });
  assert.equal(parsed.values['workspace-root'], '/tmp/ws');
  assert.equal(parsed.values.json, true);
  assert.equal(parsed.values.unknown, 'value');
});

test('default review watch wrapper remains retired to OPL status/workbench owner', () => {
  const dispatch = readFileSync('apps/redcube-cli/src/cli-parts/dispatch.ts', 'utf-8');
  assert.match(dispatch, /review/);
  assert.match(dispatch, /runtimeWatch default wrapper .*OPL status\/workbench\/read-model caller/s);
});
