// @ts-nocheck
import {
  test,
  assert,
  os,
  path,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  createRuntimeManagedRun,
  saveManagedRun,
  startRun,
  auditDeliverable,
  createDeliverable,
  getPublicationProjection,
  getReviewState,
  getManagedRun,
  runManagedDeliverable,
  superviseManagedRun,
  runtimeWatch,
  resolveWorkspaceContract,
  completeSourceReadiness,
  startMockCodexCli,
  withEnv,
  MODULE_DIR,
  MOCK_HERMES_NATIVE_BRIDGE_COMMAND,
  MOCK_REDCUBE_PYTHON_COMMAND,
  readJson,
  withoutUpdatedAt,
  runtimeDirEntries,
  assertNoManagedState,
  withMockHermesUpstream,
  withMockHermesNativeProof,
} from './shared.ts';

test('managed execution keeps xiaohongshu on the Codex-backed human-publication closure without drifting durable truth', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-xhs-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊小红书科普',
      brief: '验证托管执行在小红书 human-publication 闭环上的真值一致性。',
      keywords: ['甲状腺', '小红书'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });

    const result = await runManagedDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      userIntent: '给我一篇最终可发布的小红书图文',
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.status, 'completed');
    assert.equal(result.managed_run.overlay, 'xiaohongshu');
    assert.equal(result.managed_run.runtime_bridge?.owner, 'codex_cli');
    assert.equal(result.managed_run.current_stage, 'export_bundle');
    assert.deepEqual(
      result.managed_run.route_runs.map((stageRun) => stageRun.stage_id),
      [
        'research',
        'storyline',
        'single_note_plan',
        'visual_direction',
        'render_html',
        'visual_director_review',
        'screenshot_review',
        'publish_copy',
        'export_bundle',
      ],
    );
    assert.equal(result.progress_projection.current_stage, 'export_bundle');
    assert.equal(result.progress_projection.content_status, 'completed');
    assert.equal(result.runtime_supervision.health_status, 'completed');
    assert.equal(result.runtime_supervision.runtime_owner, 'codex_cli');
    assert.equal(result.escalation_record.escalation_status, 'none');

    const review = await getReviewState({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'note-a',
    });
    const projection = await getPublicationProjection({
      workspaceRoot,
      topicId: 'topic-a',
    });
    const audit = await auditDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      mode: 'draft_new',
    });
    const watch = await runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'note-a',
      runId: result.managed_run.route_runs.at(-1).route_run_id,
    });

  assert.equal(review.state.current_status, 'publish_ready');
  assert.equal(review.state.approval_state.required, true);
  assert.equal(review.state.approval_state.status, 'pending_human');
  assert.equal(review.state.publish_state.current, 'approval_pending');
  assert.equal(review.governance_surface.family_boundary.human_publication, true);
  assert.equal(review.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');

  const noteProjection = projection.publication.deliverables['note-a'];
  assert.equal(noteProjection.projection_model, 'human_publication');
  assert.equal(noteProjection.current, 'approval_pending');
  assert.equal(noteProjection.next, 'approved_pending_publish');
  assert.equal(noteProjection.delivery_state.current, 'output_ready');
  assert.equal(noteProjection.governance_surface.family_boundary.human_publication, true);
  assert.equal(noteProjection.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');

  assert.deepEqual(audit.review_state, review.state);
  assert.deepEqual(withoutUpdatedAt(audit.publication_projection), withoutUpdatedAt(projection.publication));
  assert.equal(audit.gate_summary.approval_required, true);
  assert.equal(audit.gate_summary.delivery_projection_current, 'approval_pending');
  assert.equal(audit.governance_surface.runtime_topology.runtime_substrate_surface, 'codex_native_host_agent');

  assert.equal(watch.run_id, result.managed_run.route_runs.at(-1).route_run_id);
  assert.equal(watch.review_state.current_status, review.state.current_status);
  assert.equal(
    watch.publication_projection.deliverables['note-a'].current,
    noteProjection.current,
  );
    assert.equal(watch.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  });
});

test('managed xiaohongshu follows review rerun_from_stage and finishes after fix_html instead of stopping on screenshot block', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-xhs-rerun-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '托管小红书回修主线',
      brief: '验证 managed 遇到 screenshot_review block 时会自动回到 fix_html 而不是停住。',
      keywords: ['小红书', 'fix_html', 'managed'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '托管小红书回修主线',
      goal: '验证 review block 的 auto rerun 行为',
    });

    const restoreVariant = withEnv({
      REDCUBE_MOCK_XHS_RENDER_VARIANT: 'repair_marker',
      REDCUBE_MOCK_XHS_SCREENSHOT_REVIEW_VARIANT: 'block_until_fix_html',
    });
    try {
      const result = await runManagedDeliverable({
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        userIntent: '给我一篇最终可发布的小红书图文',
      });

      assert.equal(result.ok, true);
      assert.equal(result.summary.status, 'completed');
      assert.deepEqual(
        result.managed_run.route_runs.map((stageRun) => stageRun.stage_id),
        [
          'research',
          'storyline',
          'single_note_plan',
          'visual_direction',
          'render_html',
          'visual_director_review',
          'screenshot_review',
          'fix_html',
          'visual_director_review',
          'screenshot_review',
          'publish_copy',
          'export_bundle',
        ],
      );
      assert.equal(result.runtime_supervision.health_status, 'completed');
      assert.equal(result.progress_projection.content_status, 'completed');
    } finally {
      restoreVariant();
    }
  });
});
