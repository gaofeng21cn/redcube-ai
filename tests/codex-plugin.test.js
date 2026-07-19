import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const repoRoot = path.resolve('.');
const pluginRoot = path.join(repoRoot, 'plugins', 'redcube-ai');
const pluginManifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
const pluginIconPath = path.join(pluginRoot, 'assets', 'icon.png');
const pluginSkillPath = path.join(pluginRoot, 'skills', 'redcube-ai', 'SKILL.md');
const canonicalSkillPath = path.join(repoRoot, 'agent', 'primary_skill', 'SKILL.md');
const pluginSkillUiMetadataPath = path.join(pluginRoot, 'skills', 'redcube-ai', 'agents', 'openai.yaml');
function readJson(filePath) { return JSON.parse(readFileSync(filePath, 'utf-8')); }
test('codex plugin scaffold tracks repo metadata and skill layout', () => {
  const packageJson = readJson(path.join(repoRoot, 'package.json'));
  const manifest = readJson(pluginManifestPath);
  const skillText = readFileSync(pluginSkillPath, 'utf-8');
  const canonicalSkillText = readFileSync(canonicalSkillPath, 'utf-8');
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
  assert.match(skillText, /^name: redcube-ai$/m);
  assert.match(skillText, /^description: .*Ordinary PPT\/PPTX requests default to full-slide images.*Do not use for Agent engineering/m);
  for (const heading of [
    'Admission',
    'Action Routing',
    'Default Workflow',
    'Quality And Hard Stops',
    'Output Expectations',
    'References',
  ]) {
    assert.match(skillText, new RegExp(`^## ${heading}$`, 'm'));
  }
  assert.match(skillText, /Canonical OPL Agent and Package id is `rca`/);
  assert.doesNotMatch(skillText, /\bmanaged runtime\b/i);
  assert.doesNotMatch(skillText, /\bgateway contract\b/i);
  assert.doesNotMatch(skillText, /redcube product invoke|redcube domain-handler export/);
  assert.match(skillText, /`invoke_product_entry`: normal entry for a complete visual deliverable\. Use this by default/);
  assert.match(skillText, /`run_image_ppt_proof`: focused image-first PPT proof/);
  assert.match(skillText, /`run_native_ppt_proof`: focused editable-native PPT proof/);
  assert.match(skillText, /storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx/i);
  assert.match(skillText, /Do not bypass RCA with generic `Presentations`, `python-pptx`, Office automation, ad-hoc scripts/);
  assert.equal(skillText, canonicalSkillText);
  assert.match(skillText, /Default to `author_image_pages \/ repair_image_pages` and a final `pptx_with_full_slide_images` container/);
  assert.match(skillText, /attached\/reference PPTX[\s\S]*hospital\/company template[\s\S]*is not enough to admit native authoring/);
  assert.match(skillText, /Admit `author_pptx_native \/ repair_pptx_native` only when the user explicitly requires editable text, shapes, charts, tables/);
  assert.match(skillText, /semantic boundary examples, not trigger tokens[\s\S]*keyword, regex, extension, or deterministic-script selection is forbidden/);
  assert.match(skillText, /evidence is missing or ambiguous, select image-first without asking a route-preference question/);
  assert.match(skillText, /selected or `@`-mentioned OMA[\s\S]*does not authorize Agent engineering/);
  assert.match(skillText, /Validator, render, screenshot, or QA failures authorize repair of the current deliverable only/);
  assert.match(skillText, /at most three `repairer \+ re_reviewer` rounds[\s\S]*continue with the best readable artifact and explicit quality debt/);
  assert.equal(existsSync(path.join(repoRoot, 'plugins', 'rca')), false);
  assert.equal(existsSync(path.join(pluginRoot, 'skills', 'rca')), false);
});

test('codex plugin has no duplicate repository-root manifest or repo-local installer', () => {
  assert.equal(existsSync(path.join(repoRoot, '.codex-plugin', 'plugin.json')), false);
  assert.equal(existsSync(path.join(repoRoot, 'scripts', 'install-codex-plugin.ts')), false);
});
