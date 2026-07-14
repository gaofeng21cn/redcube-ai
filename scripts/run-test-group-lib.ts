import path from 'node:path';
import process from 'node:process';
import { existsSync, readdirSync } from 'node:fs';
type BuildNodeTestArgsOptions = Readonly<{
  forwardedArgs?: readonly string[];
  serialized?: boolean;
}>;

export function resolveRedCubePythonCommand(
  env: NodeJS.ProcessEnv = process.env,
): { command: string; args: string[] } {
  const configured = String(env.REDCUBE_TEST_PYTHON || env.REDCUBE_PYTHON_COMMAND || '').trim();
  if (configured.startsWith('[')) {
    const parsed = JSON.parse(configured) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every((entry) => typeof entry === 'string')) {
      throw new Error('REDCUBE_PYTHON_COMMAND JSON form must be a non-empty string array.');
    }
    return { command: parsed[0], args: parsed.slice(1) };
  }
  if (configured) return { command: configured, args: [] };

  const projectEnvironment = String(env.UV_PROJECT_ENVIRONMENT || '').trim();
  if (projectEnvironment) {
    const candidate = path.join(projectEnvironment, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
    if (existsSync(candidate)) return { command: candidate, args: [] };
  }
  return { command: process.platform === 'win32' ? 'python' : 'python3', args: [] };
}

export function buildNodeTestArgs({
  forwardedArgs = [],
  serialized = false,
}: BuildNodeTestArgsOptions = {}): string[] {
  const args = ['--test'];
  if (serialized) {
    // Browser / screenshot / local-exec heavy files can still oversubscribe the host;
    // keep only that explicit subset at file-level concurrency 1.
    args.push('--test-concurrency=1');
  }
  return [...args, ...forwardedArgs];
}

export function discoverRootTestFiles({
  testsDir = 'tests',
  entries,
}: {
  testsDir?: string;
  entries?: readonly string[];
} = {}): string[] {
  const directoryEntries = entries ?? readdirSync(path.resolve(testsDir));
  return directoryEntries
    .filter((entry) => entry.endsWith('.test.js') || entry.endsWith('.test.ts'))
    .map((entry) => `${testsDir}/${entry}`)
    .sort();
}

export function assertRootTestPartition({
  discoveredFiles = [],
  partitionFiles = [],
  partitionName = 'meta/integration/e2e/historical',
}: {
  discoveredFiles?: readonly string[];
  partitionFiles?: readonly string[];
  partitionName?: string;
} = {}): void {
  const discovered = [...discoveredFiles].sort();
  const base = [...partitionFiles];
  const duplicates = base.filter((file, index) => base.indexOf(file) !== index);
  if (duplicates.length > 0) {
    throw new Error(`${partitionName} 分组存在重复项: ${[...new Set(duplicates)].join(', ')}`);
  }

  const missing = discovered.filter((file) => !base.includes(file));
  if (missing.length > 0) {
    throw new Error(`未被纳入 ${partitionName} 的测试文件: ${missing.join(', ')}`);
  }

  const unexpected = base.filter((file) => !discovered.includes(file));
  if (unexpected.length > 0) {
    throw new Error(`分组里存在非根级测试文件: ${unexpected.join(', ')}`);
  }
}
