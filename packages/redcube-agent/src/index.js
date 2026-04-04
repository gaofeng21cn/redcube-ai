import path from 'node:path';

import { loadRuntimeConfig } from '../../redcube-config/src/index.js';
import {
  createRunId,
  listRunStates,
  loadRunState,
  saveRunState,
} from '../../redcube-memory/src/index.js';
import {
  evaluateWorkflowDomain,
  listTaskArtifacts,
  publishWorkflowDomain,
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
import { loadStageLlmConfig } from './workbench-models.js';

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

export async function runWorkflow(config, context = {}) {
  const runtimeConfig = resolveRuntimeConfig(context, config);
  const rootDir = runtimeConfig.rootDir;
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
    workspaceRoot: runtimeConfig.workspaceRoot,
    repoRoot: context.repoRoot || process.cwd(),
    runtimeConfig,
    planningLlmConfig: loadStageLlmConfig(runtimeConfig.workspaceRoot, 'planning'),
    htmlGenerationLlmConfig: loadStageLlmConfig(runtimeConfig.workspaceRoot, 'html_generation'),
    htmlFixLlmConfig: loadStageLlmConfig(runtimeConfig.workspaceRoot, 'html_fix'),
  });

  saveRunState(rootDir, {
    ...started,
    status: result.ok ? 'completed' : 'failed',
    finishedAt: new Date().toISOString(),
    summary: result,
  });

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
    { rootDir: resolveRootDir(context) },
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
