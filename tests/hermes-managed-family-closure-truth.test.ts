// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/hermes-managed-family-closure-truth.json';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/hermes-stable-family-closure-truth.json';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('managed family closure truth remains historical provenance under the repo-verified product-entry mainline', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);

  assert.equal(contract.tranche_id, 'hermes_managed_family_closure_truth');
  assert.equal(contract.predecessor_tranche, predecessor.tranche_id);
  assert.equal(
    currentProgram.current_state.foundation_milestones.hermes_managed_family_closure_truth.status,
    'historical_local_migration_artifact',
  );
  assert.equal(currentProgram.current_state.phase_label, 'Repo-Verified Product Entry And OPL Federation');
  assert.equal(currentProgram.current_state.workstream, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.equal(currentProgram.current_state.active_baton.status, 'closeout_completed');
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.managed_product_entry_contract,
    'contracts/runtime-program/managed-product-entry-hardening.json',
  );
  assert.equal(
    currentProgram.current_state.active_baton.artifacts.managed_product_entry_brief,
    'human_doc:program_managed_product_entry_hardening',
  );
  assert.equal(
    currentProgram.current_state.active_baton.scope.required_session_store_root,
    '$CODEX_HOME/projects/redcube-ai/runtime-state/product-entry-sessions/',
  );
  assert.equal(
    currentProgram.current_state.active_baton.scope.required_downstream_domain_surfaces.includes('runManagedDeliverable'),
    true,
  );
  assert.equal(
    currentProgram.current_state.active_baton.scope.required_audit_surfaces.includes('getReviewState'),
    true,
  );
  assert.equal(
    currentProgram.current_state.active_baton.scope.required_audit_surfaces.includes('getPublicationProjection'),
    true,
  );
  assert.equal(currentProgram.current_state.active_baton.scope.implementation_in_scope, true);
  assert.equal(
    contract.required_behavior.some((item) => item.includes('validates stop_after_stage')),
    true,
  );
  assert.equal(
    contract.required_behavior.some((item) => item.includes('xiaohongshu managed closure preserves approval_pending')),
    true,
  );
  assert.equal(
    contract.required_behavior.some((item) => item.includes('poster_onepager managed closure preserves guarded knowledge-poster')),
    true,
  );
});
