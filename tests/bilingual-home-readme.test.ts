// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync } from 'node:fs';

const repoRoot = process.cwd();

test('public entry readmes keep bilingual mirror files tracked', () => {
  assert.equal(existsSync(path.join(repoRoot, 'README.md')), true);
  assert.equal(existsSync(path.join(repoRoot, 'README.zh-CN.md')), true);
  assert.equal(existsSync(path.join(repoRoot, 'docs', 'README.md')), true);
  assert.equal(existsSync(path.join(repoRoot, 'docs', 'README.zh-CN.md')), true);
});
