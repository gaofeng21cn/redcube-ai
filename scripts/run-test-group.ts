// @ts-nocheck
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  assertCurrentRepoSharedPinAlignment,
  assertRootTestPartition,
  assertRequiredRuntimeSharedResolution,
  assertWorkspacePackageResolution,
  buildNodeTestArgs,
  discoverRootTestFiles,
  parseRunTestGroupArgs,
  selectGroupFiles,
  resolveRedCubePythonCommand,
} from './run-test-group-lib.ts';
import {
  assertValidTestRegistry,
  buildTestGroups,
  groupRequiresLiveCodexPreflight,
  partitionTestFilesForExecution,
  rootPartitionFiles,
} from './test-registry.ts';
import {
  probeCodexCli,
  readCodexCliContract,
} from '@redcube/runtime';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
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

const hygieneResult = spawnSync('scripts/repo-hygiene.sh', {
  cwd: repoRoot,
  encoding: 'utf8',
  stdio: 'inherit',
});
if (hygieneResult.status !== 0) {
  process.exit(hygieneResult.status ?? 1);
}
assertWorkspacePackageResolution({ repoRoot });
assertRequiredRuntimeSharedResolution({ repoRoot });
assertCurrentRepoSharedPinAlignment({ repoRoot });

assertValidTestRegistry();
const GROUPS = buildTestGroups();
async function prepareSerializedVerification(groupName) {
  if (!groupRequiresLiveCodexPreflight(groupName)) {
    return null;
  }

  const pythonCommand = resolveRedCubePythonCommand();
  process.env.REDCUBE_PYTHON_COMMAND = pythonCommand.command;

  const codexProbe = await probeCodexCli({
    contract: readCodexCliContract(process.env),
    cwd: repoRoot,
    timeoutMs: 60000,
  });
  if (!codexProbe.ok) {
    throw new Error([
      '无法完成本地 Codex CLI 预检',
      JSON.stringify(codexProbe, null, 2),
    ].join('\n'));
  }

  process.stdout.write(`[run-test-group] local codex command: ${codexProbe.contract.command.join(' ')}\n`);
  process.stdout.write(`[run-test-group] local codex python command: ${pythonCommand.command}\n`);
  process.stdout.write('[run-test-group] local codex exec preflight passed\n');
}

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
    `用法: node --experimental-strip-types scripts/run-test-group.ts <${groupNames}> [--files tests/a.test.ts,tests/b.test.ts] [node --test 参数]`,
    '示例: node --experimental-strip-types scripts/run-test-group.ts smoke --test-reporter=dot',
    '示例: node --experimental-strip-types scripts/run-test-group.ts full --test-reporter=dot',
    '示例: node --experimental-strip-types scripts/run-test-group.ts full:with-historical --test-reporter=dot',
    '示例: node --experimental-strip-types scripts/run-test-group.ts full:remaining --test-reporter=dot',
    '示例: node --experimental-strip-types scripts/run-test-group.ts integration:remaining --test-reporter=dot',
    '示例: node --experimental-strip-types scripts/run-test-group.ts integration --files tests/source-intake.test.ts --test-reporter=dot',
  ].join('\n'));
}

let parsedArgs;
try {
  parsedArgs = parseRunTestGroupArgs(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  printUsage();
  process.exit(1);
}

const { groupName, forwardedArgs, requestedFiles } = parsedArgs;

if (!groupName || !Object.hasOwn(GROUPS, groupName)) {
  printUsage();
  process.exit(groupName ? 1 : 0);
}

for (const [name, files] of Object.entries(GROUPS)) {
  assertTrackedFiles(files, name);
}
assertPartition();

const selectedFiles = selectGroupFiles({
  groupName,
  groupFiles: GROUPS[groupName],
  requestedFiles,
});
await prepareSerializedVerification(groupName);
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

  const result = spawnSync(process.execPath, [...buildNodeTestArgs({ forwardedArgs, serialized }), ...files], {
    stdio: 'inherit',
    cwd: repoRoot,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

function runSerializedNodeTestFiles({ label, files }) {
  if (files.length === 0) {
    return 0;
  }

  process.stdout.write(
    `[run-test-group] ${groupName} ${label}: ${files.length} files (one process per file)\n`,
  );

  for (const file of files) {
    const status = runNodeTestBatch({
      label: `${label}: ${file}`,
      files: [file],
      serialized: true,
    });
    if (status !== 0) {
      return status;
    }
  }
  return 0;
}

const parallelStatus = runNodeTestBatch({
  label: 'parallel batch',
  files: executionPlan.parallel_files,
  serialized: false,
});
if (parallelStatus !== 0) {
  process.exit(parallelStatus);
}

const serializedStatus = runSerializedNodeTestFiles({
  label: 'serialized route-heavy batch',
  files: executionPlan.serialized_files,
});
process.exit(serializedStatus);
