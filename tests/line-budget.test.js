import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { BASELINE_ENTRIES, DEFAULT_LIMIT, evaluateLineBudget, isStrictLineBudgetMode, lineBudgetExitCode } from '../scripts/line-budget.ts';
import { buildVerifyLanePlan } from '../scripts/test-registry.ts';
import { readJson } from './helpers/json-io.ts';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('line budget list mode reports without blocking unresolved cleanup lanes', () => {
  const result = spawnSync('node', ['--experimental-strip-types', 'scripts/line-budget.ts', '--list'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.stderr, '');
});

test('line budget check reports new oversize, baseline growth, and stale baselines', () => {
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

test('line budget exits advisory by default and strict only when explicit', () => {
  assert.equal(isStrictLineBudgetMode({ argv: ['node', 'scripts/line-budget.ts'], env: {} }), false);
  assert.equal(isStrictLineBudgetMode({ argv: ['node', 'scripts/line-budget.ts', '--strict'], env: {} }), true);
  assert.equal(isStrictLineBudgetMode({ argv: ['node', 'scripts/line-budget.ts'], env: { OPL_LINE_BUDGET_STRICT: '1' } }), true);

  assert.equal(lineBudgetExitCode({ failures: ['src/new.ts: oversize'], strict: false }), 0);
  assert.equal(lineBudgetExitCode({ failures: ['src/new.ts: oversize'], strict: true }), 1);
  assert.equal(lineBudgetExitCode({ failures: [], strict: true }), 0);
});

test('default baseline entries are explicit numeric ratchets when present', () => {
  for (const relativePath of Object.keys(BASELINE_ENTRIES)) {
    const absolutePath = path.join(repoRoot, relativePath);
    assert.ok(fs.existsSync(absolutePath), `${relativePath} baseline entry points to a missing file`);

    assert.equal(typeof BASELINE_ENTRIES[relativePath], 'number');
    assert.ok(BASELINE_ENTRIES[relativePath] > DEFAULT_LIMIT);
  }
});

test('package scripts expose advisory default and explicit strict line budget entries', () => {
  const packageJson = readJson(path.join(repoRoot, 'package.json'));

  assert.equal(packageJson.scripts['line-budget'], 'node scripts/line-budget.ts');
  assert.equal(packageJson.scripts['line-budget:strict'], 'node scripts/line-budget.ts --strict');
  assert.equal(packageJson.scripts['test:line-budget'], undefined);
  assert.equal(packageJson.scripts['test:line-budget:strict'], undefined);
  assert.equal(packageJson.scripts['test:meta'], undefined);
  assert.equal(buildVerifyLanePlan('meta').lane, 'meta');
});

test('retired check-line-budget script does not remain as a second gate implementation', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, 'scripts/check-line-budget.ts')), false);
});

test('verify runs exactly one line budget gate before lane dispatch and keeps explicit strict lanes', () => {
  const verifyScript = fs.readFileSync(path.join(repoRoot, 'scripts/verify.sh'), 'utf8');
  const verifyLane = fs.readFileSync(path.join(repoRoot, 'scripts/verify-lane.ts'), 'utf8');

  assert.match(verifyScript, /scripts\/verify-lane\.ts "\$lane" --verify-wrapper "\$@"/);
  assert.equal((verifyLane.match(/runLineBudget\(/g) || []).length, 3);
  assert.match(verifyLane, /runLineBudget\(lane === 'line-budget-strict' \|\| lane === 'structure-strict'\)/);
  assert.match(verifyLane, /run\('scripts\/repo-hygiene\.sh', \['--fix'\]\)/);
  assert.match(verifyLane, /run\('scripts\/repo-hygiene\.sh'\)/);
  assert.ok(
    verifyLane.indexOf('runLineBudget(lane ===') < verifyLane.indexOf("run('scripts/repo-hygiene.sh', ['--fix'])"),
  );
  assert.match(verifyLane, /lane === 'line-budget' \|\| lane === 'line-budget-strict'/);
  assert.match(verifyLane, /OPL_LINE_BUDGET_STRICT: '1'/);
  assert.doesNotMatch(verifyScript, /test:line-budget/);
});

test('OPL module healthcheck stays on product-entry smoke instead of proof-heavy fast lane', () => {
  const healthcheck = fs.readFileSync(path.join(repoRoot, 'scripts/opl-module-healthcheck.sh'), 'utf8');

  assert.match(healthcheck, /npm run --silent line-budget/);
  assert.match(healthcheck, /npm run --silent build/);
  assert.match(healthcheck, /tests\/product-entry\.test\.js/);
  assert.match(healthcheck, /tests\/product-entry-runtime-manager-registration\.test\.js/);
  assert.match(healthcheck, /tests\/product-entry-session-checkpoint\.test\.js/);
  assert.doesNotMatch(healthcheck, /test:fast|scripts\/verify\.sh fast|run-test-group\.ts fast/);
});

test('OPL module bootstrap uses reproducible npm install without mutating lockfile', () => {
  const bootstrap = fs.readFileSync(path.join(repoRoot, 'scripts/opl-module-bootstrap.sh'), 'utf8');

  assert.match(bootstrap, /npm ci/);
  assert.doesNotMatch(bootstrap, /npm install/);
});

test('RedCube AI skill prefers repo-local launcher over PATH global CLI', () => {
  const skill = fs.readFileSync(path.join(repoRoot, 'plugins/redcube-ai/skills/redcube-ai/SKILL.md'), 'utf8');

  assert.match(skill, /npm run --prefix <redcube-ai-repo> redcube --/);
  assert.match(skill, /用户 PATH 上的裸 `redcube`/);
});

function makeLines(lineCount) {
  return Array.from({ length: lineCount }, (_, index) => `line ${index + 1}`).join('\n') + '\n';
}
