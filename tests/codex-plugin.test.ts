// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const repoRoot = path.resolve('.');
const pluginRoot = path.join(repoRoot, 'plugins', 'rca');
const pluginManifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
const pluginIconPath = path.join(pluginRoot, 'assets', 'icon.png');
const pluginIconSourcePath = path.join(pluginRoot, 'assets', 'icon.svg');
const pluginSkillPath = path.join(pluginRoot, 'skills', 'rca', 'SKILL.md');
const pluginSkillUiMetadataPath = path.join(pluginRoot, 'skills', 'rca', 'agents', 'openai.yaml');
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
  const iconSource = readFileSync(pluginIconSourcePath, 'utf-8');
  assert.match(iconSource, /<rect width="512" height="512" rx="112"/);
  assert.match(iconSource, /stroke-width="34"/);
  assert.match(iconSource, /stroke="#FFB18A"/);
  assert.match(metadataText, /display_name: "RedCube AI"/);
  assert.match(metadataText, /default_prompt: "Use \$rca/);
  assert.match(metadataText, /TypeScript orchestration plus Python native helpers; repo-tracked JavaScript is retired and blocked by closeout audit/);
  assert.match(skillText, /redcube product invoke/i);
  assert.match(skillText, /redcube domain-handler export/i);
  assert.match(skillText, /TypeScript orchestration \+ Python native helpers[\s\S]*已跟踪 JavaScript 已退役[\s\S]*不得把新 agent 工作写成 JavaScript/);
  assert.doesNotMatch(skillText, /\bmanaged runtime\b/i);
  assert.doesNotMatch(skillText, /\bgateway contract\b/i);
  assert.match(skillText, /service-safe product-entry loop/);
  assert.match(skillText, /domain handler \/ product-entry contract/);
  assert.match(skillText, /storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx/i);
  assert.match(skillText, /不得用通用 `Presentations`、`python-pptx`、artifact-tool 原生 deck、手写脚本或直接编辑文件来替代 RedCube/i);
  assert.match(skillText, /author_image_pages` 是默认视觉实现路线/i);
});

test('codex plugin repo-local installer and marketplace surfaces stay retired', () => {
  assert.equal(existsSync(path.join(repoRoot, 'scripts', 'install-codex-plugin.ts')), false);
  assert.equal(existsSync(path.join(repoRoot, '.agents', 'plugins', 'marketplace.json')), false);
});
