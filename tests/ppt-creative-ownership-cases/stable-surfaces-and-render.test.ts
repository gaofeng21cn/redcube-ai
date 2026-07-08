// @ts-nocheck
import {
  assert,
  createDeliverable,
  existsSync,
  mkdtempSync,
  os,
  path,
  readFileSync,
  runDeliverableRoute,
  startMockCodexCli,
  test,
  withEnv,
} from './shared.ts';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

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

async function runPptRoutes({ workspaceRoot, deliverableId, routes }) {
  const results = [];
  for (const route of routes) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, route);
    results.push({ route, result });
  }
  return results;
}

test('ppt screenshot_review capture is the export source of truth', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-capture-proof-'));
    const deliverableId = 'deck-a';
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId,
      title: 'Med Auto Science 同行讲课',
      goal: '向医学人工智能小同行讲清自动科研为什么成立、怎么做、模块如何复用',
    });
    const routeResults = await runPptRoutes({
      workspaceRoot,
      deliverableId,
      routes: [
        'storyline',
        'detailed_outline',
        'slide_blueprint',
        'visual_direction',
        'render_html',
        'visual_director_review',
        'screenshot_review',
      ],
    });

    const screenshotReview = readJson(routeResults.at(-1).result.artifactFile);
    assert.match(screenshotReview.review_capture?.screenshots_dir || '', /\/reports\/screenshots\/capture-[^/]+$/);
    assert.equal(
      screenshotReview.slide_reviews.every((slide) => /\/reports\/screenshots\/capture-[^/]+\/slide-\d+\.png$/.test(slide.screenshot_file)),
      true,
    );

    const exportResult = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId,
      route: 'export_pptx',
    });
    assert.equal(exportResult.ok, true);
    const exportArtifact = readJson(exportResult.artifactFile);
    assert.equal(
      exportArtifact.export_bundle.real_conversion_invocation.command.includes(screenshotReview.review_capture.screenshots_dir),
      true,
    );
    assert.equal(existsSync(exportArtifact.export_bundle.final_delivery.pptx_file), true);
    assert.equal(existsSync(exportArtifact.export_bundle.final_delivery.pdf_file), true);
  });
});
