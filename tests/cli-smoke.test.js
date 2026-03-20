import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function createProjectFixture(rootDir, name = 'cli-project') {
  const projectDir = path.join(rootDir, 'projects', name);
  const inputsDir = path.join(projectDir, 'inputs');
  const materialsDir = path.join(inputsDir, 'raw_materials');
  mkdirSync(materialsDir, { recursive: true });

  writeFileSync(path.join(inputsDir, 'series_toc.md'), '# TOC\n\n## 1. 任务A\n', 'utf-8');
  writeFileSync(path.join(materialsDir, 'source.md'), '原始素材内容', 'utf-8');
}

test('CLI run command prints run summary JSON', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-cli-'));
  createProjectFixture(root);

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/src/cli.js'), 'run', '--project', 'cli-project', '--root-dir', root],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.projectName, 'cli-project');
  assert.equal(parsed.totalTasks, 1);
});

test('CLI run command uses runtime config when --root-dir is omitted', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-cli-'));
  createProjectFixture(root);

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/src/cli.js'), 'run', '--project', 'cli-project'],
    {
      encoding: 'utf-8',
      cwd: path.resolve('.'),
      env: {
        ...process.env,
        REDCUBE_ROOT_DIR: root,
      },
    },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.projectName, 'cli-project');
  assert.equal(parsed.totalTasks, 1);
});
