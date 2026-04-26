// @ts-nocheck
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function assertWorkspaceGitBoundary(workspaceRoot) {
  assert.equal(existsSync(path.join(workspaceRoot, '.git')), true);
  assert.match(readFileSync(path.join(workspaceRoot, '.gitignore'), 'utf-8'), /^runtime\/$/m);
  assert.equal(
    execFileSync('git', ['-C', workspaceRoot, 'check-ignore', 'runtime/probe.json'], { encoding: 'utf-8' }).trim(),
    'runtime/probe.json',
  );
}
