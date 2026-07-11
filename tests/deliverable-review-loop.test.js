import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

import {
  auditDeliverable,
  applyReviewMutation,
  createDeliverable,
  reviewRenderOutput,
  runDeliverableRoute,
  runtimeWatch,
} from './product-domain-action-test-api.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.js';

const TOPIC_ID = 'topic-a';
const DECK_ID = 'deck-a';
const NOTE_ID = 'note-a';
const XHS_FULL_ROUTES = ['research', 'storyline', 'single_note_plan', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review', 'publish_copy'];
const PPT_REVIEW_ROUTES = ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review'];

async function withMockCodexRuntime(testFn) {
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

function workspace(prefix = 'redcube-review-loop-') {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

async function completeTopicSource(workspaceRoot, overrides = {}) {
  await completeSourceReadiness({ workspaceRoot, topicId: TOPIC_ID, title: '甲状腺门诊素材', brief: '为门诊患者或学生准备结构化科普材料。', keywords: ['甲状腺', '门诊', '科普'], ...overrides });
}

async function createDeck(workspaceRoot, overrides = {}) {
  return await createDeliverable({ workspaceRoot, overlay: 'ppt_deck', profileId: 'lecture_student', topicId: TOPIC_ID, deliverableId: DECK_ID, title: '甲状腺门诊科普 deck', goal: '为本科生讲授甲状腺基础知识', ...overrides });
}

async function createXhs(workspaceRoot, overrides = {}) {
  return await createDeliverable({ workspaceRoot, overlay: 'xiaohongshu', profileId: 'standard_note', topicId: TOPIC_ID, deliverableId: NOTE_ID, title: '甲状腺门诊小红书科普', goal: '为门诊患者生成可发布的科普图文', ...overrides });
}

async function runRoutes({
  workspaceRoot,
  overlay,
  deliverableId,
  routes,
  extra = {},
}) {
  for (const route of routes) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay,
      topicId: TOPIC_ID,
      deliverableId,
      route,
      ...extra,
    });
    assert.equal(result.ok, true, route);
  }
}

function contractPath(workspaceRoot, deliverableId, filename) {
  return path.join(workspaceRoot, 'topics', TOPIC_ID, 'deliverables', deliverableId, 'contracts', filename);
}

function assertPptRunWatchIdentity(report) {
  assert.equal(report.ok, true);
  assert.equal(report.surface_kind, 'runtime_watch');
  assert.equal(report.profile_id, 'defense_deck');
  assert.equal(report.delivery_contract.required_export_route, 'export_pptx');
  assert.equal(report.delivery_contract.required_export_bundle_id, 'defense_deck_bundle');
  assert.equal(report.required_export_bundle.bundle_id, 'defense_deck_bundle');
  assert.equal(report.required_export_bundle.include_backup_slides, true);
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

test('auditDeliverable uses canonical source readiness for block and pass states', async () => {
  const missingRoot = workspace('redcube-review-loop-missing-source-');
  await createDeck(missingRoot);
  const missing = await auditDeliverable({
    workspaceRoot: missingRoot,
    overlay: 'ppt_deck',
    topicId: TOPIC_ID,
    deliverableId: DECK_ID,
    mode: 'draft_new',
  });
  assert.equal(missing.status, 'block');
  assert.equal(missing.issues.includes('source_audit_missing'), true);
  assert.equal(missing.rerun_from_stage, 'source_readiness');
  assert.equal(missing.recommended_action, 'run_source_research');
  assert.equal(missing.source_readiness_summary?.status, 'missing');
  assert.equal(missing.source_readiness_summary?.canonical_source?.kind, 'shared_source_truth.source_readiness_gate');

  const readyRoot = workspace('redcube-review-loop-ready-source-');
  await completeTopicSource(readyRoot);
  await createDeck(readyRoot);
  const ready = await auditDeliverable({
    workspaceRoot: readyRoot,
    overlay: 'ppt_deck',
    topicId: TOPIC_ID,
    deliverableId: DECK_ID,
    mode: 'draft_new',
  });
  assert.equal(ready.status, 'pass');
  assert.equal(ready.recommended_action, 'run_deliverable_route');
  assert.equal(ready.source_readiness_summary?.status, 'pass');
  assert.equal(ready.source_readiness_summary?.blocking_reasons?.length, 0);
});

test('auditDeliverable gates optimize_existing baseline approval and promoted baseline summary', async () => {
  const blockedRoot = workspace('redcube-review-loop-baseline-blocked-');
  await completeTopicSource(blockedRoot);
  await createXhs(blockedRoot, { deliverableId: 'baseline-a', title: '甲状腺门诊小红书 baseline', goal: '作为后续优化的旧版基线' });
  await createXhs(blockedRoot, { deliverableId: 'candidate-a', title: '甲状腺门诊小红书优化版', goal: '在现有基线之上继续优化' });
  const blocked = await auditDeliverable({
    workspaceRoot: blockedRoot,
    overlay: 'xiaohongshu',
    topicId: TOPIC_ID,
    deliverableId: 'candidate-a',
    mode: 'optimize_existing',
    baselineDeliverableId: 'baseline-a',
  });
  assert.equal(blocked.status, 'block');
  assert.deepEqual(blocked.issues, ['baseline_not_approved']);
  assert.equal(blocked.rerun_from_stage, 'intake');
  assert.equal(blocked.recommended_action, 'approve_or_publish_baseline');
  assert.equal(blocked.quality_summary?.baseline_promotion_state ?? null, null);
  assert.equal(blocked.quality_summary?.promoted_reference_id ?? null, null);

  await withMockCodexRuntime(async () => {
    const promotedRoot = workspace('redcube-review-loop-baseline-promoted-');
    await completeTopicSource(promotedRoot);
    await createXhs(promotedRoot, { deliverableId: 'baseline-a', title: '甲状腺门诊小红书 baseline', goal: '旧版认可稿' });
    await runRoutes({ workspaceRoot: promotedRoot, overlay: 'xiaohongshu', deliverableId: 'baseline-a', routes: XHS_FULL_ROUTES });
    await applyReviewMutation({
      workspaceRoot: promotedRoot,
      topicId: TOPIC_ID,
      deliverableId: 'baseline-a',
      mutation: { type: 'approve_publish', actor: 'human', notes: 'approve baseline' },
    });
    await createXhs(promotedRoot, { deliverableId: 'candidate-a', title: '甲状腺门诊小红书优化版', goal: '在 baseline 基础上优化可读性' });
    await runRoutes({
      workspaceRoot: promotedRoot,
      overlay: 'xiaohongshu',
      deliverableId: 'candidate-a',
      routes: XHS_FULL_ROUTES,
      extra: { mode: 'optimize_existing', baselineDeliverableId: 'baseline-a' },
    });
    await applyReviewMutation({
      workspaceRoot: promotedRoot,
      topicId: TOPIC_ID,
      deliverableId: 'candidate-a',
      mutation: { type: 'approve_publish', actor: 'human', notes: 'approve optimized baseline' },
    });
    await applyReviewMutation({
      workspaceRoot: promotedRoot,
      topicId: TOPIC_ID,
      deliverableId: 'candidate-a',
      mutation: {
        type: 'promote_baseline',
        actor: 'human',
        promoted_reference_id: 'xhs-note-v1',
        notes: 'promote baseline into reference',
      },
    });

    const promoted = await auditDeliverable({
      workspaceRoot: promotedRoot,
      overlay: 'xiaohongshu',
      topicId: TOPIC_ID,
      deliverableId: 'candidate-a',
      mode: 'optimize_existing',
      baselineDeliverableId: 'candidate-a',
    });
    assert.equal(promoted.status, 'pass');
    assert.equal(promoted.quality_summary?.baseline_promotion_state, 'promoted');
    assert.equal(promoted.quality_summary?.promoted_reference_id, 'xhs-note-v1');
  });
});

test('auditDeliverable blocks missing or undeclared hydrated surface artifacts', async () => {
  for (const item of [
    {
      name: 'missing',
      mutate: (root) => rmSync(contractPath(root, DECK_ID, 'hydrated-deliverable.json')),
      issues: ['deliverable_contract_missing:hydrated_deliverable'],
    },
    {
      name: 'extra',
      mutate: (root) => writeFileSync(
        contractPath(root, DECK_ID, 'legacy-review-surface.json'),
        JSON.stringify({ stale: true }, null, 2),
        'utf-8',
      ),
      issues: ['deliverable_contract_extra:legacy_review_surface'],
    },
  ]) {
    const root = workspace(`redcube-review-loop-${item.name}-surface-`);
    await completeTopicSource(root);
    await createDeck(root);
    item.mutate(root);
    const report = await auditDeliverable({
      workspaceRoot: root,
      overlay: 'ppt_deck',
      topicId: TOPIC_ID,
      deliverableId: DECK_ID,
    });
    assert.equal(report.status, 'block', item.name);
    assert.deepEqual(report.issues, item.issues, item.name);
    assert.equal(report.rerun_from_stage, 'intake', item.name);
    assert.equal(report.recommended_action, 'rehydrate_deliverable_surface', item.name);
  }
});

test('reviewRenderOutput maps checks and profile contracts to rerun targets', async () => {
  const simpleCases = [
    {
      request: { overlay: 'ppt_deck', checks: { visual_density_ok: false, overflow_free: true } },
      issues: ['visual_density_too_high'],
      rerun: 'visual_direction',
      action: undefined,
    },
    {
      request: { overlay: 'ppt_deck', checks: {} },
      issues: ['visual_density_check_missing'],
      rerun: 'render_review',
      action: 'supply_render_checks',
    },
  ];
  for (const item of simpleCases) {
    const report = await reviewRenderOutput(item.request);
    assert.equal(report.status, 'block');
    assert.deepEqual(report.issues, item.issues);
    assert.equal(report.rerun_from_stage, item.rerun);
    if (item.action) assert.equal(report.recommended_action, item.action);
  }

  for (const item of [
    {
      profileId: 'lecture_student',
      checks: { director_intent_landed: true, anti_template_ok: true, overflow_free: true, occlusion_free: true, visual_density_ok: true, speaker_fit_ok: true, edge_clearance_ok: true, block_content_fit_ok: true, title_typography_ok: true, external_audience_language_ok: true, title_safe_zone_clear: true, table_legibility_ok: true, layout_density_ok: true, teaching_progression_clear: true },
      issues: ['term_explained_on_first_use_missing'],
      action: 'supply_render_checks',
    },
    {
      profileId: 'executive_briefing',
      checks: { director_intent_landed: true, anti_template_ok: true, overflow_free: true, occlusion_free: true, visual_density_ok: true, speaker_fit_ok: true, edge_clearance_ok: true, block_content_fit_ok: true, title_typography_ok: true, external_audience_language_ok: true, title_safe_zone_clear: true, table_legibility_ok: true, layout_density_ok: true, decision_implication_clear: false, conclusion_up_front: true },
      issues: ['decision_implication_clear_failed'],
      action: 'revise_render_output',
    },
  ]) {
    const root = workspace(`redcube-review-loop-${item.profileId}-`);
    await createDeck(root, { profileId: item.profileId, title: '门诊改造汇报 deck', goal: '向目标读者说明门诊容量与改造建议' });
    const report = await reviewRenderOutput({
      workspaceRoot: root,
      topicId: TOPIC_ID,
      deliverableId: DECK_ID,
      overlay: 'ppt_deck',
      checks: item.checks,
    });
    assert.equal(report.status, 'block', item.profileId);
    assert.deepEqual(report.issues, item.issues, item.profileId);
    assert.equal(report.rerun_from_stage, 'storyline', item.profileId);
    assert.equal(report.recommended_action, item.action, item.profileId);
  }
});

test('runtimeWatch reports pending state and rejects retired run lookup locator', async () => {
  const pending = await runtimeWatch({
    run: {
      run_id: 'run-1',
      current_stage: 'render_review',
      status: 'blocked',
      pending_reviews: ['render_review'],
      resumable: true,
    },
  });
  assert.equal(pending.ok, true);
  assert.equal(pending.surface_kind, 'runtime_watch');
  assert.equal(pending.run_id, 'run-1');
  assert.equal(pending.current_stage, 'render_review');
  assert.equal(pending.status, 'review_pending');
  assert.deepEqual(pending.pending_reviews, ['render_review']);
  assert.equal(pending.owner_boundary.classification, 'retained_current_refs_only_boundary');
  assert.equal(pending.owner_boundary.refs_only, true);
  assert.equal(pending.owner_boundary.generic_supervisor_owner, 'opl');
  assert.equal(pending.owner_boundary.owns_generic_supervisor, false);
  assert.equal(pending.owner_boundary.declares_production_soak_complete, false);
  assert.deepEqual(pending.owner_boundary.exports_only, [
    'run_status_refs',
    'artifact_locator_refs',
    'review_state_refs',
    'typed_blocker_refs',
    'operator_evidence_refs',
    'telemetry_summary_refs',
  ]);

  await withMockCodexRuntime(async () => {
    const root = workspace('redcube-runtime-watch-locator-');
    await completeTopicSource(root, { title: '正式答辩 deck source', brief: '答辩 deck 需要清晰展示问题、方法、结果与答辩防守要点。', keywords: ['答辩', '结果', '问题'] });
    await createDeck(root, { profileId: 'defense_deck', title: '正式答辩 deck', goal: '用于正式答辩并覆盖潜在质询' });
    const runResult = await runDeliverableRoute({
      workspaceRoot: root,
      overlay: 'ppt_deck',
      topicId: TOPIC_ID,
      deliverableId: DECK_ID,
      route: 'storyline',
    });
    await assert.rejects(
      () => runtimeWatch({ workspaceRoot: root, topicId: TOPIC_ID, deliverableId: DECK_ID, runId: runResult.run.run_id }),
      (error) => {
        assert.match(error.message, /runtimeWatch no longer reads RCA-local route-run records/);
        assert.equal(error.surface_kind, 'typed_blocker');
        assert.equal(error.blocker_kind, 'rca_local_route_run_lookup_retired');
        assert.deepEqual(error.typed_blocker.required_refs, [
          'opl_stage_attempt_ref',
          'provider_attempt_ref',
          'provider_attempt_ledger_ref',
        ]);
        assert.equal(error.typed_blocker.owner_boundary.rca_owns_generic_runtime_record_store, false);
        return true;
      },
    );
  });
});

test('runtimeWatch keeps deliverable-level review watch available without run locator', async () => {
  await withMockCodexRuntime(async () => {
    const root = workspace('redcube-runtime-watch-deliverable-only-');
    await createDeck(root, { title: '肠癌 AI 讲课 deck', goal: '给学生讲清肠癌 AI 的问题、方法与边界' });
    await runRoutes({ workspaceRoot: root, overlay: 'ppt_deck', deliverableId: DECK_ID, routes: PPT_REVIEW_ROUTES });
    const blocked = await applyReviewMutation({
      workspaceRoot: root,
      topicId: TOPIC_ID,
      deliverableId: DECK_ID,
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
    const watch = await runtimeWatch({ workspaceRoot: root, topicId: TOPIC_ID, deliverableId: DECK_ID });
    assert.equal(watch.ok, true);
    assert.equal(watch.status, 'review_pending');
    assert.equal(watch.review_state.current_status, 'blocked_for_revision');
    assert.equal(watch.review_state.rerun_from_stage, 'render_html');
  });
});

test('runtimeWatch rejects preloaded runs when locator identity is unsafe', async () => {
  const topicRoot = workspace('redcube-runtime-watch-locator-mismatch-');
  await completeTopicSource(topicRoot, { title: 'topic a source', brief: 'topic a', keywords: ['topic-a'] });
  await completeSourceReadiness({ workspaceRoot: topicRoot, topicId: 'topic-b', title: 'topic b source', brief: 'topic b', keywords: ['topic-b'] });
  for (const topicId of [TOPIC_ID, 'topic-b']) {
    await createDeck(topicRoot, { topicId, profileId: 'defense_deck', title: `deck ${topicId}`, goal: `goal ${topicId}` });
  }
  await assert.rejects(
    () => runtimeWatch({
      workspaceRoot: topicRoot,
      topicId: 'topic-b',
      deliverableId: DECK_ID,
      run: { run_id: 'run-topic-a-001', topic_id: TOPIC_ID, deliverable_id: DECK_ID, current_stage: 'storyline', status: 'completed' },
    }),
    /runtimeWatch topicId 与 run\.topic_id 不一致/,
  );

  const deliverableRoot = workspace('redcube-review-loop-preloaded-mismatch-');
  await createDeck(deliverableRoot, { profileId: 'defense_deck', deliverableId: DECK_ID, title: 'deck a', goal: 'goal a' });
  await createDeck(deliverableRoot, { profileId: 'defense_deck', deliverableId: 'deck-b', title: 'deck b', goal: 'goal b' });
  await assert.rejects(
    () => runtimeWatch({
      workspaceRoot: deliverableRoot,
      topicId: TOPIC_ID,
      deliverableId: 'deck-b',
      run: { run_id: 'run-1', topic_id: TOPIC_ID, deliverable_id: DECK_ID, current_stage: 'export_pptx', status: 'blocked', pending_reviews: ['backup_qa_ready'], resumable: true },
    }),
    /runtimeWatch deliverableId 与 run\.deliverable_id 不一致/,
  );
  await assert.rejects(
    () => runtimeWatch({
      workspaceRoot: deliverableRoot,
      topicId: TOPIC_ID,
      deliverableId: DECK_ID,
      run: { run_id: 'run-1', current_stage: 'export_pptx', status: 'blocked', pending_reviews: ['backup_qa_ready'], resumable: true },
    }),
    /runtimeWatch run\.topic_id 与 run\.deliverable_id 不能为空/,
  );
});

test('runtimeWatch exposes hydrated contract, source readiness, publication, and poster metric projections', async () => {
  const exportRoot = workspace('redcube-review-loop-export-contract-');
  await completeTopicSource(exportRoot, { title: '正式答辩 deck source', brief: '答辩 deck 需要清晰展示问题、方法、结果与答辩防守要点。', keywords: ['答辩', '结果', '问题'] });
  await createDeck(exportRoot, { profileId: 'defense_deck', title: '正式答辩 deck', goal: '用于正式答辩并覆盖潜在质询' });
  const exportWatch = await runtimeWatch({
    workspaceRoot: exportRoot,
    topicId: TOPIC_ID,
    deliverableId: DECK_ID,
    run: { run_id: 'run-1', topic_id: TOPIC_ID, deliverable_id: DECK_ID, current_stage: 'export_pptx', status: 'blocked', pending_reviews: ['backup_qa_ready'], resumable: true },
  });
  assertPptRunWatchIdentity(exportWatch);
  assert.equal(exportWatch.source_readiness_summary?.status, 'pass');
  assert.equal(exportWatch.source_readiness_summary?.canonical_source?.kind, 'shared_source_truth.source_readiness_gate');
  assert.equal(exportWatch.gate_summary?.source_readiness_status, 'pass');
  assert.equal(exportWatch.gate_summary?.source_planning_ready, true);
  assert.equal(exportWatch.gate_summary?.approval_status, 'not_required');

  await withMockCodexRuntime(async () => {
    const noteRoot = workspace('redcube-review-loop-publication-');
    await createXhs(noteRoot);
    await runRoutes({ workspaceRoot: noteRoot, overlay: 'xiaohongshu', deliverableId: NOTE_ID, routes: XHS_FULL_ROUTES });
    const publication = await runtimeWatch({
      workspaceRoot: noteRoot,
      topicId: TOPIC_ID,
      deliverableId: NOTE_ID,
      run: { run_id: 'run-1', topic_id: TOPIC_ID, deliverable_id: NOTE_ID, current_stage: 'publish_copy', status: 'completed', pending_reviews: [], resumable: false },
    });
    assert.equal(publication.surface_kind, 'runtime_watch');
    assert.equal(publication.review_state.publish_state.current, 'approval_pending');
    assert.equal(publication.publication_projection.current, 'approval_pending');
    assert.equal(publication.quality_summary?.relative_quality_verdict, null);
    assert.equal(publication.quality_summary?.baseline_promotion_state, null);
    assert.equal(publication.approval_throughput_summary.publish_state, 'approval_pending');
    assert.equal(publication.approval_throughput_summary.pending_review_count, 0);
  });

  const posterRoot = workspace('redcube-review-loop-poster-');
  await createDeliverable({
    workspaceRoot: posterRoot,
    overlay: 'poster_onepager',
    profileId: 'knowledge_poster',
    topicId: TOPIC_ID,
    deliverableId: 'poster-a',
    title: '甲状腺门诊知识海报',
    goal: '为门诊患者生成单页知识海报',
  });
  const poster = await runtimeWatch({
    workspaceRoot: posterRoot,
    topicId: TOPIC_ID,
    deliverableId: 'poster-a',
    run: { run_id: 'run-poster-1', topic_id: TOPIC_ID, deliverable_id: 'poster-a', current_stage: 'visual_direction', status: 'running', pending_reviews: [], resumable: true },
  });
  assert.equal(Array.isArray(poster.metric_extensions), true);
  assert.equal(poster.metric_extensions.length, 1);
  assert.equal(poster.metric_extensions[0].extension_id, 'poster_specific_metrics');
  assert.equal(poster.metric_extensions[0].metrics.some((item) => item.metric_id === 'far_view_readability'), true);
  assert.equal(poster.metric_extensions[0].metrics.some((item) => item.metric_id === 'print_export_safe'), true);
  assert.equal(poster.metric_extensions[0].metrics.every((item) => item.status === 'not_evaluated'), true);
});

test('@redcube/domain-entry manifest declares runtime dependency for review loop actions', () => {
  const domainEntryPackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-domain-entry/package.json'), 'utf-8'),
  );
  const runtimePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-runtime/package.json'), 'utf-8'),
  );

  assert.equal(
    domainEntryPackageJson.dependencies?.['@redcube/runtime'],
    runtimePackageJson.version,
  );
});
