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
import { createNativePptCodexInvocationBlockerParts } from '../packages/redcube-runtime-family-ppt/dist/ppt-deck-runtime-family-parts/native-ppt-codex-invocation-blocker.js';

test('native PPT Codex invocation blockers persist diagnostic refs before materialization', async () => {
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
      'deck-codex-blocker-author_pptx_native-codex-invocation-blocker.json',
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

    const blocker = readJson(blockerFile);
    assert.equal(blocker.surface_kind, 'redcube_native_ppt_codex_invocation_blocker');
    assert.equal(blocker.status, 'blocked');
    assert.equal(blocker.typed_blocker.blocker_kind, 'codex_cli_execution_blocked');
    assert.equal(blocker.no_artifact_body_written, true);
    assert.equal(blocker.helper_fallback_used, false);
    assert.equal(blocker.visual_ready_claimed, false);
    assert.equal(blocker.exportable_claimed, false);
    assert.equal(blocker.prompt_telemetry.timeout_ms, 600000);
    assert.equal(blocker.prompt_telemetry.prompt_bytes > 0, true);
    assert.equal(blocker.prompt_telemetry.context_bytes > 0, true);
    assert.equal(blocker.prompt_telemetry.estimated_prompt_tokens > 0, true);
    assert.equal(blocker.stage_input_refs.unit_repair_scope.scope, 'deck');
  });
});

test('native PPT Codex invocation blocker exposes latest validation refs without claiming visual readiness', () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-native-codex-blocker-summary-'));
  const blockerFile = path.join(tempRoot, 'native-codex-blocker.json');
  const parts = createNativePptCodexInvocationBlockerParts({
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
  parts.writeCodexInvocationBlocker({
    file: blockerFile,
    route: 'author_pptx_native',
    contract: {},
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
  const blocker = readJson(blockerFile);
  assert.deepEqual(blocker.attempt_artifact_refs, [
    '/tmp/attempt-01.json',
    '/tmp/attempt-01-validation.json',
  ]);
  assert.equal(blocker.latest_validation_summary.previous_attempt, 1);
  assert.equal(blocker.latest_validation_summary.ok, false);
  assert.equal(blocker.latest_validation_summary.stage, 'ai_first_shape_plan_preflight');
  assert.deepEqual(blocker.latest_validation_summary.failure_reasons, [
    'ai_first_page_number_missing',
    'ai_first_text_box_height_below_readability_floor',
  ]);
  assert.deepEqual(blocker.latest_validation_summary.failed_shape_ids, ['S01_input_label']);
  assert.equal(blocker.latest_validation_summary.refs_only, true);
  assert.equal(blocker.latest_validation_summary.can_claim_visual_ready, false);
  assert.equal(blocker.visual_ready_claimed, false);
  assert.equal(blocker.exportable_claimed, false);
});
