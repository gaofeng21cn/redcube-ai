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

test('P18 closeout audit proves structural TypeScript coverage across baseline, contracts, service boundaries, and high-churn lanes', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });

  assert.equal(audit.criteria.new_code_defaults_to_typescript, true);
  assert.equal(audit.criteria.core_contract_surfaces_typed, true);
  assert.equal(audit.criteria.service_boundaries_typed, true);
  assert.equal(audit.criteria.high_churn_paths_typed, true);
  assert.equal(audit.criteria.quality_gates_green, true);
});

test('P18 closeout audit keeps JS residue explicit instead of silently drifting', () => {
  const audit = buildCloseoutAudit({ qualityGates: passingQualityGates() });

  assert.equal(audit.criteria.js_residue_explicitly_closed_out, true);
  for (const residue of audit.evidence.js_residue_inventory) {
    assert.deepEqual(
      residue.actual_js_files,
      residue.expected_js_files,
      residue.directory,
    );
    assert.equal(typeof residue.exception_registration?.owner, 'string');
    assert.equal(typeof residue.exception_registration?.reason, 'string');
    assert.equal(typeof residue.exception_registration?.migration_window, 'string');
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

    assert.equal(audit.criteria.js_residue_explicitly_closed_out, false);
    assert.equal(audit.criteria.closeout_ready, false);
    assert.ok(residue, residueDirectory);
    assert.deepEqual(residue.unexpected_js_files, [unexpectedFile]);
  } finally {
    rmSync(path.dirname(unexpectedPath), { recursive: true, force: true });
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
