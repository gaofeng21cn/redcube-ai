import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync } from 'node:fs';

import { readRepoFile, readRepoJson, repoRoot } from './shared.js';

test('source CI stays on per-change and manual triggers while qualification is weekly or manual', () => {
  const workflow = readRepoFile('.github/workflows/ci.yml');
  const qualification = readRepoFile('.github/workflows/qualification.yml');

  assert.match(workflow, /push:\n\s+branches: \[main\]/);
  assert.match(workflow, /^  pull_request:/m);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /schedule:/);
  assert.match(qualification, /workflow_dispatch:/);
  assert.match(qualification, /schedule:\n\s+- cron:\s*['"]17 19 \* \* 0['"]/);
  assert.doesNotMatch(qualification, /pull_request:/);
  assert.match(
    workflow,
    /concurrency:\n\s+group: \$\{\{ github\.workflow \}\}-\$\{\{ github\.ref \}\}\n\s+cancel-in-progress: true/,
  );
  assert.equal(
    existsSync(path.join(repoRoot, '.github/workflows/sentrux-advisory.yml')),
    false,
  );

  for (const contractPath of [
    'tools/native-ppt-proof/ci-contract.json',
    'tools/image-ppt-proof/ci-contract.json',
  ]) {
    const contract = readRepoJson(contractPath);
    assert.deepEqual(
      contract.default_quality_lane.required_workflow_events,
      ['pull_request', 'workflow_dispatch'],
    );
  }
});

test('local structural diagnostics remain available after standalone advisory retirement', () => {
  const verify = readRepoFile('scripts/verify.sh');
  const verifyLane = readRepoFile('scripts/verify-lane.ts');
  const structuralGate = readRepoFile('scripts/run-structural-quality-gate.sh');
  const qualityDetails = readRepoFile('scripts/run-opl-quality-details.sh');

  assert.match(verify, /run-with-repo-temp-env\.sh/);
  assert.match(verify, /scripts\/verify-lane\.ts "\$lane" --verify-wrapper "\$@"/);
  assert.doesNotMatch(verify, /case "\$lane" in/);
  assert.match(verifyLane, /runLineBudget\(lane === 'line-budget-strict' \|\| lane === 'structure-strict'\)/);
  assert.match(verifyLane, /runStructure/);
  assert.doesNotMatch(verify, /quality details|sentrux-advisory|opl-quality-details/);

  assert.match(structuralGate, /strict=0/);
  assert.match(structuralGate, /OPL_LINE_BUDGET_STRICT/);
  assert.match(structuralGate, /\bsentrux gate \./);
  assert.match(structuralGate, /\bsentrux check \./);
  assert.match(structuralGate, /scripts\/run-opl-quality-details\.sh/);
  assert.match(structuralGate, /exit "\$sentrux_status"/);
  assert.match(structuralGate, /exit 0/);

  assert.match(qualityDetails, /compare_ref="\$\{OPL_QUALITY_DETAILS_COMPARE_REF:-origin\/main\}"/);
  assert.match(qualityDetails, /OPL_QUALITY_DETAILS_BIN:-\/Users\/gaofeng\/workspace\/one-person-lab\/bin\/opl/);
  assert.match(qualityDetails, /--compare-ref "\$compare_ref"/);
});
