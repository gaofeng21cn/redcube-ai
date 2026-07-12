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
  assert.match(metadataText, /TypeScript orchestration plus Python native helpers; repo-tracked JavaScript is retired and blocked by closeout audit/);
  assert.match(skillText, /redcube product invoke/i);
  assert.match(skillText, /redcube domain-handler export/i);
  assert.match(skillText, /canonical 机器名是 `redcube-ai`。/);
  assert.match(skillText, /TypeScript orchestration \+ Python native helpers[\s\S]*已跟踪 JavaScript 已退役[\s\S]*不得把新 agent 工作写成 JavaScript/);
  assert.doesNotMatch(skillText, /\bmanaged runtime\b/i);
  assert.doesNotMatch(skillText, /\bgateway contract\b/i);
  assert.match(skillText, /OPL-hosted Codex execution plan/);
  assert.match(skillText, /不自行补跑 predecessor、安排 repair 或遍历到 review\/export/);
  assert.match(skillText, /domain handler \/ product-entry contract/);
  assert.match(skillText, /storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx/i);
  assert.match(skillText, /不得用通用 `Presentations`、`python-pptx`、artifact-tool 原生 deck、手写脚本或直接编辑文件来替代 RedCube/i);
  assert.match(skillText, /author_image_pages` 是默认视觉实现路线/i);
  assert.equal(existsSync(path.join(repoRoot, 'plugins', 'rca')), false);
  assert.equal(existsSync(path.join(pluginRoot, 'skills', 'rca')), false);
});

test('codex plugin has no duplicate repository-root manifest or repo-local installer', () => {
  assert.equal(existsSync(path.join(repoRoot, '.codex-plugin', 'plugin.json')), false);
  assert.equal(existsSync(path.join(repoRoot, 'scripts', 'install-codex-plugin.ts')), false);
});
