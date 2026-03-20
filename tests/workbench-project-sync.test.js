import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { syncWorkbenchTopicToProject } from '../packages/redcube-agent/src/workbench-project-sync.js';

function write(file, content = '') {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf-8');
}

test('syncWorkbenchTopicToProject excludes preset but keeps brief and source materials', () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-sync-root-'));
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-sync-workspace-'));
  const topic = '测试主题';

  write(path.join(workspaceRoot, 'input', topic, 'AGENT_PRESET.md'), '# 默认规则');
  write(path.join(workspaceRoot, 'input', topic, '00_启动任务.md'), '# 启动任务\n请生成系列内容。');
  write(path.join(workspaceRoot, 'input', topic, 'source_material.md'), '# GLM 5\n这里是真正的参考材料。');
  write(path.join(workspaceRoot, 'input', topic, 'style_guide.md'), '专业、冷静、克制。');

  const result = syncWorkbenchTopicToProject({
    workspaceRoot,
    rootDir,
    topic,
  });

  const rawMaterialsDir = result.rawMaterialsDir;
  assert.equal(existsSync(path.join(rawMaterialsDir, 'AGENT_PRESET.md')), false);
  assert.equal(existsSync(path.join(rawMaterialsDir, '00_启动任务.md')), true);
  assert.equal(existsSync(path.join(rawMaterialsDir, 'source_material.md')), true);
  assert.equal(readFileSync(path.join(rawMaterialsDir, '00_启动任务.md'), 'utf-8').includes('请生成系列内容'), true);
});
