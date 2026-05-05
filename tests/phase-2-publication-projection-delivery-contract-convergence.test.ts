// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-publication-projection-delivery-contract-convergence.json';
const FAMILY_TRANCHE_CONTRACT = 'contracts/runtime-program/phase-2-family-source-truth-consumption-convergence.json';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readImplementation(file) {
  const source = read(file);
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? read(path.join(path.dirname(file), shell[1])) : source;
}

function readGovernanceReviewStateSurface() {
  return [
    read('packages/redcube-governance/src/review-state.ts'),
    read('packages/redcube-governance/src/review-state-parts/projection.ts'),
  ].join('\n');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('phase-2 publication projection delivery contract convergence stays absorbed provenance under the upstream Hermes cutover mainline', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);

  assert.equal(currentProgram.current_state.phase_id, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.workstream, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.review_status, 'passed');
  assert.equal(contract.program_mode, 'autonomous_longrun');
  assert.deepEqual(contract.formal_entry.repo_verified, ['MCP', 'CLI']);
  assert.equal(contract.formal_entry.controller_repo_verified, false);
  assert.equal(currentProgram.current_state.foundation_milestones.phase_2_family_source_truth_consumption_convergence.commit, 'e894641');
  assert.equal(currentProgram.current_state.active_baton.scope.required_audit_surfaces.includes('getPublicationProjection'), true);
  assert.equal(existsSync(path.resolve(FAMILY_TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(contract.foundations.phase_2_family_source_truth_consumption_convergence.commit, 'e894641');
  assert.equal(contract.closeout.next_tranche_candidate, 'phase_2_direct_delivery_operator_handoff_hardening');
});

test('phase-2 publication projection delivery contract convergence freezes one hydrated delivery contract surface across the stable families', () => {
  const contract = readJson(TRANCHE_CONTRACT);
  const pptProfiles = readImplementation('packages/redcube-overlay-ppt/src/profiles.ts');
  const xhsContracts = readImplementation('packages/redcube-overlay-xiaohongshu/src/contracts.ts');
  const posterContracts = readImplementation('packages/redcube-overlay-poster-onepager/src/contracts.ts');
  const pptSurface = readImplementation('packages/redcube-overlay-ppt/src/surface.ts');
  const xhsSurface = readImplementation('packages/redcube-overlay-xiaohongshu/src/surface.ts');
  const posterSurface = readImplementation('packages/redcube-overlay-poster-onepager/src/surface.ts');
  const reviewState = readGovernanceReviewStateSurface();

  assert.equal(contract.delivery_contract_surface.families.ppt_deck.required_export_route, 'export_pptx');
  assert.equal(contract.delivery_contract_surface.families.ppt_deck.projection_model, 'direct_delivery');
  assert.equal(contract.delivery_contract_surface.families.xiaohongshu.required_export_route, 'export_bundle');
  assert.equal(contract.delivery_contract_surface.families.xiaohongshu.projection_model, 'human_publication');
  assert.equal(contract.delivery_contract_surface.families.xiaohongshu.human_gate_required, true);
  assert.deepEqual(contract.delivery_contract_surface.families.xiaohongshu.mutation_surfaces, ['approve_publish', 'promote_publish']);
  assert.equal(contract.delivery_contract_surface.families.poster_onepager.guarded_profile, 'knowledge_poster');
  assert.equal(contract.publication_projection_surface.schema_version, 2);
  assert.equal(contract.publication_projection_surface.projection_kind, 'topic_delivery_projection');
  assert.equal(contract.publication_projection_surface.canonical_source, 'review_state.delivery_projection');
  assert.equal(pptProfiles.includes('delivery_contract'), true);
  assert.equal(xhsContracts.includes('delivery_contract'), true);
  assert.equal(posterContracts.includes('delivery_contract'), true);
  assert.equal(pptSurface.includes('contracts/delivery-contract.json'), true);
  assert.equal(xhsSurface.includes('contracts/delivery-contract.json'), true);
  assert.equal(posterSurface.includes('contracts/delivery-contract.json'), true);
  assert.equal(reviewState.includes("projection_kind: 'topic_delivery_projection'"), true);
  assert.equal(reviewState.includes("kind: 'review_state.delivery_projection'"), true);
});
