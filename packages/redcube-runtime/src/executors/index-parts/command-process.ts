// @ts-nocheck
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

import {
  buildCodexExecArgs,
  parseCodexExecOutput,
  runCodexCommandStreaming,
} from 'opl-framework/domain-task-runtime';
import { CODEX_DEFAULT_MODEL_SELECTION, CODEX_DEFAULT_REASONING_SELECTION } from '@redcube/runtime-protocol';

import {
  DEFAULT_CODEX_COMMAND,
  DEFAULT_CODEX_PROBE_TIMEOUT_MS,
  DEFAULT_CODEX_SANDBOX,
  REDCUBE_CODEX_RUNTIME_OWNER,
} from './constants.js';
import { optionalText, safeText, summarizeError } from './shared.js';

function parseCommand(value, env = process.env) {
  const raw = safeText(value);
  if (!raw) return [...DEFAULT_CODEX_COMMAND];
  if (!raw.startsWith('[')) return [raw];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((entry) => !safeText(entry))) {
    throw new Error('REDCUBE_CODEX_COMMAND 必须是非空字符串或字符串数组');
  }
  return parsed.map(String);
}

export function readCodexCliContract(env = process.env) {
  const model = optionalText(env.REDCUBE_CODEX_MODEL);
  const reasoningEffort = optionalText(env.REDCUBE_CODEX_REASONING_EFFORT);
  return {
    command: parseCommand(env.REDCUBE_CODEX_COMMAND, env),
    sandbox: optionalText(env.REDCUBE_CODEX_SANDBOX) || DEFAULT_CODEX_SANDBOX,
    model,
    reasoning_effort: reasoningEffort,
    model_selection: model || CODEX_DEFAULT_MODEL_SELECTION,
    reasoning_selection: reasoningEffort || CODEX_DEFAULT_REASONING_SELECTION,
  };
}

function events(stdout) {
  return String(stdout || '').split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
}

export async function runCodexPrompt({
  contract = readCodexCliContract(),
  prompt,
  cwd = process.cwd(),
  timeoutMs = 120000,
  spawnSyncImpl = null,
  outputSchema = null,
} = {}) {
  if (!safeText(prompt)) throw new Error('Codex prompt 不能为空');
  const tempDir = path.join(os.tmpdir(), 'opl-domain-task-runtime', 'redcube-ai');
  mkdirSync(tempDir, { recursive: true });
  const runId = `run_codex_${randomUUID()}`;
  const lastMessageFile = path.join(tempDir, `${runId}.last-message.txt`);
  const outputSchemaFile = outputSchema && typeof outputSchema === 'object'
    ? path.join(tempDir, `${runId}.output-schema.json`)
    : '';
  if (outputSchemaFile) {
    writeFileSync(outputSchemaFile, `${JSON.stringify(outputSchema, null, 2)}\n`, 'utf-8');
  }
  const args = [
    ...contract.command.slice(1),
    ...buildCodexExecArgs(prompt, {
      cwd: path.resolve(cwd),
      json: true,
      ephemeral: true,
      enableImageGeneration: contract.enable_image_generation === true,
      model: contract.model || undefined,
      reasoningEffort: contract.reasoning_effort || undefined,
      outputLastMessagePath: lastMessageFile,
      outputSchemaPath: outputSchemaFile || undefined,
      promptViaStdin: true,
    }),
  ];
  let result;
  try {
    result = typeof spawnSyncImpl === 'function'
      ? spawnSyncImpl(contract.command[0], args, {
          cwd: path.resolve(cwd),
          encoding: 'utf-8',
          maxBuffer: 20 * 1024 * 1024,
          timeout: timeoutMs,
          input: prompt,
          env: process.env,
        })
      : await runCodexCommandStreaming(args, {
          binaryPath: contract.command[0],
          cwd: path.resolve(cwd),
          timeoutMs,
          stdin: prompt,
        });
  } finally {
    if (outputSchemaFile && existsSync(outputSchemaFile)) unlinkSync(outputSchemaFile);
  }
  if (result.error) throw result.error;
  const parsed = parseCodexExecOutput(result.stdout || '');
  return {
    contract,
    lastMessageFile,
    codexRun: {
      run_id: runId,
      session_id: parsed.threadId || runId,
      terminal_event: (result.status ?? result.exitCode) === 0 ? 'run.completed' : 'run.failed',
      events: events(result.stdout),
      output: existsSync(lastMessageFile) ? readFileSync(lastMessageFile, 'utf-8') : parsed.finalMessage,
      error: (result.status ?? result.exitCode) === 0
        ? null
        : safeText(result.stderr || result.stdout, 'Codex CLI execution failed'),
      exit_code: result.status ?? result.exitCode ?? 1,
    },
  };
}

function blocked(contract, steps, reason) {
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
    error_kind: 'codex_cli_probe_failed',
    blocking_reason: reason,
  };
}

export async function probeCodexCli({
  contract = readCodexCliContract(),
  timeoutMs = DEFAULT_CODEX_PROBE_TIMEOUT_MS,
  cwd = process.cwd(),
  prompt = 'Reply with READY only.',
  spawnSyncImpl = null,
} = {}) {
  const steps = { exec_surface: { ok: false, command: [...contract.command], detail: null, terminal_event: null, run_id: null, exit_code: null } };
  try {
    const execution = await runCodexPrompt({ contract, prompt, cwd, timeoutMs, spawnSyncImpl });
    Object.assign(steps.exec_surface, {
      run_id: execution.codexRun.run_id,
      exit_code: execution.codexRun.exit_code,
      terminal_event: execution.codexRun.terminal_event,
    });
    const output = safeText(execution.codexRun.output);
    if (execution.codexRun.exit_code !== 0 || !/READY/i.test(output)) {
      steps.exec_surface.detail = execution.codexRun.error || 'Codex CLI probe did not return READY';
      return blocked(contract, steps, steps.exec_surface.detail);
    }
    steps.exec_surface.ok = true;
    steps.exec_surface.detail = 'Codex CLI exec surface ready';
    return { ...blocked(contract, steps, null), ok: true, status: 'ready', error_kind: null, blocking_reason: null };
  } catch (error) {
    steps.exec_surface.detail = summarizeError(error);
    return blocked(contract, steps, steps.exec_surface.detail);
  }
}
