// @ts-nocheck
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import {
  OPL_CODEX_EXECUTOR_SURFACE,
  REDCUBE_CODEX_RUNTIME_OWNER,
} from './index-parts/constants.js';
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
  const resolvedTimeoutMs = resolveGenerationTimeoutMs(timeoutMs, localFileInspection, {
    family: safeFamily,
    route: safeRoute,
  });
  const buildFailureRuntime = ({ usage = null, codexRun = null, error = null } = {}) => ({
    owner: REDCUBE_CODEX_RUNTIME_OWNER,
    adapter_surface: OPL_CODEX_EXECUTOR_SURFACE,
    run_id: safeText(codexRun?.run_id),
    session_id: safeText(codexRun?.session_id || codexRun?.run_id),
    model_selection: contract.model_selection,
    reasoning_selection: contract.reasoning_selection,
    sandbox: contract.sandbox,
    timeout_ms: resolvedTimeoutMs,
    terminal_event: safeText(codexRun?.terminal_event),
    exit_code: codexRun?.exit_code ?? null,
    failure_kind: 'codex_cli_execution_blocked',
    error_code: safeText(error?.code || codexRun?.exit_code),
    error_message: safeText(error?.message || codexRun?.error),
    ...buildGenerationTelemetry({
      prompt,
      promptRelativePath: safePromptRelativePath,
      context,
      localFileInspection,
      usage,
    }),
    usage,
  });
  const attachFailureRuntime = (error, runtime) => {
    const failure = error instanceof Error ? error : new Error(safeText(error, 'Codex CLI execution failed'));
    failure.failure_kind = safeText(failure.failure_kind, 'codex_cli_execution_blocked');
    failure.codex_cli_runtime = runtime;
    failure.generationRuntime = runtime;
    failure.generation_runtime = runtime;
    return failure;
  };
  let execution;
  try {
    execution = await runCodexPrompt({
      contract,
      prompt,
      cwd,
      timeoutMs: resolvedTimeoutMs,
      spawnSyncImpl,
    });
  } catch (error) {
    throw attachFailureRuntime(error, buildFailureRuntime({ error }));
  }

  if (execution.codexRun.terminal_event !== 'run.completed') {
    const usage = terminalUsage(execution.codexRun.events);
    const error = new Error(
      safeText(execution.codexRun.error, `Codex structured generation failed: ${safeFamily}:${safeRoute}`),
    );
    error.code = safeText(execution.codexRun.exit_code);
    throw attachFailureRuntime(error, buildFailureRuntime({
      usage,
      codexRun: execution.codexRun,
      error,
    }));
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
      adapter_surface: OPL_CODEX_EXECUTOR_SURFACE,
      run_id: execution.codexRun.run_id,
      session_id: execution.codexRun.session_id,
      model_selection: execution.contract.model_selection,
      reasoning_selection: execution.contract.reasoning_selection,
      sandbox: execution.contract.sandbox,
      timeout_ms: resolvedTimeoutMs,
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

function parseNativeImagegenTaskResult(output) {
  const raw = safeText(output);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function eventLooksLikeImageGenerationToolCall(event) {
  const item = event?.item || event?.call || event || {};
  const candidates = [
    item?.type,
    item?.tool,
    item?.tool_name,
    item?.name,
    event?.tool,
    event?.tool_name,
    event?.name,
  ].map((value) => safeText(value));
  return candidates.some((value) => (
    value === 'image_gen'
    || value === 'image_generation'
    || value === 'image_generation_call'
    || value === 'image_generation_tool'
  ));
}

function codexEventTextCandidates(event) {
  const item = event?.item || {};
  return [
    event?.type,
    event?.text,
    event?.message,
    event?.command,
    event?.aggregated_output,
    item?.type,
    item?.text,
    item?.command,
    item?.aggregated_output,
  ].map((value) => safeText(value)).filter(Boolean);
}

function uniquePush(list, value) {
  const safeValue = safeText(value);
  if (safeValue && !list.includes(safeValue)) list.push(safeValue);
}

function isReadableFile(file) {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

function generatedImageFilesFromDir(dir) {
  try {
    return readdirSync(dir)
      .filter((name) => /^ig_[A-Za-z0-9_.-]+\.(png|webp|jpe?g)$/i.test(name))
      .map((name) => path.join(dir, name))
      .filter((file) => isReadableFile(file))
      .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  } catch {
    return [];
  }
}

function generatedImageProvenanceFromEvents(events = []) {
  const dirs = [];
  const files = [];
  const fileNames = [];
  for (const event of Array.isArray(events) ? events : []) {
    for (const text of codexEventTextCandidates(event)) {
      for (const match of text.matchAll(/([^\s"'`]*\.codex\/generated_images\/[A-Za-z0-9-]+\/ig_[A-Za-z0-9_.-]+\.(?:png|webp|jpe?g))/gi)) {
        uniquePush(files, path.resolve(match[1]));
      }
      for (const match of text.matchAll(/([^\s"'`]*\.codex\/generated_images\/[A-Za-z0-9-]+)/g)) {
        uniquePush(dirs, path.resolve(match[1]));
      }
      for (const match of text.matchAll(/\big_[A-Za-z0-9_.-]+\.(?:png|webp|jpe?g)\b/gi)) {
        uniquePush(fileNames, match[0]);
      }
    }
  }
  for (const file of files) {
    if (isReadableFile(file)) return file;
  }
  for (const dir of dirs) {
    for (const fileName of fileNames) {
      const candidate = path.join(dir, fileName);
      if (isReadableFile(candidate)) return candidate;
    }
  }
  for (const dir of dirs) {
    const [candidate] = generatedImageFilesFromDir(dir);
    if (candidate) return candidate;
  }
  return '';
}

function eventLooksLikeGeneratedImagesMaterialization(event, targetFile) {
  const text = codexEventTextCandidates(event).join('\n');
  if (!safeText(targetFile) || !text.includes(targetFile)) return false;
  if (!/\.codex\/generated_images\/[A-Za-z0-9-]+/.test(text)) return false;
  return /\b(cp|mv|rsync|install)\b/.test(text);
}

function codexRunUsedNativeImageGeneration(events = [], targetFile = '') {
  if (!Array.isArray(events)) return false;
  if (events.some((event) => eventLooksLikeImageGenerationToolCall(event))) return true;
  return events.some((event) => eventLooksLikeGeneratedImagesMaterialization(event, targetFile));
}

function generatedImageFileFromTaskResult(result, targetFile) {
  if (!result || safeText(result.mode) !== 'codex_native_imagegen') return '';
  const directGeneratedImageFile = safeText(result.generated_image_file);
  if (directGeneratedImageFile) {
    const resolvedDirectGeneratedImageFile = path.resolve(directGeneratedImageFile);
    if (resolvedDirectGeneratedImageFile !== targetFile) return resolvedDirectGeneratedImageFile;
  }
  const generatedImageFile = safeText(result.image_file);
  if (!generatedImageFile) return '';
  const resolvedGeneratedImageFile = path.resolve(generatedImageFile);
  if (resolvedGeneratedImageFile === targetFile) return '';
  if (result.ok === true) return resolvedGeneratedImageFile;
  if (safeText(result.error).includes('sandbox_denied')) return resolvedGeneratedImageFile;
  return '';
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
  cwd = '',
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
  mkdirSync(path.dirname(safeOutputFile), { recursive: true });
  const imagegenCwd = safeText(cwd)
    ? path.resolve(safeText(cwd))
    : path.dirname(safeOutputFile);

  const taskPrompt = buildNativeImagegenPrompt({
    prompt: safePrompt,
    outputFile: safeOutputFile,
    family: safeFamily,
    route: safeRoute,
    slideId: safeText(slideId),
    toolOptions,
  });
  const execution = await runCodexPrompt({
    contract: {
      ...contract,
      enable_image_generation: true,
    },
    prompt: taskPrompt,
    cwd: imagegenCwd,
    timeoutMs,
    spawnSyncImpl,
  });

  if (execution.codexRun.terminal_event !== 'run.completed') {
    throw new Error(
      safeText(execution.codexRun.error, `Codex native imagegen task failed: ${safeFamily}:${safeRoute}:${slideId}`),
    );
  }
  if (!codexRunUsedNativeImageGeneration(execution.codexRun.events, safeOutputFile)) {
    throw new Error('Codex native imagegen task did not provide native image_generation/generated_images provenance');
  }
  const taskResult = parseNativeImagegenTaskResult(execution.codexRun.output);
  const generatedImageFile = generatedImageFileFromTaskResult(taskResult, safeOutputFile)
    || generatedImageProvenanceFromEvents(execution.codexRun.events);
  if (!existsSync(safeOutputFile)) {
    if (!generatedImageFile || !existsSync(generatedImageFile)) {
      throw new Error(`Codex native imagegen task did not create output PNG: ${safeOutputFile}`);
    }
    const generatedImageBytes = readFileSync(generatedImageFile);
    if (!pngDimensions(generatedImageBytes)) {
      throw new Error(`Codex native imagegen generated file is not a PNG: ${generatedImageFile}`);
    }
    mkdirSync(path.dirname(safeOutputFile), { recursive: true });
    copyFileSync(generatedImageFile, safeOutputFile);
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
      adapter_surface: OPL_CODEX_EXECUTOR_SURFACE,
      task_surface: 'codex_native_imagegen_skill',
      run_id: execution.codexRun.run_id,
      session_id: execution.codexRun.session_id,
      model_selection: execution.contract.model_selection,
      reasoning_selection: execution.contract.reasoning_selection,
      sandbox: execution.contract.sandbox,
      cwd: imagegenCwd,
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
      codex_generated_image_file: generatedImageFile || null,
      materialized_from_codex_generated_image: Boolean(generatedImageFile),
      usage,
    },
  };
}

export async function generateStructuredArtifactBatchViaCodexCli({
  stages,
  contract = readCodexCliContract(),
  cwd = process.cwd(),
  spawnSyncImpl = null,
} = {}) {
  return generateCodexCliBatch({
    stages,
    contract,
    cwd,
    spawnSyncImpl,
    generateStructuredArtifact: generateStructuredArtifactViaCodexCli,
  });
}
