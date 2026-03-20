import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { syncProjectOutputsToWorkbenchTopic } from '../packages/redcube-agent/src/workbench-truth-sync.js';

function write(file, content = '') {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf-8');
}

test('syncProjectOutputsToWorkbenchTopic materializes node mainline outputs into workbench truth-source layout', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-sync-'));
  const sourceProjectDir = path.join(tmp, 'projects', '主题A');
  const outputFolder = path.join(sourceProjectDir, 'outputs', '01_医生怎样整理材料');
  const workspaceRoot = path.join(tmp, 'workspace');

  write(path.join(sourceProjectDir, 'inputs', 'storyline_logic.md'), '# 叙事逻辑');
  write(path.join(sourceProjectDir, 'inputs', 'series_toc.md'), '# 系列目录');
  write(path.join(outputFolder, 'content_plan.md'), '# 内容规划');
  write(path.join(outputFolder, 'visual_quality_report.json'), '{"status":"completed","needFix":false}');
  write(path.join(outputFolder, 'visual.html'), '<html>visual</html>');
  write(path.join(outputFolder, 'images', 'slide_01.png'), 'fake');
  write(path.join(outputFolder, 'images', 'slide_02.png'), 'fake');

  const result = syncProjectOutputsToWorkbenchTopic({
    workspaceRoot,
    topic: '主题A',
    sourceProjectDir,
  });

  assert.equal(result.ok, true);
  assert.equal(existsSync(path.join(workspaceRoot, 'output', '主题A', '03_叙事风格与故事线.md')), true);
  assert.equal(existsSync(path.join(workspaceRoot, 'output', '主题A', '04_系列笔记目录.md')), true);
  assert.equal(existsSync(path.join(workspaceRoot, 'output', '主题A', 'Note_01_医生怎样整理材料', '01_单篇策划.md')), true);
  assert.equal(existsSync(path.join(workspaceRoot, 'output', '主题A', 'Note_01_医生怎样整理材料', '02_信息图大纲.md')), true);
  assert.equal(existsSync(path.join(workspaceRoot, 'output', '主题A', 'Note_01_医生怎样整理材料', '02A_视觉导演稿.md')), true);
  assert.equal(existsSync(path.join(workspaceRoot, 'output', '主题A', 'Note_01_医生怎样整理材料', '03_HTML生成说明.md')), true);
  assert.equal(existsSync(path.join(workspaceRoot, 'output', '主题A', 'Note_01_医生怎样整理材料', '05_视觉质控复核.md')), true);
  assert.equal(existsSync(path.join(workspaceRoot, 'output', '主题A', 'Note_01_医生怎样整理材料', 'visual.html')), true);
  assert.equal(existsSync(path.join(workspaceRoot, 'output', '主题A', 'Note_01_医生怎样整理材料', 'images', 'slide_01.png')), true);
  assert.equal(readFileSync(path.join(workspaceRoot, 'output', '主题A', 'Note_01_医生怎样整理材料', '01_单篇策划.md'), 'utf-8'), '# 内容规划');
});

test('syncProjectOutputsToWorkbenchTopic prefers real stage docs over derived fallback files', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-sync-'));
  const sourceProjectDir = path.join(tmp, 'projects', '主题B');
  const outputFolder = path.join(sourceProjectDir, 'outputs_pi', '01_正式稿');
  const workspaceRoot = path.join(tmp, 'workspace');

  write(path.join(sourceProjectDir, 'inputs', 'storyline_logic.md'), '# 正式故事线');
  write(path.join(sourceProjectDir, 'inputs', 'series_toc.md'), '# 正式目录');
  write(path.join(outputFolder, 'content_plan.md'), '# 旧派生稿');
  write(path.join(outputFolder, '01_单篇策划.md'), '# 正式单篇策划\n\n这是正式稿。');
  write(path.join(outputFolder, '02_信息图大纲.md'), '# 正式信息图大纲\n\n1. 第一屏');
  write(path.join(outputFolder, '02A_视觉导演稿.md'), '# 正式视觉导演稿\n\n不要退化成安全卡片。');
  write(path.join(outputFolder, '03_HTML生成说明.md'), '# 正式 HTML 生成说明');
  write(path.join(outputFolder, '04_发布文案.md'), '# 正式发布文案');
  write(path.join(outputFolder, 'visual_quality_report.json'), '{"status":"completed","needFix":false}');
  write(path.join(outputFolder, 'visual.html'), '<html>visual</html>');
  write(path.join(outputFolder, 'images', 'slide_01.png'), 'fake');

  const result = syncProjectOutputsToWorkbenchTopic({
    workspaceRoot,
    topic: '主题B',
    sourceProjectDir,
  });

  assert.equal(result.ok, true);
  assert.equal(
    readFileSync(path.join(workspaceRoot, 'output', '主题B', 'Note_01_正式稿', '01_单篇策划.md'), 'utf-8'),
    '# 正式单篇策划\n\n这是正式稿。',
  );
  assert.equal(
    readFileSync(path.join(workspaceRoot, 'output', '主题B', 'Note_01_正式稿', '02A_视觉导演稿.md'), 'utf-8'),
    '# 正式视觉导演稿\n\n不要退化成安全卡片。',
  );
  assert.equal(
    readFileSync(path.join(workspaceRoot, 'output', '主题B', 'Note_01_正式稿', '04_发布文案.md'), 'utf-8'),
    '# 正式发布文案',
  );
});
