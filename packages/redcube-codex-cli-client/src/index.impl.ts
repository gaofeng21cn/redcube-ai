// @ts-nocheck
import { REDCUBE_CODEX_RUNTIME_OWNER } from './index-parts/constants.js';
import {
  buildGenerationInput,
  buildGenerationInstructions,
  extractMarkedJson,
  resolveGenerationTimeoutMs,
} from './index-parts/prompt-guidance.js';
import {
  readCodexCliContract,
  runCodexPrompt,
} from './index-parts/command-process.js';
import { buildGenerationTelemetry, terminalUsage } from './index-parts/telemetry.js';
import { generateCodexCliBatch } from './index-parts/batch-session-pool.js';
import { safeText } from './index-parts/shared.js';

export {
  REDCUBE_CODEX_RUNTIME_OWNER,
  REDCUBE_CREATIVE_GENERATION_META_BEGIN,
  REDCUBE_CREATIVE_GENERATION_META_END,
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
} from './index-parts/constants.js';
export {
  probeCodexCli,
  readCodexCliContract,
} from './index-parts/command-process.js';

export async function generateStructuredArtifactViaCodexCli({
  family = 'redcube',
  route,
  promptRelativePath,
  context,
  outputContract,
  localFileInspection = [],
  timeoutMs,
  cwd = process.cwd(),
  contract = readCodexCliContract(),
  spawnSyncImpl = null,
} = {}) {
  const safeFamily = safeText(family, 'redcube');
  const safeRoute = safeText(route);
  const safePromptRelativePath = safeText(promptRelativePath);
  if (!safeRoute) {
    throw new Error('route 不能为空');
  }
  if (!safePromptRelativePath) {
    throw new Error('promptRelativePath 不能为空');
  }

  const input = buildGenerationInput({
    family: safeFamily,
    route: safeRoute,
    promptRelativePath: safePromptRelativePath,
    context,
    outputContract,
    localFileInspection,
  });
  const prompt = [
    buildGenerationInstructions(safeFamily, safeRoute, localFileInspection),
    '',
    input,
  ].join('\n');
  const execution = await runCodexPrompt({
    contract,
    prompt,
    cwd,
    timeoutMs: resolveGenerationTimeoutMs(timeoutMs, localFileInspection, {
      family: safeFamily,
      route: safeRoute,
    }),
    spawnSyncImpl,
  });

  if (execution.codexRun.terminal_event !== 'run.completed') {
    throw new Error(
      safeText(execution.codexRun.error, `Codex structured generation failed: ${safeFamily}:${safeRoute}`),
    );
  }

  const data = extractMarkedJson(execution.codexRun.output);
  if (!data) {
    throw new Error(`Codex structured generation returned invalid JSON for route: ${safeFamily}:${safeRoute}`);
  }
  const usage = terminalUsage(execution.codexRun.events);

  return {
    data,
    generationRuntime: {
      owner: REDCUBE_CODEX_RUNTIME_OWNER,
      adapter_surface: '@redcube/codex-cli-client',
      run_id: execution.codexRun.run_id,
      session_id: execution.codexRun.session_id,
      model_selection: execution.contract.model_selection,
      reasoning_selection: execution.contract.reasoning_selection,
      sandbox: execution.contract.sandbox,
      ...buildGenerationTelemetry({
        prompt,
        promptRelativePath: safePromptRelativePath,
        context,
        localFileInspection,
        usage,
      }),
      usage,
    },
  };
}

export async function generateStructuredArtifactBatchViaCodexCli({
  stages,
  sessionPool = {},
  contract = readCodexCliContract(),
  cwd = process.cwd(),
  spawnSyncImpl = null,
} = {}) {
  return generateCodexCliBatch({
    stages,
    sessionPool,
    contract,
    cwd,
    spawnSyncImpl,
    generateStructuredArtifact: generateStructuredArtifactViaCodexCli,
  });
}
