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
  MOCK_HERMES_AGENT_LOOP_BRIDGE_COMMAND,
  MOCK_REDCUBE_PYTHON_COMMAND,
  readJson,
  withoutUpdatedAt,
  runtimeDirEntries,
  assertNoManagedState,
  withMockHermesUpstream,
  withMockHermesAgentLoop,
} from './shared.ts';

test('managed execution keeps poster_onepager on the guarded knowledge-poster closure without drifting direct-delivery truth', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-poster-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊知识海报',
      brief: '验证托管执行在 guarded knowledge-poster 闭环上的真值一致性。',
      keywords: ['甲状腺', '海报'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: '甲状腺门诊知识海报',
      goal: '为门诊患者生成一张知识海报',
    });

    const result = await runManagedDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      userIntent: '给我一张最终可交付的知识海报',
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.status, 'completed');
    assert.equal(result.managed_run.overlay, 'poster_onepager');
    assert.equal(result.managed_run.runtime_bridge?.owner, 'codex_cli');
    assert.equal(result.managed_run.current_stage, 'export_bundle');
    assert.deepEqual(
      result.managed_run.route_runs.map((stageRun) => stageRun.stage_id),
      [
        'storyline',
        'poster_blueprint',
        'visual_direction',
        'render_html',
        'visual_director_review',
        'screenshot_review',
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
      deliverableId: 'poster-a',
    });
    const projection = await getPublicationProjection({
      workspaceRoot,
      topicId: 'topic-a',
    });
    const audit = await auditDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      mode: 'draft_new',
    });
    const watch = await runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      runId: result.managed_run.route_runs.at(-1).route_run_id,
    });

  assert.equal(review.state.current_status, 'completed');
  assert.equal(review.state.approval_state.status, 'not_required');
  assert.equal(review.state.publish_state.current, 'not_applicable');
  assert.equal(review.governance_surface.family_boundary.guarded_knowledge_poster, true);
  assert.equal(review.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');

  const posterProjection = projection.publication.deliverables['poster-a'];
  assert.equal(posterProjection.projection_model, 'direct_delivery');
  assert.equal(posterProjection.current, 'output_ready');
  assert.equal(posterProjection.delivery_state.current, 'output_ready');
  assert.equal(posterProjection.operator_handoff.gate_status, 'ready');
  assert.equal(posterProjection.governance_surface.family_boundary.guarded_knowledge_poster, true);
  assert.equal(posterProjection.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');

  assert.deepEqual(audit.review_state, review.state);
  assert.deepEqual(withoutUpdatedAt(audit.publication_projection), withoutUpdatedAt(projection.publication));
  assert.equal(audit.gate_summary.operator_handoff_status, 'ready');
  assert.equal(audit.gate_summary.delivery_projection_current, 'output_ready');
  assert.equal(audit.governance_surface.runtime_topology.runtime_substrate_surface, 'codex_cli_runtime');

  assert.equal(watch.run_id, result.managed_run.route_runs.at(-1).route_run_id);
  assert.equal(watch.review_state.current_status, review.state.current_status);
  assert.equal(
    watch.publication_projection.deliverables['poster-a'].current,
    posterProjection.current,
  );
    assert.equal(watch.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  });
});
