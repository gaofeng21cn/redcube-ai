import path from 'node:path';
import os from 'node:os';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';

import { loadRuntimeConfig } from '../../redcube-config/src/index.js';
import { listRunStates, loadRunState, createRunId, saveRunState } from '../../redcube-memory/src/index.js';
import {
  evaluateWorkflowDomain,
  listTaskArtifacts,
  publishWorkflowDomain,
  rerunTaskFromStageDomain,
  runWorkflowDomain,
} from '../../redcube-domain/src/index.js';
import {
  buildSeriesTocMarkdown,
  createProjectStructure,
  generateTasksFromRawMaterials,
  getProjectPaths,
  loadRawMaterials,
  listProjects as listProjectsFromTools,
  validateProjectInputs,
  writeText,
} from '../../redcube-tools/src/index.js';
import { generateStorylineLogic, listStorylinePromptFiles } from '../../redcube-llm/src/index.js';
import { listWorkbenchTopics } from './workbench-workspace.js';
import { deriveNoteWorkflow } from './workbench-workflow.js';
import { syncWorkbenchTopicToProject } from './workbench-project-sync.js';
import { runWorkbenchResearch } from './workbench-research.js';
import { syncProjectOutputsToWorkbenchTopic } from './workbench-truth-sync.js';
import {
  loadWorkbenchModelConfig as loadModelConfigStore,
  loadStageLlmConfig,
  saveWorkbenchModelConfig as saveModelConfigStore,
} from './workbench-models.js';

const WORKBENCH_OPENAI_TIMEOUT_MS = 45_000;
const WORKBENCH_OPENAI_MAX_RETRIES = 2;
const TOPIC_WORKFLOW_STEPS = [
  { id: 'sync_inputs', title: '同步输入材料' },
  { id: 'research', title: '自动联网研究' },
  { id: 'storyline', title: '生成故事线' },
  { id: 'workflow', title: '生成笔记产物' },
  { id: 'truth_sync', title: '回写真相源' },
];

function resolveRuntimeConfig(context = {}, config = {}) {
  return loadRuntimeConfig({
    cwd: context?.repoRoot,
    env: process.env,
    explicit: {
      rootDir: config.rootDir || context.rootDir || '',
      workspaceRoot: config.workspaceRoot || context.workspaceRoot || '',
      promptsDir: config.promptsDir || context.promptsDir || '',
    },
  });
}

function resolveRootDir(context = {}, config = {}) {
  return resolveRuntimeConfig(context, config).rootDir;
}

function resolveWorkspaceRoot(context = {}, config = {}) {
  return resolveRuntimeConfig(context, config).workspaceRoot;
}

function getWorkbenchStateDir(workspaceRoot) {
  const dir = path.join(workspaceRoot, '.redcube_pi', 'workbench');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function getWorkbenchRunLedgerFile(workspaceRoot) {
  return path.join(getWorkbenchStateDir(workspaceRoot), 'run-ledger.json');
}

export function loadWorkbenchRunLedger(workspaceRoot) {
  const file = getWorkbenchRunLedgerFile(workspaceRoot);
  if (!existsSync(file)) {
    return {
      workspaceRoot,
      runs: {},
      instructions: [],
      updatedAt: null,
    };
  }

  const raw = JSON.parse(readFileSync(file, 'utf-8'));
  return {
    workspaceRoot,
    runs: raw.runs && typeof raw.runs === 'object' ? raw.runs : {},
    instructions: Array.isArray(raw.instructions) ? raw.instructions : [],
    updatedAt: raw.updatedAt || null,
  };
}

export function saveWorkbenchRunLedger(workspaceRoot, input) {
  const file = getWorkbenchRunLedgerFile(workspaceRoot);
  const current = loadWorkbenchRunLedger(workspaceRoot);
  const nextValue = {
    workspaceRoot,
    runs: input?.runs && typeof input.runs === 'object' ? input.runs : current.runs,
    instructions: Array.isArray(input?.instructions) ? input.instructions : current.instructions,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(file, JSON.stringify(nextValue, null, 2), 'utf-8');
  return nextValue;
}

function appendWorkbenchRun(workspaceRoot, run) {
  const current = loadWorkbenchRunLedger(workspaceRoot);
  const runs = {
    ...current.runs,
    [run.runId]: run,
  };
  return saveWorkbenchRunLedger(workspaceRoot, { runs, instructions: current.instructions });
}

function updateWorkbenchRun(workspaceRoot, runId, updater) {
  const current = loadWorkbenchRunLedger(workspaceRoot);
  const existing = current.runs[runId] || {};
  const nextRun = updater(existing);
  const runs = {
    ...current.runs,
    [runId]: nextRun,
  };
  return saveWorkbenchRunLedger(workspaceRoot, { runs, instructions: current.instructions });
}

function appendWorkbenchInstruction(workspaceRoot, entry) {
  const current = loadWorkbenchRunLedger(workspaceRoot);
  const instructions = [entry, ...current.instructions].slice(0, 50);
  return saveWorkbenchRunLedger(workspaceRoot, { runs: current.runs, instructions });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function maybeThinkingConfig(modelName) {
  const model = String(modelName || '').toLowerCase();
  if (model === 'glm-5' || model.startsWith('glm-5-')) {
    return { type: 'disabled' };
  }
  return undefined;
}

async function fetchOpenAICompatible(url, options) {
  let lastResponse = null;
  let lastError = null;

  for (let attempt = 0; attempt <= WORKBENCH_OPENAI_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(WORKBENCH_OPENAI_TIMEOUT_MS),
      });

      if (response.ok) {
        return response;
      }

      lastResponse = response;
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === WORKBENCH_OPENAI_MAX_RETRIES) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === WORKBENCH_OPENAI_MAX_RETRIES) {
        throw error;
      }
    }

    await sleep(300 * (attempt + 1));
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error('OpenAI-compatible 请求失败');
}

function stripCodeFences(text) {
  const raw = String(text || '').trim();
  if (!raw.startsWith('```')) return raw;
  return raw.replace(/^```(?:[a-z0-9_-]+)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function buildWorkbenchInstructionEntry(config = {}) {
  return {
    id: `instruction-${Date.now()}`,
    createdAt: new Date().toISOString(),
    topic: String(config.topic || '').trim() || '',
    scope: String(config.scope || '').trim() || 'note',
    target: String(config.target || '').trim() || '',
    noteSlug: String(config.noteSlug || '').trim() || '',
    instruction: String(config.instruction || '').trim(),
  };
}

function resolveWorkbenchFilePath(workspaceRoot, requested, options = {}) {
  const filePath = String(requested || '').trim();
  const resolved = path.resolve(filePath);
  const workspaceResolved = path.resolve(workspaceRoot);

  if (!filePath) {
    throw new Error('filePath 不能为空');
  }
  if (!resolved.startsWith(workspaceResolved)) {
    throw new Error('禁止访问工作区之外的文件');
  }
  if (!options.allowMissing && !existsSync(resolved)) {
    throw new Error(`文件不存在: ${resolved}`);
  }

  return resolved;
}

function resolveWorkbenchDirPath(workspaceRoot, requested) {
  const dirPath = String(requested || '').trim();
  const resolved = path.resolve(dirPath);
  const workspaceResolved = path.resolve(workspaceRoot);

  if (!dirPath) {
    throw new Error('dirPath 不能为空');
  }
  if (!resolved.startsWith(workspaceResolved)) {
    throw new Error('禁止访问工作区之外的目录');
  }
  return resolved;
}

function noteSlugToTaskFolder(noteSlug = '') {
  const match = String(noteSlug || '').trim().match(/^Note_(\d{2})_(.+)$/);
  if (!match) return '';
  return `${match[1]}_${match[2]}`;
}

function resolveWorkbenchInstructionSourceTarget({ rootDir, topic, noteSlug, stageId }) {
  const taskFolder = noteSlugToTaskFolder(noteSlug);
  if (!taskFolder) {
    throw new Error(`无法从 noteSlug 推断任务目录: ${noteSlug}`);
  }

  const taskDir = path.join(getProjectPaths(rootDir, topic).outputsDir, taskFolder);
  const rerunFromStage = ['planning', 'infographic_outline', 'visual_direction'].includes(stageId)
    ? 'planning'
    : 'html_generation';

  return {
    taskFolder,
    taskDir,
    rerunFromStage,
    sourceFilePath: rerunFromStage === 'planning'
      ? path.join(taskDir, 'content_plan.md')
      : path.join(taskDir, 'visual.html'),
  };
}

function guessWorkbenchFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.md' || ext === '.markdown') return 'markdown';
  return 'text';
}

function getWorkbenchBackupRoot(workspaceRoot) {
  const dir = path.join(getWorkbenchStateDir(workspaceRoot), 'backups');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function createWorkbenchBackup(workspaceRoot, filePath) {
  const relativePath = path.relative(path.resolve(workspaceRoot), filePath);
  const backupDir = path.join(
    getWorkbenchBackupRoot(workspaceRoot),
    new Date().toISOString().replaceAll(':', '-'),
  );
  const backupPath = path.join(backupDir, relativePath);
  mkdirSync(path.dirname(backupPath), { recursive: true });
  copyFileSync(filePath, backupPath);
  return backupPath;
}

function inferStorylinePromptFile(topic, workspaceRoot) {
  const medicalCue = /医|临床|医学|内分泌|医生/.test(String(topic || ''));
  if (medicalCue) return 'medical_deep.md';

  const inputDir = path.join(workspaceRoot, 'input', String(topic || ''));
  if (existsSync(inputDir)) {
    const files = readdirSync(inputDir).join(' ');
    if (/医|临床|医学|内分泌|医生/.test(files)) return 'medical_deep.md';
  }

  return 'general_standard.md';
}

function createTopicWorkflowSummary(steps, currentStepId = '', error = '') {
  const completed = steps.filter((step) => step.status === 'done').length;
  const active = steps.find((step) => step.status === 'running') || steps.find((step) => step.id === currentStepId) || null;
  return {
    steps,
    currentStep: active ? { id: active.id, title: active.title } : null,
    completedSteps: completed,
    totalSteps: steps.length,
    error,
  };
}

function setTopicWorkflowStep(steps, stepId, status) {
  return steps.map((step) => step.id === stepId ? { ...step, status } : step);
}

function buildInitialTopicWorkflowSteps() {
  return TOPIC_WORKFLOW_STEPS.map((step, index) => ({
    ...step,
    status: index === 0 ? 'running' : 'pending',
  }));
}

async function rewriteWorkbenchFileWithLlm({
  workspaceRoot,
  stageId,
  filePath,
  fileContent,
  instructionEntry,
  pageNumber,
}) {
  const llmConfig = loadStageLlmConfig(workspaceRoot, stageId || 'planning');
  if (!llmConfig?.apiKey || !llmConfig?.baseUrl || !llmConfig?.model) {
    throw new Error(`阶段 ${stageId || 'planning'} 没有可执行的模型配置`);
  }

  const fileType = guessWorkbenchFileType(filePath);
  const systemPrompt = [
    '你是 RedCube Workbench 的返工执行器。',
    '你的任务是根据修改指令，直接改写给定文件的完整内容。',
    '必须保留原文件的语言、结构和格式习惯。',
    '未被要求修改的部分尽量保持不变。',
    '只输出修改后的完整文件内容，不要解释，不要总结，不要使用 Markdown 代码围栏。',
  ].join('\n');

  const userPrompt = [
    `文件类型：${fileType}`,
    `作用范围：${instructionEntry.scope}`,
    `目标：${instructionEntry.target || '当前对象'}`,
    `阶段：${stageId || '未指定'}`,
    pageNumber ? `重点页面：第 ${pageNumber} 页` : '',
    '',
    '修改指令：',
    instructionEntry.instruction,
    '',
    '请直接返回修改后的完整文件内容。',
    '',
    '原文件内容：',
    fileContent,
  ].filter(Boolean).join('\n');

  const response = await fetchOpenAICompatible(`${llmConfig.baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${llmConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: llmConfig.model,
      temperature: 0.2,
      max_tokens: 8192,
      ...(maybeThinkingConfig(llmConfig.model) ? { thinking: maybeThinkingConfig(llmConfig.model) } : {}),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`返工执行失败: ${response.status} ${errorText.slice(0, 300)}`);
  }

  const payload = await response.json();
  const rewritten = stripCodeFences(payload?.choices?.[0]?.message?.content || '');
  if (!rewritten) {
    throw new Error('返工执行失败：模型返回为空');
  }
  return rewritten;
}

function decorateWorkbenchTopic(topic, ledger) {
  return {
    ...topic,
    notes: topic.notes.map((note) => ({
      ...note,
      workflow: deriveNoteWorkflow(note, ledger?.runs?.[note.slug] || {}),
    })),
  };
}

export async function getWorkbenchOverview(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const overview = listWorkbenchTopics(workspaceRoot);
  const ledger = loadWorkbenchRunLedger(workspaceRoot);

  return {
    ok: overview.ok,
    workspaceRoot,
    ledger,
    topics: overview.topics.map((topic) => decorateWorkbenchTopic(topic, ledger)),
  };
}

export async function getRuntimeConfig(config = {}, context = {}) {
  const runtime = resolveRuntimeConfig(context, config);
  return {
    ok: true,
    ...runtime,
  };
}

export async function getWorkbenchTopic(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const overview = await getWorkbenchOverview({ workspaceRoot }, context);
  const topicSlug = String(config.topic || '').trim();
  const topic = overview.topics.find((item) => item.slug === topicSlug);

  if (!topic) {
    return {
      ok: false,
      workspaceRoot,
      error: `未找到主题: ${topicSlug}`,
    };
  }

  return {
    ok: true,
    workspaceRoot,
    topic,
  };
}

export async function getWorkbenchModelConfig(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  return {
    ok: true,
    workspaceRoot,
    ...loadModelConfigStore(workspaceRoot),
  };
}

export async function saveWorkbenchModelConfig(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const saved = saveModelConfigStore(workspaceRoot, {
    providers: config.providers,
    models: config.models,
    defaultModelId: config.defaultModelId,
    stageOverrides: config.stageOverrides,
  });

  return {
    ok: true,
    workspaceRoot,
    ...saved,
  };
}

export async function getWorkbenchModelSelection(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const loaded = loadModelConfigStore(workspaceRoot);

  return {
    ok: true,
    workspaceRoot,
    models: loaded.models,
    defaultModelId: loaded.defaultModelId,
    stageOverrides: loaded.stageOverrides,
    updatedAt: loaded.updatedAt,
  };
}

export async function saveWorkbenchModelSelection(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const current = loadModelConfigStore(workspaceRoot);
  const saved = saveModelConfigStore(workspaceRoot, {
    ...current,
    defaultModelId: config.defaultModelId || '',
    stageOverrides: config.stageOverrides || {},
  });

  return {
    ok: true,
    workspaceRoot,
    models: saved.models,
    defaultModelId: saved.defaultModelId,
    stageOverrides: saved.stageOverrides,
    updatedAt: saved.updatedAt,
  };
}

export async function getWorkbenchFile(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const requested = String(config.filePath || '').trim();

  if (!requested) {
    return { ok: false, workspaceRoot, error: 'filePath 不能为空' };
  }

  let resolved = '';
  try {
    resolved = resolveWorkbenchFilePath(workspaceRoot, requested);
  } catch (error) {
    return { ok: false, workspaceRoot, error: error instanceof Error ? error.message : String(error) };
  }

  const ext = path.extname(resolved).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
    const mime = ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
          ? 'image/gif'
          : 'image/jpeg';
    const base64 = readFileSync(resolved).toString('base64');

    return {
      ok: true,
      workspaceRoot,
      kind: 'image',
      filePath: resolved,
      mimeType: mime,
      content: `data:${mime};base64,${base64}`,
    };
  }

  return {
    ok: true,
    workspaceRoot,
    kind: 'text',
    filePath: resolved,
    content: readFileSync(resolved, 'utf-8'),
  };
}

export async function saveWorkbenchFile(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const content = String(config.content ?? '');

  try {
    const filePath = resolveWorkbenchFilePath(workspaceRoot, config.filePath, { allowMissing: true });
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, 'utf-8');
    return {
      ok: true,
      workspaceRoot,
      filePath,
      contentLength: content.length,
    };
  } catch (error) {
    return {
      ok: false,
      workspaceRoot,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function uploadWorkbenchFile(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const fileName = String(config.fileName || '').trim();
  const base64Content = String(config.base64Content || '').trim();

  if (!fileName) {
    return { ok: false, workspaceRoot, error: 'fileName 不能为空' };
  }
  if (!base64Content) {
    return { ok: false, workspaceRoot, error: 'base64Content 不能为空' };
  }
  if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
    return { ok: false, workspaceRoot, error: `非法文件名: ${fileName}` };
  }

  try {
    const dirPath = resolveWorkbenchDirPath(workspaceRoot, config.dirPath);
    mkdirSync(dirPath, { recursive: true });
    const filePath = path.join(dirPath, fileName);
    writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
    return {
      ok: true,
      workspaceRoot,
      filePath,
      fileName,
      dirPath,
    };
  } catch (error) {
    return {
      ok: false,
      workspaceRoot,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runWorkbenchSmokeWorkflow(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const smokeRootDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-workbench-smoke-'));
  const project = `smoke-${Date.now()}`;
  const runId = createRunId();
  const modelSelection = await getWorkbenchModelSelection({}, { workspaceRoot });

  await createProject({ project }, { rootDir: smokeRootDir });

  const inputsDir = path.join(smokeRootDir, 'projects', project, 'inputs');
  const rawDir = path.join(inputsDir, 'raw_materials');
  writeFileSync(path.join(inputsDir, 'series_toc.md'), '# 系列目录\n\n## 1. AI工作流为什么适合做小红书\n', 'utf-8');
  writeFileSync(path.join(inputsDir, 'style_guide.md'), '直接、专业、适合知识型小红书。', 'utf-8');
  writeFileSync(path.join(rawDir, 'source.md'), [
    '# AI工作流为什么适合做小红书',
    '',
    '核心观点：',
    '1. 小红书图文天然是多阶段生产流程',
    '2. 中间稿、视觉稿、HTML、PNG、发布文案都能留痕',
    '3. 可追踪和可返工让智能体工作流更稳定',
  ].join('\n'), 'utf-8');

  const startedAt = new Date().toISOString();

  const storyline = await generateStoryline(
    {
      project,
      promptFile: 'general_standard.md',
      workspaceRoot,
    },
    { rootDir: smokeRootDir, workspaceRoot },
  );

  const workflow = await runWorkflow(
    {
      project,
      mode: 'full',
      autoFix: true,
      useStrictWorkflow: false,
      workspaceRoot,
    },
    { rootDir: smokeRootDir, workspaceRoot },
  );

  const finishedAt = new Date().toISOString();
  appendWorkbenchRun(workspaceRoot, {
    runId,
    kind: 'smoke',
    status: workflow.ok ? 'completed' : 'failed',
    startedAt,
    finishedAt,
    defaultModelId: modelSelection.defaultModelId,
    project,
    smokeRootDir,
    summary: {
      storylineOk: storyline.ok,
      workflowOk: workflow.ok,
      totalTasks: workflow.totalTasks,
      successTasks: workflow.successTasks,
    },
  });

  return {
    ok: workflow.ok,
    runId,
    workspaceRoot,
    smokeRootDir,
    project,
    defaultModelId: modelSelection.defaultModelId,
    storyline,
    workflow,
  };
}

function copyTemplatesRecursive(sourceDir, targetDir, filesCreated) {
  if (!existsSync(sourceDir)) return;

  mkdirSync(targetDir, { recursive: true });
  for (const entry of readdirSync(sourceDir)) {
    const source = path.join(sourceDir, entry);
    const target = path.join(targetDir, entry);
    const stat = statSync(source);
    if (stat.isDirectory()) {
      copyTemplatesRecursive(source, target, filesCreated);
    } else {
      copyFileSync(source, target);
      filesCreated.push(target);
    }
  }
}

export async function createWorkbenchTopic(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const topic = String(config.topic || '').trim();
  const brief = String(config.brief || '').trim();
  const rawMaterialsText = String(config.rawMaterialsText || '').trim();
  const webResearchEnabled = Boolean(config.webResearchEnabled);

  if (!topic) {
    return { ok: false, workspaceRoot, error: 'topic 不能为空' };
  }

  const inputDir = path.join(workspaceRoot, 'input', topic);
  const templatesDir = path.join(inputDir, 'templates');
  const defaultsDir = path.join(workspaceRoot, 'system', '自动小红书', 'defaults');
  const filesCreated = [];

  mkdirSync(inputDir, { recursive: true });
  mkdirSync(templatesDir, { recursive: true });

  const presetSource = path.join(defaultsDir, 'AGENT_PRESET.default.md');
  const presetTarget = path.join(inputDir, 'AGENT_PRESET.md');
  if (existsSync(presetSource) && !existsSync(presetTarget)) {
    copyFileSync(presetSource, presetTarget);
    filesCreated.push(presetTarget);
  }

  copyTemplatesRecursive(path.join(defaultsDir, 'templates'), templatesDir, filesCreated);

  const briefFile = path.join(inputDir, '00_启动任务.md');
  writeFileSync(briefFile, [
    `# ${topic} 启动任务`,
    '',
    `- 创建时间：${new Date().toISOString()}`,
    `- 允许联网搜集资料：${webResearchEnabled ? '是' : '否'}`,
    '',
    '## 任务说明',
    brief || '待补充',
  ].join('\n'), 'utf-8');
  filesCreated.push(briefFile);

  let materialFile = '';
  if (rawMaterialsText) {
    materialFile = path.join(inputDir, 'source_material.md');
    writeFileSync(materialFile, rawMaterialsText, 'utf-8');
    filesCreated.push(materialFile);
  }

  return {
    ok: true,
    workspaceRoot,
    topic,
    inputDir,
    briefFile,
    materialFile,
    webResearchEnabled,
    filesCreated,
  };
}

export async function deleteWorkbenchTopic(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const rootDir = resolveRootDir(context);
  const topic = String(config.topic || '').trim();

  if (!topic) {
    return { ok: false, workspaceRoot, error: 'topic 不能为空' };
  }

  const inputDir = path.join(workspaceRoot, 'input', topic);
  const outputDir = path.join(workspaceRoot, 'output', topic);
  const legacyProjectDir = path.join(rootDir, 'projects', topic);

  const deleted = {
    topic,
    inputDir,
    outputDir,
    projectDir: legacyProjectDir,
  };

  if (existsSync(inputDir)) rmSync(inputDir, { recursive: true, force: true });
  if (existsSync(outputDir)) rmSync(outputDir, { recursive: true, force: true });
  if (existsSync(legacyProjectDir)) rmSync(legacyProjectDir, { recursive: true, force: true });

  return {
    ok: true,
    workspaceRoot,
    deleted,
  };
}

export async function runWorkbenchTopicWorkflow(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const rootDir = resolveRootDir(context);
  const topic = String(config.topic || '').trim();
  const runId = String(config.runId || '').trim() || createRunId();
  const startedAt = String(config.startedAt || '').trim() || new Date().toISOString();
  let steps = buildInitialTopicWorkflowSteps();

  if (!topic) {
    return { ok: false, workspaceRoot, error: 'topic 不能为空' };
  }

  const started = {
    runId,
    kind: 'topic_workflow',
    topic,
    status: 'running',
    startedAt,
    summary: createTopicWorkflowSummary(steps, 'sync_inputs'),
  };
  appendWorkbenchRun(workspaceRoot, started);

  try {
    const projectDir = path.join(rootDir, 'projects', topic);
    if (!existsSync(projectDir)) {
      await createProject({ project: topic }, { rootDir });
    }

    const sync = syncWorkbenchTopicToProject({ workspaceRoot, rootDir, topic });
    const toc = await generateSeriesToc(
      {
        project: topic,
        noteMode: 'auto',
      },
      { rootDir, workspaceRoot },
    );
    if (!toc.ok) {
      throw new Error(toc.error || '系列目录生成失败');
    }

    steps = setTopicWorkflowStep(steps, 'sync_inputs', 'done');
    steps = setTopicWorkflowStep(steps, 'research', 'running');
    updateWorkbenchRun(workspaceRoot, runId, (existing) => ({
      ...existing,
      summary: {
        ...(existing.summary || {}),
        ...createTopicWorkflowSummary(steps, 'research'),
        sync,
        toc,
      },
    }));

    const research = await runWorkbenchResearch({ workspaceRoot, topic });
    if (!research.ok) {
      throw new Error(research.error || '自动研究失败');
    }

    const researchSync = research.triggered
      ? syncWorkbenchTopicToProject({ workspaceRoot, rootDir, topic })
      : null;

    steps = setTopicWorkflowStep(steps, 'research', 'done');
    steps = setTopicWorkflowStep(steps, 'storyline', 'running');
    updateWorkbenchRun(workspaceRoot, runId, (existing) => ({
      ...existing,
      summary: {
        ...(existing.summary || {}),
        ...createTopicWorkflowSummary(steps, 'storyline'),
        sync,
        toc,
        research,
        researchSync,
      },
    }));

    const promptFile = String(config.promptFile || '').trim() || inferStorylinePromptFile(topic, workspaceRoot);
    const storyline = await generateStoryline(
      {
        project: topic,
        promptFile,
        workspaceRoot,
      },
      { rootDir, workspaceRoot },
    );

    steps = setTopicWorkflowStep(steps, 'storyline', 'done');
    steps = setTopicWorkflowStep(steps, 'workflow', 'running');
    updateWorkbenchRun(workspaceRoot, runId, (existing) => ({
      ...existing,
      summary: {
        ...(existing.summary || {}),
        ...createTopicWorkflowSummary(steps, 'workflow'),
        sync,
        toc,
        research,
        researchSync,
        storylineOk: storyline.ok,
        promptFile,
      },
    }));

    const workflow = await runWorkflow(
      {
        project: topic,
        mode: config.mode || 'full',
        autoFix: config.autoFix !== false,
        workspaceRoot,
      },
      { rootDir, workspaceRoot },
    );

    steps = setTopicWorkflowStep(steps, 'workflow', workflow.ok ? 'done' : 'failed');
    steps = setTopicWorkflowStep(steps, 'truth_sync', workflow.ok ? 'running' : 'pending');
    updateWorkbenchRun(workspaceRoot, runId, (existing) => ({
      ...existing,
      summary: {
        ...(existing.summary || {}),
        ...createTopicWorkflowSummary(steps, workflow.ok ? 'truth_sync' : 'workflow', workflow.ok ? '' : String(workflow.error || 'workflow failed')),
        sync,
        toc,
        research,
        researchSync,
        storylineOk: storyline.ok,
        promptFile,
        workflowOk: workflow.ok,
        totalTasks: workflow.totalTasks,
        successTasks: workflow.successTasks,
      },
    }));

    if (workflow.ok) {
      steps = setTopicWorkflowStep(steps, 'truth_sync', 'done');
    }

    const finished = {
      ...started,
      status: workflow.ok ? 'completed' : 'failed',
      finishedAt: new Date().toISOString(),
      summary: {
        ...createTopicWorkflowSummary(steps, workflow.ok ? '' : 'workflow', workflow.ok ? '' : String(workflow.error || 'workflow failed')),
        sync,
        toc,
        research,
        researchSync,
        storylineOk: storyline.ok,
        promptFile,
        workflowOk: workflow.ok,
        totalTasks: workflow.totalTasks,
        successTasks: workflow.successTasks,
      },
    };
    appendWorkbenchRun(workspaceRoot, finished);

    return {
      ok: workflow.ok,
      workspaceRoot,
      runId,
      topic,
      promptFile,
      sync,
      research,
      researchSync,
      storyline,
      workflow,
    };
  } catch (error) {
    const runningStep = steps.find((step) => step.status === 'running');
    if (runningStep) {
      steps = setTopicWorkflowStep(steps, runningStep.id, 'failed');
    }
    const finished = {
      ...started,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      summary: {
        ...createTopicWorkflowSummary(steps, runningStep?.id || '', error instanceof Error ? error.message : String(error)),
        error: error instanceof Error ? error.message : String(error),
      },
    };
    appendWorkbenchRun(workspaceRoot, finished);

    return {
      ok: false,
      workspaceRoot,
      runId,
      topic,
      error: finished.summary.error,
    };
  }
}

export async function startWorkbenchTopicWorkflow(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const topic = String(config.topic || '').trim();

  if (!topic) {
    return { ok: false, workspaceRoot, error: 'topic 不能为空' };
  }

  const runId = createRunId();
  const startedAt = new Date().toISOString();
  appendWorkbenchRun(workspaceRoot, {
    runId,
    kind: 'topic_workflow',
    topic,
    status: 'running',
    startedAt,
    summary: createTopicWorkflowSummary(buildInitialTopicWorkflowSteps(), 'sync_inputs'),
  });
  queueMicrotask(async () => {
    await runWorkbenchTopicWorkflow({ ...config, runId, startedAt }, context);
  });

  return {
    ok: true,
    started: true,
    workspaceRoot,
    topic,
    runId,
    startedAt,
  };
}

export async function saveWorkbenchInstruction(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const entry = buildWorkbenchInstructionEntry(config);

  if (!entry.instruction) {
    return { ok: false, workspaceRoot, error: 'instruction 不能为空' };
  }

  appendWorkbenchInstruction(workspaceRoot, entry);
  return {
    ok: true,
    workspaceRoot,
    entry,
  };
}

export async function runWorkbenchInstruction(config = {}, context = {}) {
  const workspaceRoot = resolveWorkspaceRoot(context, config);
  const rootDir = resolveRootDir(context);
  const entry = buildWorkbenchInstructionEntry(config);
  const stageId = String(config.stageId || '').trim() || 'planning';
  const pageNumber = Number.parseInt(String(config.pageNumber || ''), 10);
  const startedAt = new Date().toISOString();
  const runId = `instruction-run-${Date.now()}`;

  if (!entry.instruction) {
    return { ok: false, workspaceRoot, error: 'instruction 不能为空' };
  }

  appendWorkbenchInstruction(workspaceRoot, entry);

  try {
    const workbenchFilePath = resolveWorkbenchFilePath(workspaceRoot, config.filePath);
    const backupPath = createWorkbenchBackup(workspaceRoot, workbenchFilePath);
    const sourceTarget = entry.topic
      ? resolveWorkbenchInstructionSourceTarget({
        rootDir,
        topic: entry.topic,
        noteSlug: entry.noteSlug,
        stageId,
      })
      : null;
    const targetFilePath = sourceTarget?.sourceFilePath || workbenchFilePath;
    const originalContent = readFileSync(targetFilePath, 'utf-8');
    const rewritten = await rewriteWorkbenchFileWithLlm({
      workspaceRoot,
      stageId,
      filePath: targetFilePath,
      fileContent: originalContent,
      instructionEntry: entry,
      pageNumber: Number.isNaN(pageNumber) ? null : pageNumber,
    });

    writeFileSync(targetFilePath, rewritten, 'utf-8');

    let rerun = null;
    if (sourceTarget) {
      rerun = await rerunTaskFromStageDomain(
        {
          project: entry.topic,
          taskFolder: sourceTarget.taskFolder,
          fromStage: sourceTarget.rerunFromStage,
          autoFix: true,
        },
        { rootDir },
      );

      if (!rerun.ok) {
        throw new Error(rerun.error || '局部重跑失败');
      }

      syncProjectOutputsToWorkbenchTopic({
        workspaceRoot,
        topic: entry.topic,
        sourceProjectDir: path.join(rootDir, 'projects', entry.topic),
      });
    } else {
      writeFileSync(workbenchFilePath, rewritten, 'utf-8');
    }

    const run = {
      runId,
      kind: 'instruction_execution',
      status: 'completed',
      startedAt,
      finishedAt: new Date().toISOString(),
      noteSlug: entry.noteSlug,
      scope: entry.scope,
      target: entry.target,
      stageId,
      instructionId: entry.id,
      summary: {
        filePath: targetFilePath,
        workbenchFilePath,
        backupPath,
        rerun,
        pageNumber: Number.isNaN(pageNumber) ? null : pageNumber,
        previewKind: String(config.previewKind || '').trim() || 'text',
        artifactsStale: false,
      },
    };
    appendWorkbenchRun(workspaceRoot, run);

    return {
      ok: true,
      workspaceRoot,
      entry,
      run,
    };
  } catch (error) {
    const run = {
      runId,
      kind: 'instruction_execution',
      status: 'failed',
      startedAt,
      finishedAt: new Date().toISOString(),
      noteSlug: entry.noteSlug,
      scope: entry.scope,
      target: entry.target,
      stageId,
      instructionId: entry.id,
      summary: {
        error: error instanceof Error ? error.message : String(error),
      },
    };
    appendWorkbenchRun(workspaceRoot, run);

    return {
      ok: false,
      workspaceRoot,
      entry,
      run,
      error: run.summary.error,
    };
  }
}

export async function runWorkflow(config, context = {}) {
  const runtimeConfig = resolveRuntimeConfig(context, config);
  const rootDir = runtimeConfig.rootDir;
  const workspaceRoot = runtimeConfig.workspaceRoot;
  const project = String(config.project || '').trim();
  const runId = createRunId();

  const started = {
    runId,
    kind: 'workflow',
    status: 'running',
    project,
    mode: config.mode || 'full',
    startedAt: new Date().toISOString(),
  };
  saveRunState(rootDir, started);

  const result = await runWorkflowDomain({ ...config, project }, {
    rootDir,
    runId,
    workspaceRoot,
    repoRoot: context.repoRoot || process.cwd(),
    runtimeConfig,
    planningLlmConfig: loadStageLlmConfig(workspaceRoot, 'planning'),
    htmlGenerationLlmConfig: loadStageLlmConfig(workspaceRoot, 'html_generation'),
    htmlFixLlmConfig: loadStageLlmConfig(workspaceRoot, 'html_fix'),
  });

  if (result?.ok && project && existsSync(path.join(workspaceRoot, 'input', project))) {
    try {
      syncProjectOutputsToWorkbenchTopic({
        workspaceRoot,
        topic: project,
        sourceProjectDir: path.join(rootDir, 'projects', project),
      });
    } catch (error) {
      result.warnings = [...(result.warnings || []), `workbench sync failed: ${error instanceof Error ? error.message : String(error)}`];
    }
  }

  const ended = {
    ...started,
    status: result.ok ? 'completed' : 'failed',
    finishedAt: new Date().toISOString(),
    summary: result,
  };
  saveRunState(rootDir, ended);

  return {
    runId,
    ...result,
  };
}

export async function evaluateWorkflow(config, context = {}) {
  const rootDir = resolveRootDir(context);
  const runId = createRunId();

  const started = {
    runId,
    kind: 'evaluation',
    status: 'running',
    project: config.project,
    startedAt: new Date().toISOString(),
  };
  saveRunState(rootDir, started);

  const result = await evaluateWorkflowDomain(config, { rootDir, runId });

  saveRunState(rootDir, {
    ...started,
    status: 'completed',
    finishedAt: new Date().toISOString(),
    summary: result,
  });

  return {
    runId,
    ...result,
  };
}

export async function publishProject(config, context = {}) {
  const rootDir = resolveRootDir(context);

  if (config.all) {
    const projects = listProjectsFromTools(rootDir);
    const results = projects.map((project) => publishWorkflowDomain({ project }, { rootDir }));
    return {
      all: true,
      projectCount: results.length,
      results,
    };
  }

  return publishWorkflowDomain({ project: config.project }, { rootDir });
}

export async function doctorProject(config, context = {}) {
  const rootDir = resolveRootDir(context);
  const paths = getProjectPaths(rootDir, config.project);
  const { errors, warnings } = validateProjectInputs(paths);

  return {
    ok: errors.length === 0,
    project: config.project,
    paths,
    errors,
    warnings,
  };
}

export async function listProjects(config = {}, context = {}) {
  const rootDir = resolveRootDir(context);
  const projects = listProjectsFromTools(rootDir);
  return {
    projects,
    total: projects.length,
    rootDir: path.join(rootDir, 'projects'),
  };
}

export async function createProject(config = {}, context = {}) {
  const rootDir = resolveRootDir(context);
  const result = createProjectStructure(rootDir, config.project || '');
  return {
    ...result,
    rootDir: path.join(rootDir, 'projects'),
  };
}

export async function getRunStatus(config = {}, context = {}) {
  const rootDir = resolveRootDir(context);

  if (config.runId) {
    const run = loadRunState(rootDir, config.runId);
    return run || { ok: false, error: `未找到 runId: ${config.runId}` };
  }

  const latest = listRunStates(rootDir, 1);
  if (latest.length === 0) {
    return { ok: false, error: '没有可用的运行记录' };
  }

  return latest[0];
}

export async function getTaskArtifacts(config, context = {}) {
  const rootDir = resolveRootDir(context);
  return listTaskArtifacts(rootDir, config.project, config.taskFolder);
}

export async function retryTaskStep(config, context = {}) {
  const rootDir = resolveRootDir(context);
  const folder = String(config.taskFolder || '');
  const match = folder.match(/^(\d{2})_/);
  const filter = match ? String(Number.parseInt(match[1], 10)) : '';

  const rerunMode = config.step === 'plan' ? 'plan' : config.step === 'html' ? 'html' : 'full';

  return runWorkflow(
    {
      project: config.project,
      mode: rerunMode,
      tasks: filter,
      autoFix: true,
    },
    { rootDir },
  );
}

export async function getStorylinePromptFiles(config = {}, context = {}) {
  const files = listStorylinePromptFiles(resolveRuntimeConfig(context, config));
  return {
    files,
    total: files.length,
  };
}

export async function generateStoryline(config = {}, context = {}) {
  const runtimeConfig = resolveRuntimeConfig(context, config);
  const rootDir = runtimeConfig.rootDir;
  const workspaceRoot = runtimeConfig.workspaceRoot;
  const project = String(config.project || '').trim();
  const paths = getProjectPaths(rootDir, project);

  if (!project) return { ok: false, error: 'project 不能为空' };
  const { errors } = validateProjectInputs(paths);
  const inputErrors = errors.filter((msg) => !msg.includes('series_toc.md'));
  if (inputErrors.length > 0) {
    return { ok: false, error: inputErrors[0], errors: inputErrors, project, paths };
  }

  const rawMaterials = loadRawMaterials(paths.rawMaterialsDir);
  const generated = await generateStorylineLogic({
    projectTitle: project.split('/').pop() || project,
    rawMaterials,
    promptFile: config.promptFile || '',
    llmConfig: loadStageLlmConfig(workspaceRoot, 'storyline'),
    runtimeConfig,
  });

  const selectedPromptFile = String(config.promptFile || '').trim();
  const effectivePromptFile = selectedPromptFile || (listStorylinePromptFiles(runtimeConfig)[0]?.fileName || '');
  writeText(paths.storylineFile, generated);

  return {
    ok: true,
    project,
    storylineFile: paths.storylineFile,
    promptFile: effectivePromptFile,
  };
}

export async function generateSeriesToc(config = {}, context = {}) {
  const rootDir = resolveRootDir(context);
  const project = String(config.project || '').trim();
  const paths = getProjectPaths(rootDir, project);

  if (!project) return { ok: false, error: 'project 不能为空' };
  const { errors } = validateProjectInputs(paths);
  const inputErrors = errors.filter((msg) => !msg.includes('series_toc.md'));
  if (inputErrors.length > 0) {
    return { ok: false, error: inputErrors[0], errors: inputErrors, project, paths };
  }

  const rawMaterials = loadRawMaterials(paths.rawMaterialsDir);
  const generated = generateTasksFromRawMaterials({
    projectName: project,
    rawMaterials,
    noteMode: config.noteMode || 'auto',
  });
  const tocText = buildSeriesTocMarkdown({
    projectName: project,
    mode: generated.mode,
    tasks: generated.tasks,
  });
  writeText(paths.seriesTocFile, tocText);

  return {
    ok: true,
    project,
    mode: generated.mode,
    totalTasks: generated.tasks.length,
    seriesTocFile: paths.seriesTocFile,
    tasks: generated.tasks,
  };
}
