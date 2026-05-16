// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const DEFAULT_OPL_BIN = '/Users/gaofeng/workspace/one-person-lab/bin/opl';
const RCA_DOMAIN_ID = 'redcube-ai';

function runOplAgentLabLongline() {
  const oplBin = process.env.OPL_BIN || DEFAULT_OPL_BIN;
  const result = spawnSync(oplBin, ['agent-lab', 'longline', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  assert.equal(
    result.status,
    0,
    [
      `OPL Agent Lab longline command failed: ${oplBin} agent-lab longline --json`,
      result.stderr,
      result.stdout,
    ].filter(Boolean).join('\n'),
  );

  return JSON.parse(result.stdout);
}

function assertIncludesAll(actual, expected) {
  for (const value of expected) {
    assert.ok(actual.includes(value), `expected ${JSON.stringify(actual)} to include ${value}`);
  }
}

function assertNoAuthorityWrite(boundary) {
  assert.equal(boundary.can_write_domain_truth, false);
  assert.equal(boundary.can_write_memory_body, false);
  assert.equal(boundary.can_authorize_quality_verdict, false);
}

test('RCA longline migration guard is delegated to OPL Agent Lab while visual authority stays in RCA', () => {
  const payload = runOplAgentLabLongline();
  const suite = payload.agent_lab_longline?.suite_result;

  assert.equal(suite?.status, 'passed');
  assert.ok(suite.longline_summary.domain_ids.includes(RCA_DOMAIN_ID));
  assert.equal(suite.longline_summary.ready_to_reduce_domain_longline_tests, true);

  const rcaDisposition = suite.longline_summary.recommended_repo_test_disposition
    .find((entry) => entry.domain_id === RCA_DOMAIN_ID);
  assert.ok(rcaDisposition, 'missing RCA recommended repo test disposition');
  assertIncludesAll(rcaDisposition.move_to_opl_agent_lab, [
    'controlled visual-stage soak orchestration',
    'hosted-attempt reconciliation projection',
    'no-forbidden-write cross-domain regression',
  ]);
  assertIncludesAll(rcaDisposition.keep_in_domain_repo, [
    'visual quality scorer',
    'render/export owner receipt fixture',
    'artifact authority checks',
  ]);

  assertNoAuthorityWrite(suite.longline_summary.authority_boundary);
  assertNoAuthorityWrite(suite.authority_boundary);
  assertNoAuthorityWrite(payload.agent_lab_longline.authority_boundary);

  const rcaRun = suite.runs.find((run) => run.domain_id === RCA_DOMAIN_ID);
  assert.ok(rcaRun, 'missing RCA Agent Lab longline run');
  assert.equal(rcaRun.status, 'passed');
  assertNoAuthorityWrite(rcaRun.authority_boundary);
  assertNoAuthorityWrite(rcaRun.trajectory.authority_boundary);
  assertNoAuthorityWrite(rcaRun.scorecard.authority_boundary);
  assertNoAuthorityWrite(rcaRun.promotion_gate.authority_boundary);
});
