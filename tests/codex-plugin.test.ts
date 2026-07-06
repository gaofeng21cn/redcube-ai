// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs';

const repoRoot = path.resolve('.');
const devSourceManifestPath = path.join(repoRoot, '.codex-plugin', 'plugin.json');
const pluginRoot = path.join(repoRoot, 'plugins', 'redcube-ai');
const legacyPluginRoot = path.join(repoRoot, 'plugins', 'rca');
const pluginManifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
const pluginIconPath = path.join(pluginRoot, 'assets', 'icon.png');
const pluginIconSourcePath = path.join(pluginRoot, 'assets', 'icon.svg');
const pluginSkillPath = path.join(pluginRoot, 'skills', 'redcube-ai', 'SKILL.md');
const pluginSkillUiMetadataPath = path.join(pluginRoot, 'skills', 'redcube-ai', 'agents', 'openai.yaml');
function readJson(filePath) { return JSON.parse(readFileSync(filePath, 'utf-8')); }
test('codex plugin scaffold tracks repo metadata and skill layout', () => {
  const packageJson = readJson(path.join(repoRoot, 'package.json'));
  const manifest = readJson(pluginManifestPath);
  const skillText = readFileSync(pluginSkillPath, 'utf-8');
  const metadataText = readFileSync(pluginSkillUiMetadataPath, 'utf-8');

  assert.equal(manifest.name, 'redcube-ai');
  assert.equal(manifest.version, packageJson.version);
  assert.equal(manifest.skills, './skills/');
  assert.equal(manifest.interface.displayName, 'RedCube AI');
  assert.equal(manifest.interface.category, 'Creative');
  assert.equal(manifest.interface.composerIcon, './assets/icon.png');
  assert.equal(manifest.interface.logo, './assets/icon.png');
  assert.match(manifest.description, /Codex plugin/i);
  assert.equal(existsSync(pluginIconPath), true);
  assert.equal(existsSync(pluginIconSourcePath), true);
  const iconSource = readFileSync(pluginIconSourcePath, 'utf-8');
  assert.match(iconSource, /<rect width="512" height="512" rx="112"/);
  assert.match(iconSource, /stroke-width="34"/);
  assert.match(iconSource, /stroke="#FFB18A"/);
  assert.match(metadataText, /display_name: "RedCube AI"/);
  assert.match(metadataText, /default_prompt: "Use \$redcube-ai/);
  assert.match(metadataText, /legacy alias \$rca still works/);
  assert.match(metadataText, /TypeScript orchestration plus Python native helpers; repo-tracked JavaScript is retired and blocked by closeout audit/);
  assert.match(skillText, /redcube product invoke/i);
  assert.match(skillText, /redcube domain-handler export/i);
  assert.match(skillText, /canonical 机器名是 `redcube-ai`；旧 `rca` 只保留为兼容 alias/);
  assert.match(skillText, /TypeScript orchestration \+ Python native helpers[\s\S]*已跟踪 JavaScript 已退役[\s\S]*不得把新 agent 工作写成 JavaScript/);
  assert.doesNotMatch(skillText, /\bmanaged runtime\b/i);
  assert.doesNotMatch(skillText, /\bgateway contract\b/i);
  assert.match(skillText, /service-safe product-entry loop/);
  assert.match(skillText, /domain handler \/ product-entry contract/);
  assert.match(skillText, /storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx/i);
  assert.match(skillText, /不得用通用 `Presentations`、`python-pptx`、artifact-tool 原生 deck、手写脚本或直接编辑文件来替代 RedCube/i);
  assert.match(skillText, /author_image_pages` 是默认视觉实现路线/i);
  assert.equal(realpathSync(legacyPluginRoot), pluginRoot);
  assert.equal(realpathSync(path.join(legacyPluginRoot, 'skills', 'rca')), path.join(pluginRoot, 'skills', 'redcube-ai'));
});

test('codex plugin dev source manifest is available at repository root', () => {
  const packageJson = readJson(path.join(repoRoot, 'package.json'));
  const manifest = readJson(devSourceManifestPath);

  assert.equal(manifest.name, 'rca');
  assert.equal(manifest.version, packageJson.version);
  assert.equal(manifest.skills, './plugins/rca/skills/');
  assert.equal(manifest.interface.displayName, 'RedCube AI');
  assert.equal(manifest.interface.category, 'Creative');
  assert.equal(manifest.interface.composerIcon, './plugins/rca/assets/icon.png');
  assert.equal(manifest.interface.logo, './plugins/rca/assets/icon.png');
  assert.equal(existsSync(path.join(repoRoot, manifest.skills, 'rca', 'SKILL.md')), true);
  assert.equal(realpathSync(path.join(repoRoot, manifest.skills, 'rca')), path.join(pluginRoot, 'skills', 'redcube-ai'));
  assert.equal(existsSync(path.join(repoRoot, manifest.interface.logo)), true);
});

test('codex plugin repo-local installer validates tracked source without marketplace write', () => {
  const fixtureRoot = mkdtempSync(path.join(os.tmpdir(), 'rca-codex-plugin-installer-'));
  const fixturePluginRoot = path.join(fixtureRoot, 'plugins', 'redcube-ai');
  const fixtureHome = path.join(fixtureRoot, 'home');
  const installerPath = path.join(repoRoot, 'scripts', 'install-codex-plugin.ts');

  try {
    cpSync(pluginRoot, fixturePluginRoot, { recursive: true });
    rmSync(path.join(fixturePluginRoot, 'skills', 'rca'), { recursive: true, force: true });
    symlinkSync('redcube-ai', path.join(fixturePluginRoot, 'skills', 'rca'));
    symlinkSync('redcube-ai', path.join(fixtureRoot, 'plugins', 'rca'));
    cpSync(path.join(repoRoot, '.codex-plugin'), path.join(fixtureRoot, '.codex-plugin'), { recursive: true });
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        installerPath,
        '--repo-root',
        fixtureRoot,
        '--home',
        fixtureHome,
        '--skip-tools',
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.repo_root, fixtureRoot);
    assert.equal(output.home, fixtureHome);
    assert.equal(output.dev_source_root, fixtureRoot);
    assert.equal(output.dev_source_manifest, path.join(fixtureRoot, '.codex-plugin', 'plugin.json'));
    assert.equal(output.plugin_root, fixturePluginRoot);
    assert.equal(output.skill_root, path.join(fixturePluginRoot, 'skills', 'redcube-ai'));
    assert.equal(output.marketplace_path, path.join(fixtureRoot, '.agents', 'plugins', 'marketplace.json'));
    assert.equal(output.repo_local_marketplace_written, 'false');
    assert.equal(output.codex_marketplace_owner, 'opl_owned_wrapper');
    assert.equal(existsSync(output.marketplace_path), false);
    assert.equal(realpathSync(path.join(fixtureRoot, 'plugins', 'rca')), realpathSync(fixturePluginRoot));
    assert.equal(
      realpathSync(path.join(fixtureRoot, '.codex-plugin', '..', 'plugins', 'rca', 'skills', 'rca')),
      realpathSync(path.join(fixturePluginRoot, 'skills', 'redcube-ai')),
    );
    assert.equal(existsSync(path.join(fixtureHome, '.codex', 'skills', 'rca', 'SKILL.md')), false);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
