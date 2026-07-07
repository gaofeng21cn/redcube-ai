// @ts-nocheck
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { accessSync, constants as fsConstants, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';

import { CODEX_DEFAULT_MODEL_SELECTION, CODEX_DEFAULT_REASONING_SELECTION } from '@redcube/runtime-protocol';

import {
  DEFAULT_CODEX_COMMAND,
  DEFAULT_CODEX_PROBE_TIMEOUT_MS,
  DEFAULT_CODEX_SANDBOX,
  REDCUBE_CODEX_RUNTIME_OWNER,
} from './constants.js';
import { optionalText, safeText, summarizeError } from './shared.js';

function ensureTempDir() {
  const dir = path.join(os.tmpdir(), 'redcube-opl-codex-executor');
  mkdirSync(dir, { recursive: true });
  return dir;
}

function killCodexChildProcessTree(child) {
  if (!child) return;
  const pid = Number(child.pid || 0);
  if (process.platform !== 'win32' && pid > 0) {
    try {
      process.kill(-pid, 'SIGKILL');
      return;
    } catch {
      // Fall through to direct child kill when process-group kill is unavailable.
    }
  }
  try {
    child.kill('SIGKILL');
  } catch {
    // Ignore best-effort cleanup failures.
  }
}

function commandName(command) {
  return path.basename(safeText(command)).toLowerCase();
}

function terminateProcessGroup(pid) {
  const numericPid = Number(pid || 0);
  if (!Number.isInteger(numericPid) || numericPid <= 0) return false;
  if (process.platform === 'win32') return false;
  try {
    process.kill(-numericPid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

function killProcessGroup(pid) {
  const numericPid = Number(pid || 0);
  if (!Number.isInteger(numericPid) || numericPid <= 0) return false;
  if (process.platform === 'win32') return false;
  try {
    process.kill(-numericPid, 'SIGKILL');
    return true;
  } catch {
    return false;
  }
}

function reapTimedOutCodexExecutors(parentPid) {
  if (process.platform === 'win32') return;
  const parent = Number(parentPid || 0);
  if (!Number.isInteger(parent) || parent <= 0) return;
  const result = spawnSync('ps', ['-axo', 'pid=,ppid=,command='], {
    encoding: 'utf-8',
    timeout: 5000,
  });
  if (result.status !== 0) return;
  for (const line of String(result.stdout || '').split('\n')) {
    const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/);
    if (!match) continue;
    const pid = Number(match[1]);
    const ppid = Number(match[2]);
    const command = match[3] || '';
    if (ppid !== parent) continue;
    if (!/\bcodex\b/.test(command) && !/codex-canonical/.test(command)) continue;
    terminateProcessGroup(pid);
    killProcessGroup(pid);
  }
}

function parseCodexCommand(value, env = process.env) {
  const raw = String(value || '').trim();
  if (!raw) {
    const canonicalCommand = path.join(optionalText(env.HOME) || os.homedir(), 'bin', 'codex-canonical');
    try { accessSync(canonicalCommand, fsConstants.X_OK); if (statSync(canonicalCommand).isFile()) return [canonicalCommand]; } catch {}
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
    command: parseCodexCommand(env.REDCUBE_CODEX_COMMAND, env),
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
  if (contract.enable_image_generation === true) {
    args.push('--enable', 'image_generation');
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

export async function runCodexPrompt({
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
  } else if (commandName(contract.command[0]) === 'node'
    && contract.command.some((part) => commandName(part) === 'codex' || commandName(part) === 'codex-canonical')) {
    result = spawnSync(
      contract.command[0],
      [...contract.command.slice(1), ...execArgs],
      {
        cwd: resolvedCwd,
        input: safePrompt,
        encoding: 'utf-8',
        maxBuffer: 20 * 1024 * 1024,
        timeout: timeoutMs,
        env: process.env,
        detached: process.platform !== 'win32',
      },
    );
    if (result.error) {
      if (result.error.code === 'ETIMEDOUT') {
        reapTimedOutCodexExecutors(result.pid);
      }
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
          detached: process.platform !== 'win32',
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
            killCodexChildProcessTree(child);
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
