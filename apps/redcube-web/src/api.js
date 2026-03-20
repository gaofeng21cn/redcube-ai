import path from 'node:path';
import { existsSync } from 'node:fs';

import {
  createWorkbenchTopic,
  createProject,
  deleteWorkbenchTopic,
  getWorkbenchFile,
  getWorkbenchModelConfig,
  getWorkbenchModelSelection,
  getRuntimeConfig,
  getWorkbenchOverview,
  getWorkbenchTopic,
  loadWorkbenchRunLedger,
  generateSeriesToc,
  generateStoryline,
  getStorylinePromptFiles,
  getRunStatus,
  getTaskArtifacts,
  listProjects,
  retryTaskStep,
  runWorkflow,
  runWorkbenchTopicWorkflow,
  startWorkbenchTopicWorkflow,
  runWorkbenchInstruction,
  runWorkbenchSmokeWorkflow,
  saveWorkbenchInstruction,
  saveWorkbenchFile,
  saveWorkbenchModelConfig,
  saveWorkbenchModelSelection,
  uploadWorkbenchFile,
} from '../../../packages/redcube-agent/src/index.js';
import { loadRuntimeConfig } from '../../../packages/redcube-config/src/index.js';

function resolveApiRuntime({ query = {}, body = {}, defaultRootDir = '', defaultRepoRoot = '' }) {
  const repoRoot = path.resolve(defaultRepoRoot || process.cwd());
  const runtime = loadRuntimeConfig({
    cwd: defaultRootDir || defaultRepoRoot || process.cwd(),
    env: process.env,
    explicit: {
      rootDir: body?.rootDir || query?.rootDir || '',
      workspaceRoot: body?.workspaceRoot || query?.workspaceRoot || '',
      promptsDir: body?.promptsDir || query?.promptsDir || '',
    },
  });

  if (runtime.sources?.promptsDir === 'fallback.repoPromptsDir' && !existsSync(runtime.promptsDir)) {
    const repoPromptsDir = path.join(repoRoot, 'prompts', 'node');
    if (existsSync(repoPromptsDir)) {
      return {
        ...runtime,
        promptsDir: repoPromptsDir,
      };
    }
  }

  return runtime;
}

export async function handleApiRequest({ method, pathname, query, body, defaultRootDir, defaultRepoRoot }) {
  const runtime = resolveApiRuntime({ query, body, defaultRootDir, defaultRepoRoot });
  const rootDir = runtime.rootDir;
  const workspaceRoot = runtime.workspaceRoot;
  const sharedContext = {
    rootDir,
    workspaceRoot,
    repoRoot: defaultRepoRoot || defaultRootDir,
    promptsDir: runtime.promptsDir,
    runtimeConfig: runtime,
  };

  if (method === 'GET' && (pathname === '/api/GetRuntimeConfig' || pathname === '/api/getruntimeconfig')) {
    const result = await getRuntimeConfig({}, sharedContext);
    return { status: 200, payload: result };
  }

  if (method === 'GET' && (pathname === '/api/GetWorkbenchOverview' || pathname === '/api/getworkbenchoverview')) {
    const result = await getWorkbenchOverview({}, sharedContext);
    return { status: 200, payload: result };
  }

  if (method === 'GET' && (pathname === '/api/GetWorkbenchTopic' || pathname === '/api/getworkbenchtopic')) {
    const result = await getWorkbenchTopic(
      {
        topic: query.topic || '',
      },
      sharedContext,
    );
    return { status: 200, payload: result };
  }

  if (method === 'GET' && (pathname === '/api/GetModelConfig' || pathname === '/api/getmodelconfig')) {
    const result = await getWorkbenchModelConfig({}, sharedContext);
    return { status: 200, payload: result };
  }

  if (method === 'GET' && (pathname === '/api/GetModelSelectionConfig' || pathname === '/api/getmodelselectionconfig')) {
    const result = await getWorkbenchModelSelection({}, sharedContext);
    return { status: 200, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/SaveModelConfig' || pathname === '/api/savemodelconfig')) {
    const result = await saveWorkbenchModelConfig(
      {
        providers: body.providers || [],
        models: body.models || [],
        defaultModelId: body.defaultModelId || '',
        stageOverrides: body.stageOverrides || {},
      },
      sharedContext,
    );
    return { status: 200, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/SaveWorkflowModelSelection' || pathname === '/api/saveworkflowmodelselection')) {
    const result = await saveWorkbenchModelSelection(
      {
        defaultModelId: body.defaultModelId || '',
        stageOverrides: body.stageOverrides || {},
      },
      sharedContext,
    );
    return { status: 200, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/RunWorkflowSmoke' || pathname === '/api/runworkflowsmoke')) {
    const result = await runWorkbenchSmokeWorkflow({}, sharedContext);
    return { status: 200, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/CreateWorkbenchTopic' || pathname === '/api/createworkbenchtopic')) {
    const result = await createWorkbenchTopic(
      {
        topic: body.topic || '',
        brief: body.brief || '',
        rawMaterialsText: body.rawMaterialsText || '',
        webResearchEnabled: body.webResearchEnabled === true,
      },
      sharedContext,
    );
    return { status: result.ok ? 200 : 400, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/DeleteWorkbenchTopic' || pathname === '/api/deleteworkbenchtopic')) {
    const result = await deleteWorkbenchTopic(
      {
        topic: body.topic || '',
      },
      sharedContext,
    );
    return { status: result.ok ? 200 : 400, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/SaveWorkbenchInstruction' || pathname === '/api/saveworkbenchinstruction')) {
    const result = await saveWorkbenchInstruction(
      {
        scope: body.scope || '',
        target: body.target || '',
        noteSlug: body.noteSlug || '',
        instruction: body.instruction || '',
      },
      sharedContext,
    );
    return { status: result.ok ? 200 : 400, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/RunWorkbenchInstruction' || pathname === '/api/runworkbenchinstruction')) {
    const result = await runWorkbenchInstruction(
      {
        topic: body.topic || '',
        scope: body.scope || '',
        target: body.target || '',
        noteSlug: body.noteSlug || '',
        instruction: body.instruction || '',
        stageId: body.stageId || '',
        filePath: body.filePath || '',
        pageNumber: body.pageNumber,
        previewKind: body.previewKind || '',
      },
      sharedContext,
    );
    return { status: result.ok ? 200 : 400, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/RunWorkbenchTopicWorkflow' || pathname === '/api/runworkbenchtopicworkflow')) {
    const result = await runWorkbenchTopicWorkflow(
      {
        topic: body.topic || '',
        mode: body.mode || 'full',
        autoFix: body.autoFix !== false,
        promptFile: body.promptFile || '',
      },
      sharedContext,
    );
    return { status: result.ok ? 200 : 400, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/StartWorkbenchTopicWorkflow' || pathname === '/api/startworkbenchtopicworkflow')) {
    const result = await startWorkbenchTopicWorkflow(
      {
        topic: body.topic || '',
        mode: body.mode || 'full',
        autoFix: body.autoFix !== false,
        promptFile: body.promptFile || '',
      },
      sharedContext,
    );
    return { status: result.ok ? 200 : 400, payload: result };
  }

  if (method === 'GET' && (pathname === '/api/GetRunLedger' || pathname === '/api/getrunledger')) {
    const result = {
      ok: true,
      workspaceRoot,
      ...loadWorkbenchRunLedger(workspaceRoot),
    };
    return { status: 200, payload: result };
  }

  if ((pathname === '/api/GetWorkbenchFile' || pathname === '/api/getworkbenchfile') && (method === 'GET' || method === 'POST')) {
    const result = await getWorkbenchFile(
      {
        filePath: body.filePath || query.filePath || '',
      },
      sharedContext,
    );
    return { status: result.ok ? 200 : 400, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/SaveWorkbenchFile' || pathname === '/api/saveworkbenchfile')) {
    const result = await saveWorkbenchFile(
      {
        filePath: body.filePath || '',
        content: body.content ?? '',
      },
      sharedContext,
    );
    return { status: result.ok ? 200 : 400, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/UploadWorkbenchFile' || pathname === '/api/uploadworkbenchfile')) {
    const result = await uploadWorkbenchFile(
      {
        dirPath: body.dirPath || '',
        fileName: body.fileName || '',
        base64Content: body.base64Content || '',
      },
      sharedContext,
    );
    return { status: result.ok ? 200 : 400, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/RunWorkflow' || pathname === '/api/runworkflow')) {
    const result = await runWorkflow(
      {
        project: body.project,
        mode: body.mode || 'full',
        tasks: body.tasks || '',
        autoFix: body.autoFix !== false,
      },
      sharedContext,
    );
    return { status: 200, payload: result };
  }

  if (method === 'GET' && (pathname === '/api/GetRunStatus' || pathname === '/api/getrunstatus')) {
    const result = await getRunStatus({ runId: query.runId || '' }, sharedContext);
    return { status: 200, payload: result };
  }

  if (method === 'GET' && (pathname === '/api/ListProjects' || pathname === '/api/listprojects')) {
    const result = await listProjects({}, sharedContext);
    return { status: 200, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/CreateProject' || pathname === '/api/createproject')) {
    const result = await createProject(
      {
        project: body.project || '',
      },
      sharedContext,
    );
    return { status: 200, payload: result };
  }

  if (
    method === 'GET'
    && (
      pathname === '/api/StorylinePromptFiles'
      || pathname === '/api/storylinepromptfiles'
      || pathname === '/api/StorylineProfiles'
      || pathname === '/api/storylineprofiles'
    )
  ) {
    const result = await getStorylinePromptFiles({}, sharedContext);
    return { status: 200, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/GenerateStoryline' || pathname === '/api/generatestoryline')) {
    const result = await generateStoryline(
      {
        project: body.project || '',
        promptFile: body.promptFile || '',
      },
      sharedContext,
    );
    return { status: 200, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/GenerateSeriesToc' || pathname === '/api/generateseriestoc')) {
    const result = await generateSeriesToc(
      {
        project: body.project || '',
        noteMode: body.noteMode || 'auto',
      },
      sharedContext,
    );
    return { status: 200, payload: result };
  }

  if (method === 'GET' && (pathname === '/api/GetTaskArtifacts' || pathname === '/api/gettaskartifacts')) {
    const result = await getTaskArtifacts(
      {
        project: query.project || '',
        taskFolder: query.taskFolder || '',
      },
      sharedContext,
    );
    return { status: 200, payload: result };
  }

  if (method === 'POST' && (pathname === '/api/RetryTaskStep' || pathname === '/api/retrytaskstep')) {
    const result = await retryTaskStep(
      {
        project: body.project,
        taskFolder: body.taskFolder,
        step: body.step || 'full',
      },
      sharedContext,
    );
    return { status: 200, payload: result };
  }

  return { status: 404, payload: { ok: false, error: `Unknown route: ${pathname}` } };
}
