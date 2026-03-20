import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { handleApiRequest } from '../apps/redcube-web/src/api.js';

function write(file, content = '') {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf-8');
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function createWorkbenchFixture(rootDir) {
  write(path.join(rootDir, 'input', '主题A', 'AGENT_PRESET.md'), '# preset');
  write(path.join(rootDir, 'output', '主题A', '00_任务说明.md'), '# 任务说明');
  write(path.join(rootDir, 'output', '主题A', '03_叙事风格与故事线.md'), '# 故事线');
  write(path.join(rootDir, 'output', '主题A', 'Note_01_第一篇', '01_单篇策划.md'), '# 单篇策划');
  write(path.join(rootDir, 'output', '主题A', 'Note_01_第一篇', '02_信息图大纲.md'), '# 信息图');
  write(path.join(rootDir, 'output', '主题A', 'Note_01_第一篇', '02A_视觉导演稿.md'), '# 视觉');
  write(path.join(rootDir, 'output', '主题A', 'Note_01_第一篇', '03_HTML生成说明.md'), '# html');
  write(path.join(rootDir, 'output', '主题A', 'Note_01_第一篇', 'visual.html'), '<html></html>');

  write(path.join(rootDir, 'projects', '主题A', 'inputs', 'storyline_logic.md'), '# 叙事逻辑');
  write(path.join(rootDir, 'projects', '主题A', 'inputs', 'series_toc.md'), '# 系列目录\n\n## 1. 第一篇');
  write(
    path.join(rootDir, 'projects', '主题A', 'outputs_pi', '01_第一篇', 'content_plan.md'),
    [
      '# 内容规划',
      '',
      '**【小红书标题】**',
      '',
      '- 初始标题',
      '',
      '**【小红书正文】**',
      '',
      '初始正文',
      '',
      '#初始标签',
      '',
      '**【信息图设计大纲】**',
      '',
      '1. 初始大纲',
    ].join('\n'),
  );
  write(
    path.join(rootDir, 'projects', '主题A', 'outputs_pi', '01_第一篇', 'note.json'),
    JSON.stringify({
      titleOptions: ['初始标题'],
      body: '初始正文',
      hashtags: ['初始标签'],
      outline: ['初始大纲'],
    }, null, 2),
  );
  write(path.join(rootDir, 'projects', '主题A', 'outputs_pi', '01_第一篇', 'visual.html'), '<html><main>初始正文</main></html>');
  write(path.join(rootDir, 'projects', '主题A', 'outputs_pi', '01_第一篇', 'images', 'slide_01.png'), 'fake');
}

test('GetWorkbenchOverview returns topics with note workflow data', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));
  createWorkbenchFixture(rootDir);

  const result = await handleApiRequest({
    method: 'GET',
    pathname: '/api/GetWorkbenchOverview',
    query: { workspaceRoot: rootDir },
    body: {},
    defaultRootDir: rootDir,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.topics.length, 1);
  assert.equal(result.payload.topics[0].notes[0].workflow.stages.length > 0, true);
});

test('SaveModelConfig persists and GetModelConfig reads it back', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));

  const saveResult = await handleApiRequest({
    method: 'POST',
    pathname: '/api/SaveModelConfig',
    query: {},
    body: {
      workspaceRoot: rootDir,
      providers: [{ id: 'p1', name: 'Provider', baseURL: 'https://example.com/v1', apiKey: 'sk-123' }],
      models: [{ id: 'gpt-5.4', providerId: 'p1', label: 'GPT 5.4', modelName: 'gpt-5.4' }],
      defaultModelId: 'gpt-5.4',
      stageOverrides: { storyline: 'gpt-5.4' },
    },
    defaultRootDir: rootDir,
  });

  assert.equal(saveResult.status, 200);
  assert.equal(saveResult.payload.ok, true);

  const getResult = await handleApiRequest({
    method: 'GET',
    pathname: '/api/GetModelConfig',
    query: { workspaceRoot: rootDir },
    body: {},
    defaultRootDir: rootDir,
  });

  assert.equal(getResult.status, 200);
  assert.equal(getResult.payload.defaultModelId, 'gpt-5.4');
  assert.equal(getResult.payload.providers[0].baseURL, 'https://example.com/v1');
});

test('GetModelSelectionConfig hides provider secrets and SaveWorkflowModelSelection only updates routing fields', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));

  await handleApiRequest({
    method: 'POST',
    pathname: '/api/SaveModelConfig',
    query: {},
    body: {
      workspaceRoot: rootDir,
      providers: [{ id: 'p1', name: 'Provider', baseURL: 'https://example.com/v1', apiKey: 'sk-secret' }],
      models: [
        { id: 'gpt-5.4', providerId: 'p1', label: 'GPT 5.4', modelName: 'gpt-5.4' },
        { id: 'gemini-3.1-pro', providerId: 'p1', label: 'Gemini 3.1 Pro', modelName: 'gemini-3.1-pro' },
      ],
      defaultModelId: 'gpt-5.4',
      stageOverrides: { storyline: 'gpt-5.4' },
    },
    defaultRootDir: rootDir,
  });

  const selectionResult = await handleApiRequest({
    method: 'GET',
    pathname: '/api/GetModelSelectionConfig',
    query: { workspaceRoot: rootDir },
    body: {},
    defaultRootDir: rootDir,
  });

  assert.equal(selectionResult.status, 200);
  assert.equal(selectionResult.payload.ok, true);
  assert.equal(Array.isArray(selectionResult.payload.providers), false);
  assert.equal(selectionResult.payload.models.length, 2);

  await handleApiRequest({
    method: 'POST',
    pathname: '/api/SaveWorkflowModelSelection',
    query: {},
    body: {
      workspaceRoot: rootDir,
      defaultModelId: 'gemini-3.1-pro',
      stageOverrides: { html_generation: 'gpt-5.4' },
    },
    defaultRootDir: rootDir,
  });

  const after = await handleApiRequest({
    method: 'GET',
    pathname: '/api/GetModelConfig',
    query: { workspaceRoot: rootDir },
    body: {},
    defaultRootDir: rootDir,
  });

  assert.equal(after.payload.providers[0].apiKey, 'sk-secret');
  assert.equal(after.payload.defaultModelId, 'gemini-3.1-pro');
  assert.equal(after.payload.stageOverrides.html_generation, 'gpt-5.4');
});

test('RunWorkflowSmoke executes a one-round smoke workflow and stores result in ledger', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));

  await handleApiRequest({
    method: 'POST',
    pathname: '/api/SaveModelConfig',
    query: {},
    body: {
      workspaceRoot: rootDir,
      providers: [{ id: 'p1', name: 'Provider', baseURL: 'https://example.com/v1', apiKey: 'sk-secret' }],
      models: [{ id: 'glm-5', providerId: 'p1', label: 'GLM 5', modelName: 'glm-5' }],
      defaultModelId: 'glm-5',
      stageOverrides: {},
    },
    defaultRootDir: rootDir,
  });

  const result = await handleApiRequest({
    method: 'POST',
    pathname: '/api/RunWorkflowSmoke',
    query: {},
    body: {
      workspaceRoot: rootDir,
    },
    defaultRootDir: rootDir,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.defaultModelId, 'glm-5');
  assert.equal(result.payload.workflow.totalTasks, 1);
  assert.equal(result.payload.workflow.successTasks, 1);

  const ledger = JSON.parse(readFileSync(path.join(rootDir, '.redcube_pi', 'workbench', 'run-ledger.json'), 'utf-8'));
  assert.equal(Object.keys(ledger.runs).length, 1);
});

test('CreateWorkbenchTopic creates input skeleton from chat-style task brief', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));
  mkdirSync(path.join(rootDir, 'system', '自动小红书', 'defaults', 'templates'), { recursive: true });
  write(path.join(rootDir, 'system', '自动小红书', 'defaults', 'AGENT_PRESET.default.md'), '# 默认预设');
  write(path.join(rootDir, 'system', '自动小红书', 'defaults', 'templates', '00_任务说明.md'), '# 模板');

  const result = await handleApiRequest({
    method: 'POST',
    pathname: '/api/CreateWorkbenchTopic',
    query: {},
    body: {
      workspaceRoot: rootDir,
      topic: '新主题A',
      brief: '做一个关于 AI 工作流的小红书系列',
      rawMaterialsText: '这里是参考材料',
      webResearchEnabled: true,
    },
    defaultRootDir: rootDir,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.topic, '新主题A');
  assert.equal(result.payload.webResearchEnabled, true);
  assert.equal(result.payload.filesCreated.length > 0, true);
  assert.equal(result.payload.inputDir.endsWith(path.join('input', '新主题A')), true);
  assert.equal(result.payload.briefFile.includes('00_启动任务.md'), true);
  assert.equal(result.payload.materialFile.includes('source_material.md'), true);
});

test('SaveWorkbenchInstruction stores instruction in ledger with scope and target', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));

  const result = await handleApiRequest({
    method: 'POST',
    pathname: '/api/SaveWorkbenchInstruction',
    query: {},
    body: {
      workspaceRoot: rootDir,
      scope: 'page',
      target: '截图 08',
      noteSlug: 'Note_01_示例',
      instruction: '第 8 页标题缩小 12%，保留版式',
    },
    defaultRootDir: rootDir,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.entry.scope, 'page');
  assert.equal(result.payload.entry.target, '截图 08');
  assert.equal(result.payload.entry.instruction.includes('缩小 12%'), true);

  const ledger = JSON.parse(readFileSync(path.join(rootDir, '.redcube_pi', 'workbench', 'run-ledger.json'), 'utf-8'));
  assert.equal(Array.isArray(ledger.instructions), true);
  assert.equal(ledger.instructions.length, 1);
});

test('DeleteWorkbenchTopic removes truth-source input and output folders for the topic', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));
  createWorkbenchFixture(rootDir);

  const result = await handleApiRequest({
    method: 'POST',
    pathname: '/api/DeleteWorkbenchTopic',
    query: {},
    body: {
      workspaceRoot: rootDir,
      topic: '主题A',
    },
    defaultRootDir: rootDir,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.deleted.topic, '主题A');
  assert.equal(result.payload.deleted.inputDir.endsWith(path.join('input', '主题A')), true);
  assert.equal(result.payload.deleted.outputDir.endsWith(path.join('output', '主题A')), true);

  const after = await handleApiRequest({
    method: 'GET',
    pathname: '/api/GetWorkbenchOverview',
    query: { workspaceRoot: rootDir },
    body: {},
    defaultRootDir: rootDir,
  });

  assert.equal(after.payload.topics.some((topic) => topic.slug === '主题A'), false);
});

test('RunWorkbenchTopicWorkflow syncs topic inputs, runs workflow, and materializes output back into workbench topic', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));
  const workspaceRoot = path.join(rootDir, 'workspace');
  write(path.join(workspaceRoot, 'input', '主题A', '00_启动任务.md'), '# 启动任务');
  write(path.join(workspaceRoot, 'input', '主题A', 'source_material.md'), '医生整理讲课材料时，资料来源多、结构不统一。');
  write(path.join(workspaceRoot, 'input', '主题A', 'style_guide.md'), '专业、利落、适合知识型小红书。');

  const result = await handleApiRequest({
    method: 'POST',
    pathname: '/api/RunWorkbenchTopicWorkflow',
    query: {},
    body: {
      workspaceRoot,
      topic: '主题A',
    },
    defaultRootDir: rootDir,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.workflow.totalTasks >= 1, true);

  const overview = await handleApiRequest({
    method: 'GET',
    pathname: '/api/GetWorkbenchOverview',
    query: { workspaceRoot },
    body: {},
    defaultRootDir: rootDir,
  });

  const topic = overview.payload.topics.find((item) => item.slug === '主题A');
  assert.equal(Boolean(topic), true);
  assert.equal(topic.notes.length >= 1, true);
  assert.equal(Boolean(topic.notes[0].artifacts.html?.path), true);
  assert.equal(Array.isArray(topic.notes[0].artifacts.slides), true);
  assert.equal(topic.notes[0].artifacts.slides.length >= 1, true);
});

test('Workbench APIs use configured rootDir and workspaceRoot when request omits both', async () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));
  const configuredRootDir = path.join(repoRoot, 'external-root');
  const configuredWorkspaceRoot = path.join(repoRoot, 'external-workspace');
  writeJson(path.join(repoRoot, 'config', 'local', 'runtime.json'), {
    rootDir: configuredRootDir,
    workspaceRoot: configuredWorkspaceRoot,
  });

  const created = await handleApiRequest({
    method: 'POST',
    pathname: '/api/CreateWorkbenchTopic',
    query: {},
    body: {
      topic: '配置主题A',
      brief: '做一个关于配置系统的小红书主题',
      rawMaterialsText: '这里是配置系统的原始材料。',
      webResearchEnabled: false,
    },
    defaultRootDir: repoRoot,
  });

  assert.equal(created.status, 200);
  assert.equal(created.payload.ok, true);
  assert.equal(created.payload.inputDir.startsWith(path.join(configuredWorkspaceRoot, 'input')), true);

  const result = await handleApiRequest({
    method: 'POST',
    pathname: '/api/RunWorkbenchTopicWorkflow',
    query: {},
    body: {
      topic: '配置主题A',
    },
    defaultRootDir: repoRoot,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(existsSync(path.join(configuredRootDir, 'projects', '配置主题A')), true);
  assert.equal(existsSync(path.join(repoRoot, 'projects', '配置主题A')), false);
});

test('RunWorkbenchTopicWorkflow auto researches when topic allows web research and materials are insufficient', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));
  const workspaceRoot = path.join(rootDir, 'workspace');
  write(
    path.join(workspaceRoot, 'input', '主题研究', '00_启动任务.md'),
    [
      '# 主题研究 启动任务',
      '',
      '- 允许联网搜集资料：是',
      '',
      '## 任务说明',
      '请联网研究 AI 智能体在企业知识库中的最新实践，并补充形成完整材料。',
    ].join('\n'),
  );
  write(path.join(workspaceRoot, 'input', '主题研究', 'source_material.md'), 'AI 智能体。');

  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    const href = String(url);
    if (href.startsWith('https://www.bing.com/search?format=rss')) {
      return {
        ok: true,
        text: async () => [
          '<?xml version="1.0" encoding="utf-8" ?>',
          '<rss version="2.0">',
          '<channel>',
          '<item><title>企业知识库中的 AI 智能体实践</title><link>https://example.com/agent-kb</link><description>案例一</description></item>',
          '<item><title>RAG 与企业知识助手落地</title><link>https://example.com/rag-kb</link><description>案例二</description></item>',
          '</channel>',
          '</rss>',
        ].join(''),
      };
    }
    if (href === 'https://r.jina.ai/http://https://example.com/agent-kb') {
      return {
        ok: true,
        text: async () => [
          '# 企业知识库中的 AI 智能体实践',
          '',
          '核心结论：多轮检索、权限控制、反馈闭环是落地重点。',
          '补充事实：企业内部知识源通常分散在文档库、工单系统、会议纪要和 FAQ 中，智能体如果不能处理权限继承与版本漂移，回答很快就会失真。',
          '补充事实：成熟方案会把检索、工具调用、人工升级、用户反馈与审计日志串成闭环，才能真正进入生产环境。',
        ].join('\n'),
      };
    }
    if (href === 'https://r.jina.ai/http://https://example.com/rag-kb') {
      return {
        ok: true,
        text: async () => [
          '# RAG 与企业知识助手落地',
          '',
          '关键事实：资料治理、召回评估、答案溯源决定最终可用性。',
          '补充事实：很多团队先做问答 Demo，但真正上线前必须补足 chunk 策略、召回评测集、权限过滤、答案引用和失败兜底。',
          '补充事实：如果没有来源引用与效果评估，企业知识助手很难获得业务团队长期信任。',
        ].join('\n'),
      };
    }
    throw new Error(`unexpected fetch: ${href}`);
  };

  try {
    const result = await handleApiRequest({
      method: 'POST',
      pathname: '/api/RunWorkbenchTopicWorkflow',
      query: {},
      body: {
        workspaceRoot,
        topic: '主题研究',
      },
      defaultRootDir: rootDir,
    });

    assert.equal(result.status, 200);
    assert.equal(result.payload.ok, true);
    assert.equal(result.payload.research?.ok, true);
    assert.equal(result.payload.research?.triggered, true);

    const researchDir = path.join(workspaceRoot, 'input', '主题研究', 'research');
    assert.equal(existsSync(path.join(researchDir, 'research_brief.md')), true);
    assert.equal(existsSync(path.join(researchDir, 'research_report.md')), true);
    assert.equal(existsSync(path.join(researchDir, 'sources.json')), true);

    const report = readFileSync(path.join(researchDir, 'research_report.md'), 'utf-8');
    assert.equal(report.includes('企业知识库中的 AI 智能体实践'), true);
    assert.equal(report.includes('多轮检索、权限控制、反馈闭环'), true);

    const rawResearch = path.join(rootDir, 'projects', '主题研究', 'inputs', 'raw_materials', 'research', 'research_report.md');
    assert.equal(existsSync(rawResearch), true);
    assert.equal(readFileSync(rawResearch, 'utf-8').includes('答案溯源'), true);
  } finally {
    global.fetch = originalFetch;
  }
});

test('StartWorkbenchTopicWorkflow returns run id immediately and stores running state in ledger', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));
  const workspaceRoot = path.join(rootDir, 'workspace');
  write(path.join(workspaceRoot, 'input', '主题B', '00_启动任务.md'), '# 启动任务');
  write(path.join(workspaceRoot, 'input', '主题B', 'source_material.md'), '这是测试素材。');

  const result = await handleApiRequest({
    method: 'POST',
    pathname: '/api/StartWorkbenchTopicWorkflow',
    query: {},
    body: {
      workspaceRoot,
      topic: '主题B',
    },
    defaultRootDir: rootDir,
  });

  assert.equal(result.status, 200);
  assert.equal(result.payload.ok, true);
  assert.equal(result.payload.started, true);
  assert.equal(Boolean(result.payload.runId), true);

  const ledger = JSON.parse(readFileSync(path.join(workspaceRoot, '.redcube_pi', 'workbench', 'run-ledger.json'), 'utf-8'));
  assert.equal(Boolean(ledger.runs[result.payload.runId]), true);
  assert.equal(['running', 'completed', 'failed'].includes(ledger.runs[result.payload.runId].status), true);
});

test('RunWorkbenchInstruction rewrites source task files and automatically reruns current note', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));
  createWorkbenchFixture(rootDir);
  const filePath = path.join(rootDir, 'output', '主题A', 'Note_01_第一篇', '01_单篇策划.md');

  await handleApiRequest({
    method: 'POST',
    pathname: '/api/SaveModelConfig',
    query: {},
    body: {
      workspaceRoot: rootDir,
      providers: [{ id: 'p1', name: 'Provider', baseURL: 'https://example.com/v1', apiKey: 'sk-123' }],
      models: [{ id: 'glm-5', providerId: 'p1', label: 'GLM 5', modelName: 'glm-5' }],
      defaultModelId: 'glm-5',
      stageOverrides: { planning: 'glm-5' },
    },
    defaultRootDir: rootDir,
  });

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: [
              '# 内容规划',
              '',
              '**【小红书标题】**',
              '',
              '- 改写后的标题',
              '',
              '**【小红书正文】**',
              '',
              '这是自动重跑前写回主线的正文。',
              '',
              '#改写标签 #知识科普',
              '',
              '**【信息图设计大纲】**',
              '',
              '1. 改写后大纲',
              '2. 第二屏重点',
            ].join('\n'),
          },
        },
      ],
    }),
  });

  try {
    const result = await handleApiRequest({
      method: 'POST',
      pathname: '/api/RunWorkbenchInstruction',
      query: {},
      body: {
        workspaceRoot: rootDir,
        topic: '主题A',
        scope: 'stage',
        target: '当前阶段：单篇策划',
        noteSlug: 'Note_01_第一篇',
        stageId: 'planning',
        filePath,
        instruction: '把标题改短，保留原有结构',
      },
      defaultRootDir: rootDir,
    });

    assert.equal(result.status, 200);
    assert.equal(result.payload.ok, true);
    assert.equal(result.payload.entry.scope, 'stage');
    assert.equal(result.payload.run.status, 'completed');
    assert.equal(result.payload.run.summary?.rerun?.ok, true);

    const sourceNote = JSON.parse(readFileSync(path.join(rootDir, 'projects', '主题A', 'outputs_pi', '01_第一篇', 'note.json'), 'utf-8'));
    assert.equal(sourceNote.body, '这是自动重跑前写回主线的正文。');
    assert.equal(sourceNote.outline[0], '改写后大纲');

    assert.equal(readFileSync(filePath, 'utf-8').includes('改写后的标题'), true);
    assert.equal(
      readFileSync(path.join(rootDir, 'projects', '主题A', 'outputs_pi', '01_第一篇', 'visual.html'), 'utf-8').includes('这是自动重跑前写回主线的正文。'),
      true,
    );

    const ledger = JSON.parse(readFileSync(path.join(rootDir, '.redcube_pi', 'workbench', 'run-ledger.json'), 'utf-8'));
    assert.equal(ledger.instructions.length, 1);
    assert.equal(Object.keys(ledger.runs).length, 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test('RunWorkbenchInstruction reruns html stage when editing current page/image preview', async () => {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-api-'));
  createWorkbenchFixture(rootDir);
  const htmlFile = path.join(rootDir, 'output', '主题A', 'Note_01_第一篇', 'visual.html');

  await handleApiRequest({
    method: 'POST',
    pathname: '/api/SaveModelConfig',
    query: {},
    body: {
      workspaceRoot: rootDir,
      providers: [{ id: 'p1', name: 'Provider', baseURL: 'https://example.com/v1', apiKey: 'sk-123' }],
      models: [{ id: 'glm-5', providerId: 'p1', label: 'GLM 5', modelName: 'glm-5' }],
      defaultModelId: 'glm-5',
      stageOverrides: { html_generation: 'glm-5' },
    },
    defaultRootDir: rootDir,
  });

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: '<html><main><section class="card"><h2>第1页</h2><p>这是按当前页改写后的 HTML。</p></section></main></html>',
          },
        },
      ],
    }),
  });

  try {
    const result = await handleApiRequest({
      method: 'POST',
      pathname: '/api/RunWorkbenchInstruction',
      query: {},
      body: {
        workspaceRoot: rootDir,
        topic: '主题A',
        scope: 'page',
        target: '当前页面：截图 01',
        noteSlug: 'Note_01_第一篇',
        stageId: 'html_generation',
        filePath: htmlFile,
        instruction: '只改第 1 页主文案，保留结构',
        pageNumber: 1,
        previewKind: 'image',
      },
      defaultRootDir: rootDir,
    });

    assert.equal(result.status, 200);
    assert.equal(result.payload.ok, true);
    assert.equal(result.payload.run.summary?.rerun?.ok, true);
    assert.equal(
      readFileSync(path.join(rootDir, 'projects', '主题A', 'outputs_pi', '01_第一篇', 'visual.html'), 'utf-8').includes('这是按当前页改写后的 HTML。'),
      true,
    );
    assert.equal(readFileSync(htmlFile, 'utf-8').includes('这是按当前页改写后的 HTML。'), true);
  } finally {
    global.fetch = originalFetch;
  }
});
