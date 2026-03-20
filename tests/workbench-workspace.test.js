import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { listWorkbenchTopics } from '../packages/redcube-agent/src/workbench-workspace.js';

function write(file, content = '') {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf-8');
}

test('listWorkbenchTopics reads truth-source style topics, notes, and stage files', () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-'));

  write(path.join(rootDir, 'input', '主题A', 'AGENT_PRESET.md'), '# preset');
  write(path.join(rootDir, 'input', '主题A', 'templates', '00_任务说明.md'), '# template');
  write(path.join(rootDir, 'input', '主题A', 'source_material.md'), '# 材料');

  const topicDir = path.join(rootDir, 'output', '主题A');
  write(path.join(topicDir, '00_任务说明.md'), '# 任务说明');
  write(path.join(topicDir, '03_叙事风格与故事线.md'), '# 故事线');
  write(path.join(topicDir, '04_系列笔记目录.md'), '# 目录');

  const noteDir = path.join(topicDir, 'Note_01_第一篇');
  write(path.join(noteDir, '01_单篇策划.md'), '# 单篇策划');
  write(path.join(noteDir, '02A_视觉导演稿.md'), '# 视觉导演稿');
  write(path.join(noteDir, '03_HTML生成说明.md'), '# HTML 说明');
  write(path.join(noteDir, '04_发布文案.md'), '# 发布文案');
  write(path.join(noteDir, '05_视觉质控复核.md'), '# 视觉复核');
  write(path.join(noteDir, 'note_01_demo.html'), '<html></html>');
  write(path.join(noteDir, 'note_01_demo.txt'), '正文');

  const result = listWorkbenchTopics(rootDir);

  assert.equal(result.workspaceRoot, rootDir);
  assert.equal(result.topics.length, 1);
  assert.equal(result.topics[0].slug, '主题A');
  assert.equal(result.topics[0].notes.length, 1);
  assert.equal(result.topics[0].notes[0].slug, 'Note_01_第一篇');
  assert.equal(result.topics[0].notes[0].stageFiles.htmlGeneration.fileName, '03_HTML生成说明.md');
  assert.equal(result.topics[0].notes[0].artifacts.html.fileName, 'note_01_demo.html');
  assert.equal(result.topics[0].notes[0].artifacts.publishCopy.fileName, 'note_01_demo.txt');
  assert.equal(result.topics[0].inputFiles.some((file) => file.relativePath === 'source_material.md'), true);
  assert.equal(result.topics[0].inputFiles.some((file) => file.relativePath === 'templates/00_任务说明.md'), true);
  assert.equal(result.topics[0].inputFiles.find((file) => file.relativePath === 'source_material.md')?.category, 'reference_material');
  assert.equal(result.topics[0].inputFiles.find((file) => file.relativePath === 'AGENT_PRESET.md')?.category, 'persona_rule');
  assert.equal(result.topics[0].inputFiles.find((file) => file.relativePath === 'templates/00_任务说明.md')?.category, 'template');
});
