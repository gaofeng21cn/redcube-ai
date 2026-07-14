// @ts-nocheck
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  assertRootTestPartition,
  buildNodeTestArgs,
  discoverRootTestFiles,
} from './run-test-group-lib.ts';
import {
  assertValidTestRegistry,
  buildTestGroups,
  partitionTestFilesForExecution,
  rootPartitionFiles,
} from './test-registry.ts';

const scriptDir = import.meta.dirname;
const repoRoot = path.resolve(scriptDir, '..');

process.chdir(repoRoot);

function pathIsInsideRepo(value) {
  if (!value) {
    return false;
  }
  const resolved = path.resolve(value);
  return resolved === repoRoot || resolved.startsWith(`${repoRoot}${path.sep}`);
}

const repoTempRoot =
  process.env.OPL_REPO_TEMP_ROOT && !pathIsInsideRepo(process.env.OPL_REPO_TEMP_ROOT)
    ? process.env.OPL_REPO_TEMP_ROOT
    : mkdtempSync(path.join(
        process.env.OPL_SHORT_TMPDIR && !pathIsInsideRepo(process.env.OPL_SHORT_TMPDIR)
          ? process.env.OPL_SHORT_TMPDIR
          : '/tmp',
        'redcube-repo-temp-',
      ));
const pythonCacheRoot = path.join(repoTempRoot, 'python-test-cache');
mkdirSync(path.join(repoTempRoot, 'tmp'), { recursive: true });
mkdirSync(pythonCacheRoot, { recursive: true });
mkdirSync(path.join(repoTempRoot, 'uv', 'cache'), { recursive: true });
mkdirSync(path.join(repoTempRoot, 'uv', 'project-venv'), { recursive: true });
mkdirSync(path.join(repoTempRoot, 'npm', 'cache'), { recursive: true });
mkdirSync(path.join(repoTempRoot, 'node', 'compile-cache'), { recursive: true });
mkdirSync(path.join(repoTempRoot, 'xdg-cache'), { recursive: true });
mkdirSync(path.join(repoTempRoot, 'opl-state'), { recursive: true });

function externalEnvValue(name, fallback) {
  const current = process.env[name];
  return current && !pathIsInsideRepo(current) ? current : fallback;
}

process.env.OPL_REPO_TEMP_ROOT = repoTempRoot;
process.env.TMPDIR = externalEnvValue('TMPDIR', `${path.join(repoTempRoot, 'tmp')}${path.sep}`);
process.env.PYTHONDONTWRITEBYTECODE = process.env.PYTHONDONTWRITEBYTECODE || '1';
process.env.PYTHONPYCACHEPREFIX = externalEnvValue('PYTHONPYCACHEPREFIX', path.join(pythonCacheRoot, 'pycache'));
process.env.PYTEST_ADDOPTS = [
  process.env.PYTEST_ADDOPTS || '',
  '-p no:cacheprovider',
  `-o cache_dir=${path.join(pythonCacheRoot, 'pytest-cache')}`,
].filter(Boolean).join(' ');
process.env.UV_CACHE_DIR = externalEnvValue('UV_CACHE_DIR', path.join(repoTempRoot, 'uv', 'cache'));
process.env.UV_PROJECT_ENVIRONMENT = externalEnvValue(
  'UV_PROJECT_ENVIRONMENT',
  path.join(repoTempRoot, 'uv', 'project-venv'),
);
process.env.NPM_CONFIG_CACHE = externalEnvValue('NPM_CONFIG_CACHE', path.join(repoTempRoot, 'npm', 'cache'));
process.env.npm_config_cache = externalEnvValue('npm_config_cache', process.env.NPM_CONFIG_CACHE);
process.env.NODE_COMPILE_CACHE = externalEnvValue(
  'NODE_COMPILE_CACHE',
  path.join(repoTempRoot, 'node', 'compile-cache'),
);
process.env.XDG_CACHE_HOME = externalEnvValue('XDG_CACHE_HOME', path.join(repoTempRoot, 'xdg-cache'));
process.env.OPL_STATE_DIR = path.join(repoTempRoot, 'opl-state');

const hygieneResult = spawnSync('scripts/repo-hygiene.sh', {
  cwd: repoRoot,
  encoding: 'utf8',
  stdio: 'inherit',
});
if (hygieneResult.status !== 0) {
  process.exit(hygieneResult.status ?? 1);
}
assertValidTestRegistry();
const GROUPS = buildTestGroups();
function assertTrackedFiles(files, groupName) {
  for (const file of files) {
    if (!existsSync(path.resolve(file))) {
      throw new Error(`${groupName} 引用了不存在的测试文件: ${file}`);
    }
  }
}

function assertPartition() {
  assertRootTestPartition({
    discoveredFiles: discoverRootTestFiles(),
    partitionFiles: rootPartitionFiles(),
  });
}

function printUsage() {
  const groupNames = Object.keys(GROUPS).join('|');
  process.stdout.write([
    `用法: node scripts/run-test-group.ts <${groupNames}> [tests/example.test.js] [node --test 参数]`,
    '示例: node scripts/run-test-group.ts smoke --test-reporter=dot',
    '示例: node scripts/run-test-group.ts integration tests/python-native-helper-catalog.test.js --test-reporter=dot',
  ].join('\n'));
}

const [groupName, ...rawArgs] = process.argv.slice(2);
const requestedFiles = rawArgs.filter((arg) => /^tests\/[^/]+\.test\.(?:js|ts)$/.test(arg));
const forwardedArgs = rawArgs.filter((arg) => !requestedFiles.includes(arg));

if (!groupName || !Object.hasOwn(GROUPS, groupName)) {
  printUsage();
  process.exit(groupName ? 1 : 0);
}

for (const [name, files] of Object.entries(GROUPS)) {
  assertTrackedFiles(files, name);
}
assertPartition();

const missingRequestedFiles = requestedFiles.filter((file) => !GROUPS[groupName].includes(file));
if (missingRequestedFiles.length > 0) {
  throw new Error(`${groupName} 分组不包含请求的测试文件: ${missingRequestedFiles.join(', ')}`);
}
const selectedFiles = requestedFiles.length > 0 ? requestedFiles : GROUPS[groupName];
const executionPlan = partitionTestFilesForExecution({
  groupName,
  files: selectedFiles,
});

function runNodeTestBatch({ label, files, serialized }) {
  if (files.length === 0) {
    return 0;
  }

  process.stdout.write([
    `[run-test-group] ${groupName} ${label}: ${files.length} files`,
    serialized ? '(file concurrency = 1)' : '(runner default concurrency)',
  ].join(' ') + '\n');

  const result = spawnSync('node', [...buildNodeTestArgs({ forwardedArgs, serialized }), ...files], {
    stdio: 'inherit',
    cwd: repoRoot,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

const parallelStatus = runNodeTestBatch({
  label: 'parallel batch',
  files: executionPlan.parallel_files,
  serialized: false,
});
if (parallelStatus !== 0) {
  process.exit(parallelStatus);
}

const serializedStatus = runNodeTestBatch({
  label: 'serialized route-heavy batch',
  files: executionPlan.serialized_files,
  serialized: true,
});
process.exit(serializedStatus);
