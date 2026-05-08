// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const ACTIVE_ROOTS = [
  'README.md',
  'README.zh-CN.md',
  'apps',
  'packages',
  'contracts',
  'docs',
  'plugins',
  'tests',
  'tools',
  'python',
];
const TEXT_EXTENSIONS = new Set([
  '.json',
  '.md',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.py',
  '.sh',
  '.yaml',
  '.yml',
]);
const RETIRED_CONTRACTS = Object.freeze([
  'contracts/runtime-program/hermes-runtime-substrate-activation-package.json',
  'contracts/runtime-program/hermes-runtime-capability-extraction-map.json',
  'contracts/runtime-program/hermes-runtime-substrate-canonical-closure.json',
  'contracts/runtime-program/hermes-stable-family-closure-truth.json',
  'contracts/runtime-program/hermes-managed-family-closure-truth.json',
]);
const RETIRED_ACTIVE_PATTERNS = Object.freeze([
  /@redcube\/hermes-substrate/,
  /\bhost_agent\b/,
  /\bhermes_native_proof\b/,
  /\bredcube product frontdesk\b/,
  /\bproduct_frontdesk\b/,
  /\bfrontdesk\b/,
]);

function listTextFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    const normalized = file.split(path.sep).join('/');
    if (entry.isDirectory()) {
      if (entry.name === 'dist' || entry.name === 'build' || entry.name === 'node_modules') return [];
      if (normalized === 'docs/history' || normalized === 'docs/references') return [];
      return listTextFiles(file);
    }
    return entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name)) ? [file] : [];
  });
}

test('RCA active surfaces do not reintroduce retired runtime compatibility terms', () => {
  for (const contractFile of RETIRED_CONTRACTS) {
    assert.equal(existsSync(path.resolve(contractFile)), false, contractFile);
  }
  assert.equal(existsSync(path.resolve('packages/redcube-hermes-substrate')), false);

  const violations = [];
  for (const file of ACTIVE_ROOTS.flatMap((root) => {
    if (!existsSync(path.resolve(root))) return [];
    return path.extname(root) ? [root] : listTextFiles(root);
  })) {
    if (file === 'tests/rca-compat-retirement-guard.test.ts') continue;
    const text = readFileSync(file, 'utf-8');
    for (const pattern of RETIRED_ACTIVE_PATTERNS) {
      if (pattern.test(text)) {
        violations.push(`${file}: ${pattern}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
