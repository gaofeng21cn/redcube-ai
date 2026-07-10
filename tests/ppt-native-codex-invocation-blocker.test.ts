// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';

import { withEnv } from './mock-codex-cli.ts';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';
import {
  readJson,
  runNativePlanningChain,
  withMockNativePptRuntime,
} from './helpers/ppt-native-ppt-runtime-fixtures.ts';
import { runDeliverableRoute } from './product-domain-action-test-api.ts';
import { createNativePptExecutorAttemptDiagnosticParts } from '../packages/redcube-runtime/dist/families/ppt/ppt-deck-runtime-family-parts/native-ppt-executor-attempt-diagnostic.js';

test('native PPT Codex failures persist OPL attempt diagnostics without creating typed blockers', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-codex-blocker-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-codex-blocker' });

    const blockerFile = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-codex-blocker',
      'artifacts',
      'native_ppt',
      'deck-codex-blocker-author_pptx_native-executor-attempt-diagnostic.json',
    );
    const restoreRoute = withEnv({
      REDCUBE_MOCK_FAIL_ROUTE: 'author_pptx_native',
    });
    let nativeResult;
    try {
      nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-codex-blocker',
        route: 'author_pptx_native',
      });
    } finally {
      restoreRoute();
    }

    assert.equal(nativeResult.ok, false);
    assert.equal(nativeResult.run.status, 'failed');
    assert.equal(nativeResult.run.error.failure_kind, 'codex_cli_execution_blocked');
    assert.equal(nativeResult.run.error.artifact_file, blockerFile);
    assert.equal(nativeResult.run.error.artifact_refs.includes(blockerFile), true);
    assert.equal(nativeResult.run.artifact_refs.includes(blockerFile), true);
    assert.equal(existsSync(blockerFile), true);

    const diagnostic = readJson(blockerFile);
    assert.equal(diagnostic.surface_kind, 'opl_executor_attempt_diagnostic');
    assert.equal(diagnostic.contract_id, 'opl_family_runtime_attempt_contract.v1');
    assert.equal(diagnostic.status, 'failed');
    assert.equal(diagnostic.route_ref, 'author_pptx_native');
    assert.equal(diagnostic.error.failure_kind, 'codex_cli_execution_blocked');
    assert.equal(diagnostic.typed_blocker_ref, undefined);
    assert.equal(diagnostic.typed_blocker, undefined);
    assert.equal(diagnostic.authority_boundary.diagnostic_only, true);
    assert.equal(diagnostic.authority_boundary.typed_blocker_created, false);
    assert.equal(diagnostic.authority_boundary.owner_receipt_created, false);
    assert.equal(diagnostic.authority_boundary.domain_truth_written, false);
    assert.equal(diagnostic.authority_boundary.artifact_body_written, false);
    assert.equal(diagnostic.runtime_projection.timeout_ms, 600000);
    assert.equal(diagnostic.runtime_projection.prompt_bytes > 0, true);
    assert.equal(diagnostic.runtime_projection.context_bytes > 0, true);
    assert.equal(diagnostic.runtime_projection.estimated_prompt_tokens > 0, true);
    assert.equal(diagnostic.domain_projection.stage_input_refs.unit_repair_scope.scope, 'deck');
  });
});

test('native PPT Codex attempt diagnostic exposes visual validation refs without claiming readiness', () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-codex-blocker-summary-'));
  const blockerFile = path.join(tempRoot, 'native-codex-blocker.json');
  const parts = createNativePptExecutorAttemptDiagnosticParts({
    PROMPT_PACK: {
      author_pptx_native: 'prompts/ppt_deck/author_pptx_native_sample.md',
    },
    safeArray: (value) => (Array.isArray(value) ? value : []),
    safeText: (value, fallback = '') => String(value || fallback || '').trim(),
    writeJson: (file, data) => {
      writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
    },
  });
  const error = new Error('Codex CLI execution timed out after 600000ms');
  error.failure_kind = 'codex_cli_execution_blocked';
  error.codex_cli_runtime = {
    prompt_pack_file: 'prompts/ppt_deck/author_pptx_native_sample.md',
    prompt_bytes: 72593,
    context_bytes: 17420,
    estimated_prompt_tokens: 18149,
    timeout_ms: 600000,
  };
  parts.writeExecutorAttemptDiagnostic({
    file: blockerFile,
    route: 'author_pptx_native',
    deliverablePaths: { deliverableDir: tempRoot },
    blueprintArtifact: { status: 'completed' },
    visualArtifact: { status: 'completed' },
    repairFeedback: [],
    unitRepairScope: { scope: 'deck' },
    validationFeedback: {
      previous_attempt: 1,
      validator: {
        ok: false,
        stage: 'ai_first_shape_plan_preflight',
        failure_count: 2,
        failures: [{
          slide_id: 'S01',
          failures: [
            { reason: 'ai_first_page_number_missing' },
            {
              reason: 'ai_first_text_box_height_below_readability_floor',
              shape_id: 'S01_input_label',
            },
          ],
        }],
      },
      attempt_artifact_refs: [
        '/tmp/attempt-01.json',
        '/tmp/attempt-01-validation.json',
      ],
    },
    attemptIndex: 2,
    adapter: 'codex_cli',
    error,
  });
  const diagnostic = readJson(blockerFile);
  assert.deepEqual(diagnostic.artifact_refs.map((entry) => entry.ref), [
    '/tmp/attempt-01.json',
    '/tmp/attempt-01-validation.json',
  ]);
  assert.equal(diagnostic.domain_projection.latest_validation_summary.previous_attempt, 1);
  assert.equal(diagnostic.domain_projection.latest_validation_summary.ok, false);
  assert.equal(diagnostic.domain_projection.latest_validation_summary.stage, 'ai_first_shape_plan_preflight');
  assert.deepEqual(diagnostic.domain_projection.latest_validation_summary.failure_reasons, [
    'ai_first_page_number_missing',
    'ai_first_text_box_height_below_readability_floor',
  ]);
  assert.deepEqual(diagnostic.domain_projection.latest_validation_summary.failed_shape_ids, ['S01_input_label']);
  assert.equal(diagnostic.domain_projection.latest_validation_summary.refs_only, true);
  assert.equal(diagnostic.domain_projection.latest_validation_summary.can_claim_visual_ready, false);
  assert.equal(diagnostic.authority_boundary.domain_verdict_issued, false);
  assert.equal(diagnostic.typed_blocker, undefined);
});
