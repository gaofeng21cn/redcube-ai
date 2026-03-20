import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterTasks,
  generateTasksFromRawMaterials,
  parseTasksFromToc,
} from '../packages/redcube-tools/src/index.js';

test('parseTasksFromToc supports heading, numbered list and bullet list', () => {
  const toc = `# 系列目录

## 1. 第一讲：代谢入门

2. 第二讲：饮食结构

- 第三讲：运动建议\n`;

  const tasks = parseTasksFromToc(toc);
  assert.deepEqual(tasks, ['第一讲：代谢入门', '第二讲：饮食结构', '第三讲：运动建议']);
});

test('filterTasks supports index and keyword mixed filters', () => {
  const tasks = ['第一讲：代谢入门', '第二讲：饮食结构', '第三讲：运动建议'];
  assert.deepEqual(filterTasks(tasks, '2,运动'), ['第二讲：饮食结构', '第三讲：运动建议']);
});

test('generateTasksFromRawMaterials ignores preset and brief metadata noise', () => {
  const rawMaterials = `# 文件: 00_启动任务.md
# 测试新主题入口 启动任务
创建时间：2026-03-16T10:17:46.000Z
允许联网搜集资料：是

## 任务说明
请围绕 GLM 5 做一个系列选题。

# 文件: AGENT_PRESET.md
# AGENT_PRESET 默认配置（全局回退，人话版）

## 用途
你是一个严格的小红书生产助手。
`;

  const generated = generateTasksFromRawMaterials({
    projectName: '测试新主题入口',
    rawMaterials,
    noteMode: 'auto',
  });

  assert.equal(generated.mode, 'series');
  assert.deepEqual(generated.tasks, [
    '测试新主题入口问题定义与边界',
    '测试新主题入口核心机制',
    '测试新主题入口常见误区',
    '测试新主题入口实操方法',
    '测试新主题入口案例拆解',
    '测试新主题入口评估与复盘',
  ]);
});

test('generateTasksFromRawMaterials does not misclassify doctor audience topics as endocrine series', () => {
  const rawMaterials = `# 文件: 00_启动任务.md
# AI 工作流帮助医生做内容

## 任务说明
做一个关于 AI 工作流如何帮助医生做内容的系列

# 文件: source_material.md
这是一段测试原始材料，主题是工作流、内容生产与多模型协同。
`;

  const generated = generateTasksFromRawMaterials({
    projectName: '测试新主题入口',
    rawMaterials,
    noteMode: 'auto',
  });

  assert.deepEqual(generated.tasks, [
    '测试新主题入口问题定义与边界',
    '测试新主题入口核心机制',
    '测试新主题入口常见误区',
    '测试新主题入口实操方法',
    '测试新主题入口案例拆解',
    '测试新主题入口评估与复盘',
  ]);
});

test('generateTasksFromRawMaterials ignores research material headings when inferring toc', () => {
  const rawMaterials = `# 文件: research/research_report.md
# 自动研究报告

## 关键发现

## 来源覆盖

# 文件: source_material.md
这里是关于 AI 智能体企业知识库的正文素材。

## 1. 为什么企业知识库需要智能体

## 2. 权限控制与答案溯源

## 3. 检索评估怎么做

## 4. 知识治理如何闭环
`;

  const generated = generateTasksFromRawMaterials({
    projectName: '研究型主题',
    rawMaterials,
    noteMode: 'auto',
  });

  assert.deepEqual(generated.tasks, [
    '为什么企业知识库需要智能体',
    '权限控制与答案溯源',
    '检索评估怎么做',
    '知识治理如何闭环',
  ]);
});
