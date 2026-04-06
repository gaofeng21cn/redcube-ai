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
  const strategy = readFileSync(path.resolve('.omx/plans/spec-redcube-typescript-migration-strategy.md'), 'utf-8');
  assert.match(strategy, /新代码默认使用 TypeScript/);
  assert.match(strategy, /旧 JS 只在明确迁移窗口内短期共存/);
  assert.match(strategy, /NodeNext/);
  assert.match(strategy, /typecheck 成为正式质量门/);
});
