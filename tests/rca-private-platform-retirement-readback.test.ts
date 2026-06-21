// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import {
  buildPrivatePlatformRetirementReadback,
} from '../scripts/check-private-platform-retirement.ts';

test('RCA private platform retirement strict readback is a guard, not readiness authority', () => {
  const payload = buildPrivatePlatformRetirementReadback();

  assert.equal(payload.surface_kind, 'rca_private_platform_retirement_strict_readback');
  assert.equal(payload.state, 'passed_repo_source_guard_only');
  assert.deepEqual(payload.failed_checks, []);
  assert.equal(
    payload.functional_privatization_audit.functional_structure_gap_closure.functional_structure_gap_count,
    0,
  );
  assert.equal(
    payload.functional_privatization_audit.functional_structure_gap_closure.evidence_gap_class,
    'production_live_soak_evidence_only',
  );
  assert.equal(
    payload.physical_source_morphology_policy.source_ref_integrity_gate.state,
    'repo_local_source_refs_declared_no_second_truth',
  );
  assert.equal(payload.runtime_watch_boundary.refs_only, true);
  assert.equal(payload.runtime_watch_boundary.read_only, true);
  assert.deepEqual(
    payload.default_caller_tail_compact_retirement_summary,
    payload.physical_source_morphology_policy.default_caller_tail_readback.compact_retirement_summary,
  );
  assert.equal(
    payload.default_caller_tail_compact_retirement_summary.state,
    'no_cleanup_candidates_owner_delta_required',
  );
  assert.equal(payload.default_caller_tail_compact_retirement_summary.cleanup_candidate_count, 0);
  assert.equal(payload.default_caller_tail_compact_retirement_summary.can_apply_cleanup, false);
  assert.equal(payload.default_caller_tail_compact_retirement_summary.can_authorize_physical_delete, false);
  assert.equal(
    payload.default_caller_tail_compact_retirement_summary.can_claim_default_caller_cutover_complete,
    false,
  );
  assert.equal(payload.default_caller_tail_compact_retirement_summary.can_claim_domain_ready, false);
  assert.ok(
    payload.default_caller_tail_compact_retirement_summary.missing_evidence_ids.includes(
      'no_active_repo_local_default_caller',
    ),
  );
  assert.ok(payload.domain_action_adapter_boundary.blocked_actions.includes('write_visual_truth'));
  assert.ok(payload.domain_action_adapter_boundary.forbidden_writes.includes('review_verdict'));
  assert.ok(payload.allowed_outputs.includes('typed_blocker_ref_shape'));
  assert.ok(payload.forbidden_outputs.includes('physical_delete_operation'));
  assert.deepEqual(payload.authority_boundary, {
    readback_can_write_visual_truth: false,
    readback_can_write_artifact_blob: false,
    readback_can_write_memory_body: false,
    readback_can_issue_review_or_export_verdict: false,
    readback_can_sign_owner_receipt: false,
    readback_can_authorize_physical_delete: false,
    readback_can_claim_default_caller_cutover: false,
    readback_can_claim_visual_ready: false,
    readback_can_claim_exportable: false,
    readback_can_claim_handoffable: false,
    readback_can_claim_production_ready: false,
  });
});

test('RCA private platform retirement strict script emits JSON readback', () => {
  const directReadbackPath = `/tmp/redcube-ai-private-platform-direct-readback-${process.pid}.json`;
  const readbackResult = spawnSync(
    'sh',
    ['-c', `npm run --silent private-platform:readback > "${directReadbackPath}"`],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  );

  assert.equal(readbackResult.status, 0, readbackResult.stderr || readbackResult.stdout);
  const directPayload = JSON.parse(readFileSync(directReadbackPath, 'utf-8'));
  assert.equal(directPayload.surface_kind, 'rca_private_platform_retirement_strict_readback');
  assert.equal(directPayload.state, 'passed_repo_source_guard_only');
  assert.equal(directPayload.default_caller_tail_compact_retirement_summary.cleanup_candidate_count, 0);
  assert.equal(directPayload.default_caller_tail_compact_retirement_summary.can_apply_cleanup, false);
  assert.equal(directPayload.authority_boundary.readback_can_authorize_physical_delete, false);
  assert.equal(directPayload.authority_boundary.readback_can_claim_production_ready, false);

  const result = spawnSync('npm', ['run', '--silent', 'test:private-platform:strict'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(readFileSync('/tmp/redcube-ai-private-platform-retirement.json', 'utf-8'));
  assert.deepEqual(payload, directPayload);
});
