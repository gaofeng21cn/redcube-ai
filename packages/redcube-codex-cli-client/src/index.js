import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  CODEX_DEFAULT_MODEL_SELECTION,
  CODEX_DEFAULT_REASONING_SELECTION,
} from '@redcube/hermes-substrate';

export const REDCUBE_CODEX_RUNTIME_OWNER = 'codex_cli';
export const REDCUBE_CREATIVE_GENERATION_META_BEGIN = 'REDCUBE_CREATIVE_GENERATION_META_BEGIN';
export const REDCUBE_CREATIVE_GENERATION_META_END = 'REDCUBE_CREATIVE_GENERATION_META_END';
export const REDCUBE_STAGE_JSON_BEGIN = 'REDCUBE_STAGE_JSON_BEGIN';
export const REDCUBE_STAGE_JSON_END = 'REDCUBE_STAGE_JSON_END';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');
const DEFAULT_CODEX_COMMAND = Object.freeze(['codex']);
const DEFAULT_CODEX_SANDBOX = 'workspace-write';
const DEFAULT_CODEX_PROBE_TIMEOUT_MS = 60000;
const DEFAULT_CODEX_GENERATION_TIMEOUT_MS = 600000;

function summarizeError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text.trim()) {
    return {};
  }
  return JSON.parse(text);
}

function readPromptGuidance(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing prompt pack asset: ${relativePath}`);
  }

  const raw = readFileSync(absolutePath, 'utf-8');
  const runtimeSectionIndex = raw.search(/^##\s+runtime_(seed|artifact)\b/m);
  if (runtimeSectionIndex === -1) {
    return raw.trim();
  }
  return raw.slice(0, runtimeSectionIndex).trim();
}

function extractMarkedJson(text) {
  const raw = safeText(text);
  if (!raw) return null;

  const start = raw.indexOf(REDCUBE_STAGE_JSON_BEGIN);
  const end = raw.indexOf(REDCUBE_STAGE_JSON_END);
  const candidate = start >= 0 && end > start
    ? raw.slice(start + REDCUBE_STAGE_JSON_BEGIN.length, end).trim()
    : raw;
  const unfenced = candidate.startsWith('```')
    ? candidate.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : candidate;

  try {
    return JSON.parse(unfenced);
  } catch {
    return null;
  }
}

function terminalUsage(events = []) {
  const terminalEvent = events.find(
    (event) => event?.event === 'run.completed' || event?.event === 'run.failed',
  );
  return terminalEvent?.usage || null;
}

function normalizeLocalFileInspection(value) {
  return (Array.isArray(value) ? value : [])
    .map((entry) => ({
      label: safeText(entry?.label, 'local-file'),
      path: safeText(entry?.path),
      media_type: safeText(entry?.media_type, 'application/octet-stream'),
      purpose: safeText(entry?.purpose),
    }))
    .filter((entry) => entry.path);
}

function buildLocalFileInspectionSection(localFileInspection = []) {
  const entries = normalizeLocalFileInspection(localFileInspection);
  if (entries.length === 0) {
    return '';
  }
  return [
    '## Provided Local Files',
    'Only inspect the local files explicitly listed below.',
    '',
    ...entries.flatMap((entry, index) => {
      const block = [
        `### File ${index + 1}: ${entry.label}`,
        `- path: ${entry.path}`,
      ];
      if (entry.purpose) {
        block.push(`- purpose: ${entry.purpose}`);
      }
      if (entry.media_type.startsWith('image/')) {
        block.push(`![${entry.label}](<${entry.path}>)`);
      }
      block.push('');
      return block;
    }),
  ].join('\n');
}

function buildGenerationInstructions(family, route, localFileInspection = []) {
  const localFiles = normalizeLocalFileInspection(localFileInspection);
  return [
    'You are the RedCube AI Codex-native creative generation runtime.',
    `Produce the ${family}:${route} artifact as audience-facing creative output.`,
    localFiles.length > 0
      ? 'You may inspect only the provided local files embedded in this prompt. Do not browse external sources or inspect any other files.'
      : 'Do not use tools or browse external sources.',
    'Work only from the provided guidance, context, and output contract.',
    'Treat operator meta instructions as production constraints, not deck/note/poster copy.',
    'Never quote internal workflow notes, cover instructions, hidden review rules, or process directives into audience-facing fields.',
    `Return only the final JSON between ${REDCUBE_STAGE_JSON_BEGIN} and ${REDCUBE_STAGE_JSON_END}.`,
  ].join(' ');
}

function buildGenerationInput({ family, route, promptRelativePath, context, outputContract, localFileInspection = [] }) {
  const guidance = readPromptGuidance(promptRelativePath);
  const localFileSection = buildLocalFileInspectionSection(localFileInspection);
  return [
    '# RedCube Structured Generation',
    '',
    `${REDCUBE_CREATIVE_GENERATION_META_BEGIN}`,
    JSON.stringify({
      kind: 'redcube_stage_json_generation',
      family,
      route,
      prompt_pack_file: promptRelativePath,
      context,
    }, null, 2),
    `${REDCUBE_CREATIVE_GENERATION_META_END}`,
    '',
    '## Prompt Pack Guidance',
    guidance,
    '',
    '## Context',
    '```json',
    JSON.stringify(context, null, 2),
    '```',
    '',
    '## Output Contract',
    '```json',
    JSON.stringify(outputContract, null, 2),
    '```',
    '',
    ...(localFileSection ? [localFileSection, ''] : []),
    '## Output Rule',
    `Return JSON only between ${REDCUBE_STAGE_JSON_BEGIN} and ${REDCUBE_STAGE_JSON_END}.`,
  ].join('\n');
}

function ensureTempDir() {
  const dir = path.join(os.tmpdir(), 'redcube-codex-cli-client');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function optionalText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function parseCodexCommand(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return [...DEFAULT_CODEX_COMMAND];
  }
  if (raw.startsWith('[')) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('REDCUBE_CODEX_COMMAND 若使用 JSON array，必须是非空字符串数组');
    }
    const command = parsed.map((item) => String(item || '').trim()).filter(Boolean);
    if (command.length === 0) {
      throw new Error('REDCUBE_CODEX_COMMAND 解析后不能为空');
    }
    return command;
  }
  return [raw];
}

function buildBlockedResult({
  contract,
  steps,
  errorKind,
  blockingReason,
}) {
  return {
    ok: false,
    status: 'blocked',
    runtime_owner: REDCUBE_CODEX_RUNTIME_OWNER,
    contract: {
      command: [...contract.command],
      sandbox: contract.sandbox,
      model_selection: contract.model_selection,
      reasoning_selection: contract.reasoning_selection,
    },
    steps,
    error_kind: errorKind,
    blocking_reason: blockingReason,
  };
}

export function readCodexCliContract(env = process.env) {
  const model = optionalText(env.REDCUBE_CODEX_MODEL);
  const reasoningEffort = optionalText(env.REDCUBE_CODEX_REASONING_EFFORT);
  return {
    command: parseCodexCommand(env.REDCUBE_CODEX_COMMAND),
    sandbox: optionalText(env.REDCUBE_CODEX_SANDBOX) || DEFAULT_CODEX_SANDBOX,
    model,
    reasoning_effort: reasoningEffort,
    model_selection: model || CODEX_DEFAULT_MODEL_SELECTION,
    reasoning_selection: reasoningEffort || CODEX_DEFAULT_REASONING_SELECTION,
  };
}

function buildCodexExecArgs({ contract, cwd, lastMessageFile }) {
  const args = [
    'exec',
    '--json',
    '--ephemeral',
    '--cd',
    cwd,
    '--skip-git-repo-check',
    '-s',
    contract.sandbox,
    '-c',
    'approval_policy="never"',
  ];
  if (contract.reasoning_effort) {
    args.push('-c', `model_reasoning_effort="${contract.reasoning_effort}"`);
  }
  if (contract.model) {
    args.push('--model', contract.model);
  }
  args.push('--output-last-message', lastMessageFile, '-');
  return args;
}

function parseCodexEvents(stdout) {
  return String(stdout || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function buildCodexRunMetadata({ runId, result, lastMessageFile }) {
  return {
    run_id: runId,
    session_id: runId,
    terminal_event: result.status === 0 ? 'run.completed' : 'run.failed',
    events: parseCodexEvents(result.stdout),
    output: existsSync(lastMessageFile) ? readFileSync(lastMessageFile, 'utf-8') : null,
    error: result.status === 0
      ? null
      : String(result.stderr || result.stdout || 'Codex CLI execution failed').trim() || 'Codex CLI execution failed',
    exit_code: result.status,
  };
}

async function runCodexPrompt({
  contract = readCodexCliContract(),
  prompt,
  cwd = process.cwd(),
  timeoutMs = 120000,
  spawnImpl = spawn,
  spawnSyncImpl = null,
} = {}) {
  const safePrompt = safeText(prompt);
  if (!safePrompt) {
    throw new Error('Codex prompt 不能为空');
  }

  const tempDir = ensureTempDir();
  const runId = `run_codex_${randomUUID()}`;
  const lastMessageFile = path.join(tempDir, `${runId}.last-message.txt`);
  const resolvedCwd = path.resolve(cwd);
  const execArgs = buildCodexExecArgs({
    contract,
    cwd: resolvedCwd,
    lastMessageFile,
  });
  let result;
  if (typeof spawnSyncImpl === 'function') {
    result = spawnSyncImpl(
      contract.command[0],
      [...contract.command.slice(1), ...execArgs],
      {
        cwd: resolvedCwd,
        input: safePrompt,
        encoding: 'utf-8',
        maxBuffer: 20 * 1024 * 1024,
        timeout: timeoutMs,
        env: process.env,
      },
    );

    if (result.error) {
      throw result.error;
    }
  } else {
    result = await new Promise((resolve, reject) => {
      const child = spawnImpl(
        contract.command[0],
        [...contract.command.slice(1), ...execArgs],
        {
          cwd: resolvedCwd,
          env: process.env,
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );
      let stdout = '';
      let stderr = '';
      let settled = false;
      const timer = timeoutMs > 0
        ? setTimeout(() => {
            if (settled) return;
            settled = true;
            child.kill('SIGKILL');
            const error = new Error(`Codex CLI execution timed out after ${timeoutMs}ms`);
            error.code = 'ETIMEDOUT';
            reject(error);
          }, timeoutMs)
        : null;

      const finish = (payload) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        resolve(payload);
      };

      child.on('error', (error) => {
        if (timer) clearTimeout(timer);
        if (settled) return;
        settled = true;
        reject(error);
      });
      child.stdout?.setEncoding('utf-8');
      child.stderr?.setEncoding('utf-8');
      child.stdout?.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr?.on('data', (chunk) => {
        stderr += chunk;
      });
      child.on('close', (code) => {
        finish({
          status: Number.isInteger(code) ? code : 1,
          stdout,
          stderr,
          error: null,
        });
      });
      child.stdin?.end(safePrompt);
    });
  }

  return {
    contract,
    lastMessageFile,
    codexRun: buildCodexRunMetadata({ runId, result, lastMessageFile }),
  };
}

export async function probeCodexCli({
  contract = readCodexCliContract(),
  timeoutMs = DEFAULT_CODEX_PROBE_TIMEOUT_MS,
  cwd = process.cwd(),
  prompt = 'Reply with READY only.',
  spawnSyncImpl = null,
} = {}) {
  const steps = {
    exec_surface: {
      ok: false,
      command: [...contract.command],
      detail: null,
      terminal_event: null,
      run_id: null,
      exit_code: null,
    },
  };

  try {
    const execution = await runCodexPrompt({
      contract,
      prompt,
      cwd,
      timeoutMs,
      spawnSyncImpl,
    });
    steps.exec_surface.run_id = execution.codexRun.run_id;
    steps.exec_surface.exit_code = execution.codexRun.exit_code;
    steps.exec_surface.terminal_event = execution.codexRun.terminal_event;
    if (execution.codexRun.terminal_event !== 'run.completed') {
      steps.exec_surface.detail = execution.codexRun.error || 'Codex CLI probe failed';
      return buildBlockedResult({
        contract,
        steps,
        errorKind: 'codex_cli_probe_failed',
        blockingReason: steps.exec_surface.detail,
      });
    }

    const output = safeText(execution.codexRun.output);
    if (!output || !/READY/i.test(output)) {
      steps.exec_surface.detail = 'Codex CLI probe did not return READY';
      return buildBlockedResult({
        contract,
        steps,
        errorKind: 'codex_cli_probe_invalid_output',
        blockingReason: steps.exec_surface.detail,
      });
    }

    steps.exec_surface.ok = true;
    steps.exec_surface.detail = 'Codex CLI exec surface ready';
    return {
      ok: true,
      status: 'ready',
      runtime_owner: REDCUBE_CODEX_RUNTIME_OWNER,
      contract: {
        command: [...contract.command],
        sandbox: contract.sandbox,
        model_selection: contract.model_selection,
        reasoning_selection: contract.reasoning_selection,
      },
      steps,
      error_kind: null,
      blocking_reason: null,
    };
  } catch (error) {
    steps.exec_surface.detail = summarizeError(error);
    return buildBlockedResult({
      contract,
      steps,
      errorKind: 'codex_cli_probe_failed',
      blockingReason: steps.exec_surface.detail,
    });
  }
}

export async function generateStructuredArtifactViaCodexCli({
  family = 'redcube',
  route,
  promptRelativePath,
  context,
  outputContract,
  localFileInspection = [],
  timeoutMs = DEFAULT_CODEX_GENERATION_TIMEOUT_MS,
  cwd = process.cwd(),
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
  const execution = await runCodexPrompt({
    prompt: [
      buildGenerationInstructions(safeFamily, safeRoute, localFileInspection),
      '',
      input,
    ].join('\n'),
    cwd,
    timeoutMs,
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
      prompt_pack_file: safePromptRelativePath,
      usage: terminalUsage(execution.codexRun.events),
    },
  };
}
