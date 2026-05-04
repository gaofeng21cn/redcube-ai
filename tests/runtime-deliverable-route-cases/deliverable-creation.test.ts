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

test('createDeliverable writes canonical deliverable metadata', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  assert.equal(created.ok, true);
  assert.equal(created.surface_kind, 'deliverable_create');
  assert.equal(created.recommended_action, 'audit_deliverable');
  assert.equal(created.summary.deliverable_id, 'deck-a');
  assert.equal(created.summary.overlay, 'ppt_deck');

  const stored = await getDeliverable({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
  });

  assert.equal(stored.ok, true);
  assert.equal(stored.surface_kind, 'deliverable_record');
  assert.equal(stored.recommended_action, 'audit_deliverable');
  assert.equal(stored.summary.deliverable_id, 'deck-a');
  assert.equal(stored.deliverable.overlay, 'ppt_deck');
  assert.equal(stored.deliverable.kind, 'ppt_deck');
  assert.equal(stored.deliverable.profile_id, 'lecture_student');
  assert.equal(stored.deliverable.goal, '为本科生讲授甲状腺基础知识');
  assert.equal(stored.deliverable.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
  assert.equal(stored.deliverable.slide_ratio, '16:9');
  assert.deepEqual(stored.deliverable.routes, [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'author_image_pages',
    'visual_director_review',
    'screenshot_review',
    'repair_image_pages',
    'export_pptx',
  ]);
});

test('createDeliverable supports xiaohongshu on the shared runtime mainline', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  assert.equal(created.ok, true);
  assert.equal(created.surface_kind, 'deliverable_create');
  assert.equal(created.recommended_action, 'audit_deliverable');
  assert.equal(created.deliverable.overlay, 'xiaohongshu');
  assert.equal(created.deliverable.kind, 'xiaohongshu_note');
  assert.equal(created.deliverable.profile_id, 'standard_note');
  assert.deepEqual(created.deliverable.routes, ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'fix_html', 'publish_copy', 'export_bundle']);
});

test('createDeliverable supports poster_onepager on the shared runtime mainline', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'poster_onepager',
    profileId: 'knowledge_poster',
    topicId: 'topic-a',
    deliverableId: 'poster-a',
    title: '甲状腺门诊知识海报',
    goal: '为门诊患者生成单页知识海报',
  });

  assert.equal(created.ok, true);
  assert.equal(created.surface_kind, 'deliverable_create');
  assert.equal(created.recommended_action, 'audit_deliverable');
  assert.equal(created.deliverable.overlay, 'poster_onepager');
  assert.equal(created.deliverable.kind, 'poster_onepager');
  assert.equal(created.deliverable.profile_id, 'knowledge_poster');
  assert.deepEqual(created.deliverable.routes, [
    'storyline',
    'poster_blueprint',
    'visual_direction',
    'render_html',
    'visual_director_review',
    'screenshot_review',
    'export_bundle',
  ]);
});

test('createDeliverable rejects unknown overlay ids', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await assert.rejects(
    () => createDeliverable({
      workspaceRoot,
      overlay: 'poster',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: '未知交付物',
      goal: '测试未知 overlay',
    }),
    /Unknown overlay: poster/,
  );
});
