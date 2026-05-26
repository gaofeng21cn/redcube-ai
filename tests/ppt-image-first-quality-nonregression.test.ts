// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import { buildDeckRecord, hydratePptDeckContract } from '@redcube/overlay-ppt';
import { getDeliverablePaths } from '@redcube/runtime-protocol';
import { runPptDeckRoute } from '../packages/redcube-runtime-family-ppt/dist/index.js';

const CONTRACT_PATH = 'contracts/runtime-program/ppt-image-first-quality-nonregression.json';
const PRODUCTION_ROUTE_PATH = 'contracts/runtime-program/ppt-image-first-production-route.json';
const EFFICIENCY_PROJECTION_PATH = 'contracts/production_acceptance/rca-efficiency-handoff-projection.json';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function assertRefString(value, label) {
  assert.equal(typeof value, 'string', label);
  assert.notEqual(value.trim(), '', label);
  assert.equal(value.startsWith('/'), false, `${label} must be portable, not an absolute path`);
  assert.equal(value.includes('\n'), false, label);
}

function assertRefArray(values, label) {
  assert.equal(Array.isArray(values), true, label);
  assert.equal(values.length > 0, true, label);
  values.forEach((value, index) => assertRefString(value, `${label}[${index}]`));
}

function injectImagePageRoutes(contract) {
  const stages = contract.stage_sequence.stages;
  const visualIndex = stages.findIndex((stage) => stage.stage_id === 'visual_direction');
  const screenshotIndex = stages.findIndex((stage) => stage.stage_id === 'screenshot_review');
  stages.splice(visualIndex + 1, 0, {
    stage_id: 'author_image_pages',
    label: 'Author image pages',
    output_artifact: 'author_image_pages.json',
  });
  stages.splice(screenshotIndex + 2, 0, {
    stage_id: 'repair_image_pages',
    label: 'Repair image pages',
    output_artifact: 'repair_image_pages.json',
  });
  contract.stage_requirements.author_image_pages = { requires_artifacts: ['slide_blueprint', 'visual_direction'] };
  contract.stage_requirements.repair_image_pages = {
    requires_artifacts: ['author_image_pages'],
    requires_review_from_any: ['visual_director_review', 'screenshot_review'],
  };
  contract.lifecycle_model.route_to_stage.author_image_pages = 'visual_authorship';
  contract.lifecycle_model.route_to_stage.repair_image_pages = 'visual_authorship';
  contract.prompt_pack.render_contract.image_page_authoring_lane = {
    fact_governance: readJson(PRODUCTION_ROUTE_PATH).fact_governance,
    verified_asset_overlay_policy: readJson(PRODUCTION_ROUTE_PATH).verified_asset_overlay_policy,
    long_deck_production_contract: readJson(PRODUCTION_ROUTE_PATH).long_deck_production_contract,
    audience_language_policy: readJson(PRODUCTION_ROUTE_PATH).audience_language_policy,
    layout_legibility_policy: readJson(PRODUCTION_ROUTE_PATH).layout_legibility_policy,
  };
  return contract;
}

function stageArtifactFile(paths, contract, stageId) {
  const stage = [
    ...(Array.isArray(contract.stage_sequence?.stages) ? contract.stage_sequence.stages : []),
    ...(Array.isArray(contract.stage_sequence?.alternate_stages) ? contract.stage_sequence.alternate_stages : []),
  ].find((item) => item.stage_id === stageId);
  return path.join(paths.artifactsDir, stage?.output_artifact || `${stageId}.json`);
}

function seedWorkspace() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-image-quality-'));
  const topicId = 'topic-quality';
  const deliverableId = 'deck-quality';
  const record = buildDeckRecord({
    topicId,
    deliverableId,
    title: 'Image route quality non-regression deck',
    profileId: 'lecture_student',
    goal: 'Validate image-first quality non-regression read model',
  });
  const contract = injectImagePageRoutes(hydratePptDeckContract({
    topicId,
    deliverableId,
    title: 'Image route quality non-regression deck',
    profileId: 'lecture_student',
    goal: 'Validate image-first quality non-regression read model',
  }));
  const paths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  writeJson(paths.deliverableFile, { ...record, hydrated_contract_ref: 'contracts/hydrated-deliverable.json' });
  writeJson(path.join(paths.deliverableDir, 'contracts/hydrated-deliverable.json'), contract);
  writeJson(stageArtifactFile(paths, contract, 'slide_blueprint'), {
    route: 'slide_blueprint',
    slide_blueprint: {
      slides: [
        {
          slide_id: 'S01',
          title: 'Opening quality route',
          layout_family: 'cover_signal',
          core_sentence: 'The first page stays unchanged in repair.',
        },
        {
          slide_id: 'S02',
          title: 'Blocked quality route',
          layout_family: 'multi_zone_compare',
          core_sentence: 'The second page is the only blocked repair target.',
        },
      ],
    },
  });
  writeJson(stageArtifactFile(paths, contract, 'visual_direction'), {
    route: 'visual_direction',
    visual_direction: {
      palette: ['ink', 'red', 'white'],
      visual_rules: ['image-first page', 'audience-facing language', 'clear title safe zone'],
    },
  });
  return { workspaceRoot, topicId, deliverableId, contract, paths };
}

test('ppt image-first quality non-regression contract extends efficiency projection into a quality route suite input', () => {
  const contract = readJson(CONTRACT_PATH);
  const productionRoute = readJson(PRODUCTION_ROUTE_PATH);
  const efficiency = readJson(EFFICIENCY_PROJECTION_PATH);

  assert.equal(contract.contract_id, 'ppt_image_first_quality_nonregression_v1');
  assert.equal(contract.owner, 'redcube_ai');
  assert.equal(contract.consumer, 'opl_agent_lab');
  assert.equal(contract.refs_only, true);
  assert.equal(contract.read_only, true);
  assert.equal(contract.extends_efficiency_projection, EFFICIENCY_PROJECTION_PATH);
  assert.equal(contract.source_route_contract, PRODUCTION_ROUTE_PATH);
  assert.equal(contract.default_route_policy.default_visual_route, 'author_image_pages');
  assert.equal(contract.default_route_policy.default_visual_policy, 'image_first');
  assert.equal(contract.default_route_policy.default_executor_changed, false);
  assert.deepEqual(contract.default_route_policy.route_chain, productionRoute.route_chain);
  assert.deepEqual(contract.default_route_policy.alternate_routes_remain_explicit.html, ['render_html', 'fix_html']);
  assert.deepEqual(contract.default_route_policy.alternate_routes_remain_explicit.native_editable_pptx, ['author_pptx_native', 'repair_pptx_native']);

  assert.equal(contract.agent_lab_suite_input.suite_kind, 'standard');
  assert.equal(contract.agent_lab_suite_input.domain_specific_suite_kind_required, false);
  assert.equal(contract.agent_lab_suite_input.score_is_rca_visual_verdict, false);
  assert.equal(contract.agent_lab_suite_input.claims_visual_ready, false);
  assert.equal(contract.agent_lab_suite_input.claims_exportable, false);
  assert.equal(contract.agent_lab_suite_input.claims_handoffable, false);
  assert.equal(efficiency.agent_lab_suite_input.suite_kind, contract.agent_lab_suite_input.suite_kind);
});

test('ppt image-first quality non-regression contract preserves fact, asset, audience, layout, and export gates', () => {
  const contract = readJson(CONTRACT_PATH);

  assert.equal(contract.fact_governance_policy.visible_claims_must_trace_to_source_truth, true);
  assert.equal(contract.fact_governance_policy.unresolved_claim_policy, 'block_or_rephrase_as_general_without_unverified_specifics');
  assertRefString(contract.fact_governance_policy.fact_whitelist_ref, 'fact_whitelist_ref');
  assertRefString(contract.fact_governance_policy.verification_ledger_ref, 'verification_ledger_ref');

  assert.equal(contract.verified_asset_policy.deterministic_overlay_only, true);
  assert.equal(contract.verified_asset_policy.overlay_manifest_required, true);
  assert.equal(contract.verified_asset_policy.model_generation_for_verified_assets_forbidden, true);
  assert.equal(contract.verified_asset_policy.composition_repair_allowed, false);

  assert.equal(contract.audience_language_policy.visible_operator_language_allowed, false);
  assert.equal(contract.audience_language_policy.internal_route_names_visible_in_final_slide_allowed, false);
  assert.equal(contract.audience_language_policy.rewrite_target, 'project-facing audience language');

  assert.equal(contract.layout_legibility_policy.title_safe_zone_clear_required, true);
  assert.equal(contract.layout_legibility_policy.table_min_body_font_pt, 11);
  assert.equal(contract.layout_legibility_policy.max_blank_ratio_in_card, 0.38);
  assert.equal(contract.layout_legibility_policy.layout_density_required, true);

  assert.equal(contract.nonregression_policy.visual_director_review_required, true);
  assert.equal(contract.nonregression_policy.screenshot_review_required, true);
  assert.equal(contract.nonregression_policy.export_pptx_required, true);
  assert.equal(contract.nonregression_policy.quality_gates_may_be_lowered, false);
  assert.equal(contract.nonregression_policy.hard_block_checks_may_be_removed, false);
  assert.equal(contract.nonregression_policy.agent_lab_score_can_replace_rca_visual_verdict, false);

  assert.equal(contract.export_pptx_policy.full_slide_image_pages_required, true);
  assert.equal(contract.export_pptx_policy.editable_shapes_claim_allowed, false);
  assert.equal(contract.export_pptx_policy.non_editable_full_slide_image_policy, true);
  assert.equal(contract.export_pptx_policy.export_gate_may_be_replaced_by_agent_lab_score, false);
});

test('ppt image-first quality non-regression contract exposes Agent Lab refs without forbidden authority flags', () => {
  const contract = readJson(CONTRACT_PATH);

  assertRefString(contract.quality_route_refs.route_contract_ref, 'route_contract_ref');
  assertRefString(contract.quality_route_refs.runtime_read_model_ref, 'runtime_read_model_ref');
  assertRefString(contract.quality_route_refs.repair_read_model_ref, 'repair_read_model_ref');
  assertRefArray(contract.quality_route_refs.prompt_manifest_refs, 'prompt_manifest_refs');
  assertRefArray(contract.quality_route_refs.style_manifest_refs, 'style_manifest_refs');
  assertRefArray(contract.quality_route_refs.visual_director_review_refs, 'visual_director_review_refs');
  assertRefArray(contract.quality_route_refs.screenshot_review_refs, 'screenshot_review_refs');
  assertRefArray(contract.quality_route_refs.export_pptx_refs, 'export_pptx_refs');
  assertRefArray(contract.quality_route_refs.agent_lab_suite_input_refs, 'agent_lab_suite_input_refs');

  assert.equal(contract.blocked_page_only_repair_policy.repair_route, 'repair_image_pages');
  assert.equal(contract.blocked_page_only_repair_policy.source_review_stage, 'screenshot_review');
  assert.equal(contract.blocked_page_only_repair_policy.scope, 'blocked_slide_ids_only');
  assert.equal(contract.blocked_page_only_repair_policy.unblocked_slide_policy, 'reuse_prior_png_and_record_preserved_hashes');
  assert.equal(contract.blocked_page_only_repair_policy.fail_closed_when_prior_png_missing, true);
  assert.equal(contract.blocked_page_only_repair_policy.repair_may_touch_unblocked_pages, false);

  assert.equal(contract.forbidden_authority_flags.no_forbidden_write, true);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_store_suite_input_refs, true);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_compare_quality_nonregression_refs, true);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_write_rca_visual_truth, false);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_write_artifact_blob, false);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_write_memory_body, false);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_write_owner_receipt, false);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_authorize_quality_verdict, false);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_authorize_exportable, false);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_claim_visual_ready, false);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_switch_default_executor, false);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_lower_visual_director_review, false);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_lower_screenshot_review, false);
  assert.equal(contract.forbidden_authority_flags.opl_agent_lab_can_lower_export_pptx, false);
});

test('ppt image-first runtime emits refs-only quality non-regression read models for author and blocked-page repair', async () => {
  const { workspaceRoot, topicId, deliverableId, contract, paths } = seedWorkspace();
  process.env.REDCUBE_IMAGE_GENERATION_MOCK = '1';

  const authored = await runPptDeckRoute({
    workspaceRoot,
    topicId,
    deliverableId,
    route: 'author_image_pages',
    contract,
  });
  writeJson(stageArtifactFile(paths, contract, 'author_image_pages'), authored);

  assert.equal(authored.quality_non_regression_read_model.contract_ref, CONTRACT_PATH);
  assert.equal(authored.quality_non_regression_read_model.refs_only, true);
  assert.equal(authored.quality_non_regression_read_model.agent_lab_suite_input.suite_kind, 'standard');
  assert.equal(authored.quality_non_regression_read_model.agent_lab_suite_input.score_is_rca_visual_verdict, false);
  assert.equal(authored.quality_non_regression_read_model.repair_scope.policy, 'full_initial_authoring');
  assert.deepEqual(authored.quality_non_regression_read_model.repair_scope.blocked_slide_ids, []);
  assert.deepEqual(authored.quality_non_regression_read_model.repair_scope.freshly_rendered_slide_ids, ['S01', 'S02']);
  assert.equal(authored.quality_non_regression_read_model.export_pptx_policy.editable_shapes_claim_allowed, false);

  writeJson(stageArtifactFile(paths, contract, 'screenshot_review'), {
    route: 'screenshot_review',
    status: 'block',
    blocked_slide_ids: ['S02'],
    review_state_patch: {
      rerun_from_stage: 'repair_image_pages',
      rerun_policy: {
        status: 'rerun_required',
        rerun_from_stage: 'repair_image_pages',
      },
    },
    slide_reviews: [
      {
        slide_id: 'S01',
        title: 'Opening quality route',
        status: 'pass',
        checks: { block_content_fit_ok: true },
        issues: [],
        ai_review: { judgement: 'pass', visual_findings: ['ok'], recommended_fix: 'none' },
      },
      {
        slide_id: 'S02',
        title: 'Blocked quality route',
        status: 'block',
        checks: { block_content_fit_ok: false },
        issues: ['block_content_overflow_detected'],
        mechanical_issues: ['block_content_overflow_detected'],
        ai_review: {
          judgement: 'block',
          visual_findings: ['text overflow'],
          recommended_fix: 'redraw only this blocked page',
        },
      },
    ],
  });

  const repaired = await runPptDeckRoute({
    workspaceRoot,
    topicId,
    deliverableId,
    route: 'repair_image_pages',
    contract,
  });

  const model = repaired.quality_non_regression_read_model;
  assert.equal(model.contract_ref, CONTRACT_PATH);
  assert.equal(model.refs_only, true);
  assert.equal(model.read_only, true);
  assert.equal(model.repair_scope.policy, 'blocked_slide_ids_only');
  assert.equal(model.repair_scope.source_review_stage, 'screenshot_review');
  assert.deepEqual(model.repair_scope.blocked_slide_ids, ['S02']);
  assert.deepEqual(model.repair_scope.freshly_rendered_slide_ids, ['S02']);
  assert.deepEqual(model.repair_scope.preserved_slide_hashes.map((item) => item.slide_id), ['S01']);
  assert.equal(model.repair_scope.repair_may_touch_unblocked_pages, false);
  assert.equal(model.quality_gate_refs.fact_governance, `${CONTRACT_PATH}#/fact_governance_policy`);
  assert.equal(model.quality_gate_refs.verified_asset_policy, `${CONTRACT_PATH}#/verified_asset_policy`);
  assert.equal(model.quality_gate_refs.audience_language_policy, `${CONTRACT_PATH}#/audience_language_policy`);
  assert.equal(model.quality_gate_refs.layout_legibility_policy, `${CONTRACT_PATH}#/layout_legibility_policy`);
  assert.equal(model.forbidden_authority_flags.no_forbidden_write, true);
  assert.equal(model.forbidden_authority_flags.opl_agent_lab_can_write_rca_visual_truth, false);
  assert.equal(model.forbidden_authority_flags.opl_agent_lab_can_write_artifact_blob, false);
  assert.equal(model.forbidden_authority_flags.opl_agent_lab_can_write_memory_body, false);
  assert.equal(model.forbidden_authority_flags.opl_agent_lab_can_write_owner_receipt, false);
  assert.equal(model.forbidden_authority_flags.opl_agent_lab_can_authorize_quality_verdict, false);
  assert.equal(model.forbidden_authority_flags.opl_agent_lab_can_switch_default_executor, false);
  assert.equal(model.forbidden_authority_flags.opl_agent_lab_can_lower_visual_director_review, false);
  assert.equal(model.forbidden_authority_flags.opl_agent_lab_can_lower_screenshot_review, false);
  assert.equal(model.forbidden_authority_flags.opl_agent_lab_can_lower_export_pptx, false);
});
