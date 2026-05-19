// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import {
  buildTestGroups,
  TEST_REGISTRY,
} from '../scripts/test-registry.ts';

const ACTIVE_MACHINE_READABLE_ROOTS = Object.freeze([
  'apps',
  'packages',
  'contracts',
  'plugins',
  'scripts',
  'tests',
  'tools',
  'python',
]);
const TEXT_EXTENSIONS = new Set([
  '.json',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.py',
  '.sh',
  '.yaml',
  '.yml',
]);

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

function valueAtJsonPointer(document, pointer) {
  if (pointer === '') return document;
  return pointer
    .slice(1)
    .split('/')
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((value, part) => value[part], document);
}

function listTextFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'dist' || entry.name === 'build' || entry.name === 'node_modules') return [];
      return listTextFiles(file);
    }
    return entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name)) ? [file] : [];
  });
}

const ACTIVE_BATON_ID = 'managed_product_entry_hardening';
const ACTIVE_BATON_CONTRACT = 'contracts/runtime-program/managed-product-entry-hardening.json';

const HISTORICAL_CONTRACTS = Object.freeze([
  {
    milestone: 'upstream_hermes_agent_activation_package',
    contract: 'contracts/runtime-program/upstream-hermes-agent-activation-package.json',
    status: 'closeout_completed',
  },
  {
    milestone: 'upstream_hermes_agent_live_verification_blocker',
    contract: 'contracts/runtime-program/upstream-hermes-agent-live-verification-blocker.json',
    status: 'historical_blocker_resolved',
  },
  {
    milestone: 'upstream_hermes_agent_live_verification_closeout',
    contract: 'contracts/runtime-program/upstream-hermes-agent-live-verification-closeout.json',
    status: 'closeout_completed',
  },
  {
    milestone: 'upstream_hermes_agent_final_target_shape',
    contract: 'contracts/runtime-program/upstream-hermes-agent-final-target-shape.json',
    status: 'closeout_completed',
  },
]);

test('current runtime program is backed by indexed leaf refs instead of a monolithic truth owner', () => {
  const currentProgram = readJson('contracts/runtime-program/current-program.json');
  const index = readJson('contracts/runtime-program/current-program.index.json');

  assert.equal(index.surface_kind, 'rca_current_program_leaf_index');
  assert.equal(index.schema_version, 2);
  assert.equal(index.aggregate_snapshot_ref, 'contracts/runtime-program/current-program.json');
  assert.equal(index.aggregate_snapshot_role, 'generated_read_through_snapshot_for_existing_consumers');
  assert.equal(index.canonical_truth_model, 'leaf_refs_are_canonical_current_program_sources');
  assert.equal(index.no_second_truth_rule.includes('must mirror every indexed leaf ref'), true);
  assert.equal(index.split_policy.aggregate_snapshot_is_not_canonical_edit_surface, true);

  const indexedSectionIds = index.section_roots.map((section) => section.section_id);
  assert.deepEqual(indexedSectionIds, [
    'program_id',
    'date_anchor',
    'product_release_metadata',
    'longrun_goal',
    'formal_entry',
    'execution_handle_contract',
    'durable_surface_contract',
    'current_state',
    'historical_snapshots',
  ]);

  assert.equal(index.leaf_refs.length > index.section_roots.length, true);
  for (const section of index.section_roots) {
    assert.equal(existsSync(path.resolve(section.ref_root)), true, section.ref_root);
  }
  for (const leaf of index.leaf_refs) {
    assert.equal(existsSync(path.resolve(leaf.ref)), true, leaf.ref);
    assert.equal(leaf.line_count <= index.split_policy.max_leaf_json_line_count, true, leaf.ref);
    assert.deepEqual(readJson(leaf.ref), valueAtJsonPointer(currentProgram, leaf.json_pointer), leaf.ref);
  }
});

test('current runtime program keeps one active baton and machine-readable historical provenance', () => {
  const currentProgram = readJson('contracts/runtime-program/current-program.json');
  const activeBaton = currentProgram.current_state.active_baton;

  assert.equal(currentProgram.program_id, 'redcube-runtime-program');
  assert.equal(currentProgram.current_state.active_mainline.id, 'redcube-runtime-program');
  assert.equal(currentProgram.current_state.active_mainline.unique, true);

  assert.equal(activeBaton.id, ACTIVE_BATON_ID);
  assert.equal(activeBaton.status, 'closeout_completed');
  assert.equal(activeBaton.review_status, 'verified');
  assert.equal(activeBaton.artifacts.session_continuity_provenance_contract, ACTIVE_BATON_CONTRACT);
  assert.equal(existsSync(path.resolve(ACTIVE_BATON_CONTRACT)), true);

  const activeContract = readJson(ACTIVE_BATON_CONTRACT);
  assert.equal(activeContract.managed_product_entry_hardening_id, ACTIVE_BATON_ID);
  assert.equal(activeContract.status, 'closeout_completed');
  assert.equal(activeContract.callable_surface.action_ref, 'get_product_entry_session');
  assert.equal(activeContract.callable_surface.api_surface, 'getProductEntrySession');

  for (const historicalContract of HISTORICAL_CONTRACTS) {
    const milestone = currentProgram.current_state.foundation_milestones[historicalContract.milestone];
    assert.equal(milestone.status, historicalContract.status, historicalContract.milestone);
    assert.equal(milestone.contract ?? historicalContract.contract, historicalContract.contract);
    assert.notEqual(historicalContract.milestone, activeBaton.id);
    assert.equal(existsSync(path.resolve(historicalContract.contract)), true, historicalContract.contract);
  }

  for (const snapshot of Object.values(currentProgram.historical_snapshots)) {
    assert.equal(snapshot.is_active_mainline, false);
  }
});

test('active machine-readable surfaces use neutral action naming instead of retired gateway fields', () => {
  const violations = [];
  const forbidden = new RegExp(
    `\\b(?:${[
      ['gateway', 'surface'],
      ['gateway', 'action'],
      ['gateway', 'actions'],
      ['shared', 'gateway', 'action'],
      ['downstream', 'gateway', 'action'],
    ].map((parts) => parts.join('_')).join('|')})\\b`,
  );

  for (const file of ACTIVE_MACHINE_READABLE_ROOTS.flatMap((root) => {
    if (!existsSync(path.resolve(root))) return [];
    return path.extname(root) ? [root] : listTextFiles(root);
  })) {
    if (file === 'tests/runtime-program-provenance.test.ts') continue;
    const text = readFileSync(file, 'utf-8');
    if (forbidden.test(text)) {
      violations.push(file);
    }
  }

  assert.deepEqual(violations, []);
});

test('historical lane is a compact explicit provenance guard outside the active full suite', () => {
  const groups = buildTestGroups();
  const historicalEntry = TEST_REGISTRY.find((entry) => entry.file === 'tests/runtime-program-provenance.test.ts');

  assert.deepEqual(groups.historical, ['tests/runtime-program-provenance.test.ts']);
  assert.equal(groups.full.includes('tests/runtime-program-provenance.test.ts'), false);
  assert.equal(groups['full:with-historical'].includes('tests/runtime-program-provenance.test.ts'), true);
  assert.equal(historicalEntry.lane, 'historical');
  assert.equal(historicalEntry.size, 'small');
  assert.equal(historicalEntry.layer, 'provenance');
  assert.equal(historicalEntry.state, 'historical');
  assert.equal(historicalEntry.ci_default, false);

  for (const retiredFile of [
    'tests/direct-delivery-longrun-target.test.ts',
    'tests/phase-2-behavior-convergence.test.ts',
    'tests/hermes-run-topology-regression.test.ts',
    'tests/hermes-runtime-canonical-path.test.ts',
    'tests/upstream-hermes-agent-final-target-shape.test.ts',
  ]) {
    assert.equal(TEST_REGISTRY.some((entry) => entry.file === retiredFile), false, retiredFile);
  }
});
