import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';

import {
  auditDeliverable,
  createDeliverable,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import { withMockHermesUpstream } from './helpers/mock-codex-cli.js';
import { assertWorkspaceGitBoundary } from './helpers/workspace-git-boundary.js';

async function prepareSourceReadiness(workspaceRoot) {
  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊科普',
    brief: '为本科生讲授甲状腺基础知识，覆盖定义、功能、检查与常见误区。',
    keywords: ['甲状腺', '内分泌', '门诊科普'],
  });
}

test('createDeliverable initializes workspace AGENTS guardrails without overwriting existing files', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-agents-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: 'RCA guardrail deck',
    goal: '验证交付工作区 AGENTS 防偏航约束',
  });

  const agentsFile = path.join(workspaceRoot, 'AGENTS.md');
  assert.equal(created.workspaceAgentsFile, agentsFile);
  assert.equal(existsSync(agentsFile), true);
  const agentsText = readFileSync(agentsFile, 'utf-8');
  assert.match(agentsText, /RedCube AI \/ RCA product-entry/);
  assert.match(agentsText, /render_html -> visual_director_review -> screenshot_review -> export_pptx/);
  assert.match(agentsText, /不得用通用 PowerPoint 模板/);
  assertWorkspaceGitBoundary(workspaceRoot);

  writeFileSync(agentsFile, '# Custom workspace rule\n', 'utf-8');
  const second = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-b',
    deliverableId: 'deck-b',
    title: 'RCA custom guardrail deck',
    goal: '验证不覆盖已有 AGENTS',
  });
  assert.equal(second.workspaceAgentsFile, null);
  assert.equal(readFileSync(agentsFile, 'utf-8'), '# Custom workspace rule\n');
});

test('createDeliverable hydrates ppt deck contract surface', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  const deliverableDir = path.dirname(created.deliverableFile);
  const surfaceFiles = [
    'contracts/stage-sequence.json',
    'contracts/stage-requirements.json',
    'contracts/lifecycle-stage-contract.json',
    'contracts/prompt-pack.json',
    'contracts/review-surface.json',
    'contracts/layout-rules.json',
    'contracts/baseline-policy.json',
    'contracts/export-bundle.json',
    'contracts/delivery-contract.json',
    'contracts/hydrated-deliverable.json',
    'views/display-registry.json',
  ];

  for (const file of surfaceFiles) {
    assert.equal(existsSync(path.join(deliverableDir, file)), true, file);
  }

  const displayRegistry = JSON.parse(
    readFileSync(path.join(deliverableDir, 'views/display-registry.json'), 'utf-8'),
  );
  const hydratedContract = JSON.parse(
    readFileSync(path.join(deliverableDir, 'contracts/hydrated-deliverable.json'), 'utf-8'),
  );
  const promptPack = JSON.parse(
    readFileSync(path.join(deliverableDir, 'contracts/prompt-pack.json'), 'utf-8'),
  );

  assert.deepEqual(
    displayRegistry.surfaces.map((surface) => surface.id),
    [
      'source_index',
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ],
  );
  assert.equal(hydratedContract.profile_id, 'lecture_student');
  assert.equal(hydratedContract.export_bundle.bundle_id, 'lecture_student_bundle');
  assert.equal(hydratedContract.prompt_pack.root, 'prompts/ppt_deck');
  assert.equal(hydratedContract.prompt_pack.stages.render_html.file, 'render_html.md');
  assert.equal(hydratedContract.prompt_pack.render_contract.render_strategy, 'prompt_director_first');
  assert.equal(hydratedContract.prompt_pack.render_contract.default_visual_route, 'render_html');
  assert.equal(hydratedContract.prompt_pack.render_contract.native_ppt_proof_lane.status, 'opt_in_proof_lane');
  assert.deepEqual(
    hydratedContract.prompt_pack.render_contract.native_ppt_proof_lane.replaces_routes,
    ['render_html', 'fix_html'],
  );
  assert.equal(hydratedContract.prompt_pack.render_contract.shell_file, 'render_shell.html');
  assert.equal(hydratedContract.prompt_pack.render_contract.compiler_module ?? null, null);
  assert.equal(hydratedContract.prompt_pack.render_contract.compiler_export ?? null, null);
  assert.equal(hydratedContract.prompt_pack.render_contract.recipe_registry.default, 'ppt.compare_zones');
  assert.equal(promptPack.render_contract.recipe_registry.cover_hero, 'ppt.hero_signal');
  assert.equal(promptPack.render_contract.recipe_registry.summary_peak, 'ppt.summary_peak');
  assert.equal(promptPack.render_contract.compiler_module ?? null, null);
  assert.equal(promptPack.render_contract.compiler_export ?? null, null);
  assert.deepEqual(
    JSON.parse(
      readFileSync(path.join(deliverableDir, 'contracts/stage-requirements.json'), 'utf-8'),
    ).render_html.requires_artifacts,
    ['slide_blueprint', 'visual_direction'],
  );
  assert.equal(
    JSON.parse(
      readFileSync(path.join(deliverableDir, 'contracts/lifecycle-stage-contract.json'), 'utf-8'),
    ).route_to_human_stage.detailed_outline,
    'plan',
  );
  assert.equal(
    hydratedContract.review_surface.required_checks.includes('term_explained_on_first_use'),
    true,
  );
  assert.equal(hydratedContract.delivery_contract.required_export_route, 'export_pptx');
  assert.equal(hydratedContract.delivery_contract.required_export_bundle_id, 'lecture_student_bundle');
});

test('auditDeliverable blocks when hydrated ppt deck surface is missing', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));
  await prepareSourceReadiness(workspaceRoot);

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  unlinkSync(
    path.join(path.dirname(created.deliverableFile), 'contracts/review-surface.json'),
  );

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    mode: 'draft_new',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['deliverable_contract_missing:review_surface']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'rehydrate_deliverable_surface');
});

test('auditDeliverable passes when hydrated ppt deck surface exists and baseline is bound', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));
    await prepareSourceReadiness(workspaceRoot);

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-approved-v1',
      title: '甲状腺门诊科普 baseline',
      goal: '已认可基线',
    });
    for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review']) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-approved-v1',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
      goal: '为本科生讲授甲状腺基础知识',
    });

    const report = await auditDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      mode: 'optimize_existing',
      baselineDeliverableId: 'deck-approved-v1',
    });

    assert.equal(report.status, 'pass');
    assert.deepEqual(report.issues, []);
    assert.equal(report.rerun_from_stage, null);
    assert.equal(report.recommended_action, 'run_deliverable_route');
    assert.equal(report.gate_summary?.required_export_route, 'export_pptx');
    assert.equal(report.gate_summary?.required_export_bundle_id, 'lecture_student_bundle');
    assert.equal(report.gate_summary?.approval_required, false);
    assert.equal(report.gate_summary?.delivery_projection_current, 'draft');
    assert.equal(report.gate_summary?.delivery_projection_next, 'export_ready');
  });
});

test('auditDeliverable blocks when hydrated ppt deck surface content is invalid', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));
  await prepareSourceReadiness(workspaceRoot);

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'executive_briefing',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '向院领导汇报门诊容量与改造建议',
  });

  writeFileSync(
    path.join(path.dirname(created.deliverableFile), 'contracts/review-surface.json'),
    '{}',
    'utf-8',
  );

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    mode: 'draft_new',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['deliverable_contract_invalid:review_surface']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'rehydrate_deliverable_surface');
});

test('auditDeliverable blocks when prompt pack misses render contract seed', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-ppt-surface-'));
  await prepareSourceReadiness(workspaceRoot);

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  writeFileSync(
    path.join(path.dirname(created.deliverableFile), 'contracts/prompt-pack.json'),
    JSON.stringify({
      pack_id: 'ppt_deck_mainline_v1',
      root: 'prompts/ppt_deck',
      routes: {
        render_html: 'prompts/ppt_deck/render_html.md',
      },
      stages: {
        render_html: { file: 'render_html.md' },
      },
    }, null, 2),
    'utf-8',
  );

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    mode: 'draft_new',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['deliverable_contract_invalid:prompt_pack']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'rehydrate_deliverable_surface');
});
