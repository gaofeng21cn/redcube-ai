// @ts-nocheck
import {
  test,
  assert,
  os,
  path,
  existsSync,
  mkdtempSync,
  readFileSync,
  utimesSync,
  writeFileSync,
  createDeliverable,
  getDeliverable,
  getRun,
  runtimeWatch,
  runDeliverableRoute,
  appendEvent,
  startRun,
  startMockCodexCli,
  withEnv,
  completeSourceReadiness,
  MODULE_DIR,
  MOCK_HERMES_NATIVE_BRIDGE_COMMAND,
  withMockHermesUpstream,
  withMockHermesNativeProof,
} from './shared.ts';

test('runDeliverableRoute reuses a fresh gated stage artifact when the route cache key is unchanged', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-cache-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
      goal: '为本科生讲授甲状腺基础知识',
    });

    const first = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });
    assert.equal(first.ok, true);
    assert.equal(first.summary.cache_status, 'miss');

    const second = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });

    assert.equal(second.ok, true);
    assert.equal(second.summary.cache_status, 'hit');
    assert.equal(second.artifact?.route_cache?.cache_status, 'hit');
    assert.equal(second.artifact?.route_cache?.cache_key, first.artifact?.route_cache?.cache_key);
    assert.equal(second.run.stage_results[0].status, 'cached');
  });
});

test('getRun and runtimeWatch expire stale persisted running route runs with an audit trail', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-stale-run-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: 'stale running deck',
    goal: '验证旧 running run 不会继续被当作活跃事实',
  });

  const run = startRun({
    workspaceRoot,
    route: 'render_html',
    overlay: 'ppt_deck',
    target: 'deck-a',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    executor: { adapter: 'host_agent', execution_surface: 'codex_native_host_agent' },
  });
  const runFile = path.join(workspaceRoot, 'runtime', 'runs', `${run.run_id}.json`);
  const staleRun = JSON.parse(readFileSync(runFile, 'utf-8'));
  staleRun.started_at = '2020-01-01T00:00:00.000Z';
  staleRun.telemetry = { ...(staleRun.telemetry || {}), started_at: staleRun.started_at };
  writeFileSync(runFile, JSON.stringify(staleRun, null, 2), 'utf-8');

  const stored = await getRun({ workspaceRoot, runId: run.run_id });
  assert.equal(stored.run.status, 'expired');
  assert.equal(stored.summary.status, 'expired');
  assert.equal(stored.recommended_action, 'inspect_stale_run');
  assert.equal(stored.run.stale_run_audit.status_before, 'running');
  assert.equal(stored.run.stale_run_audit.status_after, 'expired');
  assert.equal(stored.run.stale_run_audit.reason_code, 'running_run_exceeded_stale_ttl');
  assert.equal(stored.run.telemetry.status, 'expired');

  const persisted = JSON.parse(readFileSync(runFile, 'utf-8'));
  assert.equal(persisted.status, 'expired');
  assert.equal(persisted.stale_run_audit.marked_by, 'redcube_runtime_run_reader');

  const watch = await runtimeWatch({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    runId: run.run_id,
  });
  assert.equal(watch.run_id, run.run_id);
  assert.equal(watch.run_telemetry.status, 'expired');
  assert.equal(watch.run_stale_audit.status_after, 'expired');
});

test('PPT and xiaohongshu HTML routes fail fast on repeated blocked artifacts with unchanged route cache input', async () => {
  await withMockHermesUpstream(async () => {
    const pptWorkspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-ppt-fastfail-'));
    await createDeliverable({
      workspaceRoot: pptWorkspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'PPT repeated block',
      goal: '验证 PPT HTML route 同 hash 阻塞不会再次调用 executor',
    });
    let pptRenderResult = null;
    let pptVisualDirectionResult = null;
    for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html']) {
      const result = await runDeliverableRoute({
        workspaceRoot: pptWorkspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true);
      if (route === 'visual_direction') pptVisualDirectionResult = result;
      if (route === 'render_html') pptRenderResult = result;
    }
    const pptArtifactFile = pptRenderResult.artifactFile;
    const pptArtifact = JSON.parse(readFileSync(pptArtifactFile, 'utf-8'));
    pptArtifact.status = 'block';
    pptArtifact.target_slide_ids = ['S03'];
    pptArtifact.blocking_reasons = ['visual_density_ok'];
    pptArtifact.checks = { visual_density_ok: false };
    writeFileSync(pptArtifactFile, JSON.stringify(pptArtifact, null, 2), 'utf-8');

    const xhsWorkspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-xhs-fastfail-'));
    await completeSourceReadiness({
      workspaceRoot: xhsWorkspaceRoot,
      topicId: 'topic-a',
      title: 'XHS repeated block',
      brief: '验证小红书 HTML route 同 hash 阻塞不会再次调用 executor。',
      keywords: ['小红书', 'fail-fast'],
    });
    await createDeliverable({
      workspaceRoot: xhsWorkspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '小红书 repeated block',
      goal: '验证 xiaohongshu HTML route 同 hash 阻塞不会再次调用 executor',
    });
    let xhsRenderResult = null;
    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html']) {
      const result = await runDeliverableRoute({
        workspaceRoot: xhsWorkspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route,
      });
      assert.equal(result.ok, true);
      if (route === 'render_html') xhsRenderResult = result;
    }
    const xhsArtifactFile = xhsRenderResult.artifactFile;
    const xhsArtifact = JSON.parse(readFileSync(xhsArtifactFile, 'utf-8'));
    xhsArtifact.status = 'block';
    xhsArtifact.target_slide_ids = ['N02'];
    xhsArtifact.blocking_reasons = ['block_content_fit_ok'];
    xhsArtifact.checks = { block_content_fit_ok: false };
    writeFileSync(xhsArtifactFile, JSON.stringify(xhsArtifact, null, 2), 'utf-8');

    const restoreEnv = withEnv({ REDCUBE_MOCK_FAIL_ROUTE: 'render_html' });
    try {
      for (const scenario of [
        {
          workspaceRoot: pptWorkspaceRoot,
          overlay: 'ppt_deck',
          topicId: 'topic-a',
          deliverableId: 'deck-a',
          targetSlideIds: ['S03'],
          blockingReasons: ['visual_density_ok'],
        },
        {
          workspaceRoot: xhsWorkspaceRoot,
          overlay: 'xiaohongshu',
          topicId: 'topic-a',
          deliverableId: 'note-a',
          targetSlideIds: ['N02'],
          blockingReasons: ['block_content_fit_ok'],
        },
      ]) {
        const blocked = await runDeliverableRoute({
          workspaceRoot: scenario.workspaceRoot,
          overlay: scenario.overlay,
          topicId: scenario.topicId,
          deliverableId: scenario.deliverableId,
          route: 'render_html',
        });

        assert.equal(blocked.ok, false);
        assert.equal(blocked.run.status, 'failed');
        assert.equal(blocked.run.error.failure_kind, 'repeated_block_without_input_change');
        assert.equal(blocked.run.error.code, 'repeated_block_without_input_change');
        assert.deepEqual(blocked.run.error.target_slide_ids, scenario.targetSlideIds);
        assert.deepEqual(blocked.run.error.blocking_reasons, scenario.blockingReasons);
        assert.equal(blocked.run.error.recommended_action, 'change_input_or_route_to_page_local_fix');
        assert.doesNotMatch(blocked.run.error.message, /mock forced route failure/);
      }

      const visualDirectionFile = pptVisualDirectionResult.artifactFile;
      const changedVisualDirection = JSON.parse(readFileSync(visualDirectionFile, 'utf-8'));
      changedVisualDirection.hash_probe = 'same-mtime-different-content';
      writeFileSync(visualDirectionFile, JSON.stringify(changedVisualDirection, null, 2), 'utf-8');
      const oldTime = new Date('2020-01-01T00:00:00.000Z');
      utimesSync(visualDirectionFile, oldTime, oldTime);
      const rerunAfterInputChange = await runDeliverableRoute({
        workspaceRoot: pptWorkspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'render_html',
      });
      assert.equal(rerunAfterInputChange.ok, false);
      assert.match(rerunAfterInputChange.run.error.message, /mock forced route failure/);
      assert.notEqual(rerunAfterInputChange.run.error.failure_kind, 'repeated_block_without_input_change');
    } finally {
      restoreEnv();
    }
  });
});
