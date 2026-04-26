import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

import {
  bootstrapPrivateProfile,
  exportPrivateProfile,
  installPrivateProfile,
} from '@redcube/redcube-config/private-profile';

function write(filePath, content = '') {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function createPrivateSourceFixture(rootDir) {
  const sourceDir = path.join(rootDir, 'system', '自动小红书');
  write(path.join(sourceDir, '作者档案库.md'), [
    '# 作者档案库（可扩展）',
    '',
    '## profile_id: dr_mie',
    '',
    '- 署名显示：医学私有作者',
    '- 署名副标：私有品牌标识',
    '',
    '## profile_id: traveling_anthropologist',
    '',
    '- 署名显示：通用私有作者',
    '- 署名副标：私有品牌标识',
  ].join('\n'));
  write(path.join(sourceDir, '人设自动路由规则.md'), [
    '# 人设自动路由规则',
    '',
    '- 若核心主题命中医学域',
    '  - 默认选择：`dr_mie`',
    '- 否则',
    '  - 默认选择：`traveling_anthropologist`',
  ].join('\n'));
  write(path.join(sourceDir, 'defaults', 'AGENT_PRESET.default.md'), '# 默认预设');
  write(path.join(sourceDir, '策划提示词', '单篇策划.md'), '# 单篇策划');
  return sourceDir;
}

test('bootstrapPrivateProfile migrates private prompts and identity into config home', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-private-profile-'));
  const sourceDir = createPrivateSourceFixture(root);
  const configHome = path.join(root, 'config-home');

  const result = bootstrapPrivateProfile({
    sourceSystemDir: sourceDir,
    configHome,
  });

  assert.equal(result.ok, true);
  assert.equal(existsSync(path.join(configHome, 'prompts', 'aligned', '自动小红书', '作者档案库.md')), true);
  assert.equal(readJson(path.join(configHome, 'runtime.json')).promptsDir, './prompts');
  const identity = readJson(path.join(configHome, 'identity.json'));
  assert.equal(identity.defaultProfileId, 'traveling_anthropologist');
  assert.equal(identity.routing.medicalProfileId, 'dr_mie');
  assert.equal(identity.profiles.dr_mie.signatureDisplay, '医学私有作者');
  assert.equal(identity.profiles.traveling_anthropologist.signatureDisplay, '通用私有作者');
});

test('exportPrivateProfile and installPrivateProfile round-trip private bundle', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-private-profile-'));
  const sourceDir = createPrivateSourceFixture(root);
  const configHome = path.join(root, 'config-home');
  const installedHome = path.join(root, 'installed-home');
  const bundleFile = path.join(root, 'bundle', 'redcube-private-profile.tgz');

  bootstrapPrivateProfile({
    sourceSystemDir: sourceDir,
    configHome,
  });

  const exported = exportPrivateProfile({
    configHome,
    bundleFile,
  });
  assert.equal(exported.ok, true);
  assert.equal(existsSync(bundleFile), true);

  const installed = installPrivateProfile({
    configHome: installedHome,
    bundleFile,
  });
  assert.equal(installed.ok, true);

  const identity = readJson(path.join(installedHome, 'identity.json'));
  assert.equal(identity.routing.generalProfileId, 'traveling_anthropologist');
  assert.equal(readJson(path.join(installedHome, 'runtime.json')).promptsDir, './prompts');
  assert.equal(existsSync(path.join(installedHome, 'prompts', 'aligned', '自动小红书', 'defaults', 'AGENT_PRESET.default.md')), true);
});

test('CLI profile command supports bootstrap export and install', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'redcube-private-profile-cli-'));
  const sourceDir = createPrivateSourceFixture(root);
  const configHome = path.join(root, 'config-home');
  const installedHome = path.join(root, 'installed-home');
  const bundleFile = path.join(root, 'bundle', 'redcube-private-profile.tgz');

  const bootstrapOutput = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'profile', '--action', 'bootstrap', '--source-dir', sourceDir, '--config-home', configHome],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  const bootstrapResult = JSON.parse(bootstrapOutput);
  assert.equal(bootstrapResult.ok, true);

  const exportOutput = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'profile', '--action', 'export', '--bundle', bundleFile, '--config-home', configHome],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  const exportResult = JSON.parse(exportOutput);
  assert.equal(exportResult.ok, true);

  const installOutput = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'profile', '--action', 'install', '--bundle', bundleFile, '--config-home', installedHome],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  const installResult = JSON.parse(installOutput);
  assert.equal(installResult.ok, true);
  assert.equal(existsSync(path.join(installedHome, 'prompts', 'aligned', '自动小红书', '作者档案库.md')), true);
});
