import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const STYLE_PROFILE = 'prompts/ppt_deck/image-first-default-style-profile.json';
const BENCHMARK_FIXTURE = 'prompts/ppt_deck/image-first-benchmark-fixture.json';
const MANIFEST_FIXTURE = 'tests/fixtures/ppt-image-first-benchmark/manifest.json';
const PROMPT_TEMPLATE = 'prompts/ppt_deck/image_first_prompt_template.md';
const ROUTE_CONTRACT = 'contracts/runtime-program/ppt-image-first-production-route.json';

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

test('PPT authoring lane uses semantic prompt judgment and defaults to image-first without explicit native intent', () => {
  const route = readJson(ROUTE_CONTRACT);
  const selection = route.route_selection_contract;
  const nativeAdmission = selection.native_route_admission;
  const intentCases = Object.fromEntries(
    selection.semantic_regression_cases.map((entry) => [entry.case_id, entry.expected_author_route]),
  );
  const artifactPrompt = read('agent/prompts/artifact_creation.md');
  const visualDirector = read('agent/professional_skills/rca-ppt-visual-director/SKILL.md');
  const nativeDesigner = read('agent/professional_skills/rca-native-ppt-designer/SKILL.md');
  const nativePrompt = read('prompts/ppt_deck/author_pptx_native.md');
  const visualGate = read('agent/quality_gates/visual_pack_discipline.md');

  assert.equal(selection.contract_id, 'ppt_deck_authoring_lane_admission_v1');
  assert.equal(selection.decision_owner, 'decisive_codex_attempt');
  assert.equal(selection.decision_mode, 'whole_current_user_request_semantic_judgment');
  assert.equal(selection.deterministic_selector_implemented_here, false);
  assert.equal(selection.examples_are, 'semantic_regression_cases_not_trigger_vocabulary');
  for (const forbidden of [
    'literal_keyword_matching',
    'regular_expression_matching',
    'file_extension_matching',
    'validator_or_helper_driven_selection',
  ]) {
    assert.equal(selection.forbidden_decision_mechanisms.includes(forbidden), true, forbidden);
  }
  assert.equal(selection.default_decision.author_route, 'author_image_pages');
  assert.equal(selection.default_decision.repair_route, 'repair_image_pages');
  assert.equal(selection.default_decision.final_container, 'pptx_with_full_slide_images');
  assert.equal(selection.default_decision.ambiguity_policy, 'select_image_first_without_human_gate');
  assert.equal(nativeAdmission.policy, 'explicit_current_user_native_editability_or_native_authoring_semantics_required');
  assert.equal(nativeAdmission.evidence_interpretation, 'semantic_judgment_over_complete_current_user_request');
  assert.equal(nativeAdmission.missing_evidence_decision, 'author_image_pages');
  for (const insufficient of [
    'generic_ppt_or_slides_wording',
    'pptx_output_extension',
    'attached_or_reference_pptx',
    'reuse_or_follow_template_style',
    'speaker_notes_or_pdf_export',
    'agent_route_preference',
    'native_validator_or_materializer_availability',
  ]) {
    assert.equal(nativeAdmission.non_admitting_context_alone.includes(insufficient), true, insufficient);
  }
  assert.deepEqual(intentCases, {
    generic_ppt_request: 'author_image_pages',
    reference_pptx_template_request: 'author_image_pages',
    pptx_output_with_notes_and_pdf: 'author_image_pages',
    explicit_editable_objects_request: 'author_pptx_native',
    explicit_drawingml_request: 'author_pptx_native',
    explicit_native_authoring_request: 'author_pptx_native',
  });
  assert.equal(selection.lane_lock.validator_or_repair_failure_may_switch_lane, false);
  assert.equal(selection.lane_lock.agent_may_upgrade_image_first_to_native, false);

  assert.match(artifactPrompt, /Generic requests for a “PPT”, “slides”, or `\.pptx` output/i);
  assert.match(artifactPrompt, /whole-request semantic judgment owned by the decisive Codex Attempt/i);
  assert.match(artifactPrompt, /keyword, regex, extension, or deterministic-script matching is forbidden/i);
  assert.match(artifactPrompt, /Missing or ambiguous admission evidence selects `author_image_pages` without a human gate/i);
  assert.match(visualDirector, /Native admission is a whole-request semantic decision owned by the decisive Codex Attempt/i);
  assert.match(visualDirector, /template\/reference deck as visual and structural guidance under image-first by default/);
  assert.match(visualDirector, /`visual_route_feasibility`[\s\S]*cannot admit native/i);
  assert.match(nativeDesigner, /Do not infer native-vs-image-first admission here/);
  assert.match(nativeDesigner, /Missing native admission is a route mismatch, not a hard stop/);
  assert.match(nativePrompt, /semantic boundary examples, not trigger tokens[\s\S]*Generic “PPT” wording, `\.pptx` input\/output[\s\S]*is insufficient/i);
  assert.match(visualGate, /Mentioning or `@`-ing OMA beside RCA[\s\S]*does not authorize Agent engineering/);
  assert.match(visualGate, /cannot become route authority or reopen a quality cycle after the three-round repair budget is exhausted/);
});

test('image-first generation prefers the real Codex tool and automatically falls back through active Codex provider config', () => {
  const route = readJson(ROUTE_CONTRACT);
  const api = route.api_contract;
  const builtin = api.preferred_builtin_route;
  const fallback = api.automatic_api_fallback;
  const terminal = api.terminal_failure_policy;
  const primarySkill = read('agent/primary_skill/SKILL.md');
  const artifactPrompt = read('agent/prompts/artifact_creation.md');
  const pageAuthor = read('agent/professional_skills/rca-ppt-page-author/SKILL.md');
  const affordances = read('agent/tools/domain_affordances.md');
  const routeDoc = read('docs/delivery/image-first-ppt-production-route.md');
  const compiler = readJson('contracts/pack_compiler_input.json');
  const cognitive = readJson('contracts/cognitive_kernel_adoption.json');
  const goldenPath = readJson('contracts/golden_path_profile.json');

  assert.equal(api.contract_id, 'rca_codex_image_generation_dual_route_v1');
  assert.equal(builtin.skill_id, 'imagegen');
  assert.equal(builtin.tool_namespace, 'image_gen');
  assert.equal(builtin.tool_action, 'imagegen');
  assert.deepEqual(builtin.accepted_runtime_names, ['image_gen.imagegen', 'image_gen__imagegen']);
  assert.equal(builtin.availability_authority, 'active_executor_tool_inventory');
  assert.equal(builtin.skill_presence_is_not_tool_availability, true);
  assert.equal(builtin.explicit_provider_token_required, false);
  assert.equal(builtin.missing_openai_api_key_may_block, false);

  assert.deepEqual(fallback.activation, [
    'built_in_tool_absent_from_active_executor_inventory',
    'built_in_tool_unavailable_before_any_image_artifact',
  ]);
  assert.equal(
    fallback.authorization,
    'selected_rca_image_first_route_authorizes_same_model_api_fallback_without_additional_user_confirmation',
  );
  assert.equal(fallback.must_not_ask_user_to_confirm_fallback, true);
  assert.equal(fallback.must_not_request_new_openai_api_key_before_codex_config_resolution, true);
  assert.deepEqual(fallback.config_path_precedence, ['$CODEX_HOME/config.toml', '~/.codex/config.toml']);
  assert.equal(fallback.config_parser, 'toml');
  assert.equal(fallback.active_provider_resolution, 'root.model_provider -> model_providers.<provider_id>');
  assert.equal(fallback.base_url_field, 'base_url');
  assert.deepEqual(fallback.credential_resolution_order, [
    'model_providers.<provider_id>.experimental_bearer_token',
    'model_providers.<provider_id>.api_key',
    'environment value named by model_providers.<provider_id>.env_key',
  ]);
  assert.equal(fallback.preferred_client, 'installed_imagegen_skill_scripts_image_gen_py');
  assert.deepEqual(fallback.client_path_precedence, [
    'active_imagegen_skill_root/scripts/image_gen.py',
    '$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py',
    '~/.codex/skills/.system/imagegen/scripts/image_gen.py',
  ]);
  assert.equal(
    fallback.client_dependency_policy,
    'use_active_openai_sdk_else_ephemeral_uv_run_with_openai_without_user_prompt',
  );
  assert.deepEqual(fallback.request, {
    api: 'openai_compatible_images',
    path: '/images/generations',
    model: 'gpt-image-2',
    final_slide_size: '2048x1152',
    output_format: 'png',
  });
  assert.deepEqual(fallback.child_process_env_mapping, {
    OPENAI_BASE_URL: 'resolved_base_url',
    OPENAI_API_KEY: 'resolved_credential',
  });
  for (const forbidden of [
    'parse_toml_with_shell_sourcing_or_ad_hoc_regex',
    'persist_token_in_prompt_artifact_manifest_or_receipt',
    'require_OPENAI_API_KEY_to_already_exist',
    'ask_user_to_install_openai_sdk_when_ephemeral_uv_is_available',
    'ask_user_to_paste_or_configure_a_key_when_codex_provider_config_is_resolvable',
  ]) {
    assert.equal(fallback.forbidden.includes(forbidden), true, forbidden);
  }

  assert.equal(terminal.result, 'redacted_typed_blocker_with_attempted_route_and_config_path_only');
  assert.equal(terminal.must_not_include_secret_values, true);
  assert.equal(terminal.must_not_offer_generic_openai_key_setup_as_first_remediation, true);
  assert.deepEqual(route.proof_runner.live_mode_requires, [
    'codex_image_generation_dual_route_resolvable',
  ]);
  assert.deepEqual(route.proof_runner.live_mode_requires_any, [
    'codex_builtin_image_gen_tool_available',
    'codex_config_gpt_image_2_fallback_resolvable',
  ]);

  assert.deepEqual(goldenPath.image_generation_resolution_precedence, {
    contract_ref: 'contracts/runtime-program/ppt-image-first-production-route.json#/api_contract',
    applies_before_generic_credential_stop_loss: true,
    missing_openai_api_key_alone_is_not_missing_credential: true,
    resolve_builtin_tool_then_active_codex_provider_config: true,
    selected_image_first_route_authorizes_same_model_api_fallback: true,
    additional_human_confirmation_for_fallback: 'forbidden',
    terminal_unresolvable_result: 'redacted_typed_blocker_ref',
  });

  const requiredCredentialRefs = [
    'executor_must_resolve_active_codex_provider_config_before_missing_image_generation_credential_gate',
    'selected_rca_image_first_route_authorizes_config_backed_gpt_image_2_without_additional_human_gate',
  ];
  const requiredSideEffectRef = 'selected_rca_image_first_route_authorizes_bounded_image_generation_provider_call';
  for (const contract of [compiler, cognitive]) {
    const boundaries = contract.tool_affordance_boundary || contract.cognitive_stage_pack_contract.tool_affordance_boundary;
    const credentialRefs = boundaries.credential_boundary_refs.map((entry) => entry.ref);
    const sideEffectRefs = boundaries.side_effect_risk_refs.map((entry) => entry.ref);
    for (const ref of requiredCredentialRefs) assert.equal(credentialRefs.includes(ref), true, ref);
    assert.equal(sideEffectRefs.includes(requiredSideEffectRef), true, requiredSideEffectRef);
  }

  for (const surface of [primarySkill, artifactPrompt, pageAuthor, affordances, routeDoc]) {
    assert.match(surface, /imagegen|image_gen/);
    assert.match(surface, /Codex|config\.toml/);
    assert.match(surface, /gpt-image-2/);
    assert.match(surface, /do not ask|without another user confirmation|without checking `OPENAI_API_KEY`|不再向用户确认/i);
  }
  assert.doesNotMatch(routeDoc, /codex_native_imagegen_skill/);
});
