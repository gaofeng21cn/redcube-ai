import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';

import { runWorkflow } from '../packages/redcube-agent/src/index.js';

function createProjectFixture(rootDir, name = 'demo-project') {
  const projectDir = path.join(rootDir, 'projects', name);
  const inputsDir = path.join(projectDir, 'inputs');
  const materialsDir = path.join(inputsDir, 'raw_materials');
  mkdirSync(materialsDir, { recursive: true });
  writeFileSync(
    path.join(inputsDir, 'series_toc.md'),
    '# 系列目录\n\n## 1. 胰岛素基础\n',
    'utf-8',
  );
  writeFileSync(path.join(inputsDir, 'style_guide.md'), '简洁、专业、可执行。', 'utf-8');
  writeFileSync(path.join(inputsDir, 'storyline_logic.md'), '从认知到行动。', 'utf-8');
  writeFileSync(path.join(materialsDir, 'source.md'), '糖尿病管理核心是监测、饮食和运动。', 'utf-8');
}

test('runWorkflow no longer mirrors outputs into workbench truth directories', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-cutover-root-'));
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cutover-workspace-'));
  createProjectFixture(rootDir, 'topic-a');
  mkdirSync(path.join(workspaceRoot, 'input', 'topic-a'), { recursive: true });
  writeFileSync(
    path.join(workspaceRoot, 'input', 'topic-a', '00_启动任务.md'),
    '# 启动任务',
    'utf-8',
  );

  const result = await runWorkflow(
    { project: 'topic-a', mode: 'plan' },
    { rootDir, workspaceRoot },
  );

  assert.equal(result.ok, true);
  assert.equal(
    (result.warnings || []).some((item) => String(item).includes('workbench sync failed')),
    false,
  );
  assert.equal(
    existsSync(path.join(workspaceRoot, 'output', 'topic-a')),
    false,
  );
});
