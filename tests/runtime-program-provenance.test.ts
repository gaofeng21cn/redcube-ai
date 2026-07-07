// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import {
  buildTestGroups,
  TEST_REGISTRY,
} from '../scripts/test-registry.ts';
import {
  assembleCurrentProgramFromParts,
  checkCurrentProgramLeafIndex,
} from '../scripts/sync-current-program-leaf-index.ts';

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

const ACTIVE_BATON_ID = 'product_entry_session_continuity';
const ACTIVE_BATON_CONTRACT = 'contracts/runtime-program/product-entry-session-continuity.json';
const RETIRED_MANAGED_BATON_ID = 'managed_product_entry_hardening';
const RETIRED_MANAGED_BATON_CONTRACT = 'contracts/runtime-program/managed-product-entry-hardening.json';
const RETIRED_MANAGED_BATON_HUMAN_DOC = 'human_doc:retired_managed_product_entry_contract_tombstone';

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
const CURRENT_PROGRAM_AGGREGATE = 'contracts/runtime-program/current-program.json';
const CURRENT_PROGRAM_ASSEMBLY = 'contracts/runtime-program/current-program.assembly.json';
const CURRENT_PROGRAM_BUNDLE_MANIFEST = 'contracts/runtime-program/current-program.bundle-manifest.json';
const CANONICAL_PROJECTION_MODE = 'canonical_ref_only_no_body_copy';

const CURRENT_PROGRAM_CANONICAL_PROJECTION_POINTERS = Object.freeze([
  '/current_state/opl_generic_primitive_consumption',
  '/current_state/opl_stability_read_model_consumption',
  '/current_state/privatized_functional_module_audit',
  '/current_state/visual_pack_compiler_handoff',
  '/current_state/active_baton/scope/opl_generic_primitive_consumption',
  '/current_state/active_baton/scope/opl_stability_read_model_consumption',
  '/current_state/active_baton/scope/privatized_functional_module_audit',
  '/current_state/active_baton/scope/visual_pack_compiler_handoff',
  '/product_release_metadata/opl_generic_primitive_consumption',
  '/product_release_metadata/opl_stability_read_model_consumption',
  '/product_release_metadata/privatized_functional_module_audit',
  '/product_release_metadata/visual_pack_compiler_handoff',
]);

test('current runtime program is backed by source parts and one source index locator', () => {
  const currentProgram = assembleCurrentProgramFromParts();
  const index = readJson('contracts/runtime-program/current-program.index.json');
  const syncCheck = checkCurrentProgramLeafIndex();

  assert.equal(index.surface_kind, 'rca_current_program_source_index');
  assert.equal(index.schema_version, 4);
  assert.equal(index.source_root_ref, 'contracts/runtime-program/current-program-parts');
  assert.equal(index.canonical_truth_model, 'current_program_parts_are_canonical_sources');
  assert.equal(index.no_second_truth_rule.includes('validates current-program-parts and this index only'), true);
  assert.equal(index.generated_aggregate_snapshot.ref, CURRENT_PROGRAM_AGGREGATE);
  assert.equal(index.generated_aggregate_snapshot.role, 'legacy_read_through_projection_for_existing_consumers');
  assert.equal(index.generated_aggregate_snapshot.canonical_source, false);
  assert.equal(index.generated_aggregate_snapshot.edit_surface, false);
  assert.equal(index.generated_aggregate_snapshot.check_input, false);
  assert.equal(index.split_policy.aggregate_snapshot_is_not_canonical_edit_surface, true);
  assert.equal(index.split_policy.aggregate_snapshot_is_not_required_check_input, true);
  assert.match(index.source_digest, /^[a-f0-9]{64}$/);
  assert.equal(index.commands.write, 'npm run contracts:current-program:write');
  assert.equal(index.commands.check, 'npm run contracts:current-program:check');
  assert.equal(index.false_authority_flags.aggregate_snapshot_is_canonical_source, false);
  assert.equal(index.false_authority_flags.aggregate_snapshot_is_check_input, false);
  assert.equal(index.false_authority_flags.manifest_can_authorize_quality_or_export, false);
  assert.equal(index.not_claims.includes('quality_or_export_verdict'), true);
  assert.equal(index.not_claims.includes('artifact_authority'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(index, 'assembly_ref'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(index, 'manifest_ref'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(index, 'aggregate_ref'), false);

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

  assert.equal(index.source_part_refs.length > index.section_roots.length, true);
  assert.equal(index.source_part_refs.length <= 100, true);
  assert.deepEqual(index.leaf_refs, index.source_part_refs);
  assert.deepEqual(syncCheck.mismatches, []);
  assert.equal(syncCheck.source_part_ref_count, index.source_part_refs.length);
  for (const section of index.section_roots) {
    assert.equal(existsSync(path.resolve(section.source_root_ref)), true, section.source_root_ref);
  }
  for (const sourcePart of index.source_part_refs) {
    const sourcePartValue = readJson(sourcePart.ref);
    const sourcePartText = `${JSON.stringify(sourcePartValue, null, 2)}\n`;
    assert.equal(existsSync(path.resolve(sourcePart.ref)), true, sourcePart.ref);
    assert.equal(sourcePart.ref.startsWith(`${index.source_root_ref}/`), true, sourcePart.ref);
    assert.equal(sourcePart.line_count <= index.split_policy.max_part_json_line_count, true, sourcePart.ref);
    assert.match(sourcePart.sha256, /^[a-f0-9]{64}$/);
    assert.equal(sourcePart.sha256, createHash('sha256').update(sourcePartText).digest('hex'), sourcePart.ref);
    assert.deepEqual(sourcePartValue, valueAtJsonPointer(currentProgram, sourcePart.json_pointer), sourcePart.ref);
  }

  for (const pointer of CURRENT_PROGRAM_CANONICAL_PROJECTION_POINTERS) {
    const projection = valueAtJsonPointer(currentProgram, pointer);
    assert.equal(projection.surface_kind, 'rca_current_program_canonical_projection_ref', pointer);
    assert.equal(projection.projection_mode, CANONICAL_PROJECTION_MODE, pointer);
    assert.equal(projection.body_copy_in_current_program, false, pointer);
    assert.equal(
      projection.duplicate_entity_policy,
      'reference_canonical_contract_instead_of_repeating_machine_snapshot_body',
      pointer,
    );
    assert.equal(JSON.stringify(projection).length < 1600, true, pointer);
  }

  const functionalAuditProjection = currentProgram.product_release_metadata.functional_privatization_audit;
  assert.equal(functionalAuditProjection.surface_kind, 'functional_privatization_audit_projection');
  assert.equal(functionalAuditProjection.schema_version, 2);
  assert.equal(functionalAuditProjection.projection_mode, CANONICAL_PROJECTION_MODE);
  assert.equal(functionalAuditProjection.body_copy_in_current_program, false);
  assert.equal(functionalAuditProjection.canonical_contract_ref, 'contracts/functional_privatization_audit.json#/');
  assert.equal(Object.prototype.hasOwnProperty.call(functionalAuditProjection, 'modules'), false);
  assert.equal(
    Object.prototype.hasOwnProperty.call(functionalAuditProjection, 'privatized_functional_module_audit'),
    false,
  );
  assert.equal(existsSync(path.resolve(CURRENT_PROGRAM_ASSEMBLY)), false);
  assert.equal(existsSync(path.resolve(CURRENT_PROGRAM_BUNDLE_MANIFEST)), false);
});

test('current runtime program keeps one active baton and machine-readable historical provenance', () => {
  const currentProgram = assembleCurrentProgramFromParts();
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
  assert.equal(activeContract.product_entry_session_continuity_id, ACTIVE_BATON_ID);
  assert.equal(activeContract.status, 'closeout_completed');
  assert.equal(activeContract.callable_surface.action_ref, 'get_product_entry_session');
  assert.equal(activeContract.callable_surface.api_surface, 'getProductEntrySession');

  const retiredManagedContract = readJson(RETIRED_MANAGED_BATON_CONTRACT);
  assert.equal(retiredManagedContract.surface_kind, 'retired_runtime_program_contract_tombstone');
  assert.equal(retiredManagedContract.retired_contract_id, RETIRED_MANAGED_BATON_ID);
  assert.equal(retiredManagedContract.replacement_contract, ACTIVE_BATON_CONTRACT);
  assert.equal(retiredManagedContract.retained_human_doc, RETIRED_MANAGED_BATON_HUMAN_DOC);
  assert.equal(retiredManagedContract.callable_surface_retained, false);
  assert.equal(retiredManagedContract.compatibility_alias_allowed, false);
  assert.deepEqual(activeContract.legacy_tombstone_refs, [
    RETIRED_MANAGED_BATON_CONTRACT,
    RETIRED_MANAGED_BATON_HUMAN_DOC,
  ]);

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
  const retiredRouteChain = /\bgateway\s*->/i;

  for (const file of ACTIVE_MACHINE_READABLE_ROOTS.flatMap((root) => {
    if (!existsSync(path.resolve(root))) return [];
    return path.extname(root) ? [root] : listTextFiles(root);
  })) {
    if (file === 'tests/runtime-program-provenance.test.ts') continue;
    const text = readFileSync(file, 'utf-8');
    if (forbidden.test(text) || retiredRouteChain.test(text)) {
      violations.push(file);
    }
  }

  assert.deepEqual(violations, []);
});

test('historical upstream Hermes contracts keep gateway command prose out of object keys', () => {
  const violations = [];
  const forbiddenKey = /(?:gateway.*command|command.*gateway)/i;

  function collectViolations(value, pointer, file) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => collectViolations(item, `${pointer}/${index}`, file));
      return;
    }
    if (value === null || typeof value !== 'object') return;

    for (const [key, child] of Object.entries(value)) {
      const childPointer = `${pointer}/${key}`;
      if (forbiddenKey.test(key)) {
        violations.push(`${file}${childPointer}`);
      }
      collectViolations(child, childPointer, file);
    }
  }

  for (const historicalContract of HISTORICAL_CONTRACTS) {
    collectViolations(readJson(historicalContract.contract), '', historicalContract.contract);
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
