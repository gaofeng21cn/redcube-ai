// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, utimesSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

import {
  createDeliverable,
  runDeliverableRoute,
} from './gateway-test-api.ts';
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
const MOCK_HERMES_AGENT_LOOP_BRIDGE_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-hermes-agent-loop-bridge.ts', import.meta.url)),
]);

async function withMockHermesUpstream(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_HERMES_AGENT_LOOP_BRIDGE_COMMAND: MOCK_HERMES_AGENT_LOOP_BRIDGE_COMMAND,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

async function startMockHermesAgentApiServer() {
  let runCounter = 0;
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const bodyText = Buffer.concat(chunks).toString('utf-8');
    const body = bodyText ? JSON.parse(bodyText) : {};
    response.setHeader('content-type', 'application/json');

    if (request.method === 'POST' && request.url === '/v1/runs') {
      runCounter += 1;
      const input = body.input || {};
      response.end(JSON.stringify({
        provider: 'mock-hermes-provider',
        model: 'server-selected-agent-loop-model',
        session_id: 'mock-hermes-session',
        run_id: `mock-hermes-run-${runCounter}`,
        output: {
          payload: buildMockCreativeOutput({
            family: input.family,
            route: input.route,
            context: input.context,
          }),
        },
      }));
      return;
    }

    if (request.method === 'GET' && /^\/v1\/runs\/[^/]+\/events$/.test(String(request.url || ''))) {
      response.end(JSON.stringify({
        events: [
          { type: 'run.started' },
          { type: 'tool.used', tool: 'read_file' },
          { type: 'run.completed' },
        ],
      }));
      return;
    }

    response.statusCode = 404;
    response.end(JSON.stringify({ error: 'not_found' }));
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.equal(typeof address, 'object');
  assert.notEqual(address, null);
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

async function withMockHermesAgentApi(testFn) {
  const server = await startMockHermesAgentApiServer();
  const restoreEnv = withEnv({
    REDCUBE_HERMES_AGENT_API_BASE_URL: server.baseUrl,
    REDCUBE_HERMES_AGENT_API_COMPAT_MODEL: 'caller-compat-model',
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await server.close();
  }
}

test('runDeliverableRoute auto-recovers fresh review dependencies before ppt fix_html', async () => {
  await withMockHermesUpstream(async () => withMockHermesAgentApi(async () => {
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
    }

    const renderBundleFile = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-a',
      'artifacts',
      'render_bundle.json',
    );
    const fixBundleFile = path.join(
      workspaceRoot,
      'topics',
      'topic-a',
      'deliverables',
      'deck-a',
      'artifacts',
      'fix_bundle.json',
    );
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
      assert.equal(result.execution_proof?.escalation_status, 'escalated_still_requires_fix_html');
      assert.deepEqual(result.artifact?.render_execution?.freshly_rendered_slide_ids, ['S02']);
      const fixArtifact = JSON.parse(readFileSync(fixBundleFile, 'utf-8'));
      assert.deepEqual(fixArtifact.render_execution?.freshly_rendered_slide_ids, ['S02']);
    } finally {
      restoreVariants();
    }
  }));
});

test('runDeliverableRoute continues from ppt fix_html to requested stop-after review gate', async () => {
  await withMockHermesUpstream(async () => {
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

test('runDeliverableRoute escalates repeated ppt fix_html review blocks through Hermes agent loop once', async () => {
  await withMockHermesUpstream(async () => withMockHermesAgentApi(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-route-escalation-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Route escalation proof',
      brief: '验证 fix_html 复审仍阻断时升级到 Hermes agent loop。',
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
      assert.equal(result.execution_proof?.escalation_status, 'escalated_still_requires_fix_html');
      assert.deepEqual(
        result.execution_proof?.attempts.map((attempt) => [attempt.executor_backend, attempt.execution_shape]),
        [
          ['codex_cli', 'structured_call'],
          ['hermes_agent', 'agent_loop'],
        ],
      );
      assert.deepEqual(
        result.execution_proof?.attempts.map((attempt) => attempt.review_requires_fix_html),
        [true, true],
      );

      const reviewArtifact = JSON.parse(readFileSync(path.join(
        workspaceRoot,
        'topics',
        'topic-a',
        'deliverables',
        'deck-a',
        'artifacts',
        'quality_gate.json',
      ), 'utf-8'));
      assert.equal(reviewArtifact.execution_proof.escalation_status, 'escalated_still_requires_fix_html');
    } finally {
      restoreVariants();
    }
  }));
});
