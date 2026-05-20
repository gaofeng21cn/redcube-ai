// @ts-nocheck
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
} from '../scripts/typescript-closeout-audit-lib.ts';

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

const RETIRED_SOURCE_JS_FILES = {
  'packages/redcube-gateway/src/actions/doctor-workspace.ts': 1,
  'packages/redcube-gateway/src/actions/execute-source-augmentation.ts': 1,
  'packages/redcube-gateway/src/actions/get-deliverable.ts': 1,
  'packages/redcube-gateway/src/actions/get-product-status.ts': 1,
  'packages/redcube-gateway/src/actions/get-product-preflight.ts': 1,
  'packages/redcube-gateway/src/actions/get-product-start.ts': 1,
  'packages/redcube-gateway/src/actions/get-run.ts': 1,
  'packages/redcube-gateway/src/actions/intake-source.ts': 1,
  'packages/redcube-gateway/src/actions/list-topics.ts': 1,
  'packages/redcube-gateway/src/actions/ops-eval-summary.ts': 1,
  'packages/redcube-gateway/src/actions/prepare-source-augmentation-result.ts': 1,
  'packages/redcube-gateway/src/actions/prepare-source-augmentation.ts': 1,
  'packages/redcube-gateway/src/actions/runtime-watch.ts': 1,
  'packages/redcube-gateway/src/actions/run-deliverable-route.ts': 1,
  'packages/redcube-gateway/src/actions/source-research.ts': 1,
  'packages/redcube-gateway/src/actions/write-source-augmentation-result.ts': 1,
  'packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime-parts/review-helpers.ts': 1,
  'packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime.ts': 1,
  'packages/redcube-runtime-family-registry/src/index.ts': 1,
  'packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.ts': 1,
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/authoring.ts': 1,
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/core.ts': 1,
  'packages/redcube-runtime/src/candidate-racing.ts': 1,
  'packages/redcube-runtime/src/creative-ownership.ts': 1,
  'packages/redcube-runtime/src/executors.ts': 1,
  'packages/redcube-runtime/src/index.ts': 1,
  'packages/redcube-runtime/src/product-entry-session-snapshot-ref-adapter.ts': 1,
  'packages/redcube-runtime/src/runtime-state.ts': 1,
  'packages/redcube-runtime/src/shared-source-truth.ts': 1,
  'packages/redcube-runtime/src/source-augmentation-executor.ts': 1,
  'packages/redcube-runtime/src/source-augmentation-request.ts': 1,
  'packages/redcube-runtime/src/source-augmentation-result.ts': 1,
  'packages/redcube-runtime/src/source-research.ts': 1,
  'packages/redcube-runtime/src/source-readiness-pack.ts': 1,
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/export.ts': 1,
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/incremental-review-scope.ts': 1,
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/native-ppt.ts': 1,
  'packages/redcube-runtime-family-ppt/src/ppt-deck-runtime-family-parts/screenshot-capture.ts': 1,
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
    ],
  );
});

test('P24 source TypeScript retirement keeps migrated product files present without JS mirrors', () => {
  for (const file of Object.keys(RETIRED_SOURCE_JS_FILES)) {
    const retiredJsFile = file.replace(/\.ts$/, '.js');

    assert.equal(existsSync(path.resolve(file)), true, file);
    assert.equal(existsSync(path.resolve(retiredJsFile)), false, retiredJsFile);
  }
});

test('P18 closeout audit keeps JS residue explicit instead of silently drifting', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });

  assert.equal(audit.criteria.js_residue_explicitly_closed_out, true);
  assert.equal(audit.criteria.new_unregistered_js_blocked, true);
  assert.equal(audit.criteria.js_residue_file_count_locked, true);
  assert.equal(audit.criteria.test_and_script_language_policy_closed, true);
  assert.deepEqual(audit.language_target.primary_implementation_languages, ['TypeScript', 'Python']);
  assert.equal(audit.language_target.javascript_policy, 'repo_tracked_javascript_retired');
  assert.equal(audit.language_target.test_language_policy, 'new_tests_default_to_typescript');
  assert.equal(audit.language_target.script_language_policy, 'new_scripts_default_to_typescript');
  assert.equal(audit.evidence.js_residue_summary.totals.unregistered_js_file_count, 0);
  assert.equal(audit.evidence.js_residue_summary.totals.legacy_allowlisted_js_file_count, 0);
  assert.equal(
    audit.evidence.js_residue_retirement_budget.actual_legacy_allowlisted_js_file_count,
    audit.evidence.js_residue_summary.totals.legacy_allowlisted_js_file_count,
  );
  assert.equal(audit.evidence.js_residue_retirement_budget.legacy_allowlisted_js_file_count_within_budget, true);
  assert.equal(audit.evidence.js_residue_retirement_budget.actual_js_line_count_within_budget, true);
  assert.equal(audit.evidence.js_residue_summary.by_directory.length, 0);
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

test('P18 closeout audit blocks repo-tracked JS tests and scripts after TS migration', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
  const policy = audit.evidence.test_and_script_language_policy;

  assert.equal(policy.status, 'closed');
  assert.equal(policy.tests.scan_glob, 'tests/**/*.{js,mjs,cjs,ts}');
  assert.equal(policy.tests.allowed_new_extension, '.test.ts');
  assert.equal(policy.tests.actual_js_files.length, 0);
  assert.equal(policy.tests.registered_js_files.length, 0);
  assert.equal(policy.tests.unregistered_js_files.length, 0);
  assert.equal(policy.tests.registered_ts_files.includes('tests/typescript-baseline.test.ts'), true);
  assert.equal(policy.scripts.scan_glob, 'scripts/**/*.{js,mjs,cjs,ts}');
  assert.equal(policy.scripts.allowed_new_extension, '.ts');
  assert.equal(policy.scripts.actual_js_files.length, 0);
  assert.equal(policy.scripts.registered_js_files.length, 0);
  assert.equal(policy.scripts.unregistered_js_files.length, 0);
  assert.equal(policy.scripts.actual_ts_files.includes('scripts/run-test-group.ts'), true);
});

test('P18 closeout audit records zero product source JS residue', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });

  assert.equal(audit.evidence.js_residue_summary.totals.directories_with_js_residue, 0);
  assert.equal(audit.evidence.js_residue_summary.totals.actual_js_line_count, 0);
  assert.equal(audit.evidence.js_residue_inventory.every((entry) => entry.actual_js_files.length === 0), true);
});

test('P18 closeout audit line-locks product source JS at zero', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });

  assert.equal(audit.criteria.js_residue_line_growth_locked, true);
  assert.equal(audit.evidence.js_residue_line_lock.contract_file, JS_RESIDUE_LINE_LOCK_FILE);
  assert.equal(audit.evidence.js_residue_line_lock.entries.length, 0);
  assert.equal(audit.evidence.js_residue_retirement_budget.actual_legacy_allowlisted_js_file_count, 0);
  assert.equal(audit.evidence.js_residue_retirement_budget.actual_js_line_count, 0);
});

test('P18 closeout audit fails closed when nested JS appears without an explicit migration exception', () => {
  const residueDirectory = 'packages/redcube-runtime';
  const unexpectedFile = 'src/__closeout-audit-test__/unregistered.js';
  const unexpectedPath = path.join(residueDirectory, unexpectedFile);
  const caseDirectory = 'tests/__closeout-audit-nested-ts-case__';

  mkdirSync(path.dirname(unexpectedPath), { recursive: true });
  mkdirSync(caseDirectory, { recursive: true });
  writeFileSync(unexpectedPath, 'export const unregistered = true;\n', 'utf-8');
  writeFileSync(path.join(caseDirectory, 'case.test.ts'), 'export const nestedTsCase = true;\n', 'utf-8');

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
    rmSync(caseDirectory, { recursive: true, force: true });
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
  const baselineAudit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
  const tightenedContract = {
    ...previousContract,
    max_legacy_allowlisted_js_file_count:
      baselineAudit.evidence.js_residue_retirement_budget.actual_legacy_allowlisted_js_file_count - 1,
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
