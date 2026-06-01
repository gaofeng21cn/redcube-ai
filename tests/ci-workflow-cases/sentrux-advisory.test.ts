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
  assert.match(verify, /smoke\)\n\s+npm run test:line-budget\n\s+npm run test:smoke/);
  assert.match(verify, /fast\)\n\s+npm run test:line-budget\n\s+npm run test:fast/);
  assert.match(verify, /ci\)\n\s+npm run test:line-budget\n\s+npm run test:ci/);
  assert.match(verify, /structure\)\n\s+npm run test:line-budget\n\s+scripts\/run-structural-quality-gate\.sh/);
  assert.doesNotMatch(verify, /quality details|sentrux-advisory|opl-quality-details/);

  const structuralGate = readRepoFile('scripts/run-structural-quality-gate.sh');
  assert.match(structuralGate, /\bsentrux gate \./);
  assert.match(structuralGate, /\bsentrux check \./);
  assert.match(structuralGate, /scripts\/run-opl-quality-details\.sh/);
  assert.match(structuralGate, /exit "\$sentrux_status"/);

  const qualityDetails = readRepoFile('scripts/run-opl-quality-details.sh');
  assert.match(qualityDetails, /compare_ref="\$\{OPL_QUALITY_DETAILS_COMPARE_REF:-origin\/main\}"/);
  assert.match(qualityDetails, /OPL_QUALITY_DETAILS_BIN:-\/Users\/gaofeng\/workspace\/one-person-lab\/bin\/opl/);
  assert.match(qualityDetails, /--compare-ref "\$compare_ref"/);
});
