// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import { readRepoFile } from './shared.ts';

test('Sentrux advisory publishes OPL quality details without changing the default quality lane', () => {
  const workflow = readRepoFile('.github/workflows/sentrux-advisory.yml');

  assert.match(workflow, /uses:\s*actions\/checkout@v6\b[\s\S]*?fetch-depth:\s*0\b/);
  assert.match(workflow, /git fetch --no-tags --prune origin main:refs\/remotes\/origin\/main/);
  assert.match(workflow, /\bsentrux gate \./);
  assert.match(workflow, /\bsentrux check \./);
  assert.match(workflow, /uses:\s*gaofeng21cn\/one-person-lab\/\.github\/actions\/quality-details@main\b/);
  assert.match(workflow, /compare-ref:\s*origin\/main\b/);
  assert.match(
    workflow,
    /limit:\s*['"]20['"]/
  );
  assert.match(
    workflow,
    /json-limit:\s*['"]50['"]/
  );
  assert.match(workflow, /uses:\s*actions\/upload-artifact@v7\b/);
  assert.match(workflow, /name:\s*opl-quality-details\b/);
  assert.match(workflow, /path:\s*artifacts\/opl-quality-details\/quality-details\.json\b/);

  const verify = readRepoFile('scripts/verify.sh');
  const verifyLines = verify.split('\n').map((line) => line.trim());
  const preflightCaseStart = verifyLines.indexOf('case "$lane" in');
  assert.notEqual(preflightCaseStart, -1);
  assert.deepEqual(verifyLines.slice(preflightCaseStart, preflightCaseStart + 9), [
    'case "$lane" in',
    'line-budget-strict|structure-strict)',
    'npm run --silent line-budget:strict',
    ';;',
    '*)',
    'npm run --silent line-budget',
    ';;',
    'esac',
    '',
  ]);
  assert.ok(preflightCaseStart < verifyLines.indexOf('scripts/repo-hygiene.sh --fix'));
  assert.match(verify, /smoke\)\n\s+npm run test:smoke/);
  assert.match(verify, /fast\)\n\s+npm run test:fast/);
  assert.match(verify, /ci\)\n\s+npm run test:ci/);
  assert.match(verify, /line-budget\|line-budget-strict\)\n\s+;;/);
  assert.match(verify, /structure\)\n\s+scripts\/run-structural-quality-gate\.sh/);
  assert.match(verify, /structure-strict\)\n\s+OPL_LINE_BUDGET_STRICT=1 scripts\/run-structural-quality-gate\.sh --strict/);
  assert.doesNotMatch(verify, /test:line-budget/);
  assert.doesNotMatch(verify, /quality details|sentrux-advisory|opl-quality-details/);

  const structuralGate = readRepoFile('scripts/run-structural-quality-gate.sh');
  assert.match(structuralGate, /strict=0/);
  assert.match(structuralGate, /OPL_LINE_BUDGET_STRICT/);
  assert.match(structuralGate, /\bsentrux gate \./);
  assert.match(structuralGate, /\bsentrux check \./);
  assert.match(structuralGate, /scripts\/run-opl-quality-details\.sh/);
  assert.match(structuralGate, /exit "\$sentrux_status"/);
  assert.match(structuralGate, /Sentrux advisory only; continuing/);
  assert.match(structuralGate, /exit 0/);

  const qualityDetails = readRepoFile('scripts/run-opl-quality-details.sh');
  assert.match(qualityDetails, /compare_ref="\$\{OPL_QUALITY_DETAILS_COMPARE_REF:-origin\/main\}"/);
  assert.match(qualityDetails, /OPL_QUALITY_DETAILS_BIN:-\/Users\/gaofeng\/workspace\/one-person-lab\/bin\/opl/);
  assert.match(qualityDetails, /--compare-ref "\$compare_ref"/);
});
