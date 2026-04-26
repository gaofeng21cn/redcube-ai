import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const CATALOG_FILE = 'contracts/runtime-program/python-native-helper-catalog.json';
const ENGINE_CONTRACT_FILE = 'contracts/runtime-program/ppt-native-python-engine-contract.json';
const PROOF_LANE_FILE = 'contracts/runtime-program/ppt-native-authoring-proof-lane.json';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function helperById(catalog) {
  return Object.fromEntries(catalog.helpers.map((helper) => [helper.helper_id, helper]));
}

test('Python native helper catalog records the repo-owned helper boundary', () => {
  const catalog = readJson(CATALOG_FILE);
  const currentProgram = readJson('contracts/runtime-program/current-program.json');

  assert.equal(catalog.contract_id, 'python-native-helper-catalog');
  assert.equal(catalog.language, 'python');
  assert.equal(catalog.bypass_policy.generic_bypass_allowed, false);
  assert.equal(currentProgram.longrun_goal.language_target.python_native_helper_catalog, CATALOG_FILE);
  assert.equal(currentProgram.current_state.runtime_manager_status.native_helper_catalog, CATALOG_FILE);
  assert.equal(
    currentProgram.current_state.exploration_lanes.ppt_native_authoring_proof_lane.native_helper_catalog,
    CATALOG_FILE,
  );
});

test('Python native helper catalog only points at tracked Python helper scripts', () => {
  const catalog = readJson(CATALOG_FILE);
  const helpers = helperById(catalog);

  assert.deepEqual(
    Object.keys(helpers).sort(),
    ['ppt_deck_export', 'ppt_deck_native', 'ppt_deck_review'],
  );

  for (const helper of catalog.helpers) {
    assert.equal(helper.owner, 'python_native_helper');
    assert.equal(helper.script.endsWith('.py'), true, helper.helper_id);
    assert.equal(existsSync(path.resolve(helper.script)), true, helper.script);
    assert.equal(helper.deliverable_family, 'ppt_deck');
  }
});

test('Native PPT helper routes stay tied to the engine contract and review/export gates', () => {
  const catalog = readJson(CATALOG_FILE);
  const helpers = helperById(catalog);
  const engineContract = readJson(ENGINE_CONTRACT_FILE);
  const proofLane = readJson(PROOF_LANE_FILE);

  assert.deepEqual(helpers.ppt_deck_native.routes, engineContract.owned_routes);
  assert.equal(helpers.ppt_deck_native.engine_contract, ENGINE_CONTRACT_FILE);
  assert.equal(helpers.ppt_deck_native.proof_lane_contract, PROOF_LANE_FILE);
  assert.deepEqual(
    helpers.ppt_deck_native.routes,
    proofLane.candidate_route_model.runnable_routes,
  );
  assert.deepEqual(
    helpers.ppt_deck_native.gates,
    ['visual_director_review', 'screenshot_review', 'export_pptx'],
  );
});

test('Review and export helpers stay scoped to their existing runtime gates', () => {
  const catalog = readJson(CATALOG_FILE);
  const helpers = helperById(catalog);

  assert.deepEqual(helpers.ppt_deck_review.routes, []);
  assert.deepEqual(helpers.ppt_deck_review.gates, ['screenshot_review']);
  assert.deepEqual(helpers.ppt_deck_review.requires, ['playwright']);

  assert.deepEqual(helpers.ppt_deck_export.routes, ['export_pptx']);
  assert.deepEqual(helpers.ppt_deck_export.gates, ['export_pptx']);
  assert.deepEqual(helpers.ppt_deck_export.requires, ['Pillow', 'python-pptx']);
});
