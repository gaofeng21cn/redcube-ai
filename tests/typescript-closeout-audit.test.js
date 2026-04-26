import test from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import {
  AUDIT_FILE,
  JS_RESIDUE_LINE_LOCK_FILE,
  buildCloseoutAudit,
  writeAuditFile,
} from '../scripts/typescript-closeout-audit-lib.mjs';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function passingQualityGates() {
  return {
    typecheck: {
      command: 'rtk npm run typecheck',
      status: 'pass',
      exit_code: 0,
    },
    full_test_suite: {
      command: 'rtk npm run test:full -- --test-reporter=dot',
      status: 'pass',
      exit_code: 0,
    },
    diagnostics: {
      command: 'npx tsc --noEmit --pretty false --project tsconfig.json',
      status: 'pass',
      exit_code: 0,
    },
  };
}

const LEAF_TS_MIGRATION_LOCKS = {
  'packages/redcube-gateway/src/actions/doctor-workspace.js': 1,
  'packages/redcube-gateway/src/actions/execute-source-augmentation.js': 1,
  'packages/redcube-gateway/src/actions/get-deliverable.js': 1,
  'packages/redcube-gateway/src/actions/get-managed-run.js': 1,
  'packages/redcube-gateway/src/actions/get-product-frontdesk.js': 1,
  'packages/redcube-gateway/src/actions/get-product-start.js': 1,
  'packages/redcube-gateway/src/actions/get-run.js': 1,
  'packages/redcube-gateway/src/actions/intake-source.js': 1,
  'packages/redcube-gateway/src/actions/prepare-source-augmentation-result.js': 1,
  'packages/redcube-gateway/src/actions/prepare-source-augmentation.js': 1,
  'packages/redcube-gateway/src/actions/run-deliverable-route.js': 1,
  'packages/redcube-gateway/src/actions/run-managed-deliverable.js': 1,
  'packages/redcube-gateway/src/actions/write-source-augmentation-result.js': 1,
  'packages/redcube-overlay-core/src/contracts.js': 1,
  'packages/redcube-overlay-core/src/index.js': 1,
  'packages/redcube-overlay-core/src/registry.js': 1,
  'packages/redcube-overlay-registry/src/index.js': 1,
  'packages/redcube-reference-os/src/index.js': 1,
  'packages/redcube-runtime-family-registry/src/index.js': 1,
  'packages/redcube-runtime-protocol/src/managed-runs.js': 1,
  'packages/redcube-runtime-protocol/src/runs.js': 1,
  'packages/redcube-runtime-protocol/src/screenshot-capture-store.js': 1,
  'packages/redcube-runtime-protocol/src/source-readiness-summary.js': 1,
  'packages/redcube-runtime-protocol/src/source-truth.js': 1,
  'packages/redcube-runtime-protocol/src/workspace.js': 1,
  'packages/redcube-governance/src/governance-surface.js': 1,
  'packages/redcube-governance/src/index.js': 1,
  'packages/redcube-runtime/src/candidate-racing.js': 1,
  'packages/redcube-runtime/src/executors.js': 1,
  'packages/redcube-runtime/src/managed-dag-scheduler.js': 1,
  'packages/redcube-runtime/src/managed-event-log.js': 1,
  'packages/redcube-runtime/src/managed-run-liveness.js': 1,
  'packages/redcube-runtime/src/product-entry-session-store.js': 1,
  'packages/redcube-runtime/src/runtime-state.js': 1,
  'packages/redcube-runtime/src/shared-source-truth.js': 1,
  'packages/redcube-runtime/src/source-augmentation-executor.js': 1,
  'packages/redcube-runtime/src/source-augmentation-request.js': 1,
  'packages/redcube-runtime/src/source-augmentation-result.js': 1,
  'packages/redcube-runtime/src/source-readiness-pack.js': 1,
};

test('P18 closeout audit proves structural TypeScript coverage across baseline, contracts, service boundaries, and high-churn lanes', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });

  assert.equal(audit.criteria.new_code_defaults_to_typescript, true);
  assert.equal(audit.criteria.core_contract_surfaces_typed, true);
  assert.equal(audit.criteria.service_boundaries_typed, true);
  assert.equal(audit.criteria.utility_boundaries_typed, true);
  assert.equal(audit.criteria.high_churn_paths_typed, true);
  assert.equal(audit.criteria.js_residue_line_growth_locked, true);
  assert.equal(audit.criteria.quality_gates_green, true);
  assert.deepEqual(
    audit.evidence.utility_boundaries.map((entry) => entry.directory),
    [
      'packages/redcube-config',
      'packages/redcube-tools',
      'packages/redcube-llm',
    ],
  );
});

test('P24 leaf TypeScript migration shrinks low-coupling JS residue line locks', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
  const entriesByFile = Object.fromEntries(
    audit.evidence.js_residue_line_lock.entries.map((entry) => [entry.file, entry]),
  );

  for (const [file, expectedLineCount] of Object.entries(LEAF_TS_MIGRATION_LOCKS)) {
    const entry = entriesByFile[file];
    assert.ok(entry, file);
    assert.equal(entry.locked_line_count, expectedLineCount, file);
    assert.equal(entry.actual_line_count, expectedLineCount, file);
    assert.equal(entry.line_growth, 0, file);
    assert.equal(entry.within_lock, true, file);
  }
});

test('P18 closeout audit keeps JS residue explicit instead of silently drifting', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });

  assert.equal(audit.criteria.js_residue_explicitly_closed_out, true);
  assert.equal(audit.criteria.new_unregistered_js_blocked, true);
  assert.equal(audit.criteria.js_residue_file_count_locked, true);
  assert.equal(audit.criteria.test_and_script_language_policy_closed, true);
  assert.deepEqual(audit.language_target.primary_implementation_languages, ['TypeScript', 'Python']);
  assert.equal(audit.language_target.javascript_policy, 'legacy_allowlisted_residue_only');
  assert.equal(audit.language_target.test_language_policy, 'new_tests_default_to_typescript');
  assert.equal(audit.language_target.script_language_policy, 'new_scripts_default_to_typescript');
  assert.equal(audit.evidence.js_residue_summary.totals.unregistered_js_file_count, 0);
  assert.equal(audit.evidence.js_residue_summary.totals.legacy_allowlisted_js_file_count > 100, true);
  assert.equal(
    audit.evidence.js_residue_retirement_budget.actual_legacy_allowlisted_js_file_count,
    audit.evidence.js_residue_summary.totals.legacy_allowlisted_js_file_count,
  );
  assert.equal(audit.evidence.js_residue_retirement_budget.legacy_allowlisted_js_file_count_within_budget, true);
  assert.equal(audit.evidence.js_residue_retirement_budget.actual_js_line_count_within_budget, true);
  assert.equal(audit.evidence.js_residue_summary.by_directory.length > 10, true);
  for (const residue of audit.evidence.js_residue_inventory) {
    assert.deepEqual(
      residue.actual_js_files,
      residue.expected_js_files,
      residue.directory,
    );
    assert.deepEqual(residue.unregistered_js_files, []);
    assert.equal(typeof residue.exception_registration?.owner, 'string');
    assert.equal(typeof residue.exception_registration?.reason, 'string');
    assert.equal(typeof residue.exception_registration?.migration_window, 'string');
  }
});

test('P18 closeout audit registers existing JS tests and scripts while allowing TS additions', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
  const policy = audit.evidence.test_and_script_language_policy;

  assert.equal(policy.status, 'closed');
  assert.equal(policy.tests.scan_glob, 'tests/**/*.test.{js,ts}');
  assert.equal(policy.tests.allowed_new_extension, '.test.ts');
  assert.equal(policy.tests.unregistered_js_files.length, 0);
  assert.equal(policy.tests.registered_js_files.includes('tests/typescript-baseline.test.js'), true);
  assert.equal(policy.scripts.scan_glob, 'scripts/**/*.{mjs,ts}');
  assert.equal(policy.scripts.allowed_new_extension, '.ts');
  assert.equal(policy.scripts.unregistered_js_files.length, 0);
  assert.equal(policy.scripts.registered_js_files.includes('scripts/run-test-group.mjs'), true);
});

test('P18 closeout audit classifies legacy allowlisted JS separately from unregistered JS residue', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
  const runtimeResidue = audit.evidence.js_residue_inventory.find((entry) => entry.directory === 'packages/redcube-runtime');

  assert.ok(runtimeResidue, 'packages/redcube-runtime residue inventory');
  assert.equal(runtimeResidue.legacy_allowlisted_js_files.includes('src/runtime-state.js'), true);
  assert.equal(
    runtimeResidue.residue_classification.some((entry) => (
      entry.file === 'src/runtime-state.js' && entry.status === 'legacy_allowlisted'
    )),
    true,
  );
  assert.equal(
    audit.evidence.js_residue_summary.by_directory.some((entry) => (
      entry.directory === 'packages/redcube-runtime'
      && entry.legacy_allowlisted_js_file_count > 0
      && entry.unregistered_js_file_count === 0
    )),
    true,
  );
});

test('P18 closeout audit line-locks existing JS residue so it cannot keep absorbing new implementation', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });

  assert.equal(audit.criteria.js_residue_line_growth_locked, true);
  assert.equal(audit.evidence.js_residue_line_lock.contract_file, JS_RESIDUE_LINE_LOCK_FILE);
  assert.equal(audit.evidence.js_residue_line_lock.entries.length > 100, true);
  assert.equal(
    audit.evidence.js_residue_line_lock.entries.every((entry) => entry.actual_line_count <= entry.locked_line_count),
    true,
  );
});

test('P18 closeout audit fails closed when existing JS residue grows', () => {
  const residueFile = path.join('packages/redcube-runtime/src/runtime-state.js');
  const previousContent = readFileSync(residueFile, 'utf-8');

  writeFileSync(residueFile, `${previousContent}\nexport const __lineLockTest = true;\n`, 'utf-8');

  try {
    const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
    const lockEntry = audit.evidence.js_residue_line_lock.entries.find((entry) => entry.file === residueFile);

    assert.equal(audit.criteria.js_residue_line_growth_locked, false);
    assert.equal(audit.criteria.closeout_ready, false);
    assert.ok(lockEntry, residueFile);
    assert.equal(lockEntry.line_growth > 0, true);
    assert.equal(lockEntry.within_lock, false);
  } finally {
    writeFileSync(residueFile, previousContent, 'utf-8');
  }
});

test('P18 closeout audit fails closed when nested JS appears without an explicit migration exception', () => {
  const residueDirectory = 'packages/redcube-runtime';
  const unexpectedFile = 'src/__closeout-audit-test__/unregistered.js';
  const unexpectedPath = path.join(residueDirectory, unexpectedFile);

  mkdirSync(path.dirname(unexpectedPath), { recursive: true });
  writeFileSync(unexpectedPath, 'export const unregistered = true;\n', 'utf-8');

  try {
    const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
    const residue = audit.evidence.js_residue_inventory.find((entry) => entry.directory === residueDirectory);
    const summary = audit.evidence.js_residue_summary.by_directory.find((entry) => entry.directory === residueDirectory);

    assert.equal(audit.criteria.js_residue_explicitly_closed_out, false);
    assert.equal(audit.criteria.new_unregistered_js_blocked, false);
    assert.equal(audit.criteria.closeout_ready, false);
    assert.ok(residue, residueDirectory);
    assert.ok(summary, residueDirectory);
    assert.deepEqual(residue.unexpected_js_files, [unexpectedFile]);
    assert.deepEqual(residue.unregistered_js_files, [unexpectedFile]);
    assert.equal(
      residue.residue_classification.some((entry) => (
        entry.file === unexpectedFile && entry.status === 'unregistered_js_residue'
      )),
      true,
    );
    assert.equal(summary.unregistered_js_file_count, 1);
  } finally {
    rmSync(path.dirname(unexpectedPath), { recursive: true, force: true });
  }
});

test('P18 closeout audit fails closed when a new package adds JS without registration', () => {
  const residueDirectory = 'packages/__closeout-new-js-package__';
  const unexpectedFile = 'src/unregistered.js';
  const unexpectedPath = path.join(residueDirectory, unexpectedFile);

  mkdirSync(path.dirname(unexpectedPath), { recursive: true });
  writeFileSync(unexpectedPath, 'export const unregistered = true;\n', 'utf-8');

  try {
    const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
    const residue = audit.evidence.js_residue_inventory.find((entry) => entry.directory === residueDirectory);

    assert.equal(audit.criteria.js_residue_explicitly_closed_out, false);
    assert.equal(audit.criteria.new_unregistered_js_blocked, false);
    assert.equal(audit.criteria.closeout_ready, false);
    assert.ok(residue, residueDirectory);
    assert.equal(residue.package_name, null);
    assert.deepEqual(residue.expected_js_files, []);
    assert.deepEqual(residue.unregistered_js_files, [unexpectedFile]);
  } finally {
    rmSync(residueDirectory, { recursive: true, force: true });
  }
});

test('P18 closeout audit fails closed when a new JS script appears without registration', () => {
  const unexpectedPath = 'scripts/__closeout-unregistered-script.mjs';

  writeFileSync(unexpectedPath, 'export const unregistered = true;\n', 'utf-8');

  try {
    const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
    const scriptsPolicy = audit.evidence.test_and_script_language_policy.scripts;

    assert.equal(audit.criteria.test_and_script_language_policy_closed, false);
    assert.equal(audit.criteria.closeout_ready, false);
    assert.deepEqual(scriptsPolicy.unregistered_js_files, [unexpectedPath]);
  } finally {
    rmSync(unexpectedPath, { force: true });
  }
});

test('P18 closeout audit fails closed when the registered JS residue budget grows', () => {
  const previousContent = readFileSync(JS_RESIDUE_LINE_LOCK_FILE, 'utf-8');
  const previousContract = JSON.parse(previousContent);
  const tightenedContract = {
    ...previousContract,
    max_legacy_allowlisted_js_file_count: previousContract.max_legacy_allowlisted_js_file_count - 1,
  };

  writeFileSync(JS_RESIDUE_LINE_LOCK_FILE, `${JSON.stringify(tightenedContract, null, 2)}\n`, 'utf-8');

  try {
    const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });

    assert.equal(audit.criteria.js_residue_file_count_locked, false);
    assert.equal(audit.criteria.closeout_ready, false);
    assert.equal(audit.evidence.js_residue_retirement_budget.legacy_allowlisted_js_file_count_within_budget, false);
  } finally {
    writeFileSync(JS_RESIDUE_LINE_LOCK_FILE, previousContent, 'utf-8');
  }
});

test('P18 closeout audit emits a machine-readable JSON artifact', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
  writeAuditFile(audit);

  assert.equal(existsSync(AUDIT_FILE), true);
  const stored = readJson(AUDIT_FILE);
  assert.equal(stored.criteria.closeout_ready, true);
  assert.equal(stored.criteria.quality_gates_green, true);
});
