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

test('runDeliverableRoute supports poster_onepager routes on shared runtime', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: '甲状腺门诊知识海报',
      goal: '为门诊患者生成单页知识海报',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      route: 'storyline',
    });

    assert.equal(result.ok, true);
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.overlay, 'poster_onepager');
    assert.equal(artifact.route, 'storyline');
    assert.equal(typeof artifact.storyline.headline, 'string');
  });
});

test('poster_onepager starts a downstream route without program-owned prerequisite admission', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-poster-direct-stage-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-direct',
      title: '甲状腺门诊知识海报',
      goal: '验证任意 declared stage 均可直接启动',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-direct',
      route: 'render_html',
    });

    assert.equal(result.ok, true);
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.status, 'completed_with_quality_debt');
    assert.equal(artifact.progress_first.next_stage_may_start, true);
    assert.equal(artifact.quality_debt.blocks_stage_transition, false);
    assert.equal(
      artifact.quality_debt.reasons.some((reason) => reason.startsWith('missing_upstream_artifacts:')),
      true,
    );
  });
});

test('poster_onepager mainline runs through review and export on shared runtime', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: '甲状腺门诊知识海报',
      goal: '为门诊患者生成单页知识海报',
    });

    let screenshotResult = null;
    let exportResult = null;
    for (const route of [
      'storyline',
      'poster_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'export_bundle',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'poster_onepager',
        topicId: 'topic-a',
        deliverableId: 'poster-a',
        route,
      });
      assert.equal(result.ok, true);
      if (route === 'screenshot_review') screenshotResult = result;
      if (route === 'export_bundle') exportResult = result;
    }

    const screenshotArtifact = JSON.parse(readFileSync(screenshotResult.artifactFile, 'utf-8'));
    const exportArtifact = JSON.parse(readFileSync(exportResult.artifactFile, 'utf-8'));

    assert.equal(screenshotArtifact.status, 'pass');
    assert.equal(screenshotArtifact.review_state_patch.rerun_from_stage, null);
    assert.equal(screenshotArtifact.review_state_patch.current_status, 'screenshot_review_passed');
    assert.equal(screenshotArtifact.review_state_patch.ready_for_export, false);
    assert.equal(exportArtifact.status, 'completed');
    assert.equal(exportArtifact.export_bundle.png_files.length, 1);
    assert.equal(typeof exportArtifact.export_bundle.source_html, 'string');
  });
});

test('poster_onepager review quality debt does not block screenshot review or export', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-poster-progress-first-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-debt',
      title: '甲状腺门诊知识海报',
      goal: '验证质量债务不阻断交付推进',
    });
    for (const route of ['storyline', 'poster_blueprint', 'visual_direction', 'render_html']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'poster_onepager',
        topicId: 'topic-a',
        deliverableId: 'poster-debt',
        route,
      });
      assert.equal(result.ok, true, route);
    }
    process.env.REDCUBE_MOCK_POSTER_REVIEW_VARIANT = 'force_director_block';
    const directorResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-debt',
      route: 'visual_director_review',
    });
    delete process.env.REDCUBE_MOCK_POSTER_REVIEW_VARIANT;
    assert.equal(directorResult.ok, true);
    const directorArtifact = JSON.parse(readFileSync(directorResult.artifactFile, 'utf-8'));
    assert.equal(directorArtifact.status, 'completed_with_quality_debt');

    process.env.REDCUBE_MOCK_POSTER_SCREENSHOT_REVIEW_VARIANT = 'force_block';
    const screenshotResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-debt',
      route: 'screenshot_review',
    });
    delete process.env.REDCUBE_MOCK_POSTER_SCREENSHOT_REVIEW_VARIANT;
    assert.equal(screenshotResult.ok, true, JSON.stringify(screenshotResult));
    const screenshotArtifact = JSON.parse(readFileSync(screenshotResult.artifactFile, 'utf-8'));
    assert.equal(screenshotArtifact.status, 'completed_with_quality_debt');

    const exportResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-debt',
      route: 'export_bundle',
    });
    assert.equal(exportResult.ok, true);
    const exported = JSON.parse(readFileSync(exportResult.artifactFile, 'utf-8'));
    assert.equal(exported.status, 'completed_with_quality_debt');
    assert.equal(exported.quality_debt.blocks_stage_transition, false);
    assert.equal(exported.review_state_patch.ready_for_export, false);
    assert.equal(existsSync(exported.export_bundle.source_html), true);
  });
});
