import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  ResolvedRedCubePythonCommand,
  ResolveRedCubePythonCommandOptions,
} from './types.js';

export const REDCUBE_PYTHON_COMMAND_ENV = 'REDCUBE_PYTHON_COMMAND';
const PYTHON_PLAYWRIGHT_PROBE_COMMAND = 'python3';
const PYTHON_PLAYWRIGHT_PROBE_ARGS = ['-c', 'import sys; import playwright; print(sys.executable)'];

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');
const REQUIREMENTS_FILE = path.join(REPO_ROOT, '.github', 'requirements', 'ci-python.txt');
const RUNTIME_STATE_ROOT_ENV = 'REDCUBE_RUNTIME_STATE_ROOT';
const MANAGED_PYTHON_ROOT_SEGMENTS = ['python', 'stable-playwright'];
const MANAGED_PYTHON_MARKER_FILE = 'installation.json';
const PYTHON_VERSION_PROBE_ARGS = [
  '-c',
  'import json, sys; print(json.dumps({"executable": sys.executable, "version": ".".join(map(str, sys.version_info[:3])), "major": sys.version_info[0], "minor": sys.version_info[1]}))',
];
const MANAGED_PYTHON_BASE_CANDIDATES = ['python3.12', 'python3.13', 'python3'];

type EnvMap = Record<string, string | undefined>;
type SpawnSyncImpl = typeof spawnSync;
type JsonRecord = Record<string, unknown>;
type ProbeFailure = { ok: false; command: string; error: string };
type PlaywrightProbe = ProbeFailure | { ok: true; command: string; executable: string };
type VersionProbe = ProbeFailure | { ok: true; command: string; executable: string; version: string; major: number; minor: number };
type ManagedPythonPaths = {
  root: string;
  venvDir: string;
  pythonCommand: string;
  markerFile: string;
};

function safeText(value: unknown): string {
  return String(value || '').trim();
}

function parseExplicitPythonCommand(value: string): Pick<ResolvedRedCubePythonCommand, 'command' | 'args'> {
  const raw = safeText(value);
  if (raw.startsWith('[')) {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(`${REDCUBE_PYTHON_COMMAND_ENV} 若使用 JSON array，必须是非空字符串数组`);
    }
    const command = parsed.map((item) => safeText(item)).filter(Boolean);
    if (command.length === 0) {
      throw new Error(`${REDCUBE_PYTHON_COMMAND_ENV} 解析后不能为空`);
    }
    return {
      command: command[0],
      args: command.slice(1),
    };
  }
  return { command: raw };
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeJson(file: string): JsonRecord | null {
  if (!safeText(file) || !existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as unknown;
    return isJsonRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function probeFailureMessage(result: { stderr?: unknown; stdout?: unknown } | null | undefined): string {
  const stderr = safeText(result?.stderr);
  const stdout = safeText(result?.stdout);
  return stderr || stdout || 'unknown probe failure';
}

function parseResolvedCommand(stdout: unknown): string {
  return safeText(stdout)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1) || '';
}

function parseVersionProbe(stdout: unknown): Omit<Extract<VersionProbe, { ok: true }>, 'ok' | 'command'> | null {
  const payload = safeText(stdout)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as JsonRecord;
    return {
      executable: safeText(parsed?.executable),
      version: safeText(parsed?.version),
      major: Number(parsed?.major || 0),
      minor: Number(parsed?.minor || 0),
    };
  } catch {
    return null;
  }
}

function isStablePythonVersion(probe: Pick<Extract<VersionProbe, { ok: true }>, 'major' | 'minor'> | null | undefined): boolean {
  return Number(probe?.major) === 3 && Number(probe?.minor) > 0 && Number(probe?.minor) < 14;
}

function probePythonWithPlaywright(command: string, spawnSyncImpl: SpawnSyncImpl): PlaywrightProbe {
  try {
    const result = spawnSyncImpl(command, PYTHON_PLAYWRIGHT_PROBE_ARGS, {
      encoding: 'utf-8',
    });
    if (result?.status !== 0) {
      return {
        ok: false,
        command,
        error: probeFailureMessage(result),
      };
    }
    const executable = parseResolvedCommand(result.stdout);
    if (!executable) {
      return {
        ok: false,
        command,
        error: 'python probe returned empty executable path',
      };
    }
    return {
      ok: true,
      command,
      executable,
    };
  } catch (error) {
    return {
      ok: false,
      command,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function probePythonVersion(command: string, spawnSyncImpl: SpawnSyncImpl): VersionProbe {
  try {
    const result = spawnSyncImpl(command, PYTHON_VERSION_PROBE_ARGS, {
      encoding: 'utf-8',
    });
    if (result?.status !== 0) {
      return {
        ok: false,
        command,
        error: probeFailureMessage(result),
      };
    }
    const parsed = parseVersionProbe(result.stdout);
    if (!parsed?.executable) {
      return {
        ok: false,
        command,
        error: 'python version probe returned invalid payload',
      };
    }
    return {
      ok: true,
      command,
      ...parsed,
    };
  } catch (error) {
    return {
      ok: false,
      command,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function resolveCodexHome(env: EnvMap): string {
  const explicitHome = safeText(env?.CODEX_HOME);
  if (explicitHome) {
    return path.resolve(explicitHome);
  }
  return path.join(os.homedir(), '.codex');
}

function resolveRuntimeStateRoot(env: EnvMap): string {
  const explicitRoot = safeText(env?.[RUNTIME_STATE_ROOT_ENV]);
  if (explicitRoot) {
    return path.resolve(explicitRoot);
  }
  return path.join(resolveCodexHome(env), 'projects', 'redcube-ai', 'runtime-state');
}

function managedPythonPaths(env: EnvMap): ManagedPythonPaths {
  const root = path.join(resolveRuntimeStateRoot(env), ...MANAGED_PYTHON_ROOT_SEGMENTS);
  return {
    root,
    venvDir: path.join(root, 'venv'),
    pythonCommand: path.join(root, 'venv', 'bin', 'python'),
    markerFile: path.join(root, MANAGED_PYTHON_MARKER_FILE),
  };
}

function requirementsSignature(): string {
  const content = readFileSync(REQUIREMENTS_FILE, 'utf-8');
  return createHash('sha256').update(content).digest('hex');
}

function managedPythonReady(paths: ManagedPythonPaths, spawnSyncImpl: SpawnSyncImpl, signature: string): boolean {
  const marker = safeJson(paths.markerFile);
  if (!existsSync(paths.pythonCommand)) return false;
  if (!marker || marker.requirements_signature !== signature) return false;
  const playwrightProbe = probePythonWithPlaywright(paths.pythonCommand, spawnSyncImpl);
  if (!playwrightProbe.ok) return false;
  const versionProbe = probePythonVersion(playwrightProbe.executable, spawnSyncImpl);
  return versionProbe.ok && isStablePythonVersion(versionProbe);
}

function runOrThrow(command: string, args: string[], spawnSyncImpl: SpawnSyncImpl, label: string): void {
  let result;
  try {
    result = spawnSyncImpl(command, args, {
      encoding: 'utf-8',
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (error) {
    throw new Error(`${label} 失败。\nCommand: ${command} ${args.join(' ')}\nError: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (result?.status !== 0) {
    throw new Error(`${label} 失败。\nCommand: ${command} ${args.join(' ')}\nResult: ${probeFailureMessage(result)}`);
  }
}

function resolveManagedBasePython(spawnSyncImpl: SpawnSyncImpl): Extract<VersionProbe, { ok: true }> | null {
  for (const command of MANAGED_PYTHON_BASE_CANDIDATES) {
    const probe = probePythonVersion(command, spawnSyncImpl);
    if (probe.ok && isStablePythonVersion(probe)) {
      return probe;
    }
  }
  return null;
}

function ensureManagedPythonCommand(env: EnvMap, spawnSyncImpl: SpawnSyncImpl): ResolvedRedCubePythonCommand {
  const paths = managedPythonPaths(env);
  const signature = requirementsSignature();
  if (managedPythonReady(paths, spawnSyncImpl, signature)) {
    return {
      command: paths.pythonCommand,
      source: 'managed_python_runtime',
    };
  }

  const basePython = resolveManagedBasePython(spawnSyncImpl);
  if (!basePython?.executable) {
    throw new Error([
      `${REDCUBE_PYTHON_COMMAND_ENV} 未设置，且本机没有可用于托管 RedCube Python 的稳定 Python 3.12/3.13。`,
      `请安装 Python 3.12 或 3.13，或显式设置 ${REDCUBE_PYTHON_COMMAND_ENV}。`,
    ].join('\n'));
  }

  mkdirSync(paths.root, { recursive: true });
  rmSync(paths.venvDir, { recursive: true, force: true });
  runOrThrow(basePython.executable, ['-m', 'venv', paths.venvDir], spawnSyncImpl, '创建托管 Python 虚拟环境');
  runOrThrow(paths.pythonCommand, ['-m', 'pip', 'install', '-r', REQUIREMENTS_FILE], spawnSyncImpl, '安装 RedCube Python 依赖');
  runOrThrow(paths.pythonCommand, ['-m', 'playwright', 'install', 'chromium'], spawnSyncImpl, '安装 Playwright Chromium');
  writeFileSync(paths.markerFile, JSON.stringify({
    requirements_signature: signature,
    base_python: basePython.executable,
    base_version: basePython.version,
  }, null, 2), 'utf-8');

  if (!managedPythonReady(paths, spawnSyncImpl, signature)) {
    throw new Error('托管 Python 环境创建完成后仍未通过 playwright/版本探测。');
  }
  return {
    command: paths.pythonCommand,
    source: 'managed_python_runtime',
  };
}

export function resolveRedCubePythonCommand({
  env = process.env,
  spawnSyncImpl = spawnSync,
}: ResolveRedCubePythonCommandOptions = {}): ResolvedRedCubePythonCommand {
  const explicitCommand = safeText(env?.[REDCUBE_PYTHON_COMMAND_ENV]);
  if (explicitCommand) {
    return {
      ...parseExplicitPythonCommand(explicitCommand),
      source: 'env',
    };
  }

  const playwrightProbe = probePythonWithPlaywright(PYTHON_PLAYWRIGHT_PROBE_COMMAND, spawnSyncImpl);
  if (playwrightProbe.ok) {
    const versionProbe = probePythonVersion(playwrightProbe.executable, spawnSyncImpl);
    if (versionProbe.ok && isStablePythonVersion(versionProbe)) {
      return {
        command: versionProbe.executable,
        source: 'python3_with_playwright',
      };
    }
  }

  try {
    return ensureManagedPythonCommand(env, spawnSyncImpl);
  } catch (managedError) {
    const hostProbeMessage = playwrightProbe.ok
      ? `Host python probe: ${playwrightProbe.executable} 不满足稳定版本要求（需要 < 3.14）。`
      : `Host python probe: ${playwrightProbe.error}`;
    throw new Error([
      `${REDCUBE_PYTHON_COMMAND_ENV} 未设置，且无法解析到稳定可用的 Python。`,
      hostProbeMessage,
      managedError instanceof Error ? managedError.message : String(managedError),
      `也可以显式设置 ${REDCUBE_PYTHON_COMMAND_ENV} 指向已安装 playwright 的稳定 Python 可执行文件。`,
    ].join('\n'));
  }
}
