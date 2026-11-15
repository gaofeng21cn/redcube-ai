import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { resolveRedCubePythonCommand } from '../scripts/run-test-group-lib.ts';

test('image exporter verifies actual PPTX/PDF, original layers, notes and stale-review boundaries', () => {
  const python = resolveRedCubePythonCommand();
  const run = spawnSync(python.command, [...python.args, 'tests/image_deck_export_cases.py'], {
    encoding: 'utf8', env: { ...process.env, PYTHONPATH: path.resolve('python'), PYTHONDONTWRITEBYTECODE: '1' },
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
