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
  MOCK_HERMES_AGENT_LOOP_BRIDGE_COMMAND,
  withMockCodexRuntime,
  withMockHermesAgentLoop,
} from './shared.ts';

test('runDeliverableRoute auto-rehydrates stale deliverable surfaces when the current overlay contract declares the requested route', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-rehydrate-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
      goal: '为本科生讲授甲状腺基础知识',
    });

    const contractFile = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-a',
      'contracts',
      'hydrated-deliverable.json',
    );
    const contract = JSON.parse(readFileSync(contractFile, 'utf-8'));
    contract.stage_sequence.stages = contract.stage_sequence.stages.filter((stage) => stage.stage_id !== 'repair_image_pages');
    delete contract.stage_requirements.repair_image_pages;
    delete contract.prompt_pack.routes.repair_image_pages;
    delete contract.prompt_pack.stages.repair_image_pages;
    writeFileSync(contractFile, JSON.stringify(contract, null, 2), 'utf-8');

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'repair_image_pages',
    });

    assert.equal(result.ok, false);
    assert.match(result.run.error.message, /requires completed stage artifacts|requires screenshot_review/i);

    const refreshedContract = JSON.parse(readFileSync(contractFile, 'utf-8'));
    assert.equal(
      refreshedContract.stage_sequence.stages.some((stage) => stage?.stage_id === 'repair_image_pages'),
      true,
    );
    assert.equal(result.governance_surface?.family_boundary?.overlay, 'ppt_deck');
  });
});

test('runDeliverableRoute includes operator user intent in route authoring context and cache key', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-route-intent-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Route user intent proof',
      brief: '验证 direct route 保留操作者本轮具体意图。',
      keywords: ['ppt', 'route', 'user-intent'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Route user intent proof',
      goal: '验证 route authoring context',
    });

    const first = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
      userIntent: '第一轮：只生成同步主线',
    });
    assert.equal(first.ok, true);
    assert.equal(first.summary.cache_status, 'miss');
    assert.equal(first.artifact.contract.user_intent, '第一轮：只生成同步主线');
    assert.equal(first.artifact.contract.delivery_request.user_intent, '第一轮：只生成同步主线');

    const second = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
      userIntent: '第二轮：改为定点说明主任关心的问题',
    });
    assert.equal(second.ok, true);
    assert.equal(second.summary.cache_status, 'miss');
    assert.equal(second.artifact.contract.user_intent, '第二轮：改为定点说明主任关心的问题');
    assert.notEqual(
      second.artifact.route_cache.cache_key,
      first.artifact.route_cache.cache_key,
    );
  });
});
