import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

export const repoRoot = path.resolve(import.meta.dirname, '..');

export function ensureRepoTempEnvironment(entrypoint: string, args: readonly string[]): void {
  if (process.env.OPL_REPO_TEMP_ENV_ACTIVE === '1') {
    return;
  }

  const result = spawnSync(
    'scripts/run-with-repo-temp-env.sh',
    ['node', entrypoint, ...args],
    {
      cwd: repoRoot,
      env: process.env,
      stdio: 'inherit',
    },
  );
  if (result.error) {
    throw result.error;
  }
  process.exit(result.status ?? 1);
}
