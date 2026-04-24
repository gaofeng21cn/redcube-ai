import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('line budget script accepts current locked baseline', () => {
  const result = spawnSync('node', ['scripts/line-budget.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('test:meta runs the line budget guard before meta tests', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(packageJson.scripts['line-budget'], 'node scripts/line-budget.mjs');
  assert.equal(packageJson.scripts['test:meta'], 'node scripts/run-test-group.mjs meta');
});

test('verify runs the line budget guard before lane dispatch', () => {
  const verifyScript = fs.readFileSync(path.join(repoRoot, 'scripts/verify.sh'), 'utf8');

  assert.match(verifyScript, /node scripts\/line-budget\.mjs/);
  assert.ok(verifyScript.indexOf('node scripts/line-budget.mjs') < verifyScript.indexOf('case "$lane" in'));
});
