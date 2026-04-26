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
  assert.equal(existsSync(path.resolve('tsconfig.typecheck.json')), true);

  const base = readJson('tsconfig.base.json');
  assert.equal(base.compilerOptions.module, 'NodeNext');
  assert.equal(base.compilerOptions.moduleResolution, 'NodeNext');
  assert.equal(base.compilerOptions.resolveJsonModule, true);
  assert.equal(base.compilerOptions.verbatimModuleSyntax, true);

  const typecheck = readJson('tsconfig.typecheck.json');
  assert.equal(typecheck.extends, './tsconfig.base.json');
  assert.equal(typecheck.compilerOptions.composite, true);
  assert.equal(typecheck.include.includes('packages/**/*.ts'), true);
  assert.equal(typecheck.include.includes('packages/**/*.js'), true);
  assert.equal(typecheck.include.includes('packages/**/*.mjs'), true);
  assert.equal(typecheck.include.includes('apps/**/*.ts'), true);
  assert.equal(typecheck.include.includes('tests/**/*.js'), true);
  assert.equal(typecheck.include.includes('tests/**/*.mjs'), true);
  assert.equal(typecheck.include.includes('scripts/**/*.mjs'), true);
});

test('root package exposes formal typecheck entrypoint', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts.test, 'node scripts/run-test-group.mjs fast');
  assert.equal(pkg.scripts['test:fast'], 'node scripts/run-test-group.mjs fast');
  assert.equal(pkg.scripts['test:meta'], 'node scripts/run-test-group.mjs meta');
  assert.equal(pkg.scripts['test:integration'], 'node scripts/run-test-group.mjs integration');
  assert.equal(pkg.scripts['test:e2e'], 'node scripts/run-test-group.mjs e2e');
  assert.equal(pkg.scripts['test:historical'], 'node scripts/run-test-group.mjs historical');
  assert.equal(pkg.scripts['test:full'], 'node scripts/run-test-group.mjs full');
  assert.equal(pkg.scripts.typecheck, 'tsc --noEmit --project tsconfig.typecheck.json --pretty false');
  assert.equal(pkg.scripts.build, 'tsc --build tsconfig.json --pretty false');
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
  ];

  for (const file of paths) {
    assert.equal(existsSync(path.resolve(file)), true, file);
    const config = readJson(file);
    assert.equal(config.extends, '../../tsconfig.base.json');
  }
});

test('typescript migration policy reference stays tracked', () => {
  assert.equal(existsSync(path.resolve('docs/policies/typescript_migration_policy.md')), true);
});

test('root AGENTS stays tracked', () => {
  assert.equal(existsSync(path.resolve('AGENTS.md')), true);
});
