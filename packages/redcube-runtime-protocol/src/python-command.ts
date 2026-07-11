import { resolveDomainPythonCommand } from 'opl-framework/domain-helper-runtime';

import type {
  ResolvedRedCubePythonCommand,
  ResolveRedCubePythonCommandOptions,
} from './types.js';

export const REDCUBE_PYTHON_COMMAND_ENV = 'REDCUBE_PYTHON_COMMAND';

export function resolveRedCubePythonCommand({
  env = process.env,
}: ResolveRedCubePythonCommandOptions = {}): ResolvedRedCubePythonCommand {
  const resolved = resolveDomainPythonCommand({
    command_env: REDCUBE_PYTHON_COMMAND_ENV,
    env,
    managed_python_path: env.OPL_MANAGED_PYTHON,
    required_modules: ['playwright'],
    cache_root: env.REDCUBE_RUNTIME_STATE_ROOT,
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
