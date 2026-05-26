// @ts-nocheck
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

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

function pngDimensions(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }
  return null;
}

function buildNativeImagegenPrompt({
  prompt,
  outputFile,
  family,
  route,
  slideId,
  toolOptions,
}) {
  return [
    '你是 RedCube AI 的 Codex executor，负责执行一个 RCA visual artifact task。',
    '必须使用 Codex 原生 imagegen / image_generation 能力生成 raster PNG。不要使用脚本绘图、SVG、HTML 截图、占位图、外部 curl/fetch、显式 Base URL、显式 API key、OPENAI_API_KEY 或 REDCUBE_IMAGE_GENERATION_TOKEN。',
    '使用内置 imagegen 默认路径生成后，把最终 PNG 复制或移动到指定 output_file。不要把 project-bound asset 只留在 $CODEX_HOME/generated_images。',
    '如果需要读取 imagegen skill，请按本机 Codex skill 指南执行；不要切换到 CLI/API fallback。',
    `family: ${family}`,
    `route: ${route}`,
    `slide_id: ${slideId}`,
    `output_file: ${outputFile}`,
    `image_tool_options: ${JSON.stringify(toolOptions || {})}`,
    '',
    'Image prompt:',
    prompt,
    '',
    '完成后只回复一行 JSON，不要附加说明：',
    JSON.stringify({
      ok: true,
      image_file: outputFile,
      mode: 'codex_native_imagegen',
    }),
  ].join('\n');
}

export async function generateImageViaCodexNativeImagegen({
  family = 'redcube',
  route = '',
  slideId = '',
  prompt = '',
  outputFile = '',
  toolOptions = {},
  timeoutMs = 900000,
  cwd = process.cwd(),
  contract = readCodexCliContract(),
  spawnSyncImpl = null,
} = {}) {
  const safeFamily = safeText(family, 'redcube');
  const safeRoute = safeText(route);
  const safePrompt = safeText(prompt);
  const safeOutputFile = path.resolve(safeText(outputFile));
  if (!safeRoute) throw new Error('route 不能为空');
  if (!safePrompt) throw new Error('image prompt 不能为空');
  if (!safeText(outputFile)) throw new Error('outputFile 不能为空');

  const taskPrompt = buildNativeImagegenPrompt({
    prompt: safePrompt,
    outputFile: safeOutputFile,
    family: safeFamily,
    route: safeRoute,
    slideId: safeText(slideId),
    toolOptions,
  });
  const execution = await runCodexPrompt({
    contract,
    prompt: taskPrompt,
    cwd,
    timeoutMs,
    spawnSyncImpl,
  });

  if (execution.codexRun.terminal_event !== 'run.completed') {
    throw new Error(
      safeText(execution.codexRun.error, `Codex native imagegen task failed: ${safeFamily}:${safeRoute}:${slideId}`),
    );
  }
  if (!existsSync(safeOutputFile)) {
    throw new Error(`Codex native imagegen task did not create output PNG: ${safeOutputFile}`);
  }
  const imageBytes = readFileSync(safeOutputFile);
  const dimensions = pngDimensions(imageBytes);
  if (!dimensions) {
    throw new Error(`Codex native imagegen output is not a PNG: ${safeOutputFile}`);
  }
  const usage = terminalUsage(execution.codexRun.events);
  const promptHash = createHash('sha256').update(safePrompt).digest('hex');
  const imageHash = createHash('sha256').update(imageBytes).digest('hex');
  return {
    imageFile: safeOutputFile,
    imageBytes,
    dimensions,
    generationRuntime: {
      owner: REDCUBE_CODEX_RUNTIME_OWNER,
      adapter_surface: '@redcube/codex-cli-client',
      task_surface: 'codex_native_imagegen_skill',
      run_id: execution.codexRun.run_id,
      session_id: execution.codexRun.session_id,
      model_selection: execution.contract.model_selection,
      reasoning_selection: execution.contract.reasoning_selection,
      sandbox: execution.contract.sandbox,
      family: safeFamily,
      route: safeRoute,
      slide_id: safeText(slideId),
      prompt_hash: promptHash,
      image_sha256: imageHash,
      image_file: safeOutputFile,
      token_persisted: false,
      explicit_provider_token_required: false,
      provider_token_source: 'codex_executor_native_tool',
      imagegen_mode: 'built_in_tool',
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
