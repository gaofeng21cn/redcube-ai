// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, utimesSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  runDeliverableRoute,
} from './product-domain-action-test-api.ts';
import {
  canonicalStageForRoute,
  getDeliverablePaths,
  readStageFolderArtifact,
  stageOrderForCanonicalStage,
} from '@redcube/runtime-protocol';
import {
  buildMockCreativeOutput,
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.ts';
import { completeSourceReadiness } from './helpers/complete-source-readiness.ts';

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.ts', import.meta.url)),
]);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function routeArtifactFile(result) {
  const file = result?.artifactFile || result?.artifact_file || result?.error?.artifact_file || result?.run?.error?.artifact_file;
  assert.equal(typeof file, 'string');
  assert.notEqual(file.trim(), '');
  return file;
}

function readStageArtifact(workspaceRoot, topicId, deliverableId, routeStageId) {
  const canonicalStageId = canonicalStageForRoute(routeStageId);
  const loaded = readStageFolderArtifact({
    deliverablePaths: getDeliverablePaths(workspaceRoot, topicId, deliverableId),
    routeStageId,
    canonicalStageId,
    stageOrder: stageOrderForCanonicalStage(canonicalStageId),
  });
  assert.equal(Boolean(loaded?.artifact), true, routeStageId);
  return loaded.artifact;
}

async function withMockCodexRuntime(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

async function preparePptPlan({
  workspaceRoot,
  topicId = 'topic-a',
  deliverableId,
  title,
  goal,
  profileId = 'lecture_student',
}) {
  await completeSourceReadiness({
    workspaceRoot,
    topicId,
    title,
    brief: goal,
    keywords: ['ppt', 'route', 'export'],
  });

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId,
    topicId,
    deliverableId,
    title,
    goal,
  });

  for (const route of ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId,
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, `${deliverableId}:${route}`);
  }
}

test('runDeliverableRoute auto-recovers fresh review dependencies before ppt fix_html', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-route-recovery-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Route recovery proof',
      brief: '验证 direct route 在旧截图质控后自动补跑 fresh review。',
      keywords: ['ppt', 'fix_html', 'recovery'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Route recovery proof',
      goal: '验证 direct route recovery',
    });

    const routeResults = new Map();
    for (const route of [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
      routeResults.set(route, result);
    }

    const renderBundleFile = routeArtifactFile(routeResults.get('render_html'));
    await new Promise((resolve) => setTimeout(resolve, 30));
    const touchedAt = new Date();
    utimesSync(renderBundleFile, touchedAt, touchedAt);

    const restoreVariants = withEnv({
      REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'force_block',
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender',
    });
    try {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });

      assert.equal(result.ok, true);
      assert.deepEqual(result.summary.auto_recovered_dependency_routes, [
        'visual_director_review',
        'screenshot_review',
      ]);
      assert.equal(result.summary.requested_route, 'fix_html');
      assert.equal(result.summary.executed_route, 'screenshot_review');
      assert.deepEqual(
        result.dependency_route_runs.map((entry) => entry.route),
        ['visual_director_review', 'screenshot_review'],
      );
      assert.equal(result.execution_proof?.proof_kind, 'fix_html_agentic_escalation');
      assert.equal(result.execution_proof?.escalation_status, 'escalation_unavailable');
      assert.deepEqual(result.artifact?.render_execution?.freshly_rendered_slide_ids, ['S02']);
      const fixArtifact = readJson(routeArtifactFile(result));
      assert.deepEqual(fixArtifact.render_execution?.freshly_rendered_slide_ids, ['S02']);
    } finally {
      restoreVariants();
    }
  });
});

test('runDeliverableRoute continues from ppt fix_html to requested stop-after review gate', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-route-stop-after-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Route stop-after proof',
      brief: '验证 direct route 回修后会继续复审到指定 gate。',
      keywords: ['ppt', 'fix_html', 'stop-after'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Route stop-after proof',
      goal: '验证 route stop-after continuation',
    });

    for (const route of [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const restoreBlockedReview = withEnv({
      REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'force_block',
    });
    try {
      const blockedReview = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'screenshot_review',
      });
      assert.equal(blockedReview.ok, false);
    } finally {
      restoreBlockedReview();
    }

    const restoreFixVariant = withEnv({
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender',
    });
    try {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
        stopAfterStage: 'screenshot_review',
      });

      assert.equal(result.ok, true);
      assert.equal(result.summary.requested_route, 'fix_html');
      assert.equal(result.summary.executed_route, 'screenshot_review');
      assert.equal(result.summary.stop_after_stage, 'screenshot_review');
      assert.deepEqual(result.summary.continued_route_sequence, [
        'visual_director_review',
        'screenshot_review',
      ]);
      assert.deepEqual(
        result.continuation_route_runs.map((entry) => entry.route),
        ['visual_director_review', 'screenshot_review'],
      );
      assert.equal(result.artifact?.status, 'pass');
    } finally {
      restoreFixVariant();
    }
  });
});

test('runDeliverableRoute continues explicit ppt visual routes through review and export', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-explicit-visual-export-'));
    const routeCases = [
      { deliverableId: 'deck-html', visualRoute: 'render_html' },
      { deliverableId: 'deck-native', visualRoute: 'author_pptx_native' },
    ];

    for (const routeCase of routeCases) {
      await preparePptPlan({
        workspaceRoot,
        deliverableId: routeCase.deliverableId,
        title: `Explicit ${routeCase.visualRoute} export proof`,
        goal: '验证显式 PPT 技术路线可以由 product-entry route 入口自主续跑到导出。',
      });

      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: routeCase.deliverableId,
        route: routeCase.visualRoute,
        stopAfterStage: 'export_pptx',
      });

      assert.equal(result.ok, true, routeCase.visualRoute);
      assert.equal(result.summary.requested_route, routeCase.visualRoute);
      assert.equal(result.summary.executed_route, 'export_pptx');
      assert.deepEqual(result.summary.continued_route_sequence, [
        'visual_director_review',
        'screenshot_review',
        'export_pptx',
      ]);
      assert.deepEqual(
        result.continuation_route_runs.map((entry) => entry.route),
        ['visual_director_review', 'screenshot_review', 'export_pptx'],
      );
      assert.equal(result.artifact?.export_bundle?.delivery_state?.current, 'output_ready');
      assert.equal(
        result.artifact?.export_bundle?.source_visual_route
          || result.artifact?.export_bundle?.review_capture?.source_visual_route,
        routeCase.visualRoute,
      );
    }
  });
});

test('runDeliverableRoute recovers explicit ppt visual route planning prerequisites before export', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-explicit-visual-plan-recovery-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Explicit native plan recovery proof',
      brief: '验证显式 native PPT route 可以从空 plan 自主补齐 planning 依赖并导出。',
      keywords: ['ppt', 'native', 'plan', 'recovery'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-native',
      title: 'Explicit native plan recovery proof',
      goal: '验证显式 PPT 技术路线可以从 product-entry route 入口自主补齐计划并续跑到导出。',
    });

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-native',
      route: 'author_pptx_native',
      stopAfterStage: 'export_pptx',
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.requested_route, 'author_pptx_native');
    assert.deepEqual(result.summary.auto_recovered_dependency_routes, [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
    ]);
    assert.equal(result.summary.executed_route, 'export_pptx');
    assert.deepEqual(result.summary.continued_route_sequence, [
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ]);
    assert.equal(result.artifact?.export_bundle?.delivery_state?.current, 'output_ready');
    assert.equal(result.artifact?.export_bundle?.source_visual_route, 'author_pptx_native');
  });
});

test('runDeliverableRoute continues from ppt repair_image_pages through fresh review before export', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-image-repair-export-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Image repair export proof',
      brief: '验证 image-first 回修后必须重新经过 visual review 与 screenshot review 才能导出。',
      keywords: ['ppt', 'image-first', 'repair', 'export'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Image repair export proof',
      goal: '验证 image-first repair 到 export 的自主续跑',
    });

    for (const route of [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'author_image_pages',
      'visual_director_review',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const restoreBlockedReview = withEnv({
      REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'force_block',
    });
    try {
      const blockedReview = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'screenshot_review',
      });
      assert.equal(blockedReview.ok, false);
      assert.equal(blockedReview.summary.executed_route, 'screenshot_review');
    } finally {
      restoreBlockedReview();
    }

    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'repair_image_pages',
      stopAfterStage: 'export_pptx',
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.requested_route, 'repair_image_pages');
    assert.equal(result.summary.executed_route, 'export_pptx');
    assert.deepEqual(result.summary.continued_route_sequence, [
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ]);
    assert.deepEqual(
      result.continuation_route_runs.map((entry) => entry.route),
      ['visual_director_review', 'screenshot_review', 'export_pptx'],
    );
    assert.equal(result.artifact?.export_bundle?.delivery_state?.current, 'output_ready');
  });
});

test('runDeliverableRoute auto-repairs ppt image pages after visual director review blocks before export', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-director-image-repair-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Director image repair export proof',
      brief: '验证 image-first visual director 阻断后能自动回修并继续导出。',
      keywords: ['ppt', 'image-first', 'director-review', 'repair', 'export'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Director image repair export proof',
      goal: '验证 visual director review 到 image repair 再到 export 的自主续跑',
    });

    for (const route of [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'author_image_pages',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const restoreDirectorVariant = withEnv({
      REDCUBE_MOCK_PPT_DIRECTOR_REVIEW_VARIANT: 'block_author_image_pages_until_repair',
    });
    try {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'visual_director_review',
        stopAfterStage: 'export_pptx',
      });

      assert.equal(result.ok, true);
      assert.equal(result.summary.requested_route, 'visual_director_review');
      assert.equal(result.summary.executed_route, 'export_pptx');
      assert.deepEqual(result.summary.continued_route_sequence, [
        'repair_image_pages',
        'visual_director_review',
        'screenshot_review',
        'export_pptx',
      ]);
      assert.deepEqual(
        result.continuation_route_runs.map((entry) => entry.route),
        ['repair_image_pages', 'visual_director_review', 'screenshot_review', 'export_pptx'],
      );
      assert.equal(result.artifact?.export_bundle?.delivery_state?.current, 'output_ready');

      const repairArtifact = readStageArtifact(workspaceRoot, 'topic-a', 'deck-a', 'repair_image_pages');
      assert.equal(repairArtifact.repair_image_pages?.source_review_stage, 'visual_director_review');
      assert.deepEqual(repairArtifact.repair_image_pages?.blocked_slide_ids, ['S01']);
    } finally {
      restoreDirectorVariant();
    }
  });
});

test('runDeliverableRoute can repair native PPT directly from visual director preflight block before export', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-director-native-repair-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Director native repair export proof',
      brief: '验证 native PPT visual director 阻断后先补截图质控，再回修并继续导出。',
      keywords: ['ppt', 'native', 'director-review', 'screenshot-review', 'repair', 'export'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-native',
      title: 'Director native repair export proof',
      goal: '验证 visual director review 到 native repair 再到 export 的自主续跑',
    });

    for (const route of [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'author_pptx_native',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-native',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const restoreDirectorVariant = withEnv({
      REDCUBE_MOCK_PPT_DIRECTOR_REVIEW_VARIANT: 'block_author_pptx_native_until_repair',
    });
    try {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-native',
        route: 'visual_director_review',
        stopAfterStage: 'export_pptx',
      });

      assert.equal(result.ok, true);
      assert.equal(result.summary.requested_route, 'visual_director_review');
      assert.equal(result.summary.executed_route, 'export_pptx');
      assert.deepEqual(result.summary.continued_route_sequence, [
        'screenshot_review',
        'repair_pptx_native',
        'visual_director_review',
        'screenshot_review',
        'export_pptx',
      ]);
      assert.deepEqual(
        result.continuation_route_runs.map((entry) => entry.route),
        ['screenshot_review', 'repair_pptx_native', 'visual_director_review', 'screenshot_review', 'export_pptx'],
      );
      assert.equal(result.artifact?.export_bundle?.delivery_state?.current, 'output_ready');
      assert.equal(result.artifact?.export_bundle?.source_visual_route, 'repair_pptx_native');

      const repairArtifact = readStageArtifact(workspaceRoot, 'topic-a', 'deck-native', 'repair_pptx_native');
      assert.equal(repairArtifact.native_ppt_repair_log?.consumed_review_stage, 'screenshot_review');
      assert.equal(repairArtifact.native_ppt_bundle?.source_visual_route, 'repair_pptx_native');
    } finally {
      restoreDirectorVariant();
    }
  });
});

test('runDeliverableRoute reports repeated ppt screenshot blocks after image repair instead of earlier visual pass', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-repeated-image-review-block-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Repeated image review block proof',
      brief: '验证 image-first 截图质控回修后仍阻断时不会把中间 visual pass 当作导出成功。',
      keywords: ['ppt', 'image-first', 'screenshot-review', 'quality-blocked'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Repeated image review block proof',
      goal: '验证 repeated screenshot block 的终态语义',
    });

    for (const route of [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'author_image_pages',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const restoreBlockedReview = withEnv({
      REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'force_block',
    });
    try {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'visual_director_review',
        stopAfterStage: 'export_pptx',
      });

      assert.equal(result.ok, false);
      assert.equal(result.error_kind, 'quality_blocked');
      assert.equal(result.recommended_action, 'run_recommended_repair');
      assert.equal(result.summary.requested_route, 'visual_director_review');
      assert.equal(result.summary.executed_route, 'screenshot_review');
      assert.equal(result.summary.stop_after_stage, 'export_pptx');
      assert.deepEqual(result.summary.continued_route_sequence, [
        'screenshot_review',
        'repair_image_pages',
        'visual_director_review',
        'screenshot_review',
      ]);
      assert.deepEqual(
        result.continuation_route_runs.map((entry) => entry.route),
        ['screenshot_review', 'repair_image_pages', 'visual_director_review', 'screenshot_review'],
      );
      assert.equal(result.artifact, null);
      assert.match(result.run.error.message, /Route screenshot_review blocked/);
    } finally {
      restoreBlockedReview();
    }
  });
});

test('runDeliverableRoute fails closed when repeated ppt fix_html review blocks cannot escalate to retired Hermes loop', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-route-escalation-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Route escalation proof',
      brief: '验证 fix_html 复审仍阻断且 Hermes loop 已退役时保持 fail-closed。',
      keywords: ['ppt', 'fix_html', 'agent_loop'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_peer',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Route escalation proof',
      goal: '验证 route escalation',
    });

    for (const route of [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
    ]) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
    }

    const restoreVariants = withEnv({
      REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT: 'force_block',
      REDCUBE_MOCK_PPT_RENDER_VARIANT: 'require_targeted_revision_rerender',
    });
    try {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'fix_html',
      });

      assert.equal(result.summary.requested_route, 'fix_html');
      assert.equal(result.summary.executed_route, 'screenshot_review');
      assert.equal(result.summary.stop_after_stage, 'screenshot_review');
      assert.equal(result.execution_proof?.proof_kind, 'fix_html_agentic_escalation');
      assert.equal(result.execution_proof?.escalation_status, 'escalation_unavailable');
      assert.deepEqual(
        result.execution_proof?.attempts.map((attempt) => [attempt.executor_backend, attempt.execution_shape]),
        [
          ['codex_cli', 'structured_call'],
        ],
      );
      assert.deepEqual(
        result.execution_proof?.attempts.map((attempt) => attempt.review_requires_fix_html),
        [true],
      );

      const reviewArtifact = readStageArtifact(workspaceRoot, 'topic-a', 'deck-a', 'screenshot_review');
      assert.equal(reviewArtifact.execution_proof.escalation_status, 'escalation_unavailable');
    } finally {
      restoreVariants();
    }
  });
});
