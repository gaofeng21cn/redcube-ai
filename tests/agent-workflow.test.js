import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  runWorkflow,
  publishProject,
  doctorProject,
  createProject,
  generateStoryline,
} from '../packages/redcube-agent/src/index.js';
import { saveWorkbenchModelConfig } from '../packages/redcube-agent/src/workbench-models.js';
import { rerunTaskFromStageDomain } from '../packages/redcube-domain/src/index.js';

function createProjectFixture(rootDir, name = 'demo-project') {
  const projectDir = path.join(rootDir, 'projects', name);
  const inputsDir = path.join(projectDir, 'inputs');
  const materialsDir = path.join(inputsDir, 'raw_materials');
  mkdirSync(materialsDir, { recursive: true });

  writeFileSync(
    path.join(inputsDir, 'series_toc.md'),
    '# 系列目录\n\n## 1. 胰岛素基础\n\n## 2. 饮食管理\n',
    'utf-8',
  );
  writeFileSync(path.join(inputsDir, 'style_guide.md'), '简洁、专业、可执行。', 'utf-8');
  writeFileSync(path.join(inputsDir, 'storyline_logic.md'), '从认知到行动。', 'utf-8');
  writeFileSync(path.join(materialsDir, 'source.md'), '糖尿病管理核心是监测、饮食和运动。', 'utf-8');

  return projectDir;
}

test('runWorkflow(full) creates plans, html, images and summary', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-'));
  createProjectFixture(root);

  const result = await runWorkflow(
    {
      project: 'demo-project',
      mode: 'full',
      autoFix: true,
    },
    { rootDir: root },
  );

  assert.equal(result.totalTasks, 2);
  assert.equal(result.successTasks, 2);
  assert.ok(existsSync(path.join(result.outputDir, 'run_summary.json')));

  const summary = JSON.parse(readFileSync(path.join(result.outputDir, 'run_summary.json'), 'utf-8'));
  assert.equal(summary.totalTasks, 2);

  const firstTaskFolder = result.taskResults[0].folder;
  assert.ok(existsSync(path.join(firstTaskFolder, '01_单篇策划.md')));
  assert.ok(existsSync(path.join(firstTaskFolder, '02_信息图大纲.md')));
  assert.ok(existsSync(path.join(firstTaskFolder, '02A_视觉导演稿.md')));
  assert.ok(existsSync(path.join(firstTaskFolder, '03_HTML生成说明.md')));
  assert.ok(existsSync(path.join(firstTaskFolder, '04_发布文案.md')));
  assert.ok(existsSync(path.join(firstTaskFolder, 'content_plan.md')));
  assert.ok(existsSync(path.join(firstTaskFolder, 'visual.html')));
  assert.ok(existsSync(path.join(firstTaskFolder, 'images', 'slide_01.png')));
  assert.match(readFileSync(path.join(firstTaskFolder, '01_单篇策划.md'), 'utf-8'), /备选标题|小红书标题/);
  assert.match(readFileSync(path.join(firstTaskFolder, '02A_视觉导演稿.md'), 'utf-8'), /视觉导演稿|视觉方向/);
  assert.match(readFileSync(path.join(firstTaskFolder, '04_发布文案.md'), 'utf-8'), /发布标题|正文主稿/);
});

test('publishProject exports publish bundle for generated tasks', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-'));
  createProjectFixture(root);

  await runWorkflow(
    {
      project: 'demo-project',
      mode: 'full',
      autoFix: true,
    },
    { rootDir: root },
  );

  const publishResult = await publishProject(
    {
      project: 'demo-project',
    },
    { rootDir: root },
  );

  assert.equal(publishResult.publishedTasks, 2);
  assert.ok(existsSync(path.join(publishResult.publishDir, '01_胰岛素基础', '小红书正文.txt')));
});

test('doctorProject returns readable errors when required inputs are missing', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-'));
  const projectDir = path.join(root, 'projects', 'broken-project');
  mkdirSync(path.join(projectDir, 'inputs', 'raw_materials'), { recursive: true });

  const report = await doctorProject(
    {
      project: 'broken-project',
    },
    { rootDir: root },
  );

  assert.equal(report.ok, false);
  assert.ok(report.errors.some((msg) => msg.includes('raw_materials 目录为空')));
});

test('createProject creates standard input skeleton', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-'));

  const created = await createProject(
    {
      project: 'new-project',
    },
    { rootDir: root },
  );

  assert.equal(created.ok, true);
  assert.ok(existsSync(path.join(root, 'projects', 'new-project', 'inputs', 'series_toc.md')));
  assert.ok(existsSync(path.join(root, 'projects', 'new-project', 'inputs', 'style_guide.md')));
  assert.ok(existsSync(path.join(root, 'projects', 'new-project', 'inputs', 'storyline_logic.md')));
  assert.ok(existsSync(path.join(root, 'projects', 'new-project', 'inputs', 'raw_materials', 'README.md')));
});

test('runWorkflow auto-generates series_toc when missing', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-'));
  const projectDir = path.join(root, 'projects', 'auto-toc-project');
  const inputsDir = path.join(projectDir, 'inputs');
  const materialsDir = path.join(inputsDir, 'raw_materials');
  mkdirSync(materialsDir, { recursive: true });
  writeFileSync(path.join(materialsDir, 'source.md'), '内分泌总论。\\n\\n# 垂体轴\\n# 甲状腺轴\\n# 肾上腺轴\\n', 'utf-8');

  const result = await runWorkflow(
    {
      project: 'auto-toc-project',
      mode: 'plan',
    },
    { rootDir: root },
  );

  assert.equal(result.ok, true);
  assert.ok(result.totalTasks >= 1);
  assert.ok(existsSync(path.join(inputsDir, 'series_toc.md')));
});

test('generateStoryline writes storyline_logic.md with selected prompt file', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-'));
  const projectDir = path.join(root, 'projects', 'storyline-project');
  const inputsDir = path.join(projectDir, 'inputs');
  const materialsDir = path.join(inputsDir, 'raw_materials');
  mkdirSync(materialsDir, { recursive: true });
  writeFileSync(path.join(materialsDir, 'source.md'), '这是面向医生的内分泌学概论素材。', 'utf-8');

  const result = await generateStoryline(
    {
      project: 'storyline-project',
      promptFile: 'medical_deep.md',
    },
    { rootDir: root },
  );

  assert.equal(result.ok, true);
  assert.equal(result.promptFile, 'medical_deep.md');
  assert.ok(existsSync(path.join(inputsDir, 'storyline_logic.md')));
  const storyline = readFileSync(path.join(inputsDir, 'storyline_logic.md'), 'utf-8');
  assert.ok(storyline.includes('叙事逻辑'));
});

test('runWorkflow stays on node mainline when workbench models are configured', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-'));
  createProjectFixture(root);

  saveWorkbenchModelConfig(root, {
    providers: [
      {
        id: 'provider-1',
        name: 'Provider 1',
        baseURL: 'https://example.com/v1',
        apiKey: 'sk-test',
      },
    ],
    models: [
      {
        id: 'glm-5',
        providerId: 'provider-1',
        label: 'GLM-5',
        modelName: 'glm-5',
      },
    ],
    defaultModelId: 'glm-5',
    stageOverrides: {
      planning: 'glm-5',
      html_generation: 'glm-5',
      html_fix: 'glm-5',
    },
  });

  const originalFetch = global.fetch;
  let fetchCalls = 0;
  global.fetch = async () => {
    fetchCalls += 1;
    return {
      ok: true,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  titleOptions: ['标题A'],
                  body: '正文A',
                  hashtags: ['标签A'],
                  outline: ['大纲A'],
                }),
              },
            },
          ],
        };
      },
    };
  };

  try {
    const result = await runWorkflow(
      {
        project: 'demo-project',
        mode: 'full',
        autoFix: true,
      },
      { rootDir: root, workspaceRoot: root },
    );

    assert.equal(result.ok, true);
    assert.ok(fetchCalls >= 1);
    const firstTaskFolder = result.taskResults[0].folder;
    const noteFile = path.join(firstTaskFolder, 'note.json');
    assert.ok(existsSync(noteFile));
    const note = JSON.parse(readFileSync(noteFile, 'utf-8'));
    assert.equal(note.body, '正文A');
  } finally {
    global.fetch = originalFetch;
  }
});

test('runWorkflow stage docs use identity defaults from runtime config', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-'));
  const configHome = path.join(root, 'config-home');
  createProjectFixture(root);

  mkdirSync(configHome, { recursive: true });
  writeFileSync(
    path.join(configHome, 'identity.json'),
    JSON.stringify({
      defaultProfileId: 'medical_private',
      routing: {
        medicalProfileId: 'medical_private',
        generalProfileId: 'general_private',
      },
      profiles: {
        medical_private: {
          signatureDisplay: '配置医学作者',
          signatureSubtitle: '配置医学品牌',
        },
        general_private: {
          signatureDisplay: '配置通用作者',
          signatureSubtitle: '配置通用品牌',
        },
      },
    }, null, 2),
    'utf-8',
  );

  const previousConfigHome = process.env.REDCUBE_CONFIG_HOME;
  process.env.REDCUBE_CONFIG_HOME = configHome;

  try {
    const result = await runWorkflow(
      {
        project: 'demo-project',
        mode: 'full',
        autoFix: true,
      },
      { rootDir: root },
    );

    const firstTaskFolder = result.taskResults[0].folder;
    const planningDoc = readFileSync(path.join(firstTaskFolder, '01_单篇策划.md'), 'utf-8');
    const publishDoc = readFileSync(path.join(firstTaskFolder, '04_发布文案.md'), 'utf-8');

    assert.match(planningDoc, /配置医学作者｜配置医学品牌/);
    assert.match(publishDoc, /配置医学作者｜配置医学品牌/);
  } finally {
    if (previousConfigHome === undefined) delete process.env.REDCUBE_CONFIG_HOME;
    else process.env.REDCUBE_CONFIG_HOME = previousConfigHome;
  }
});

test('rerunTaskFromStageDomain rebuilds note and html from edited content plan', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-pi-'));
  createProjectFixture(root);

  const initial = await runWorkflow(
    {
      project: 'demo-project',
      mode: 'full',
      autoFix: true,
    },
    { rootDir: root },
  );

  const taskFolder = path.basename(initial.taskResults[0].folder);
  const contentPlanFile = path.join(initial.taskResults[0].folder, 'content_plan.md');
  writeFileSync(
    contentPlanFile,
    [
      '# 内容规划',
      '',
      '**【小红书标题】**',
      '',
      '- 手改标题',
      '',
      '**【小红书正文】**',
      '',
      '这是手动修订后的正文。',
      '',
      '#手改标签 #医学科普',
      '',
      '**【信息图设计大纲】**',
      '',
      '1. 第一屏重点',
      '2. 第二屏重点',
    ].join('\n'),
    'utf-8',
  );

  const rerun = await rerunTaskFromStageDomain(
    {
      project: 'demo-project',
      taskFolder,
      fromStage: 'planning',
      autoFix: true,
    },
    { rootDir: root },
  );

  assert.equal(rerun.ok, true);
  const note = JSON.parse(readFileSync(path.join(initial.taskResults[0].folder, 'note.json'), 'utf-8'));
  assert.equal(note.body, '这是手动修订后的正文。');
  assert.deepEqual(note.outline, ['第一屏重点', '第二屏重点']);
  const visualHtml = readFileSync(path.join(initial.taskResults[0].folder, 'visual.html'), 'utf-8');
  assert.match(visualHtml, /手改标题/);
  assert.match(visualHtml, /这是手动修订后的正文。/);
});
