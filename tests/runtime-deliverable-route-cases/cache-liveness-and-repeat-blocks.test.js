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
  runtimeWatch,
  runDeliverableRoute,
  startMockCodexCli,
  withEnv,
  completeSourceReadiness,
  MODULE_DIR,
  withMockCodexRuntime,
} from './shared.js';
import { runDeliverableRoute as runRawRuntimeDeliverableRoute } from '@redcube/runtime';

test('runDeliverableRoute reuses a fresh gated stage artifact when the route cache key is unchanged', async () => {
  await withMockCodexRuntime(async () => {
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
    assert.equal(first.artifact.runtime_currentness_receipt.surface_kind, 'rca_runtime_currentness_receipt');
    assert.equal(Boolean(first.artifact.runtime_currentness_receipt.source_revision), true);
    assert.equal(first.artifact.runtime_currentness_receipt.rca_version, '0.1.0');
    assert.equal(first.artifact.runtime_currentness_receipt.plugin_version, '0.1.0');
    assert.equal(first.artifact.runtime_currentness_receipt.blocks_stage_transition, false);

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

test('route cache hits do not rewrite upstream artifacts or invalidate dependent stage cache', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-cache-hit-stable-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '稳定 cache hit deck',
      goal: '验证上游 cache hit 不会污染下游输入指纹',
    });

    const firstStoryline = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });
    assert.equal(firstStoryline.ok, true);
    assert.equal(firstStoryline.summary.cache_status, 'miss');

    const firstOutline = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'detailed_outline',
    });
    assert.equal(firstOutline.ok, true);
    assert.equal(firstOutline.summary.cache_status, 'miss');

    const persistedStorylineBefore = readFileSync(firstStoryline.artifactFile, 'utf-8');
    await new Promise((resolve) => setTimeout(resolve, 25));

    const cachedStoryline = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });
    assert.equal(cachedStoryline.ok, true);
    assert.equal(cachedStoryline.summary.cache_status, 'hit');
    assert.equal(cachedStoryline.artifact?.route_cache?.cache_status, 'hit');
    assert.equal(readFileSync(firstStoryline.artifactFile, 'utf-8'), persistedStorylineBefore);

    const cachedOutline = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'detailed_outline',
    });
    assert.equal(cachedOutline.ok, true);
    assert.equal(cachedOutline.summary.cache_status, 'hit');
    assert.equal(cachedOutline.run.stage_results[0].status, 'cached');
  });
});

test('authoring route lock rejects automatic cross-lane fallback', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-route-lock-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'route lock deck',
      goal: '验证 image lane 不会静默切换 HTML',
      constraints: {
        authoring_route_lock: {
          lane_id: 'image_pages',
          selected_route: 'author_image_pages',
          automatic_cross_lane_fallback_allowed: false,
        },
      },
    });
    for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }
    await assert.rejects(
      runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'render_html',
      }),
      (error) => error?.failure_kind === 'authority_boundary_violation'
        && /authoring route lock image_pages/.test(error.message),
    );
  });
});

test('image authoring cache survives downstream review and export artifacts', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-image-author-cache-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'image route cache deck',
      goal: '验证下游审阅与导出不会让上游 image authoring cache 失效',
    });

    for (const route of [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'author_image_pages',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
      assert.equal(result.summary.cache_status, 'miss', route);
    }

    const cachedAuthor = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'author_image_pages',
    });
    assert.equal(cachedAuthor.ok, true);
    assert.equal(cachedAuthor.summary.cache_status, 'hit');
    assert.equal(cachedAuthor.run.stage_results[0].status, 'cached');

    const cachedDirectorReview = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'visual_director_review',
    });
    assert.equal(cachedDirectorReview.ok, true);
    assert.equal(cachedDirectorReview.summary.cache_status, 'hit');

    const cachedScreenshotReview = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'screenshot_review',
    });
    assert.equal(cachedScreenshotReview.ok, true);
    assert.equal(cachedScreenshotReview.summary.cache_status, 'hit');

    const cachedExport = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'export_pptx',
    });
    assert.equal(cachedExport.ok, true);
    assert.equal(cachedExport.summary.cache_status, 'hit');
  });
});

test('runDeliverableRoute rejects missing OPL attempt evidence without local diagnostic bypass', async () => {
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

  const blocked = await runRawRuntimeDeliverableRoute({
    workspaceRoot,
    route: 'render_html',
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.blocker_kind, 'missing_opl_stage_attempt');
  assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'runs')), false);
  assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'events')), false);
});

test('PPT and xiaohongshu HTML routes exhaust quality budget and continue with the prior artifact', async () => {
  await withMockCodexRuntime(async () => {
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
    pptArtifact.typed_blocker_refs = ['rca-typed-blocker:test:ppt-render-html-repeat'];
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
    xhsArtifact.typed_blocker_refs = ['rca-typed-blocker:test:xhs-render-html-repeat'];
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

        assert.equal(blocked.ok, true);
        assert.equal(blocked.run.status, 'completed_with_quality_debt');
        assert.equal(blocked.artifact.status, 'completed_with_quality_debt');
        assert.equal(blocked.artifact.progress_first.advance_allowed, true);
        assert.equal(blocked.artifact.quality_debt.blocks_stage_transition, false);
        assert.deepEqual(blocked.artifact.target_slide_ids, scenario.targetSlideIds);
        assert.deepEqual(blocked.artifact.quality_budget_exhaustion.blocking_reasons, scenario.blockingReasons);
        assert.equal(blocked.artifact.stall_lineage.lineage_id, `repeated-block:${scenario.overlay}:render_html:${scenario.deliverableId}`);
        assert.equal(blocked.artifact.stall_lineage.repeated_block_count, 2);
        assert.deepEqual(blocked.artifact.stall_lineage.repeat_budget, {
          max_repeats: 2,
          remaining_repeats: 0,
          budget_exhausted: true,
        });
        assert.equal(blocked.artifact.quality_budget_exhaustion.recommended_action, 'continue_with_best_available_artifact');
        assert.equal(blocked.artifact.typed_blocker_refs.length, 0);
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
