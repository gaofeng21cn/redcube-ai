// @ts-nocheck
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { BASELINE_ENTRIES, DEFAULT_LIMIT, countLines, evaluateLineBudget } from '../scripts/line-budget.ts';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('line budget list mode reports without blocking unresolved cleanup lanes', () => {
  const result = spawnSync('node', ['--experimental-strip-types', 'scripts/line-budget.ts', '--list'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.stderr, '');
});

test('line budget check fails closed for new oversize, baseline growth, and stale baselines', () => {
  const files = new Map(Object.entries({
    'src/grown.ts': makeLines(DEFAULT_LIMIT + 4),
    'src/new.ts': makeLines(DEFAULT_LIMIT + 1),
    'src/reviewed.ts': makeLines(DEFAULT_LIMIT + 2),
    'src/split.ts': makeLines(DEFAULT_LIMIT),
  }));

  const result = evaluateLineBudget({
    baselineEntries: {
      'src/deleted.ts': DEFAULT_LIMIT + 1,
      'src/grown.ts': DEFAULT_LIMIT + 2,
      'src/reviewed.ts': DEFAULT_LIMIT + 2,
      'src/split.ts': DEFAULT_LIMIT + 1,
    },
    exists: (relativePath) => files.has(relativePath),
    readFile: (relativePath) => files.get(relativePath),
    trackedFiles: [...files.keys()],
  });

  assert.deepEqual(result.oversize, [
    ['src/grown.ts', DEFAULT_LIMIT + 4],
    ['src/reviewed.ts', DEFAULT_LIMIT + 2],
    ['src/new.ts', DEFAULT_LIMIT + 1],
  ]);
  assert.equal(result.failures.length, 4);
  assert.match(result.failures.join('\n'), /src\/new\.ts: 1001 lines exceeds 1000 line budget/);
  assert.match(result.failures.join('\n'), /src\/grown\.ts: 1004 lines exceeds locked baseline 1002/);
  assert.match(result.failures.join('\n'), /src\/split\.ts: stale line-budget baseline entry; file is now 1000 lines within the 1000 line budget/);
  assert.match(result.failures.join('\n'), /src\/deleted\.ts: stale line-budget baseline entry; remove it after deleting or renaming the file/);
});

test('default baseline does not retain files already within the line budget', () => {
  for (const relativePath of Object.keys(BASELINE_ENTRIES)) {
    const absolutePath = path.join(repoRoot, relativePath);
    assert.ok(fs.existsSync(absolutePath), `${relativePath} baseline entry points to a missing file`);

    const lineCount = countLines(fs.readFileSync(absolutePath, 'utf8'));
    assert.ok(
      lineCount > DEFAULT_LIMIT,
      `${relativePath} is ${lineCount} lines and must be removed from the line-budget baseline`,
    );
  }
});

test('test:meta runs the line budget guard before meta tests', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

  assert.equal(packageJson.scripts['line-budget'], 'node --experimental-strip-types scripts/line-budget.ts');
  assert.equal(packageJson.scripts['test:meta'], 'npm run --silent build && node --experimental-strip-types scripts/run-test-group.ts meta');
});

test('verify runs the line budget guard before lane dispatch', () => {
  const verifyScript = fs.readFileSync(path.join(repoRoot, 'scripts/verify.sh'), 'utf8');

  assert.match(verifyScript, /node --experimental-strip-types scripts\/line-budget\.ts/);
  assert.ok(verifyScript.indexOf('node --experimental-strip-types scripts/line-budget.ts') < verifyScript.indexOf('case "$lane" in'));
});

test('OPL module healthcheck stays on product-entry smoke instead of proof-heavy fast lane', () => {
  const healthcheck = fs.readFileSync(path.join(repoRoot, 'scripts/opl-module-healthcheck.sh'), 'utf8');

  assert.match(healthcheck, /npm run test:line-budget/);
  assert.match(healthcheck, /npm run --silent build/);
  assert.match(healthcheck, /tests\/product-entry\.test\.ts/);
  assert.match(healthcheck, /tests\/product-entry-runtime-manager-registration\.test\.ts/);
  assert.match(healthcheck, /tests\/product-entry-session-checkpoint\.test\.ts/);
  assert.match(healthcheck, /tests\/product-entry-cases\/domain-memory-ref-adapter\.test\.ts/);
  assert.match(healthcheck, /tests\/product-entry-cases\/manifest-and-start-surfaces\.test\.ts/);
  assert.match(healthcheck, /tests\/product-entry-cases\/runtime-and-sidecar-surfaces\.test\.ts/);
  assert.match(healthcheck, /tests\/product-entry-cases\/sidecar-receipt-and-workspace-proof\.test\.ts/);
  assert.doesNotMatch(healthcheck, /test:fast|scripts\/verify\.sh fast|run-test-group\.ts fast/);
});

test('OPL module bootstrap uses reproducible npm install without mutating lockfile', () => {
  const bootstrap = fs.readFileSync(path.join(repoRoot, 'scripts/opl-module-bootstrap.sh'), 'utf8');

  assert.match(bootstrap, /npm ci/);
  assert.doesNotMatch(bootstrap, /npm install/);
});

test('RCA skill prefers repo-local launcher over PATH global CLI', () => {
  const skill = fs.readFileSync(path.join(repoRoot, 'plugins/rca/skills/rca/SKILL.md'), 'utf8');

  assert.match(skill, /npm run --prefix <redcube-ai-repo> redcube --/);
  assert.match(skill, /shell PATH lookup/);
  assert.match(skill, /用户 PATH 上的裸 `redcube`/);
});

function makeLines(lineCount) {
  return Array.from({ length: lineCount }, (_, index) => `line ${index + 1}`).join('\n') + '\n';
}
