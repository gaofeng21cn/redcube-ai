import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';

import {
  auditDeliverable,
  applyReviewMutation,
  createDeliverable,
  reviewRenderOutput,
  runDeliverableRoute,
  runtimeWatch,
} from '../packages/redcube-gateway/src/index.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.js';

async function withMockHermesUpstream(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

test('auditDeliverable blocks optimize_existing task without baseline', async () => {
  const report = await auditDeliverable({
    overlay: 'ppt_deck',
    mode: 'optimize_existing',
    baselineDeliverableId: '',
  });

  assert.equal(report.surface_kind, 'audit');
  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['baseline_missing']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'bind_baseline_deliverable');
});

test('auditDeliverable blocks when canonical source readiness is missing and exposes source_readiness_summary', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    mode: 'draft_new',
  });

  assert.equal(report.status, 'block');
  assert.equal(report.issues.includes('source_audit_missing'), true);
  assert.equal(report.rerun_from_stage, 'source_readiness');
  assert.equal(report.recommended_action, 'run_source_research');
  assert.equal(report.source_readiness_summary?.status, 'missing');
  assert.equal(report.source_readiness_summary?.canonical_source?.kind, 'shared_source_truth.source_readiness_gate');
});

test('auditDeliverable passes with canonical source readiness and returns source_readiness_summary', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊科普',
    brief: '为本科生准备甲状腺基础知识讲解材料，强调定义、功能、检查与常见误区。',
    keywords: ['甲状腺', '内分泌', '门诊科普'],
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    mode: 'draft_new',
  });

  assert.equal(report.status, 'pass');
  assert.equal(report.recommended_action, 'run_deliverable_route');
  assert.equal(report.source_readiness_summary?.status, 'pass');
  assert.equal(report.source_readiness_summary?.blocking_reasons?.length, 0);
});

test('auditDeliverable blocks optimize_existing task when baseline is not approved', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));
  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊小红书素材',
    brief: '为门诊患者准备甲状腺科普图文，需要覆盖检查、误区与就诊建议。',
    keywords: ['甲状腺', '门诊', '科普'],
  });

  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'baseline-a',
    title: '甲状腺门诊小红书 baseline',
    goal: '作为后续优化的旧版基线',
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'candidate-a',
    title: '甲状腺门诊小红书优化版',
    goal: '在现有基线之上继续优化',
  });

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId: 'candidate-a',
    mode: 'optimize_existing',
    baselineDeliverableId: 'baseline-a',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['baseline_not_approved']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'approve_or_publish_baseline');
  assert.equal(report.quality_summary?.baseline_promotion_state ?? null, null);
  assert.equal(report.quality_summary?.promoted_reference_id ?? null, null);
});

test('auditDeliverable surfaces promoted baseline summary for optimize_existing', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊小红书素材',
      brief: '为门诊患者准备甲状腺科普图文，需要覆盖检查、误区与就诊建议。',
      keywords: ['甲状腺', '门诊', '科普'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'baseline-a',
      title: '甲状腺门诊小红书 baseline',
      goal: '旧版认可稿',
    });
    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'baseline-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }
    await applyReviewMutation({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'baseline-a',
      mutation: { type: 'approve_publish', actor: 'human', notes: 'approve baseline' },
    });
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'candidate-a',
      title: '甲状腺门诊小红书优化版',
      goal: '在 baseline 基础上优化可读性',
    });
    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'candidate-a',
        route,
        mode: 'optimize_existing',
        baselineDeliverableId: 'baseline-a',
      });
      assert.equal(result.ok, true, route);
    }
    await applyReviewMutation({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'candidate-a',
      mutation: { type: 'approve_publish', actor: 'human', notes: 'approve optimized baseline' },
    });
    await applyReviewMutation({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'candidate-a',
      mutation: {
        type: 'promote_baseline',
        actor: 'human',
        promoted_reference_id: 'xhs-note-v1',
        notes: 'promote baseline into reference',
      },
    });

    const report = await auditDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'candidate-a',
      mode: 'optimize_existing',
      baselineDeliverableId: 'candidate-a',
    });

    assert.equal(report.status, 'pass');
    assert.equal(report.quality_summary?.baseline_promotion_state, 'promoted');
    assert.equal(report.quality_summary?.promoted_reference_id, 'xhs-note-v1');
  });
});

test('auditDeliverable blocks missing hydrated surface artifact', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));
  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊 deck 素材',
    brief: '为本科生讲授甲状腺基础知识，需要结构化材料支持。',
    keywords: ['甲状腺', '教学', '基础知识'],
  });

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });
  rmSync(path.join(
    workspaceRoot,
    'topics',
    'topic-a',
    'deliverables',
    'deck-a',
    'contracts',
    'hydrated-deliverable.json',
  ));

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['deliverable_contract_missing:hydrated_deliverable']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'rehydrate_deliverable_surface');
});

test('reviewRenderOutput emits rerun target when visual density is too high', async () => {
  const report = await reviewRenderOutput({
    overlay: 'ppt_deck',
    checks: { visual_density_ok: false, overflow_free: true },
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['visual_density_too_high']);
  assert.equal(report.rerun_from_stage, 'visual_direction');
});

test('reviewRenderOutput reports missing visual density check separately', async () => {
  const report = await reviewRenderOutput({
    overlay: 'ppt_deck',
    checks: {},
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['visual_density_check_missing']);
  assert.equal(report.rerun_from_stage, 'render_review');
  assert.equal(report.recommended_action, 'supply_render_checks');
});

test('reviewRenderOutput loads lecture_student profile checks from hydrated contract', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  const report = await reviewRenderOutput({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    overlay: 'ppt_deck',
    checks: {
      director_intent_landed: true,
      anti_template_ok: true,
      overflow_free: true,
      occlusion_free: true,
      visual_density_ok: true,
      speaker_fit_ok: true,
      edge_clearance_ok: true,
      block_content_fit_ok: true,
      title_typography_ok: true,
      teaching_progression_clear: true,
    },
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['term_explained_on_first_use_missing']);
  assert.equal(report.rerun_from_stage, 'storyline');
  assert.equal(report.recommended_action, 'supply_render_checks');
});

test('reviewRenderOutput loads executive_briefing profile checks from hydrated contract', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'executive_briefing',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '门诊改造汇报 deck',
    goal: '向院领导汇报门诊容量与改造建议',
  });

  const report = await reviewRenderOutput({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    overlay: 'ppt_deck',
    checks: {
      director_intent_landed: true,
      anti_template_ok: true,
      overflow_free: true,
      occlusion_free: true,
      visual_density_ok: true,
      speaker_fit_ok: true,
      edge_clearance_ok: true,
      block_content_fit_ok: true,
      title_typography_ok: true,
      decision_implication_clear: false,
      conclusion_up_front: true,
    },
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['decision_implication_clear_failed']);
  assert.equal(report.rerun_from_stage, 'storyline');
  assert.equal(report.recommended_action, 'revise_render_output');
});

test('runtimeWatch reports pending review loop state', async () => {
  const report = await runtimeWatch({
    run: {
      run_id: 'run-1',
      current_stage: 'render_review',
      status: 'blocked',
      pending_reviews: ['render_review'],
      resumable: true,
    },
  });

  assert.equal(report.ok, true);
  assert.equal(report.surface_kind, 'runtime_watch');
  assert.equal(report.run_id, 'run-1');
  assert.equal(report.current_stage, 'render_review');
  assert.equal(report.status, 'review_pending');
  assert.deepEqual(report.pending_reviews, ['render_review']);
  assert.equal(report.resumable, true);
  assert.equal(report.run_telemetry.run_id, 'run-1');
  assert.equal(report.run_telemetry.status, 'blocked');
  assert.equal(report.error_taxonomy.error_kind, null);
  assert.equal(report.rerun_analytics.rerun_count, 0);
  assert.equal(report.cost_summary.executor_identity, null);
  assert.equal(report.quality_drift_summary.relative_quality_verdict, null);
  assert.equal(report.approval_throughput_summary.pending_review_count, 1);
});


test('runtimeWatch can load a persisted run from the canonical workspace/topic/deliverable/run locator', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-watch-locator-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '正式答辩 deck source',
      brief: '答辩 deck 需要清晰展示问题、方法、结果与答辩防守要点。',
      keywords: ['答辩', '结果', '问题'],
    });
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'defense_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '正式答辩 deck',
      goal: '用于正式答辩并覆盖潜在质询',
    });

    const runResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });

    const report = await runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      runId: runResult.run.run_id,
    });

    assert.equal(report.ok, true);
    assert.equal(report.run_id, runResult.run.run_id);
    assert.equal(report.current_stage, 'storyline');
    assert.equal(report.run_telemetry.run_id, runResult.run.run_id);
  });
});

test('runtimeWatch keeps deliverable-level review watch available when no run locator is provided', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-watch-deliverable-only-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '肠癌 AI 讲课 deck',
      goal: '给学生讲清肠癌 AI 的问题、方法与边界',
    });

    for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const blocked = await applyReviewMutation({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      mutation: {
        type: 'request_changes',
        actor: 'human',
        review_stage: 'screenshot_review',
        rerun_from_stage: 'render_html',
        issues: ['visual_peak_missing'],
        notes: '关键页视觉峰值不够',
      },
    });
    assert.equal(blocked.state.current_status, 'blocked_for_revision');

    const watch = await runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
    });

    assert.equal(watch.ok, true);
    assert.equal(watch.status, 'review_pending');
    assert.equal(watch.review_state.current_status, 'blocked_for_revision');
    assert.equal(watch.review_state.rerun_from_stage, 'render_html');
  });
});

test('runtimeWatch rejects a persisted run when topic locator does not match the run identity', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-watch-locator-mismatch-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'topic a source',
      brief: 'topic a',
      keywords: ['topic-a'],
    });
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-b',
      title: 'topic b source',
      brief: 'topic b',
      keywords: ['topic-b'],
    });
    for (const topicId of ['topic-a', 'topic-b']) {
      await createDeliverable({
        workspaceRoot,
        overlay: 'ppt_deck',
        profileId: 'defense_deck',
        topicId,
        deliverableId: 'deck-a',
        title: `deck ${topicId}`,
        goal: `goal ${topicId}`,
      });
    }

    const runResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });

    await assert.rejects(
      () => runtimeWatch({
        workspaceRoot,
        topicId: 'topic-b',
        deliverableId: 'deck-a',
        runId: runResult.run.run_id,
      }),
      /runtimeWatch topicId 与 run\.topic_id 不一致/,
    );
  });
});

test('runtimeWatch exposes export bundle obligations from hydrated contract', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'defense_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '正式答辩 deck',
    goal: '用于正式答辩并覆盖潜在质询',
  });

  const report = await runtimeWatch({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    run: {
      run_id: 'run-1',
      topic_id: 'topic-a',
      deliverable_id: 'deck-a',
      current_stage: 'export_pptx',
      status: 'blocked',
      pending_reviews: ['backup_qa_ready'],
      resumable: true,
    },
  });

  assert.equal(report.ok, true);
  assert.equal(report.profile_id, 'defense_deck');
  assert.equal(report.delivery_contract.required_export_route, 'export_pptx');
  assert.equal(report.delivery_contract.required_export_bundle_id, 'defense_deck_bundle');
  assert.equal(report.required_export_bundle.bundle_id, 'defense_deck_bundle');
  assert.equal(report.required_export_bundle.include_backup_slides, true);
});

test('runtimeWatch rejects a preloaded run when deliverable locator does not match the run identity', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-preloaded-mismatch-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'defense_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: 'deck a',
    goal: 'goal a',
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'defense_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-b',
    title: 'deck b',
    goal: 'goal b',
  });

  await assert.rejects(
    () => runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-b',
      run: {
        run_id: 'run-1',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        current_stage: 'export_pptx',
        status: 'blocked',
        pending_reviews: ['backup_qa_ready'],
        resumable: true,
      },
    }),
    /runtimeWatch deliverableId 与 run\.deliverable_id 不一致/,
  );
});

test('runtimeWatch rejects a preloaded run without topic and deliverable identity under a workspace locator', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-preloaded-missing-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'defense_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: 'deck a',
    goal: 'goal a',
  });

  await assert.rejects(
    () => runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      run: {
        run_id: 'run-1',
        current_stage: 'export_pptx',
        status: 'blocked',
        pending_reviews: ['backup_qa_ready'],
        resumable: true,
      },
    }),
    /runtimeWatch run\.topic_id 与 run\.deliverable_id 不能为空/,
  );
});

test('runtimeWatch exposes source readiness summary and gate summary from canonical source audit plus export contract', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: '正式答辩 deck source',
    brief: '答辩 deck 需要清晰展示问题、方法、结果与答辩防守要点。',
    keywords: ['答辩', '结果', '问题'],
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'defense_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '正式答辩 deck',
    goal: '用于正式答辩并覆盖潜在质询',
  });

  const report = await runtimeWatch({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    run: {
      run_id: 'run-1',
      topic_id: 'topic-a',
      deliverable_id: 'deck-a',
      current_stage: 'export_pptx',
      status: 'blocked',
      pending_reviews: ['backup_qa_ready'],
      resumable: true,
    },
  });

  assert.equal(report.source_readiness_summary?.status, 'pass');
  assert.equal(report.source_readiness_summary?.canonical_source?.kind, 'shared_source_truth.source_readiness_gate');
  assert.equal(report.gate_summary?.source_readiness_status, 'pass');
  assert.equal(report.gate_summary?.source_planning_ready, true);
  assert.equal(report.gate_summary?.required_export_route, 'export_pptx');
  assert.equal(report.gate_summary?.required_export_bundle_id, 'defense_deck_bundle');
  assert.equal(report.gate_summary?.approval_status, 'not_required');
});

test('runtimeWatch exposes publication projection separately from canonical review state', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });

    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const report = await runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'note-a',
      run: {
        run_id: 'run-1',
        topic_id: 'topic-a',
        deliverable_id: 'note-a',
        current_stage: 'publish_copy',
        status: 'completed',
        pending_reviews: [],
        resumable: false,
      },
    });

    assert.equal(report.surface_kind, 'runtime_watch');
    assert.equal(report.review_state.publish_state.current, 'approval_pending');
    assert.equal(report.publication_projection.current, 'approval_pending');
    assert.equal(report.quality_summary?.relative_quality_verdict, null);
    assert.equal(report.quality_summary?.baseline_promotion_state, null);
    assert.equal(report.approval_throughput_summary.publish_state, 'approval_pending');
    assert.equal(report.approval_throughput_summary.pending_review_count, 0);
  });
});

test('runtimeWatch exposes poster-specific metric extension surface separately from generic ops-eval base', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'poster_onepager',
    profileId: 'knowledge_poster',
    topicId: 'topic-a',
    deliverableId: 'poster-a',
    title: '甲状腺门诊知识海报',
    goal: '为门诊患者生成单页知识海报',
  });

  const report = await runtimeWatch({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'poster-a',
    run: {
      run_id: 'run-poster-1',
      topic_id: 'topic-a',
      deliverable_id: 'poster-a',
      current_stage: 'visual_direction',
      status: 'running',
      pending_reviews: [],
      resumable: true,
    },
  });

  assert.equal(Array.isArray(report.metric_extensions), true);
  assert.equal(report.metric_extensions.length, 1);
  assert.equal(report.metric_extensions[0].extension_id, 'poster_specific_metrics');
  assert.equal(report.metric_extensions[0].status, 'declared');
  assert.equal(report.metric_extensions[0].metrics.some((item) => item.metric_id === 'far_view_readability'), true);
  assert.equal(report.metric_extensions[0].metrics.some((item) => item.metric_id === 'print_export_safe'), true);
  assert.equal(report.metric_extensions[0].metrics.every((item) => item.status === 'not_evaluated'), true);
});

test('@redcube/gateway manifest declares runtime dependency for review loop actions', () => {
  const gatewayPackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-gateway/package.json'), 'utf-8'),
  );
  const runtimePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-runtime/package.json'), 'utf-8'),
  );

  assert.equal(
    gatewayPackageJson.dependencies?.['@redcube/runtime'],
    runtimePackageJson.version,
  );
});
