// @ts-nocheck
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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
  rootPartitionFiles,
} from './test-registry.ts';
import { ensureRepoTempEnvironment, repoRoot } from './verification-runtime.ts';

ensureRepoTempEnvironment('scripts/run-test-group.ts', process.argv.slice(2));

process.chdir(repoRoot);
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

function runNodeTestBatch(files) {
  if (files.length === 0) {
    return 0;
  }

  process.stdout.write(`[run-test-group] ${groupName}: ${files.length} files (runner default concurrency)\n`);

  const result = spawnSync('node', [...buildNodeTestArgs({ forwardedArgs }), ...files], {
    stdio: 'inherit',
    cwd: repoRoot,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

process.exit(runNodeTestBatch(selectedFiles));
