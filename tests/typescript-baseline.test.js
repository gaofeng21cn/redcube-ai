import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('typescript baseline defines root tsconfig with NodeNext/ESM policy', () => {
  assert.equal(existsSync(path.resolve('tsconfig.base.json')), true);
  assert.equal(existsSync(path.resolve('tsconfig.json')), true);

  const base = readJson('tsconfig.base.json');
  assert.equal(base.compilerOptions.module, 'NodeNext');
  assert.equal(base.compilerOptions.moduleResolution, 'NodeNext');
  assert.equal(base.compilerOptions.resolveJsonModule, true);
  assert.equal(base.compilerOptions.verbatimModuleSyntax, true);
});

test('root package exposes formal typecheck entrypoint', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts.test, 'node scripts/run-test-group.mjs fast');
  assert.equal(pkg.scripts['test:fast'], 'node scripts/run-test-group.mjs fast');
  assert.equal(pkg.scripts['test:meta'], 'node scripts/run-test-group.mjs meta');
  assert.equal(pkg.scripts['test:integration'], 'node scripts/run-test-group.mjs integration');
  assert.equal(pkg.scripts['test:e2e'], 'node scripts/run-test-group.mjs e2e');
  assert.equal(pkg.scripts['test:full'], 'node scripts/run-test-group.mjs full');
  assert.equal(pkg.scripts.typecheck, 'tsc --noEmit --project tsconfig.tests.json --pretty false');
});

test('workspace packages and apps participate in package-level tsconfig layering', () => {
  const paths = [
    'apps/redcube-cli/tsconfig.json',
    'apps/redcube-mcp/tsconfig.json',
    'packages/redcube-gateway/tsconfig.json',
    'packages/redcube-governance/tsconfig.json',
    'packages/redcube-reference-os/tsconfig.json',
    'packages/redcube-runtime-protocol/tsconfig.json',
    'packages/redcube-runtime/tsconfig.json',
    'packages/redcube-pack-runtime/tsconfig.json',
  ];

  for (const file of paths) {
    assert.equal(existsSync(path.resolve(file)), true, file);
    const config = readJson(file);
    assert.equal(config.extends, '../../tsconfig.base.json');
  }
});

test('typescript migration policy freezes new code defaults and JS compatibility shell rules', () => {
  const strategy = readFileSync(path.resolve('docs/policies/typescript_migration_policy.md'), 'utf-8');
  assert.match(strategy, /新代码默认使用 TypeScript/);
  assert.match(strategy, /旧 JS 只在明确迁移窗口内短期共存/);
  assert.match(strategy, /NodeNext/);
  assert.match(strategy, /typecheck 成为正式质量门/);
});

test('root AGENTS points to the current verification entrypoints without pinning legacy command-surface freeze wording', () => {
  const agents = readFileSync(path.resolve('AGENTS.md'), 'utf-8');
  assert.match(agents, /默认最小验证入口是 `scripts\/verify\.sh`/);
  assert.match(agents, /默认 smoke 是 `npm test` \/ `npm run test:fast`/);
  assert.match(agents, /`npm run test:meta`、`npm run test:integration`、`npm run test:e2e` 是显式 lane/);
  assert.match(agents, /`npm run test:full` 是 clean-clone 基线/);
  assert.match(
    agents,
    /修改 formal-entry、execution handle、runtime mainline、program brief 路径、测试命令或 CI 分层时，必须同步改 README、docs、contracts 与相关测试/,
  );
});
