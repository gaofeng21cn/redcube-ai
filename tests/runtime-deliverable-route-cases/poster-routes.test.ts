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
  runtimeWatch,
  runDeliverableRoute,
  startMockCodexCli,
  withEnv,
  completeSourceReadiness,
  MODULE_DIR,
  withMockCodexRuntime,
} from './shared.ts';

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
    assert.equal(exportArtifact.status, 'completed');
    assert.equal(exportArtifact.export_bundle.png_files.length, 1);
    assert.equal(typeof exportArtifact.export_bundle.source_html, 'string');
  });
});
