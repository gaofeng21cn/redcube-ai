// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync } from 'node:fs';

const repoRoot = path.resolve('.');
const pluginRoot = path.join(repoRoot, 'plugins', 'rca');
const pluginManifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
const pluginIconPath = path.join(pluginRoot, 'assets', 'icon.png');
const pluginIconSourcePath = path.join(pluginRoot, 'assets', 'icon.svg');
const pluginSkillPath = path.join(pluginRoot, 'skills', 'rca', 'SKILL.md');
const pluginSkillUiMetadataPath = path.join(pluginRoot, 'skills', 'rca', 'agents', 'openai.yaml');
const installerPath = path.join(repoRoot, 'scripts', 'install-codex-plugin.ts');
function readJson(filePath) { return JSON.parse(readFileSync(filePath, 'utf-8')); }
test('codex plugin scaffold tracks repo metadata and skill layout', () => {
  const packageJson = readJson(path.join(repoRoot, 'package.json'));
  const manifest = readJson(pluginManifestPath);
  const skillText = readFileSync(pluginSkillPath, 'utf-8');
  const metadataText = readFileSync(pluginSkillUiMetadataPath, 'utf-8');

  assert.equal(manifest.name, 'rca');
  assert.equal(manifest.version, packageJson.version);
  assert.equal(manifest.skills, './skills/');
  assert.equal(manifest.interface.displayName, 'RedCube AI');
  assert.equal(manifest.interface.category, 'Creative');
  assert.equal(manifest.interface.composerIcon, './assets/icon.png');
  assert.equal(manifest.interface.logo, './assets/icon.png');
  assert.match(manifest.description, /Codex plugin/i);
  assert.equal(existsSync(pluginIconPath), true);
  assert.equal(existsSync(pluginIconSourcePath), true);
  assert.match(metadataText, /display_name: "RedCube AI"/);
  assert.match(metadataText, /default_prompt: "Use \$rca/);
  assert.match(metadataText, /TypeScript orchestration plus Python native helpers; repo-tracked JavaScript is retired and blocked by closeout audit/);
  assert.match(skillText, /redcube product frontdesk/i);
  assert.match(skillText, /redcube product invoke/i);
  assert.match(skillText, /TypeScript orchestration \+ Python native helpers[\s\S]*已跟踪 JavaScript 已退役[\s\S]*不得把新 agent 工作写成 JavaScript/);
  assert.match(skillText, /storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx/i);
  assert.match(skillText, /不得用通用 `Presentations`、`python-pptx`、artifact-tool 原生 deck、手写脚本或直接编辑文件来替代 RedCube/i);
  assert.match(skillText, /author_image_pages` 是默认视觉实现路线/i);
});

test('codex plugin installer keeps plugin and skill paths repo-local with machine-readable output', () => {
  const homeDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-home-'));
  const legacyTarget = path.join(homeDir, 'legacy-target');
  const legacyPluginRoot = path.join(homeDir, 'plugins', 'redcube-ai');
  const legacySkillRoot = path.join(homeDir, '.agents', 'skills', 'redcube-ai');
  mkdirSync(legacyTarget, { recursive: true });
  mkdirSync(path.dirname(legacyPluginRoot), { recursive: true });
  mkdirSync(path.dirname(legacySkillRoot), { recursive: true });
  symlinkSync(legacyTarget, legacyPluginRoot);
  symlinkSync(legacyTarget, legacySkillRoot);
  const marketplacePath = path.join(repoRoot, '.agents', 'plugins', 'marketplace.json');

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
  assert.equal(existsSync(installedPluginRoot), false);
  assert.equal(existsSync(installedSkillRoot), false);
  assert.equal(existsSync(legacyPluginRoot), false);
  assert.equal(existsSync(legacySkillRoot), false);
  assert.equal(marketplace.plugins.some((item) => item.name === 'redcube-ai'), false);
  assert.equal(result.plugin_root, pluginRoot);
  assert.equal(result.skill_root, path.dirname(pluginSkillPath));
  assert.equal(existsSync(path.join(homeDir, '.codex', 'skills', 'rca')), false);
  assert.equal(existsSync(path.join(homeDir, '.agents', 'plugins', 'marketplace.json')), false);
  assert.equal(marketplace.interface.displayName, 'RedCube AI Local');
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
    languageSurface: result.language_surface,
    category: 'Creative',
  });
  assert.match(result.language_surface.javascriptPolicy, /Repo-tracked JavaScript is retired/i);
});
