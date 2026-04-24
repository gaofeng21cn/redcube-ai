import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';

const repoRoot = path.resolve('.');
const pluginRoot = path.join(repoRoot, 'plugins', 'rca');
const pluginManifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
const pluginSkillPath = path.join(pluginRoot, 'skills', 'rca', 'SKILL.md');
const installerPath = path.join(repoRoot, 'scripts', 'install-codex-plugin.mjs');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

test('codex plugin scaffold tracks repo metadata and skill layout', () => {
  const packageJson = readJson(path.join(repoRoot, 'package.json'));
  const manifest = readJson(pluginManifestPath);
  const skillText = readFileSync(pluginSkillPath, 'utf-8');

  assert.equal(manifest.name, 'rca');
  assert.equal(manifest.version, packageJson.version);
  assert.equal(manifest.skills, './skills/');
  assert.equal(manifest.interface.displayName, 'RCA');
  assert.equal(manifest.interface.category, 'Creative');
  assert.match(manifest.description, /Codex plugin/i);
  assert.match(skillText, /redcube product frontdesk/i);
  assert.match(skillText, /redcube product invoke/i);
});

test('codex plugin installer creates user-level plugin and skill links with machine-readable output', () => {
  const homeDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-home-'));
  const legacyTarget = path.join(homeDir, 'legacy-target');
  const legacyPluginRoot = path.join(homeDir, 'plugins', 'redcube-ai');
  const legacySkillRoot = path.join(homeDir, '.agents', 'skills', 'redcube-ai');
  mkdirSync(legacyTarget, { recursive: true });
  mkdirSync(path.dirname(legacyPluginRoot), { recursive: true });
  mkdirSync(path.dirname(legacySkillRoot), { recursive: true });
  symlinkSync(legacyTarget, legacyPluginRoot);
  symlinkSync(legacyTarget, legacySkillRoot);
  const marketplacePath = path.join(homeDir, '.agents', 'plugins', 'marketplace.json');
  mkdirSync(path.dirname(marketplacePath), { recursive: true });
  writeFileSync(marketplacePath, JSON.stringify({ plugins: [{ name: 'redcube-ai' }] }), 'utf-8');

  const output = execFileSync(
    'node',
    [installerPath, '--repo-root', repoRoot, '--home', homeDir],
    { cwd: repoRoot, encoding: 'utf-8' },
  );
  const result = JSON.parse(output);
  const installedPluginRoot = path.join(homeDir, 'plugins', 'rca');
  const installedSkillRoot = path.join(homeDir, '.agents', 'skills', 'rca');
  const marketplace = readJson(marketplacePath);
  const pluginEntry = marketplace.plugins.find((item) => item.name === 'rca');

  assert.equal(result.ok, true);
  assert.equal(result.plugin_name, 'rca');
  assert.equal(result.repo_root, repoRoot);
  assert.equal(result.home, homeDir);
  assert.equal(existsSync(installedPluginRoot), true);
  assert.equal(existsSync(installedSkillRoot), true);
  assert.equal(existsSync(legacyPluginRoot), false);
  assert.equal(existsSync(legacySkillRoot), false);
  assert.equal(marketplace.plugins.some((item) => item.name === 'redcube-ai'), false);
  assert.equal(realpathSync(installedPluginRoot), realpathSync(pluginRoot));
  assert.equal(realpathSync(installedSkillRoot), realpathSync(path.dirname(pluginSkillPath)));
  assert.deepEqual(pluginEntry, {
    name: 'rca',
    source: {
      source: 'local',
      path: './plugins/rca',
    },
    policy: {
      installation: 'AVAILABLE',
      authentication: 'ON_INSTALL',
    },
    category: 'Creative',
  });
});
