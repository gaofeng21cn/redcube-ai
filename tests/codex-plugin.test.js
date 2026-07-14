import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const repoRoot = path.resolve('.');
const pluginRoot = path.join(repoRoot, 'plugins', 'redcube-ai');
const pluginManifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
const pluginIconPath = path.join(pluginRoot, 'assets', 'icon.png');
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
  assert.match(metadataText, /display_name: "RedCube AI"/);
  assert.match(metadataText, /default_prompt: "Use \$redcube-ai/);
  assert.doesNotMatch(metadataText, /legacy alias \$rca still works/);
  assert.match(metadataText, /OPL-generated interfaces and hosted StageRun/);
  assert.match(skillText, /只使用已安装 RCA Package 的 OPL-generated interface/);
  assert.match(skillText, /不得调用 repo-local `redcube`/);
  assert.match(skillText, /canonical OPL agent\/package id 是 `rca`/);
  assert.match(skillText, /`redcube-ai` 只是 repo、Codex plugin 与 skill carrier 名/);
  assert.match(skillText, /Declarative Visual Pack \+ Python native helpers \+ minimal authority functions/);
  assert.doesNotMatch(skillText, /\bmanaged runtime\b/i);
  assert.doesNotMatch(skillText, /\bgateway contract\b/i);
  assert.match(skillText, /hosted StageRun controller/);
  assert.match(skillText, /controller 负责实际 transition/);
  assert.doesNotMatch(skillText, /redcube product invoke|redcube domain-handler export/);
  assert.match(skillText, /storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx/i);
  assert.match(skillText, /不得用通用 `Presentations`、`python-pptx`、artifact-tool 原生 deck、手写脚本或 checkout 内直接编辑来绕过 RCA/i);
  assert.match(skillText, /author_image_pages` 是默认视觉实现路线/i);
  assert.equal(existsSync(path.join(repoRoot, 'plugins', 'rca')), false);
  assert.equal(existsSync(path.join(pluginRoot, 'skills', 'rca')), false);
});

test('codex plugin has no duplicate repository-root manifest or repo-local installer', () => {
  assert.equal(existsSync(path.join(repoRoot, '.codex-plugin', 'plugin.json')), false);
  assert.equal(existsSync(path.join(repoRoot, 'scripts', 'install-codex-plugin.ts')), false);
});
