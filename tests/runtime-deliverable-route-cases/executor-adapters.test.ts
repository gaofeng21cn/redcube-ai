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
  MOCK_HERMES_AGENT_LOOP_BRIDGE_COMMAND,
  withMockCodexRuntime,
  withMockHermesAgentLoop,
} from './shared.ts';

test('runDeliverableRoute uses Codex-backed executor by default', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
      goal: '为本科生讲授甲状腺基础知识',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });

    assert.equal(result.ok, true);
    assert.equal(result.surface_kind, 'route_run');
    assert.equal(result.recommended_action, 'continue');
    assert.equal(result.summary.route, 'storyline');
    assert.match(result.run.run_id, /^run[-_]/);
    assert.equal(result.run.executor.adapter, 'codex_cli');
    assert.equal(result.run.executor.primary, true);
    assert.equal(result.run.executor.execution_surface, 'codex_cli_runtime');
    assert.equal(result.run.executor.creative_execution, 'agent_first_director_first');
    assert.equal(result.run.executor.execution_model.mainline_adapter, 'codex_cli');
    assert.equal(result.run.executor.execution_model.primary_surface, 'codex_cli_runtime');
    assert.equal(result.run.executor.execution_model.freeze_origin_milestone, 'P19.A');
    assert.equal(result.run.executor.codex_cli_runtime?.owner, 'codex_cli');
    assert.equal(result.run.executor.codex_cli_runtime?.adapter_surface, '@redcube/codex-cli-client');
    assert.equal(result.run.topic_id, 'topic-a');
    assert.equal(result.run.deliverable_id, 'deck-a');
    assert.equal(result.run.status, 'completed');
    assert.equal(result.events.some((event) => event?.type === 'codex_route_started'), true);

    const stored = await getRun({ workspaceRoot, runId: result.run.run_id });
    assert.equal(stored.surface_kind, 'run_record');
    assert.equal(stored.recommended_action, 'review_runtime_state');
    assert.equal(stored.summary.run_id, result.run.run_id);
    assert.equal(stored.run.topic_id, 'topic-a');
    assert.equal(stored.run.deliverable_id, 'deck-a');
    assert.equal(stored.run.executor.adapter, 'codex_cli');
    assert.equal(stored.run.executor.execution_surface, 'codex_cli_runtime');
    assert.equal(stored.run.executor.execution_model.mainline_adapter, 'codex_cli');
    assert.equal(stored.run.executor.execution_model.freeze_origin_milestone, 'P19.A');
    assert.equal(stored.run.executor.codex_cli_runtime?.owner, 'codex_cli');
    assert.equal(stored.run.executor.codex_cli_runtime?.model_selection, 'inherit_local_codex_default');
    assert.equal(stored.run_telemetry.run_id, result.run.run_id);
    assert.equal(stored.run_telemetry.route, 'storyline');
    assert.equal(stored.run_telemetry.executor_kind, 'codex_cli');
    assert.equal(stored.run_telemetry.prompt_pack_file, 'prompts/ppt_deck/storyline.md');
    assert.equal(Number.isInteger(stored.run_telemetry.prompt_bytes), true);
    assert.equal(stored.run_telemetry.prompt_bytes > 0, true);
    assert.equal(Number.isInteger(stored.run_telemetry.context_bytes), true);
    assert.equal(stored.run_telemetry.context_bytes > 0, true);
    assert.deepEqual(stored.run_telemetry.prompt_files, ['prompts/ppt_deck/storyline.md']);
    assert.deepEqual(stored.run_telemetry.slide_scope.target_slide_ids, []);
    assert.equal(stored.run.telemetry.prompt_pack_file, 'prompts/ppt_deck/storyline.md');
    assert.equal(stored.error_taxonomy.error_kind, null);
    assert.equal(stored.rerun_analytics.rerun_count, 0);
    assert.equal(stored.cost_summary.executor_identity, 'codex_cli_runtime');
    assert.equal(stored.quality_drift_summary.relative_quality_verdict, null);
    assert.equal(stored.approval_throughput_summary.pending_review_count, 0);
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.route, 'storyline');
    assert.equal(artifact.contract.profile_id, 'lecture_student');
    assert.equal(artifact.contract.goal, '为本科生讲授甲状腺基础知识');
    assert.equal(artifact.stage_contract.stage_id, 'storyline');
    assert.equal(artifact.execution_model.mainline_adapter, 'codex_cli');
    assert.equal(artifact.execution_model.primary_surface, 'codex_cli_runtime');
    assert.equal(artifact.execution_model.freeze_origin_milestone, 'P19.A');
    assert.equal(artifact.execution_model.codex_cli_runtime?.owner, 'codex_cli');
  });
});

test('runDeliverableRoute executes other declared stages through Codex-backed executor', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '同行讲解 deck',
      goal: '向小同行解释问题、方法、证据与边界',
    });

    const preflight = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });
    assert.equal(preflight.ok, true);

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'detailed_outline',
    });

    assert.equal(result.ok, true);
    assert.match(result.run.run_id, /^run[-_]/);
    assert.equal(result.run.executor.adapter, 'codex_cli');
    assert.equal(result.run.executor.execution_model.mainline_adapter, 'codex_cli');
    assert.equal(result.run.executor.codex_cli_runtime?.owner, 'codex_cli');
    assert.equal(result.run.current_stage, 'detailed_outline');
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.stage_contract.stage_id, 'detailed_outline');
    assert.equal(artifact.contract.profile_id, 'lecture_peer');
    assert.equal(artifact.execution_model.mainline_adapter, 'codex_cli');
  });
});

test('runDeliverableRoute supports explicit hermes_agent adapter without changing the default executor', async () => {
  await withMockHermesAgentLoop(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-hermes-proof-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Hermes-Agent loop route',
      goal: '验证 RedCube 可显式走 Hermes-Agent loop full agent loop route',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
      adapter: 'hermes_agent',
    });

    assert.equal(result.ok, true);
    assert.equal(result.run.executor.adapter, 'hermes_agent');
    assert.equal(result.run.executor.primary, false);
    assert.equal(result.run.executor.execution_surface, 'hermes_agent_loop');
    assert.equal(result.run.executor.execution_model.mainline_adapter, 'hermes_agent');
    assert.equal(result.run.executor.execution_model.primary_surface, 'hermes_agent_loop');
    assert.equal(result.run.executor.execution_model.adapter_role, 'opl_hosted_executor_adapter_proof');
    assert.equal(result.run.executor.execution_model.runtime_substrate_owner, 'OPL Runtime Manager');
    assert.equal(
      result.run.executor.execution_model.opl_executor_adapter_receipt?.hosted_adapter_reference,
      'opl_hosted:hermes_agent_loop',
    );
    assert.equal(result.run.executor.hermes_agent_loop_runtime?.owner, 'opl_runtime_manager');
    assert.equal(result.run.executor.hermes_agent_loop_runtime?.source, 'opl_executor_adapter_receipt');
    assert.equal(result.run.executor.hermes_agent_loop_runtime?.hosted_adapter_reference, 'opl_hosted:hermes_agent_loop');
    assert.equal(result.run.executor.hermes_agent_loop_runtime?.adapter_runtime_owner, 'hermes_agent');
    assert.equal(
      result.run.executor.hermes_agent_loop_runtime?.domain_truth_owner,
      'redcube_ai_visual_deliverable_runtime',
    );
    assert.equal(result.run.executor.hermes_agent_loop_runtime?.review_export_gate_owner, 'redcube_ai');
    assert.equal(result.run.executor.hermes_agent_loop_runtime?.activation, 'explicit_opt_in_only');
    assert.equal(result.run.executor.hermes_agent_loop_runtime?.auditability, 'receipt_backed');
    assert.equal(result.run.executor.hermes_agent_loop_runtime?.failure_mode, 'fail_closed');
    assert.equal(result.run.executor.hermes_agent_loop_runtime?.effect_equivalence_guaranteed, false);
    assert.equal(result.run.executor.hermes_agent_loop_runtime?.model_selection, 'inherit_local_hermes_default');
    assert.equal(result.run.executor.hermes_agent_loop_runtime?.reasoning_selection, 'inherit_local_hermes_default');
    assert.equal(result.events.some((event) => event?.type === 'hermes_agent_loop_route_started'), true);

    const stored = await getRun({ workspaceRoot, runId: result.run.run_id });
    assert.equal(stored.run.executor.adapter, 'hermes_agent');
    assert.equal(stored.run.executor.execution_surface, 'hermes_agent_loop');
    assert.equal(stored.run.executor.execution_model.mainline_adapter, 'hermes_agent');
    assert.equal(stored.run.executor.execution_model.runtime_substrate_owner, 'OPL Runtime Manager');
    assert.equal(stored.run.executor.hermes_agent_loop_runtime?.owner, 'opl_runtime_manager');
    assert.equal(stored.run.executor.hermes_agent_loop_runtime?.source, 'opl_executor_adapter_receipt');
    assert.equal(stored.run_telemetry.executor_kind, 'hermes_agent');
    assert.equal(stored.cost_summary.executor_identity, 'hermes_agent_loop');

    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.execution_model.mainline_adapter, 'hermes_agent');
    assert.equal(artifact.execution_model.primary_surface, 'hermes_agent_loop');
    assert.equal(artifact.execution_model.runtime_substrate_owner, 'OPL Runtime Manager');
    assert.equal(artifact.execution_model.opl_executor_adapter_receipt?.source, 'opl_executor_adapter_receipt');
    assert.equal(
      artifact.execution_model.opl_executor_adapter_receipt?.domain_truth_owner,
      'redcube_ai_visual_deliverable_runtime',
    );
    assert.equal(artifact.execution_model.opl_executor_adapter_receipt?.review_export_gate_owner, 'redcube_ai');
    assert.equal(artifact.creative_execution?.owner, 'redcube_ai_visual_deliverable_runtime');
    assert.equal(artifact.creative_execution?.primary_surface, 'hermes_agent_loop');
    assert.equal(artifact.creative_execution?.generation_runtime?.owner, 'opl_runtime_manager');
    assert.equal(artifact.creative_execution?.generation_runtime?.source, 'opl_executor_adapter_receipt');
    assert.equal(
      artifact.creative_execution?.generation_runtime?.hosted_adapter_reference,
      'opl_hosted:hermes_agent_loop',
    );
    assert.equal(artifact.creative_execution?.generation_runtime?.adapter_runtime_owner, 'hermes_agent');
    assert.equal(
      artifact.creative_execution?.generation_runtime?.creative_owner,
      'redcube_ai_visual_deliverable_runtime',
    );
    assert.equal(
      artifact.creative_execution?.generation_runtime?.domain_truth_owner,
      'redcube_ai_visual_deliverable_runtime',
    );
    assert.equal(artifact.creative_execution?.generation_runtime?.review_export_gate_owner, 'redcube_ai');
    assert.equal(artifact.creative_execution?.generation_runtime?.proof?.full_agent_loop_proved, true);
    assert.equal(
      artifact.creative_execution?.generation_runtime?.proof?.opl_executor_adapter_receipt?.source,
      'opl_executor_adapter_receipt',
    );
  });
});

test('runDeliverableRoute supports explicit hermes_agent adapter for xiaohongshu storyline', async () => {
  await withMockHermesAgentLoop(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-xhs-hermes-proof-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Hermes-Agent loop xiaohongshu proof route',
      brief: '验证小红书 family 可以显式走 Hermes-Agent loop full agent loop storyline。',
      keywords: ['小红书', 'Hermes'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'Hermes-Agent loop 小红书 proof route',
      goal: '验证 RedCube xiaohongshu family 可显式走 Hermes-Agent loop full agent loop route',
    });

    const research = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'research',
      adapter: 'hermes_agent',
    });
    assert.equal(research.ok, true);

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'storyline',
      adapter: 'hermes_agent',
    });

    assert.equal(result.ok, true);
    assert.equal(result.run.executor.adapter, 'hermes_agent');
    assert.equal(result.run.executor.execution_surface, 'hermes_agent_loop');
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.execution_model.mainline_adapter, 'hermes_agent');
    assert.equal(artifact.execution_model.primary_surface, 'hermes_agent_loop');
    assert.equal(artifact.execution_model.runtime_substrate_owner, 'OPL Runtime Manager');
    assert.equal(artifact.execution_model.opl_executor_adapter_receipt?.source, 'opl_executor_adapter_receipt');
    assert.equal(
      artifact.execution_model.opl_executor_adapter_receipt?.domain_truth_owner,
      'redcube_ai_visual_deliverable_runtime',
    );
    assert.equal(artifact.creative_execution?.owner, 'redcube_ai_visual_deliverable_runtime');
    assert.equal(artifact.creative_execution?.generation_runtime?.source, 'opl_executor_adapter_receipt');
    assert.equal(
      artifact.creative_execution?.generation_runtime?.hosted_adapter_reference,
      'opl_hosted:hermes_agent_loop',
    );
    assert.equal(artifact.creative_execution?.generation_runtime?.adapter_runtime_owner, 'hermes_agent');
    assert.equal(
      artifact.creative_execution?.generation_runtime?.creative_owner,
      'redcube_ai_visual_deliverable_runtime',
    );
    assert.equal(
      artifact.creative_execution?.generation_runtime?.domain_truth_owner,
      'redcube_ai_visual_deliverable_runtime',
    );
    assert.equal(artifact.creative_execution?.generation_runtime?.proof?.full_agent_loop_proved, true);
  });
});

test('runDeliverableRoute supports explicit hermes_agent adapter for poster storyline', async () => {
  await withMockHermesAgentLoop(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-poster-hermes-proof-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: 'Hermes-Agent loop 海报 proof route',
      goal: '验证 RedCube poster family 可显式走 Hermes-Agent loop full agent loop route',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      route: 'storyline',
      adapter: 'hermes_agent',
    });

    assert.equal(result.ok, true);
    assert.equal(result.run.executor.adapter, 'hermes_agent');
    assert.equal(result.run.executor.execution_surface, 'hermes_agent_loop');
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.execution_model.mainline_adapter, 'hermes_agent');
    assert.equal(artifact.execution_model.primary_surface, 'hermes_agent_loop');
    assert.equal(artifact.execution_model.runtime_substrate_owner, 'OPL Runtime Manager');
    assert.equal(artifact.execution_model.opl_executor_adapter_receipt?.source, 'opl_executor_adapter_receipt');
    assert.equal(
      artifact.execution_model.opl_executor_adapter_receipt?.domain_truth_owner,
      'redcube_ai_visual_deliverable_runtime',
    );
    assert.equal(artifact.creative_execution?.owner, 'redcube_ai_visual_deliverable_runtime');
    assert.equal(artifact.creative_execution?.generation_runtime?.source, 'opl_executor_adapter_receipt');
    assert.equal(
      artifact.creative_execution?.generation_runtime?.hosted_adapter_reference,
      'opl_hosted:hermes_agent_loop',
    );
    assert.equal(artifact.creative_execution?.generation_runtime?.adapter_runtime_owner, 'hermes_agent');
    assert.equal(
      artifact.creative_execution?.generation_runtime?.creative_owner,
      'redcube_ai_visual_deliverable_runtime',
    );
    assert.equal(
      artifact.creative_execution?.generation_runtime?.domain_truth_owner,
      'redcube_ai_visual_deliverable_runtime',
    );
    assert.equal(artifact.creative_execution?.generation_runtime?.proof?.full_agent_loop_proved, true);
  });
});
