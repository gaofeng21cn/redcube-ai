import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readCurrentProgramContract } from './helpers/current-program-contract.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('ppt image-first production contract absorbs long-deck fact and asset governance', () => {
  const contract = readJson('contracts/runtime-program/ppt-image-first-production-route.json');
  const currentProgram = readCurrentProgramContract();
  const activeLane = currentProgram.current_state.exploration_lanes.ppt_image_first_production_route;

  assert.equal(contract.fact_governance.fact_whitelist_surface, 'shared_source_truth.readable_shared_source_truth_fields');
  assert.equal(contract.fact_governance.forbidden_generated_artifacts.includes('fake QR code'), true);
  assert.equal(contract.verified_asset_overlay_policy.deterministic_overlay_only, true);
  assert.equal(contract.verified_asset_overlay_policy.composition_repair_allowed, false);
  assert.equal(contract.long_deck_production_contract.contract_id, 'ppt_image_first_long_deck_production_v1');
  assert.equal(contract.long_deck_production_contract.full_colorectal_ai_long_deck_regression_allowed_by_default, false);
  assert.equal(contract.long_deck_production_contract.completeness_gates.includes('full-deck contact sheet or manifest exists for operator review'), true);
  assert.equal(contract.long_deck_production_contract.line_divergence_policy.image_route_is_not_html_skin, true);
  assert.equal(contract.long_deck_production_contract.rejected_repair_route_policy.rejected_route_provenance_required, true);

  assert.equal(activeLane.fact_governance.verification_ledger_surface, 'reports/fact-verification-ledger.json');
  assert.equal(activeLane.verified_asset_overlay_policy.model_generation_forbidden.includes('QR code'), true);
  assert.equal(activeLane.long_deck_production_contract.contract_id, 'ppt_image_first_long_deck_production_v1');
  assert.equal(activeLane.long_deck_production_contract.full_colorectal_ai_long_deck_regression_allowed_by_default, false);
});

test('ppt image-first production contract keeps regressions as ready-claim blockers without stopping progress', () => {
  const contract = readJson('contracts/runtime-program/ppt-image-first-production-route.json');
  const currentProgram = readCurrentProgramContract();
  const activeLane = currentProgram.current_state.exploration_lanes.ppt_image_first_production_route;

  assert.equal(contract.audience_language_policy.visible_operator_language_allowed, false);
  assert.equal(contract.audience_language_policy.forbidden_visible_fragments.includes('汇报讨论用途'), true);
  assert.equal(contract.audience_language_policy.forbidden_visible_fragments.includes('本次汇报边界'), true);
  assert.equal(contract.audience_language_policy.forbidden_visible_fragments.includes('author_pptx_native'), true);

  assert.equal(contract.layout_legibility_policy.title_safe_zone_clear.required, true);
  assert.equal(contract.layout_legibility_policy.title_safe_zone_clear.forbidden_elements.includes('section chip'), true);
  assert.equal(contract.layout_legibility_policy.table_legibility.min_body_font_pt, 11);
  assert.equal(contract.layout_legibility_policy.table_legibility.max_blank_ratio_in_card, 0.38);

  assert.equal(contract.review_export_gates.mechanical_checks.includes('operator language leak'), true);
  assert.equal(contract.review_export_gates.mechanical_checks.includes('title safe zone obstruction'), true);
  assert.equal(contract.review_export_gates.mechanical_checks.includes('table font below 11pt'), true);
  assert.equal(contract.review_export_gates.ready_claim_block_checks.includes('external_audience_language_ok'), true);
  assert.equal(contract.review_export_gates.ready_claim_block_checks.includes('title_safe_zone_clear'), true);
  assert.equal(contract.review_export_gates.ready_claim_block_checks.includes('table_legibility_ok'), true);
  assert.equal(contract.review_export_gates.ready_claim_block_checks.includes('layout_density_ok'), true);

  assert.deepEqual(
    activeLane.visual_qa_hardening.ready_claim_block_checks.slice(-4),
    ['external_audience_language_ok', 'title_safe_zone_clear', 'table_legibility_ok', 'layout_density_ok'],
  );
  assert.equal(activeLane.visual_qa_hardening.zero_consumable_png_hard_stop, true);
  assert.equal(activeLane.visual_qa_hardening.missing_or_partial_manifest_quality_debt, true);
});
