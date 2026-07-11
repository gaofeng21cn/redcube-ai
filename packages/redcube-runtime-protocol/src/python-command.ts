import { resolveDomainPythonCommand } from 'opl-framework/domain-helper-runtime';

import type {
  ResolvedRedCubePythonCommand,
  ResolveRedCubePythonCommandOptions,
} from './types.js';

export const REDCUBE_PYTHON_COMMAND_ENV = 'REDCUBE_PYTHON_COMMAND';

export function resolveRedCubePythonCommand({
  env = process.env,
  fileExists,
  pythonProbeImpl,
}: ResolveRedCubePythonCommandOptions = {}): ResolvedRedCubePythonCommand {
  const resolved = resolveDomainPythonCommand({
    command_env: REDCUBE_PYTHON_COMMAND_ENV,
    env: {
      ...env,
      [REDCUBE_PYTHON_COMMAND_ENV]: env[REDCUBE_PYTHON_COMMAND_ENV],
    },
    managed_python_path: env.OPL_MANAGED_PYTHON,
    required_modules: ['playwright'],
    cache_root: env.REDCUBE_RUNTIME_STATE_ROOT,
    file_exists: fileExists,
    probe_python: pythonProbeImpl,
  });
  return {
    command: resolved.command,
    args: resolved.args,
    source: resolved.source === 'explicit_env'
      ? 'env'
      : resolved.source === 'managed_runtime'
        ? 'managed_python_runtime'
        : 'python3_with_playwright',
    runtimeEnv: resolved.runtime_env,
  };
}
