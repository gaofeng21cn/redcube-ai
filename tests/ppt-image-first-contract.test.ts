// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('ppt image-first production contract absorbs long-deck fact and asset governance', () => {
  const contract = readJson('contracts/runtime-program/ppt-image-first-production-route.json');
  const currentProgram = readJson('contracts/runtime-program/current-program.json');
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
