import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  getDeliverable,
  getRun,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import { appendEvent } from '@redcube/runtime';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const MOCK_HERMES_NATIVE_BRIDGE_COMMAND = JSON.stringify([
  process.execPath,
  path.join(MODULE_DIR, 'helpers/mock-hermes-native-bridge.mjs'),
]);

async function withMockHermesUpstream(testFn) {
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

async function withMockHermesNativeProof(testFn) {
  const restoreEnv = withEnv({
    REDCUBE_HERMES_NATIVE_BRIDGE_COMMAND: MOCK_HERMES_NATIVE_BRIDGE_COMMAND,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
  }
}

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
    'render_html',
    'visual_director_review',
    'screenshot_review',
    'fix_html',
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

test('runDeliverableRoute uses Codex-backed executor by default', async () => {
  await withMockHermesUpstream(async () => {
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
    assert.equal(result.run.executor.adapter, 'host_agent');
    assert.equal(result.run.executor.primary, true);
    assert.equal(result.run.executor.execution_surface, 'codex_native_host_agent');
    assert.equal(result.run.executor.creative_execution, 'agent_first_director_first');
    assert.equal(result.run.executor.execution_model.mainline_adapter, 'host_agent');
    assert.equal(result.run.executor.execution_model.primary_surface, 'codex_native_host_agent');
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
    assert.equal(stored.run.executor.adapter, 'host_agent');
    assert.equal(stored.run.executor.execution_surface, 'codex_native_host_agent');
    assert.equal(stored.run.executor.execution_model.mainline_adapter, 'host_agent');
    assert.equal(stored.run.executor.execution_model.freeze_origin_milestone, 'P19.A');
    assert.equal(stored.run.executor.codex_cli_runtime?.owner, 'codex_cli');
    assert.equal(stored.run.executor.codex_cli_runtime?.model_selection, 'inherit_local_codex_default');
    assert.equal(stored.run_telemetry.run_id, result.run.run_id);
    assert.equal(stored.run_telemetry.route, 'storyline');
    assert.equal(stored.run_telemetry.executor_kind, 'host_agent');
    assert.equal(stored.error_taxonomy.error_kind, null);
    assert.equal(stored.rerun_analytics.rerun_count, 0);
    assert.equal(stored.cost_summary.executor_identity, 'codex_native_host_agent');
    assert.equal(stored.quality_drift_summary.relative_quality_verdict, null);
    assert.equal(stored.approval_throughput_summary.pending_review_count, 0);
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.route, 'storyline');
    assert.equal(artifact.contract.profile_id, 'lecture_student');
    assert.equal(artifact.contract.goal, '为本科生讲授甲状腺基础知识');
    assert.equal(artifact.stage_contract.stage_id, 'storyline');
    assert.equal(artifact.execution_model.mainline_adapter, 'host_agent');
    assert.equal(artifact.execution_model.primary_surface, 'codex_native_host_agent');
    assert.equal(artifact.execution_model.freeze_origin_milestone, 'P19.A');
    assert.equal(artifact.execution_model.codex_cli_runtime?.owner, 'codex_cli');
  });
});

test('runDeliverableRoute executes other declared stages through Codex-backed executor', async () => {
  await withMockHermesUpstream(async () => {
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
    assert.equal(result.run.executor.adapter, 'host_agent');
    assert.equal(result.run.executor.execution_model.mainline_adapter, 'host_agent');
    assert.equal(result.run.executor.codex_cli_runtime?.owner, 'codex_cli');
    assert.equal(result.run.current_stage, 'detailed_outline');
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.stage_contract.stage_id, 'detailed_outline');
    assert.equal(artifact.contract.profile_id, 'lecture_peer');
    assert.equal(artifact.execution_model.mainline_adapter, 'host_agent');
  });
});

test('runDeliverableRoute supports explicit hermes_native_proof adapter without changing the default executor', async () => {
  await withMockHermesNativeProof(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-hermes-proof-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Hermes-native proof route',
      goal: '验证 RedCube 可显式走 Hermes-native full agent loop route',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
      adapter: 'hermes_native_proof',
    });

    assert.equal(result.ok, true);
    assert.equal(result.run.executor.adapter, 'hermes_native_proof');
    assert.equal(result.run.executor.primary, false);
    assert.equal(result.run.executor.execution_surface, 'hermes_native_full_agent_loop');
    assert.equal(result.run.executor.execution_model.mainline_adapter, 'hermes_native_proof');
    assert.equal(result.run.executor.execution_model.primary_surface, 'hermes_native_full_agent_loop');
    assert.equal(result.run.executor.hermes_native_runtime?.owner, 'hermes_native_proof');
    assert.equal(result.run.executor.hermes_native_runtime?.model_selection, 'inherit_local_hermes_default');
    assert.equal(result.run.executor.hermes_native_runtime?.reasoning_selection, 'inherit_local_hermes_default');
    assert.equal(result.events.some((event) => event?.type === 'hermes_native_route_started'), true);

    const stored = await getRun({ workspaceRoot, runId: result.run.run_id });
    assert.equal(stored.run.executor.adapter, 'hermes_native_proof');
    assert.equal(stored.run.executor.execution_surface, 'hermes_native_full_agent_loop');
    assert.equal(stored.run.executor.execution_model.mainline_adapter, 'hermes_native_proof');
    assert.equal(stored.run.executor.hermes_native_runtime?.owner, 'hermes_native_proof');
    assert.equal(stored.run_telemetry.executor_kind, 'hermes_native_proof');
    assert.equal(stored.cost_summary.executor_identity, 'hermes_native_full_agent_loop');

    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.execution_model.mainline_adapter, 'hermes_native_proof');
    assert.equal(artifact.execution_model.primary_surface, 'hermes_native_full_agent_loop');
    assert.equal(artifact.creative_execution?.owner, 'hermes_native_proof');
    assert.equal(artifact.creative_execution?.primary_surface, 'hermes_native_full_agent_loop');
    assert.equal(artifact.creative_execution?.generation_runtime?.owner, 'hermes_native_proof');
    assert.equal(artifact.creative_execution?.generation_runtime?.proof?.full_agent_loop_proved, true);
  });
});

test('runDeliverableRoute supports explicit hermes_native_proof adapter for xiaohongshu storyline', async () => {
  await withMockHermesNativeProof(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-xhs-hermes-proof-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Hermes-native xiaohongshu proof route',
      brief: '验证小红书 family 可以显式走 Hermes-native full agent loop storyline。',
      keywords: ['小红书', 'Hermes'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: 'Hermes-native 小红书 proof route',
      goal: '验证 RedCube xiaohongshu family 可显式走 Hermes-native full agent loop route',
    });

    const research = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'research',
      adapter: 'hermes_native_proof',
    });
    assert.equal(research.ok, true);

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'storyline',
      adapter: 'hermes_native_proof',
    });

    assert.equal(result.ok, true);
    assert.equal(result.run.executor.adapter, 'hermes_native_proof');
    assert.equal(result.run.executor.execution_surface, 'hermes_native_full_agent_loop');
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.execution_model.mainline_adapter, 'hermes_native_proof');
    assert.equal(artifact.execution_model.primary_surface, 'hermes_native_full_agent_loop');
    assert.equal(artifact.creative_execution?.owner, 'hermes_native_proof');
    assert.equal(artifact.creative_execution?.generation_runtime?.proof?.full_agent_loop_proved, true);
  });
});

test('runDeliverableRoute supports explicit hermes_native_proof adapter for poster storyline', async () => {
  await withMockHermesNativeProof(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-poster-hermes-proof-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: 'Hermes-native 海报 proof route',
      goal: '验证 RedCube poster family 可显式走 Hermes-native full agent loop route',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      route: 'storyline',
      adapter: 'hermes_native_proof',
    });

    assert.equal(result.ok, true);
    assert.equal(result.run.executor.adapter, 'hermes_native_proof');
    assert.equal(result.run.executor.execution_surface, 'hermes_native_full_agent_loop');
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.execution_model.mainline_adapter, 'hermes_native_proof');
    assert.equal(artifact.execution_model.primary_surface, 'hermes_native_full_agent_loop');
    assert.equal(artifact.creative_execution?.owner, 'hermes_native_proof');
    assert.equal(artifact.creative_execution?.generation_runtime?.proof?.full_agent_loop_proved, true);
  });
});

test('getRun rejects unsafe run identifiers', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await assert.rejects(
    () => getRun({ workspaceRoot, runId: '../run-a' }),
    /runId 不能包含路径分隔符/,
  );
});

test('appendEvent rejects unsafe run identifiers', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  assert.throws(
    () => appendEvent(workspaceRoot, '../run-a', { type: 'test' }),
    /runId 不能包含路径分隔符/,
  );
});

test('runDeliverableRoute rejects unsafe route segments', async () => {
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

  await assert.rejects(
    () => runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: '../storyline',
    }),
    /route 不能包含路径分隔符/,
  );
});

test('runDeliverableRoute rejects overlay mismatch against stored deliverable', async () => {
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

  await assert.rejects(
    () => runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    }),
    /overlay mismatch: expected ppt_deck, got xiaohongshu/,
  );
});

test('runDeliverableRoute rejects retired external_llm adapter before creating durable run state', async () => {
  await withMockHermesUpstream(async () => {
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

    await assert.rejects(
      () => runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'detailed_outline',
        adapter: 'external_llm',
      }),
      /Unsupported executor adapter: external_llm/,
    );

    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'runs')), false);
    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'events')), false);
  });
});

test('runDeliverableRoute rejects route not declared by hydrated deliverable contract', async () => {
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

  await assert.rejects(
    () => runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'publish_live',
    }),
    /Route publish_live is not declared by hydrated deliverable contract/,
  );
});

test('runDeliverableRoute auto-rehydrates stale deliverable surfaces when the current overlay contract declares the requested route', async () => {
  await withMockHermesUpstream(async () => {
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
    contract.stage_sequence.stages = contract.stage_sequence.stages.filter((stage) => stage.stage_id !== 'fix_html');
    delete contract.stage_requirements.fix_html;
    delete contract.prompt_pack.routes.fix_html;
    delete contract.prompt_pack.stages.fix_html;
    writeFileSync(contractFile, JSON.stringify(contract, null, 2), 'utf-8');

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'fix_html',
    });

    assert.equal(result.ok, false);
    assert.match(result.run.error.message, /requires completed stage artifacts|requires screenshot_review/i);

    const refreshedContract = JSON.parse(readFileSync(contractFile, 'utf-8'));
    assert.equal(
      refreshedContract.stage_sequence.stages.some((stage) => stage?.stage_id === 'fix_html'),
      true,
    );
    assert.equal(result.governance_surface?.family_boundary?.overlay, 'ppt_deck');
  });
});

test('runDeliverableRoute supports xiaohongshu routes on shared runtime', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route: 'research',
    });

    assert.equal(result.ok, true);
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.overlay, 'xiaohongshu');
    assert.equal(artifact.route, 'research');
    assert.equal(typeof artifact.research.topic_summary, 'string');
  });
});

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

test('runDeliverableRoute supports poster_onepager routes on shared runtime', async () => {
  await withMockHermesUpstream(async () => {
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
  await withMockHermesUpstream(async () => {
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
    }

    const screenshotArtifact = JSON.parse(readFileSync(path.join(
      workspaceRoot,
      'topics/topic-a/deliverables/poster-a/artifacts/quality_gate.json',
    ), 'utf-8'));
    const exportArtifact = JSON.parse(readFileSync(path.join(
      workspaceRoot,
      'topics/topic-a/deliverables/poster-a/artifacts/publish_bundle.json',
    ), 'utf-8'));

    assert.equal(screenshotArtifact.status, 'pass');
    assert.equal(screenshotArtifact.review_state_patch.rerun_from_stage, null);
    assert.equal(exportArtifact.status, 'completed');
    assert.equal(exportArtifact.export_bundle.png_files.length, 1);
    assert.equal(typeof exportArtifact.export_bundle.source_html, 'string');
  });
});
