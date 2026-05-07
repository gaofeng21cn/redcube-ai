// @ts-nocheck
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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
  partitionTestFilesForExecution,
  selectGroupFiles,
  SERIALIZED_VERIFICATION_GROUP_NAMES,
  resolveRedCubePythonCommand,
} from './run-test-group-lib.ts';
import {
  assertValidTestRegistry,
  buildTestGroups,
  rootPartitionFiles,
} from './test-registry.ts';
import {
  probeCodexCli,
  readCodexCliContract,
} from '@redcube/codex-cli-client';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

process.chdir(repoRoot);
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
  if (!SERIALIZED_VERIFICATION_GROUP_NAMES.has(groupName)) {
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
  return {
    codexProbe,
    pythonCommand,
  };
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
const serializedVerificationHandle = await prepareSerializedVerification(groupName);
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

try {
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
} finally {
  void serializedVerificationHandle;
}
