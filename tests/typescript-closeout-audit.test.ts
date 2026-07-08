// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
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
  buildCloseoutAudit,
  writeAuditFile,
} from '../scripts/typescript-closeout-audit-lib.ts';

const JS_RESIDUE_LINE_LOCK_FILE = 'contracts/runtime-program/js-residue-line-lock.json';

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

test('P18 closeout audit keeps repo-tracked JS physically retired', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });

  assert.equal(audit.criteria.js_source_absent, true);
  assert.equal(audit.criteria.repo_tracked_js_blocked, true);
  assert.equal(audit.criteria.js_residue_file_count_locked, true);
  assert.equal(audit.criteria.test_and_script_language_policy_closed, true);
  assert.deepEqual(audit.language_target.primary_implementation_languages, ['TypeScript', 'Python']);
  assert.equal(audit.language_target.javascript_policy, 'repo_tracked_javascript_retired');
  assert.equal(audit.language_target.test_language_policy, 'new_tests_default_to_typescript');
  assert.equal(audit.language_target.script_language_policy, 'new_scripts_default_to_typescript');
  assert.equal(audit.evidence.js_residue_summary.totals.forbidden_js_file_count, 0);
  assert.equal(audit.evidence.js_source_zero_gate.actual_js_file_count, 0);
  assert.equal(audit.evidence.js_source_zero_gate.actual_js_file_count_within_zero_gate, true);
  assert.equal(audit.evidence.js_source_zero_gate.actual_js_line_count_within_zero_gate, true);
  assert.equal(audit.evidence.js_residue_summary.by_directory.length, 0);
  for (const residue of audit.evidence.js_residue_inventory) {
    assert.deepEqual(residue.actual_js_files, [], residue.directory);
    assert.deepEqual(residue.forbidden_js_files, []);
    assert.equal(residue.zero_js_source, true);
  }
});

test('P18 closeout audit blocks repo-tracked JS tests and scripts after TS migration', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
  const policy = audit.evidence.test_and_script_language_policy;

  assert.equal(policy.status, 'closed');
  assert.equal(policy.tests.scan_glob, 'tests/**/*.{js,mjs,cjs,ts}');
  assert.equal(policy.tests.allowed_new_extension, '.test.ts');
  assert.equal(policy.tests.actual_js_files.length, 0);
  assert.equal(policy.tests.forbidden_js_files.length, 0);
  assert.equal(policy.tests.registered_ts_files.includes('tests/typescript-baseline.test.ts'), true);
  assert.equal(policy.scripts.scan_glob, 'scripts/**/*.{js,mjs,cjs,ts}');
  assert.equal(policy.scripts.allowed_new_extension, '.ts');
  assert.equal(policy.scripts.actual_js_files.length, 0);
  assert.equal(policy.scripts.forbidden_js_files.length, 0);
  assert.equal(policy.scripts.actual_ts_files.includes('scripts/run-test-group.ts'), true);
  assert.equal(policy.tools.scan_glob, 'tools/**/*.{js,mjs,cjs,ts}');
  assert.equal(policy.tools.allowed_new_extension, '.ts');
  assert.equal(policy.tools.actual_js_files.length, 0);
  assert.equal(policy.tools.forbidden_js_files.length, 0);
  assert.equal(policy.tools.actual_ts_files.includes('tools/native-ppt-proof/build-fixture-input.ts'), true);
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
  assert.equal(audit.evidence.js_source_zero_gate.actual_js_file_count, 0);
  assert.equal(audit.evidence.js_source_zero_gate.actual_js_line_count, 0);
});

test('P18 closeout audit fails closed when nested JS appears without an explicit migration exception', () => {
  const residueDirectory = 'packages/redcube-runtime';
  const unexpectedFile = `src/__closeout-audit-test-${randomUUID()}/unregistered.js`;
  const unexpectedPath = path.join(residueDirectory, unexpectedFile);
  const caseDirectory = `tests/__closeout-audit-nested-ts-case-${randomUUID()}__`;

  mkdirSync(path.dirname(unexpectedPath), { recursive: true });
  mkdirSync(caseDirectory, { recursive: true });
  writeFileSync(unexpectedPath, 'export const unregistered = true;\n', 'utf-8');
  writeFileSync(path.join(caseDirectory, 'case.test.ts'), 'export const nestedTsCase = true;\n', 'utf-8');

  try {
    const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
    const residue = audit.evidence.js_residue_inventory.find((entry) => entry.directory === residueDirectory);
    const summary = audit.evidence.js_residue_summary.by_directory.find((entry) => entry.directory === residueDirectory);

    assert.equal(audit.criteria.js_source_absent, false);
    assert.equal(audit.criteria.repo_tracked_js_blocked, false);
    assert.equal(audit.criteria.closeout_ready, false);
    assert.ok(residue, residueDirectory);
    assert.ok(summary, residueDirectory);
    assert.deepEqual(residue.forbidden_js_files, [unexpectedFile]);
    assert.equal(
      residue.residue_classification.some((entry) => (
        entry.file === unexpectedFile && entry.status === 'forbidden_js_source'
      )),
      true,
    );
    assert.equal(summary.forbidden_js_file_count, 1);
  } finally {
    rmSync(path.dirname(unexpectedPath), { recursive: true, force: true });
    rmSync(caseDirectory, { recursive: true, force: true });
  }
});

test('P18 closeout audit fails closed when a new package adds JS without registration', () => {
  const residueDirectory = `packages/__closeout-new-js-package-${randomUUID()}__`;
  const unexpectedFile = 'src/unregistered.js';
  const unexpectedPath = path.join(residueDirectory, unexpectedFile);

  mkdirSync(path.dirname(unexpectedPath), { recursive: true });
  writeFileSync(unexpectedPath, 'export const unregistered = true;\n', 'utf-8');

  try {
    const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
    const residue = audit.evidence.js_residue_inventory.find((entry) => entry.directory === residueDirectory);

    assert.equal(audit.criteria.js_source_absent, false);
    assert.equal(audit.criteria.repo_tracked_js_blocked, false);
    assert.equal(audit.criteria.closeout_ready, false);
    assert.ok(residue, residueDirectory);
    assert.equal(residue.package_name, null);
    assert.deepEqual(residue.forbidden_js_files, [unexpectedFile]);
  } finally {
    rmSync(residueDirectory, { recursive: true, force: true });
  }
});

test('P18 closeout audit fails closed when a new JS script appears without registration', () => {
  const unexpectedPath = `scripts/__closeout-unregistered-script-${randomUUID()}.mjs`;

  writeFileSync(unexpectedPath, 'export const unregistered = true;\n', 'utf-8');

  try {
    const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
    const scriptsPolicy = audit.evidence.test_and_script_language_policy.scripts;

    assert.equal(audit.criteria.test_and_script_language_policy_closed, false);
    assert.equal(audit.criteria.closeout_ready, false);
    assert.deepEqual(scriptsPolicy.forbidden_js_files, [unexpectedPath]);
  } finally {
    rmSync(unexpectedPath, { force: true });
  }
});

test('P18 closeout audit fails closed when a repo proof helper keeps JavaScript', () => {
  const unexpectedPath = `tools/native-ppt-proof/__closeout-unregistered-helper-${randomUUID()}.mjs`;

  writeFileSync(unexpectedPath, 'export const unregistered = true;\n', 'utf-8');

  try {
    const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
    const toolsPolicy = audit.evidence.test_and_script_language_policy.tools;

    assert.equal(audit.criteria.test_and_script_language_policy_closed, false);
    assert.equal(audit.criteria.closeout_ready, false);
    assert.deepEqual(toolsPolicy.forbidden_js_files, [unexpectedPath]);
  } finally {
    rmSync(unexpectedPath, { force: true });
  }
});

test('P18 closeout audit fails closed when the zero JS source gate contract is relaxed', () => {
  const previousContent = readFileSync(JS_RESIDUE_LINE_LOCK_FILE, 'utf-8');
  const previousContract = JSON.parse(previousContent);
  const tightenedContract = {
    ...previousContract,
    max_js_file_count: 1,
  };

  writeFileSync(JS_RESIDUE_LINE_LOCK_FILE, `${JSON.stringify(tightenedContract, null, 2)}\n`, 'utf-8');

  try {
    const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });

    assert.equal(audit.criteria.js_residue_file_count_locked, false);
    assert.equal(audit.criteria.closeout_ready, false);
    assert.equal(audit.evidence.js_source_zero_gate.actual_js_file_count_within_zero_gate, false);
  } finally {
    writeFileSync(JS_RESIDUE_LINE_LOCK_FILE, previousContent, 'utf-8');
  }
});

test('P18 closeout audit emits a machine-readable JSON artifact', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });
  const auditFile = path.join(
    path.dirname(AUDIT_FILE),
    `P18_TYPESCRIPT_CLOSEOUT_AUDIT.${process.pid}.${randomUUID()}.json`,
  );

  try {
    writeAuditFile(audit, auditFile);

    assert.equal(existsSync(auditFile), true);
    const stored = readJson(auditFile);
    assert.equal(stored.criteria.closeout_ready, true);
    assert.equal(stored.criteria.quality_gates_green, true);
  } finally {
    rmSync(auditFile, { force: true });
  }
});
