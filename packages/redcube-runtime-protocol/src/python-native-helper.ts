import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { resolveRedCubePythonCommand } from './python-command.js';
import { readJson, safeText } from './protocol-utils.js';

import type {
  RedCubePythonHelperInvocation,
  RedCubePythonHelperReference,
  RedCubePythonHelperRunResult,
  RedCubePythonNativeHelper,
  ResolveRedCubePythonNativeHelperOptions,
  RunRedCubePythonHelperOptions,
} from './types.js';

export function buildPythonHelperEnv(
  pythonRoot: string,
  env: Record<string, string | undefined> = process.env,
): Record<string, string | undefined> {
  const currentPath = safeText(env.PYTHONPATH);
  return {
    ...env,
    PYTHONPATH: currentPath ? `${pythonRoot}${path.delimiter}${currentPath}` : pythonRoot,
  };
}

export function resolvePythonNativeHelper(
  repoRoot: string,
  helperId: string,
  options: ResolveRedCubePythonNativeHelperOptions = {},
): RedCubePythonNativeHelper {
  const catalogFile = path.join(repoRoot, options.catalogFile || 'contracts/runtime-program/python-native-helper-catalog.json');
  const catalog = readJson(catalogFile) as {
    package?: { source_root?: string };
    helpers?: Array<{
      helper_id?: string;
      package_module?: string;
    }>;
  };
  const helper = (Array.isArray(catalog.helpers) ? catalog.helpers : [])
    .find((item) => item?.helper_id === helperId);
  if (!helper?.package_module) {
    throw new Error(`Missing Python helper catalog package_module: ${helperId}`);
  }
  return Object.freeze({
    helperId,
    packageModule: helper.package_module,
    pythonRoot: path.resolve(repoRoot, catalog.package?.source_root || 'python'),
    catalogFile,
  });
}

export function resolvePythonHelperInvocation(
  helper: RedCubePythonNativeHelper,
  options: RunRedCubePythonHelperOptions = {},
): RedCubePythonHelperInvocation {
  const fileExists = options.fileExists || existsSync;
  const env = options.env || process.env;
  if (!helper || typeof helper !== 'object' || !helper.packageModule) {
    throw new Error('Python helper must be resolved from the native helper catalog before invocation');
  }
  const pythonRoot = safeText(helper.pythonRoot);
  if (!pythonRoot || !fileExists(pythonRoot)) {
    throw new Error(`Missing RedCube Python package root for helper ${helper.helperId || helper.packageModule}: ${pythonRoot}`);
  }
  return {
    helperId: helper.helperId || helper.packageModule,
    packageModule: helper.packageModule,
    argv: ['-m', helper.packageModule],
    env: buildPythonHelperEnv(pythonRoot, env),
    label: helper.packageModule,
  };
}

export function pythonHelperReference(
  helper: RedCubePythonNativeHelper,
): RedCubePythonHelperReference {
  if (!helper || typeof helper !== 'object' || !helper.packageModule) {
    throw new Error('Python helper reference must come from the native helper catalog');
  }
  return {
    helper_id: helper.helperId || helper.packageModule,
    package_module: helper.packageModule,
  };
}

export function runRedCubePythonHelper(
  helper: RedCubePythonNativeHelper,
  args: string[],
  options: RunRedCubePythonHelperOptions = {},
): RedCubePythonHelperRunResult {
  const invocation = resolvePythonHelperInvocation(helper, options);
  const spawnSyncImpl = options.spawnSyncImpl || spawnSync;
  const pythonCommand = resolveRedCubePythonCommand({
    env: options.env,
    fileExists: options.fileExists,
    pythonProbeImpl: options.pythonProbeImpl,
  });
  const result = spawnSyncImpl(pythonCommand.command, [...(pythonCommand.args || []), ...invocation.argv, ...args], {
    encoding: 'utf-8',
    env: {
      ...invocation.env,
      ...pythonCommand.runtimeEnv,
    },
    maxBuffer: options.maxBuffer || 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const message = String(result.stderr || result.stdout || `${options.failureMessagePrefix || 'python helper failed'}: ${invocation.label}`).trim();
    throw new Error(message);
  }
  return {
    command: pythonCommand.command,
    helper_id: invocation.helperId,
    package_module: invocation.packageModule,
    argv: invocation.argv,
    payload: JSON.parse(String(result.stdout || '{}')),
  };
}
