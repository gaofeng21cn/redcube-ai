import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const catalogPath = path.join(root, 'prompts/ppt_deck/style_profiles.json');
const registryPath = path.join(root, 'contracts/runtime-program/ppt-native-ai-first-design-pack.json');
const promptPath = path.join(root, 'prompts/ppt_deck/image_first_prompt_template.md');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('lecture style catalog exposes five selectable profiles with actionable constraints', () => {
  const catalog = readJson(catalogPath);
  const ids = catalog.profiles.map((profile) => profile.profile_id);
  assert.deepEqual(ids, [
    'rca_handdrawn_lecture',
    'rca_chinese_ink_lecture',
    'rca_alariko_editorial_illustration',
    'rca_ukiyo_e_woodblock_lecture',
    'rca_warm_animation_lecture',
  ]);
  assert.equal(catalog.selection_policy.reference_image_policy.required, false);
  assert.equal(catalog.selection_policy.reference_image_policy.text_only_is_valid, true);
  assert.equal(catalog.selection_policy.style_does_not_reorder_story, true);
  assert.equal(catalog.selection_policy.style_does_not_change_facts, true);
  assert.equal(catalog.selection_policy.style_first_glance_gate.includes('lecture slide'), true);

  for (const profile of catalog.profiles) {
    assert.ok(profile.display_name_i18n['zh-CN'], profile.profile_id);
    assert.ok(profile.use_when, profile.profile_id);
    assert.ok(profile.palette.canvas, profile.profile_id);
    assert.ok(profile.typography.title, profile.profile_id);
    assert.ok(profile.material_and_mark_making.length >= 3, profile.profile_id);
    assert.ok(profile.composition, profile.profile_id);
    assert.ok(profile.prompt_recipe, profile.profile_id);
    assert.ok(profile.forbidden_patterns.length >= 3, profile.profile_id);
    assert.ok(profile.review_checks.length >= 3, profile.profile_id);
  }
});

test('profile guardrails preserve the lecture-first lesson', () => {
  const catalog = readJson(catalogPath);
  const byId = Object.fromEntries(catalog.profiles.map((profile) => [profile.profile_id, profile]));
  assert.equal(byId.rca_alariko_editorial_illustration.forbidden_patterns.some((value) => value.includes('满幅办公室')), true);
  assert.equal(byId.rca_alariko_editorial_illustration.forbidden_patterns.some((value) => value.includes('带文字的独立插画')), true);
  assert.equal(byId.rca_chinese_ink_lecture.forbidden_patterns.some((value) => value.includes('山水') && value.includes('竹子')), true);
  assert.equal(byId.rca_ukiyo_e_woodblock_lecture.forbidden_patterns.some((value) => value.includes('随机日文')), true);
  assert.equal(byId.rca_alariko_editorial_illustration.approval_scope.includes('not a global default'), true);
});

test('professional style registry and image-first prompt resolve the catalog', () => {
  const registry = readJson(registryPath).professional_style_registry;
  const catalog = readJson(catalogPath);
  assert.equal(registry.style_profile_catalog_ref, 'prompts/ppt_deck/style_profiles.json#/profiles');
  assert.equal(registry.image_first_selection_field, 'visual_manifest.style_profile_id');
  assert.equal(registry.profile_selection_policy.style_is_independent_of_communication_mode, true);
  const catalogIds = new Set(catalog.profiles.map((profile) => profile.profile_id));
  for (const id of catalogIds) {
    assert.equal(registry.profiles.some((profile) => profile.profile_id === id), true, id);
  }
  const prompt = fs.readFileSync(promptPath, 'utf8');
  assert.equal(prompt.includes('Style profile:'), true);
  assert.equal(prompt.includes('illustration with text attached'), true);
});
