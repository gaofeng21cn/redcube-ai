import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { safeText } from './protocol-utils.js';

import type {
  RedCubePythonHelperReference,
  RedCubePythonHelperRunResult,
  RedCubePythonNativeHelper,
  ResolveRedCubePythonNativeHelperOptions,
  RunRedCubePythonHelperOptions,
} from './types.js';

const DEFAULT_CATALOG = 'contracts/runtime-program/python-native-helper-catalog.json';

export function resolvePythonNativeHelper(
  repoRoot: string,
  helperId: string,
  options: ResolveRedCubePythonNativeHelperOptions = {},
): RedCubePythonNativeHelper {
  const catalogFile = path.resolve(repoRoot, options.catalogFile || DEFAULT_CATALOG);
  if (!(options.fileExists || existsSync)(catalogFile)) {
    throw new Error(`Missing Python helper catalog: ${catalogFile}`);
  }
  if (!safeText(helperId)) {
    throw new Error('Python helper id is required');
  }
  return Object.freeze({ helperId, catalogFile });
}

export function pythonHelperReference(
  helper: RedCubePythonNativeHelper,
): RedCubePythonHelperReference {
  if (!helper || typeof helper !== 'object' || !safeText(helper.helperId) || !safeText(helper.catalogFile)) {
    throw new Error('Python helper reference must identify an RCA catalog declaration');
  }
  return {
    helper_id: helper.helperId,
    catalog_ref: helper.catalogFile,
  };
}

function resolveOplCommand(options: RunRedCubePythonHelperOptions) {
  const env = options.env || process.env;
  return safeText(options.oplBin || env.OPL_BIN || env.OPL_COMMAND || 'opl');
}

function oplExecutionEnv(options: RunRedCubePythonHelperOptions) {
  const env = options.env || process.env;
  if (env.OPL_DOMAIN_PYTHON_COMMAND || !env.REDCUBE_PYTHON_COMMAND) return env;
  return {
    ...env,
    OPL_DOMAIN_PYTHON_COMMAND: env.REDCUBE_PYTHON_COMMAND,
  };
}

export function runRedCubePythonHelper(
  helper: RedCubePythonNativeHelper,
  args: string[],
  options: RunRedCubePythonHelperOptions = {},
): RedCubePythonHelperRunResult {
  const reference = pythonHelperReference(helper);
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== 'string')) {
    throw new Error('Python helper args must be a string array');
  }

  const requestDir = mkdtempSync(path.join(options.tempRoot || os.tmpdir(), 'redcube-opl-native-helper-'));
  const requestFile = path.join(requestDir, 'request.json');
  writeFileSync(requestFile, `${JSON.stringify({ args, timeout_seconds: options.timeoutSeconds || 300 })}\n`, 'utf8');

  const command = resolveOplCommand(options);
  const executionArgv = [
    'pack', 'native-helper', 'run',
    '--catalog', reference.catalog_ref,
    '--helper', reference.helper_id,
    '--request', requestFile,
    '--json',
  ];
  const spawnSyncImpl = options.spawnSyncImpl || spawnSync;
  try {
    const result = spawnSyncImpl(command, executionArgv, {
      cwd: options.cwd || path.dirname(reference.catalog_ref),
      encoding: 'utf-8',
      env: oplExecutionEnv(options),
      maxBuffer: options.maxBuffer || 16 * 1024 * 1024,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      const message = String(result.stderr || result.stdout || `${options.failureMessagePrefix || 'OPL native helper failed'}: ${reference.helper_id}`).trim();
      throw new Error(message);
    }
    const envelope = JSON.parse(String(result.stdout || '{}')) as {
      pack_native_helper_execution_receipt?: {
        helper_id?: string;
        package_module?: string;
        payload?: unknown;
      };
    };
    const receipt = envelope.pack_native_helper_execution_receipt;
    if (!receipt || receipt.helper_id !== reference.helper_id || !safeText(receipt.package_module)) {
      throw new Error(`Invalid OPL native helper execution receipt: ${reference.helper_id}`);
    }
    return {
      command,
      helper_id: receipt.helper_id,
      package_module: receipt.package_module as string,
      argv: [
        'pack', 'native-helper', 'run',
        '--catalog', reference.catalog_ref,
        '--helper', reference.helper_id,
        '--request', '<ephemeral-request>',
        '--json',
      ],
      request_args: [...args],
      payload: receipt.payload,
    };
  } finally {
    rmSync(requestDir, { recursive: true, force: true });
  }
}
