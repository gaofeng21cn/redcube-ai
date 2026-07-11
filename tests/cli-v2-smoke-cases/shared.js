import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { cpSync, copyFileSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import {
  startMockCodexCli,
  withEnv,
} from '../helpers/mock-codex-cli.js';

const execFileAsync = promisify(execFile);
const domainEntryResolve = createRequire(path.resolve('packages/redcube-domain-entry/package.json'));
const CLI_STDIO_MAX_BUFFER = 8 * 1024 * 1024;

function copyPackageIntoInstall(sourceDir, targetDir) {
  cpSync(sourceDir, targetDir, {
    recursive: true,
    force: true,
  });
}

export function createIsolatedCliInstall() {
  const installRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-isolated-'));
  const cliDir = path.join(installRoot, 'dist');
  const consumerNodeModulesDir = path.join(installRoot, 'node_modules', '@redcube');
  const domainEntryPackagePath = path.join(consumerNodeModulesDir, 'domain-entry');
  const domainEntryNodeModulesDir = path.join(domainEntryPackagePath, 'node_modules', '@redcube');
  const runtimeProtocolPackagePath = path.join(domainEntryNodeModulesDir, 'runtime-protocol');

  mkdirSync(cliDir, { recursive: true });
  mkdirSync(consumerNodeModulesDir, { recursive: true });

  const domainEntrySourcePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-domain-entry/package.json'), 'utf-8'),
  );

  copyFileSync(
    path.resolve('apps/redcube-cli/dist/cli.js'),
    path.join(cliDir, 'cli.js'),
  );
  copyFileSync(
    path.resolve('apps/redcube-cli/src/cli.ts'),
    path.join(cliDir, 'cli.ts'),
  );
  cpSync(
    path.resolve('apps/redcube-cli/dist/cli-parts'),
    path.join(cliDir, 'cli-parts'),
    {
      recursive: true,
      force: true,
    },
  );
  writeFileSync(
    path.join(installRoot, 'package.json'),
    JSON.stringify({
      name: 'redcube-cli-isolated-test',
      private: true,
      type: 'module',
      dependencies: {
        '@redcube/domain-entry': domainEntrySourcePackageJson.version,
      },
    }, null, 2),
    'utf-8',
  );

  for (const [source, target] of [
    ['packages/redcube-domain-entry', domainEntryPackagePath],
    ['packages/redcube-runtime-protocol', runtimeProtocolPackagePath],
    ['packages/redcube-runtime', path.join(domainEntryNodeModulesDir, 'runtime')],
    ['packages/redcube-config', path.join(domainEntryNodeModulesDir, 'redcube-config')],
    ['packages/redcube-governance', path.join(domainEntryNodeModulesDir, 'governance')],
    ['packages/redcube-runtime/src/families/ppt', path.join(domainEntryNodeModulesDir, 'runtime-family-ppt')],
    ['packages/redcube-runtime/src/families/ppt', path.join(domainEntryPackagePath, 'node_modules', '@redcube', 'runtime-family-ppt')],
    ['packages/redcube-runtime/src/families/xiaohongshu', path.join(domainEntryNodeModulesDir, 'runtime-family-xiaohongshu')],
    ['packages/redcube-runtime/src/families/poster-onepager', path.join(domainEntryNodeModulesDir, 'runtime-family-poster-onepager')],
    ['packages/redcube-runtime/src/families/poster-onepager', path.join(domainEntryPackagePath, 'node_modules', '@redcube', 'runtime-family-poster-onepager')],
    ['packages/redcube-overlay-core', path.join(domainEntryNodeModulesDir, 'overlay-core')],
    ['prompts', path.join(domainEntryPackagePath, 'node_modules', 'prompts')],
    ['contracts', path.join(installRoot, 'node_modules', 'contracts')],
    ['contracts', path.join(domainEntryPackagePath, 'node_modules', 'contracts')],
  ]) {
    copyPackageIntoInstall(path.resolve(source), target);
  }

  const oplFrameworkSharedDist = domainEntryResolve.resolve('opl-framework-shared/family-orchestration');
  const oplFrameworkSharedPackageRoot = path.resolve(path.dirname(oplFrameworkSharedDist), '..');
  copyPackageIntoInstall(
    oplFrameworkSharedPackageRoot,
    path.join(domainEntryPackagePath, 'node_modules', 'opl-framework-shared'),
  );

  return {
    cliPath: path.join(cliDir, 'cli.js'),
    domainEntryPackagePath,
    runtimeProtocolPackagePath,
    installRoot,
  };
}

export function execCliExpectFailure(cliPath, args, options) {
  try {
    execFileSync('node', [cliPath, ...args], {
      encoding: 'utf-8',
      ...options,
    });
    assert.fail('expected CLI to exit with non-zero status');
  } catch (error) {
    assert.notEqual(error.status, 0);
    assert.equal(error.stderr || '', '');

    return JSON.parse(error.stdout);
  }
}

export async function execCliAsync(cliPath, args, options = {}) {
  const result = await execFileAsync('node', [cliPath, ...args], {
    encoding: 'utf-8',
    maxBuffer: CLI_STDIO_MAX_BUFFER,
    ...options,
  });
  return JSON.parse(result.stdout);
}

export async function execCliExpectFailureAsync(cliPath, args, options = {}) {
  try {
    await execFileAsync('node', [cliPath, ...args], {
      encoding: 'utf-8',
      ...options,
    });
    assert.fail('expected CLI to exit with non-zero status');
  } catch (error) {
    assert.notEqual(error.code, 0);
    assert.equal(error.stderr || '', '');
    return JSON.parse(error.stdout);
  }
}

export async function withMockCodexRuntimeCli(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });

  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}
