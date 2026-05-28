// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

import { withEnv } from './mock-codex-cli.ts';
import { mkUserScopedTestWorkspace } from './helpers/test-workspace.ts';
import {
  readJson,
  runNativePlanningChain,
  withMockNativePptRuntime,
} from './helpers/ppt-native-ppt-runtime-fixtures.ts';
import { runDeliverableRoute } from './product-domain-action-test-api.ts';

test('native PPT AI shape plan retry carries panel safe-area fixes with containing panel refs', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-panel-safe-area-retry-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-panel-safe-area-retry' });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'require_panel_safe_area_retry_contract',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-panel-safe-area-retry',
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, true);
      const authored = readJson(nativeResult.artifactFile);
      const preflight = authored.native_ppt_bundle.ai_first_shape_plan_preflight;
      assert.equal(preflight.attempts, 2);
      assert.equal(preflight.self_repair_used, true);
      assert.equal(preflight.validator.ok, true);
      const attemptValidationFile = preflight.attempt_artifact_refs
        .find((file) => file.endsWith('plan-validation-input-attempt-01-validation.json'));
      assert.equal(existsSync(attemptValidationFile), true);
      const firstAttemptValidation = readJson(attemptValidationFile);
      const panelSafeAreaFix = firstAttemptValidation.failures
        .flatMap((slide) => slide.failures || [])
        .find((failure) => failure.reason === 'ai_first_text_panel_safe_area_violation');
      assert.equal(typeof panelSafeAreaFix?.panel_shape_id, 'string');
      assert.equal(panelSafeAreaFix.other_shape_id, undefined);
      assert.equal(panelSafeAreaFix.required_inset_in, 0.15);
      assert.equal(
        preflight.attempt_artifact_refs.some((file) => file.endsWith('plan-validation-input-attempt-02-validation.json')),
        true,
      );
    } finally {
      restoreRoute();
    }
  });
});

test('native PPT final preflight failure records attempt refs for live blocker audit', async () => {
  await withMockNativePptRuntime(async () => {
    const workspaceRoot = mkUserScopedTestWorkspace('redcube-native-ppt-final-preflight-refs-');
    await runNativePlanningChain({ workspaceRoot, deliverableId: 'deck-final-preflight-refs' });
    const restoreRoute = withEnv({
      REDCUBE_MOCK_MUTATE_ROUTE: 'author_pptx_native',
      REDCUBE_MOCK_MUTATE_KIND: 'always_tiny_native_plan',
      REDCUBE_NATIVE_PPT_PLAN_MAX_ATTEMPTS: '2',
    });
    try {
      const nativeResult = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-final-preflight-refs',
        route: 'author_pptx_native',
      });
      assert.equal(nativeResult.ok, false);
      assert.match(
        String(nativeResult.error?.message || nativeResult.error || ''),
        /did not pass preflight after 2 attempt/i,
      );
      assert.equal(nativeResult.run.artifact_refs.length >= 4, true);
      assert.equal(
        nativeResult.run.artifact_refs.some((file) => file.endsWith('plan-validation-input-attempt-02-validation.json')),
        true,
      );
      assert.equal(
        nativeResult.run.error.artifact_refs.some((file) => file.endsWith('plan-validation-input-attempt-01.json')),
        true,
      );
    } finally {
      restoreRoute();
    }
  });
});
