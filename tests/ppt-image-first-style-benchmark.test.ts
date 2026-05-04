// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const STYLE_PROFILE = 'prompts/ppt_deck/image-first-default-style-profile.json';
const BENCHMARK_FIXTURE = 'prompts/ppt_deck/image-first-benchmark-fixture.json';
const MANIFEST_FIXTURE = 'tests/fixtures/ppt-image-first-benchmark/manifest.json';
const PROMPT_TEMPLATE = 'prompts/ppt_deck/image_first_prompt_template.md';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function flattenPrompt(prompt) {
  return Object.values(prompt).join('\n');
}

function assertNoForbiddenTermsInPositiveFields(page, forbiddenStyles) {
  const positiveText = [
    page.prompt.primary_request,
    page.prompt.exact_main_title,
    page.prompt.content_structure,
    page.prompt.style,
  ].join('\n').toLowerCase();

  for (const term of forbiddenStyles) {
    assert.equal(
      positiveText.includes(term.toLowerCase()),
      false,
      `${page.slide_id} leaks forbidden style into positive prompt fields: ${term}`,
    );
  }
}

test('image-first default style profile captures full-slide handdrawn medical lecture constraints', () => {
  const profile = readJson(STYLE_PROFILE);

  assert.equal(profile.profile_id, 'ppt_deck_image_first_handdrawn_medical_default_v1');
  assert.equal(profile.deliverable_kind, 'ppt_deck');
  assert.equal(profile.visual_route, 'image_first_full_slide');
  assert.equal(profile.model_family, 'gpt-image-2');
  assert.deepEqual(profile.default_canvas, {
    aspect_ratio: '16:9',
    pixel_size: '1920x1080',
    page_contract: 'complete_ppt_slide_page_image',
  });
  assert.equal(profile.style_system.background.includes('white dotted notebook paper background'), true);
  assert.equal(profile.style_system.linework.includes('bold black hand-drawn sketch outlines'), true);
  assert.equal(profile.style_system.linework.includes('hand-drawn arrows'), true);
  assert.equal(profile.style_system.color.includes('pastel marker blocks'), true);
  assert.equal(profile.style_system.decorative_grammar.includes('sticker tape corners'), true);
  assert.equal(profile.style_system.decorative_grammar.includes('small medical icons'), true);
  assert.equal(profile.style_system.decorative_grammar.includes('small system icons'), true);
  assert.equal(profile.style_system.typography.includes('large Chinese main title'), true);
  assert.equal(profile.style_system.typography.includes('minimal small text'), true);
  assert.equal(profile.whole_page_requirements.includes('state that the output is a complete 16:9 PPT slide page image'), true);
  assert.equal(profile.forbidden_styles.includes('dark futuristic console'), true);
  assert.equal(profile.forbidden_styles.includes('glassmorphism'), true);
  assert.equal(profile.forbidden_styles.includes('photo collage'), true);
  assert.equal(profile.forbidden_styles.includes('logo watermark'), true);
});

test('image-first benchmark fixture covers at least six complete 16:9 Chinese PPT page prompts', () => {
  const profile = readJson(STYLE_PROFILE);
  const fixture = readJson(BENCHMARK_FIXTURE);

  assert.equal(fixture.profile_id, profile.profile_id);
  assert.equal(fixture.benchmark_pages.length >= 6, true);
  assert.deepEqual(
    fixture.benchmark_pages.map((page) => page.slide_id),
    [
      'slide-01-cn-lecture-framing',
      'slide-02-medical-concept-map',
      'slide-03-platform-architecture',
      'slide-04-disease-package-boundary',
      'slide-05-governance-human-gate',
      'slide-06-summary-bridge',
    ],
  );

  const coverage = new Set(fixture.benchmark_pages.flatMap((page) => page.coverage));
  for (const required of [
    'Chinese lecture',
    'medical concept diagram',
    'platform architecture',
    'governance and boundary',
    'summary page',
  ]) {
    assert.equal(coverage.has(required), true, required);
  }

  for (const page of fixture.benchmark_pages) {
    for (const field of profile.required_prompt_fields) {
      assert.equal(Object.hasOwn(page.prompt, field), true, `${page.slide_id}.${field}`);
    }

    const promptText = flattenPrompt(page.prompt);
    assert.match(page.prompt.asset_type, /Full 16:9 PPT slide page image, 1920x1080\./);
    assert.match(page.prompt.primary_request, /complete 16:9 PPT slide page image/);
    assert.match(page.prompt.primary_request, /not separate elements/);
    assert.match(promptText, /white dotted notebook paper background/);
    assert.match(promptText, /bold black sketch outlines/);
    assert.match(promptText, /pastel marker blocks/);
    assert.match(promptText, /large readable Chinese title/);
    assertNoForbiddenTermsInPositiveFields(page, profile.forbidden_styles);
  }
});

test('image-first benchmark fixture blocks fragmentation-prone asset requests', () => {
  const profile = readJson(STYLE_PROFILE);
  const fixture = readJson(BENCHMARK_FIXTURE);

  for (const page of fixture.benchmark_pages) {
    const positiveText = [
      page.prompt.asset_type,
      page.prompt.primary_request,
      page.prompt.content_structure,
      page.prompt.style,
    ].join('\n').toLowerCase();

    for (const required of profile.fragmentation_risk_controls.required_language) {
      assert.equal(
        positiveText.includes(required.toLowerCase()),
        true,
        `${page.slide_id} misses anti-fragmentation phrase: ${required}`,
      );
    }

    for (const forbidden of profile.fragmentation_risk_controls.forbidden_asset_requests) {
      assert.equal(
        positiveText.includes(forbidden.toLowerCase()),
        false,
        `${page.slide_id} asks for fragmented asset: ${forbidden}`,
      );
    }

    assert.match(page.prompt.avoid, /isolated icon sets/);
    assert.match(page.prompt.avoid, /separate components/);
  }
});

test('image manifest fixture simulates PNG evidence without vendoring external images or calling APIs', () => {
  const fixture = readJson(BENCHMARK_FIXTURE);
  const manifest = readJson(MANIFEST_FIXTURE);

  assert.equal(manifest.fixture_id, fixture.fixture_id);
  assert.equal(manifest.profile_id, fixture.profile_id);
  assert.equal(manifest.external_api_invocation, false);
  assert.equal(manifest.external_images_vendored, false);
  assert.equal(manifest.image_evidence_mode, 'placeholder_manifest_hash');
  assert.equal(manifest.placeholder_assets.length, fixture.benchmark_pages.length);

  const pageIds = new Set(fixture.benchmark_pages.map((page) => page.slide_id));
  for (const asset of manifest.placeholder_assets) {
    assert.equal(pageIds.has(asset.slide_id), true, asset.slide_id);
    assert.match(asset.logical_file, /^placeholder:\/\/ppt-image-first\/.+\.png$/);
    assert.equal(asset.mime_type, 'image/png');
    assert.equal(asset.pixel_size, '1920x1080');
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
  }
});

test('style_reference_dir override is visual-reference-only and cannot relax default profile policy', () => {
  const profile = readJson(STYLE_PROFILE);
  const fixture = readJson(BENCHMARK_FIXTURE);
  const manifest = readJson(MANIFEST_FIXTURE);
  const template = read(PROMPT_TEMPLATE);

  assert.equal(profile.style_reference_policy.user_override_field, 'style_reference_dir');
  assert.equal(fixture.style_reference_dir_policy.user_override_allowed, true);
  assert.equal(fixture.style_reference_dir_policy.override_scope, 'visual_reference_only');
  assert.equal(fixture.style_reference_dir_policy.must_preserve_profile_constraints, true);
  assert.equal(manifest.style_reference_override_case.expected_effect, 'replace_reference_directory_only');

  for (const field of manifest.style_reference_override_case.must_not_change) {
    assert.equal(
      profile.style_reference_policy.mandatory_constraints_after_override.includes(field) ||
        ['profile_id', 'forbidden_styles'].includes(field),
      true,
      field,
    );
  }

  assert.match(template, /`style_reference_dir` may point to user-supplied local reference images/);
  assert.match(template, /must not relax the full-slide contract/);
  assert.equal(profile.style_reference_policy.repo_vendor_policy.includes('Do not vendor external reference images'), true);
});
