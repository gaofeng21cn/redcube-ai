// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import {
  cpSync,
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  realpathSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import {
  startMockCodexCli,
  withEnv,
} from '../helpers/mock-codex-cli.ts';
import {
  executeCli,
} from '../../apps/redcube-cli/dist/index.js';

const execFileAsync = promisify(execFile);
const domainEntryResolve = createRequire(path.resolve('packages/redcube-domain-entry/package.json'));
const CLI_STDIO_MAX_BUFFER = 8 * 1024 * 1024;

function copyPackageIntoInstall(sourceDir, targetDir) {
  cpSync(sourceDir, targetDir, {
    recursive: true,
    force: true,
  });
}

function createIsolatedCliInstall() {
  const installRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-isolated-'));
  const cliDir = path.join(installRoot, 'dist');
  const consumerNodeModulesDir = path.join(installRoot, 'node_modules', '@redcube');
  const domainEntryPackagePath = path.join(consumerNodeModulesDir, 'domain-entry');
  const domainEntryNodeModulesDir = path.join(domainEntryPackagePath, 'node_modules', '@redcube');
  const runtimeProtocolPackagePath = path.join(domainEntryNodeModulesDir, 'runtime-protocol');

  mkdirSync(cliDir, { recursive: true });
  mkdirSync(consumerNodeModulesDir, { recursive: true });

  const domainEntrySourcePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-domain-entry/package.json'), 'utf-8'),
  );

  copyFileSync(
    path.resolve('apps/redcube-cli/dist/cli.js'),
    path.join(cliDir, 'cli.js'),
  );
  copyFileSync(
    path.resolve('apps/redcube-cli/src/cli.ts'),
    path.join(cliDir, 'cli.ts'),
  );
  cpSync(
    path.resolve('apps/redcube-cli/dist/cli-parts'),
    path.join(cliDir, 'cli-parts'),
    {
      recursive: true,
      force: true,
    },
  );
  writeFileSync(
    path.join(installRoot, 'package.json'),
    JSON.stringify({
      name: 'redcube-cli-isolated-test',
      private: true,
      type: 'module',
      dependencies: {
        '@redcube/domain-entry': domainEntrySourcePackageJson.version,
      },
    }, null, 2),
    'utf-8',
  );

  copyPackageIntoInstall(
    path.resolve('packages/redcube-domain-entry'),
    domainEntryPackagePath,
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-protocol'),
    runtimeProtocolPackagePath,
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime'),
    path.join(domainEntryNodeModulesDir, 'runtime'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-config'),
    path.join(domainEntryNodeModulesDir, 'redcube-config'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-governance'),
    path.join(domainEntryNodeModulesDir, 'governance'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime/src/families/ppt'),
    path.join(domainEntryNodeModulesDir, 'runtime-family-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime/src/families/ppt'),
    path.join(domainEntryPackagePath, 'node_modules', '@redcube', 'runtime-family-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime/src/families/xiaohongshu'),
    path.join(domainEntryNodeModulesDir, 'runtime-family-xiaohongshu'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime/src/families/poster-onepager'),
    path.join(domainEntryNodeModulesDir, 'runtime-family-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime/src/families/poster-onepager'),
    path.join(domainEntryPackagePath, 'node_modules', '@redcube', 'runtime-family-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-core'),
    path.join(domainEntryNodeModulesDir, 'overlay-core'),
  );
  copyPackageIntoInstall(
    path.resolve('prompts'),
    path.join(domainEntryPackagePath, 'node_modules', 'prompts'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-ppt'),
    path.join(domainEntryNodeModulesDir, 'overlay-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-xiaohongshu'),
    path.join(domainEntryNodeModulesDir, 'overlay-xiaohongshu'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-poster-onepager'),
    path.join(domainEntryNodeModulesDir, 'overlay-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('contracts'),
    path.join(installRoot, 'node_modules', 'contracts'),
  );
  copyPackageIntoInstall(
    path.resolve('contracts'),
    path.join(domainEntryPackagePath, 'node_modules', 'contracts'),
  );
  const oplFrameworkSharedDist = domainEntryResolve.resolve('opl-framework-shared/family-orchestration');
  const oplFrameworkSharedPackageRoot = path.resolve(path.dirname(oplFrameworkSharedDist), '..');
  copyPackageIntoInstall(
    oplFrameworkSharedPackageRoot,
    path.join(domainEntryPackagePath, 'node_modules', 'opl-framework-shared'),
  );

  return {
    cliPath: path.join(cliDir, 'cli.js'),
    domainEntryPackagePath,
    runtimeProtocolPackagePath,
    installRoot,
  };
}

function execCliExpectFailure(cliPath, args, options) {
  try {
    execFileSync('node', [cliPath, ...args], {
      encoding: 'utf-8',
      ...options,
    });
    assert.fail('expected CLI to exit with non-zero status');
  } catch (error) {
    assert.notEqual(error.status, 0);
    assert.equal(error.stderr || '', '');

    return JSON.parse(error.stdout);
  }
}

async function execCliAsync(cliPath, args, options = {}) {
  const result = await execFileAsync('node', [cliPath, ...args], {
    encoding: 'utf-8',
    maxBuffer: CLI_STDIO_MAX_BUFFER,
    ...options,
  });
  return JSON.parse(result.stdout);
}

async function execCliExpectFailureAsync(cliPath, args, options = {}) {
  try {
    await execFileAsync('node', [cliPath, ...args], {
      encoding: 'utf-8',
      ...options,
    });
    assert.fail('expected CLI to exit with non-zero status');
  } catch (error) {
    assert.notEqual(error.code, 0);
    assert.equal(error.stderr || '', '');
    return JSON.parse(error.stdout);
  }
}

async function withMockCodexRuntimeCli(testFn) {
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

test('CLI deliverable execute returns an OPL stage execution plan instead of starting repo-local stage runner', async () => {
  await withMockCodexRuntimeCli(async () => {
    const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-stage-plan-'));

    await execCliAsync(
      cliPath,
      [
        'source',
        'research',
        '--workspace-root',
        workspaceRoot,
        '--topic-id',
        'topic-a',
        '--title',
        '甲状腺门诊科普',
        '--brief',
        '给出一份最终课堂 PPT 所需的公开信息。',
      ],
      {
        cwd: path.resolve('.'),
        env: {
          ...process.env,
          REDCUBE_SOURCE_AUGMENT_ADAPTER: 'result_file',
        },
      },
    );

    await execCliAsync(
      cliPath,
      [
        'deliverable',
        'create',
        '--workspace-root',
        workspaceRoot,
        '--overlay',
        'ppt_deck',
        '--profile-id',
        'lecture_student',
        '--topic-id',
        'topic-a',
        '--deliverable-id',
        'deck-a',
        '--title',
        '甲状腺门诊科普 deck',
        '--goal',
        '为本科生讲授甲状腺基础知识',
      ],
      { cwd: path.resolve('.') },
    );

    const executeParsed = await execCliAsync(
      cliPath,
      [
        'deliverable',
        'execute',
        '--workspace-root',
        workspaceRoot,
        '--overlay',
        'ppt_deck',
        '--topic-id',
        'topic-a',
        '--deliverable-id',
        'deck-a',
        '--user-intent',
        '给我一个最终 PPT',
        '--stop-after-stage',
        'storyline',
      ],
      { cwd: path.resolve('.') },
    );
    assert.equal(executeParsed.ok, true);
    assert.equal(executeParsed.surface_kind, 'domain_entry');
    assert.equal(executeParsed.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(executeParsed.result_surface.owner, 'one-person-lab');
    assert.equal(
      executeParsed.result_surface.execution_model.repo_local_stage_runner_active_caller,
      false,
    );
    assert.equal(executeParsed.result_surface.control_policy.requested_stop_after_stage, 'storyline');
    assert.equal(executeParsed.summary.actual_surface_kind, 'opl_stage_execution_plan');
  });
});

test('CLI product invoke and domain-handler dispatch keep RCA as handler target while retired product wrappers fail closed', async () => {
  await withMockCodexRuntimeCli(async () => {
    const { cliPath, installRoot } = createIsolatedCliInstall();
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-product-'));
    const runtimeStateRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-product-state-'));

    await execCliAsync(
      cliPath,
      [
        'source',
        'research',
        '--workspace-root',
        workspaceRoot,
        '--topic-id',
        'topic-a',
        '--title',
        '甲状腺门诊科普',
        '--brief',
        '验证 product entry 命令组。',
      ],
      {
        cwd: installRoot,
        env: {
          ...process.env,
          REDCUBE_SOURCE_AUGMENT_ADAPTER: 'result_file',
          REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
        },
      },
    );

    const directParsed = await execCliAsync(
      cliPath,
      [
        'product',
        'invoke',
        '--workspace-root',
        workspaceRoot,
        '--entry-session-id',
        'session-a',
        '--overlay',
        'ppt_deck',
        '--topic-id',
        'topic-a',
        '--deliverable-id',
        'deck-a',
        '--profile-id',
        'lecture_student',
        '--title',
        '甲状腺门诊科普 deck',
        '--goal',
        '为本科生讲授甲状腺基础知识',
        '--user-intent',
        '先给我主线故事',
        '--stop-after-stage',
        'storyline',
        '--native-sample-slide-count',
        '1',
      ],
      {
        cwd: installRoot,
        env: {
          ...process.env,
          REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
        },
      },
    );
    assert.equal(directParsed.ok, true);
    assert.equal(directParsed.surface_kind, 'product_entry');
    assert.equal(directParsed.entry_session.entry_session_id, 'session-a');
    assert.equal(directParsed.family_orchestration.action_graph_ref.ref, '/family_orchestration/action_graph');
    assert.equal(directParsed.family_orchestration.action_graph.nodes.length, 4);
    assert.equal(directParsed.family_orchestration.human_gates[0].gate_id, 'redcube_operator_review_gate');
    assert.equal(directParsed.family_orchestration.resume_contract.session_locator_field, 'entry_session.entry_session_id');
    assert.equal(directParsed.summary.latest_handle, directParsed.summary.target_handle);
    assert.equal(directParsed.summary.approval_required, directParsed.runtime_loop_closure.control_policy.approval_required);
    assert.equal(directParsed.summary.gate_status, directParsed.runtime_loop_closure.control_policy.gate_status);
    const hydratedContract = JSON.parse(
      readFileSync(
        path.join(workspaceRoot, 'topics/topic-a/deliverables/deck-a/contracts/hydrated-deliverable.json'),
        'utf-8',
      ),
    );
    assert.equal(hydratedContract.delivery_request.constraints.native_visual_sample, true);
    assert.equal(hydratedContract.delivery_request.constraints.expected_slide_count, 1);

    const domainHandlerTaskFile = path.join(runtimeStateRoot, 'opl-hosted-domain-handler-task.json');
    writeFileSync(
      domainHandlerTaskFile,
      JSON.stringify({
        action: 'notification_receipt',
        workspace_locator: {
          workspace_root: workspaceRoot,
        },
        notification_id: 'notice-oplHosted',
      }),
      'utf-8',
    );

    const domainHandlerDispatch = await execCliAsync(
      cliPath,
      [
        'domain-handler',
        'dispatch',
        '--task',
        domainHandlerTaskFile,
        '--format',
        'json',
      ],
      {
        cwd: installRoot,
        env: {
          ...process.env,
          REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
        },
      },
    );
    assert.equal(domainHandlerDispatch.ok, true);
    assert.equal(domainHandlerDispatch.surface_kind, 'product_domain_handler_dispatch');
    assert.equal(domainHandlerDispatch.handler_id, 'redcube_product_domain_handler.v1');
    assert.equal(domainHandlerDispatch.wrapped_dispatch_surface_kind, 'domain_action_adapter_dispatch');
    assert.equal(domainHandlerDispatch.repo_local_legacy_product_domain_action_adapter_command_available, false);
    assert.equal(domainHandlerDispatch.compatibility_alias_allowed, false);
    assert.equal(domainHandlerDispatch.action, 'notification_receipt');

    const resultSurface = domainHandlerDispatch.result_surface;
    assert.equal(resultSurface.ok, true);
    assert.equal(resultSurface.surface_kind, 'notification_receipt');
    assert.equal(resultSurface.notification_id, 'notice-oplHosted');
    assert.equal(resultSurface.receipt_status, 'accepted');

    for (const args of [
      ['product', 'status', '--workspace-root', workspaceRoot],
      ['product', 'preflight', '--workspace-root', workspaceRoot],
      ['product', 'start', '--workspace-root', workspaceRoot],
      ['product', 'session', '--entry-session-id', 'session-a'],
      ['product', 'manifest', '--workspace-root', workspaceRoot],
      ['product', 'domain_action_adapter', 'export', '--workspace-root', workspaceRoot, '--format', 'json'],
      ['product', 'domain_action_adapter', 'dispatch', '--task', domainHandlerTaskFile, '--format', 'json'],
    ]) {
      const failure = execCliExpectFailure(cliPath, args, {
        cwd: installRoot,
        env: {
          ...process.env,
          REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
        },
      });
      assert.equal(failure.ok, false);
      assert.equal(failure.error_kind, 'cli_usage_error');
      assert.match(failure.error, /generated\/default wrapper 由 OPL 持有|product 命令仅保留 invoke/);
    }
  });
});

test('CLI native-ppt proof proxies the controlled product-entry helper surface', async () => {
  const proof = await executeCli([
    'native-ppt',
    'proof',
    '--workspace-root',
    '/tmp/redcube-native-proof-cli',
    '--entry-session-id',
    'session-native-proof',
    '--topic-id',
    'topic-a',
    '--deliverable-id',
    'deck-a',
    '--native-sample-slide-count',
    '1',
  ], {
    domainActions: {
      runNativePptProductEntryProof: async (request) => ({
        ok: true,
        surface_kind: 'native_ppt_product_entry_proof',
        request,
      }),
    },
  });

  assert.equal(proof.ok, true);
  assert.equal(proof.surface_kind, 'native_ppt_product_entry_proof');
  assert.equal(proof.request.workspace_root, '/tmp/redcube-native-proof-cli');
  assert.equal(proof.request.entry_session_id, 'session-native-proof');
  assert.equal(proof.request.topic_id, 'topic-a');
  assert.equal(proof.request.deliverable_id, 'deck-a');
  assert.equal(proof.request.route, 'author_pptx_native');
  assert.equal(proof.request.constraints.native_visual_sample, true);
  assert.equal(proof.request.constraints.expected_slide_count, 1);
});

test('CLI domain-handler export and dispatch proxy guarded RCA-owned actions without legacy product alias', async () => {
  const taskFile = path.join(mkdtempSync(path.join(os.tmpdir(), 'redcube-domain-handler-task-')), 'task.json');
  writeFileSync(
    taskFile,
    JSON.stringify({
      action: 'notification_receipt',
      notification_id: 'notice-1',
    }),
    'utf-8',
  );
  const evidenceTaskFile = path.join(mkdtempSync(path.join(os.tmpdir(), 'redcube-domain-handler-evidence-task-')), 'task.json');
  writeFileSync(
    evidenceTaskFile,
    JSON.stringify({
      action: 'emit_no_regression_evidence',
      workspace_root: '/tmp/redcube-domain-handler-workspace',
      evidence_id: 'cli-no-regression',
    }),
    'utf-8',
  );

  const exported = await executeCli([
    'domain-handler',
    'export',
    '--workspace-root',
    '/tmp/redcube-domain-handler-workspace',
    '--format',
    'json',
  ], {
    domainActions: {
      exportDomainHandler: async (request) => ({
        ok: true,
        surface_kind: 'product_domain_handler_export',
        handler_id: 'redcube_product_domain_handler.v1',
        request,
        owner_boundary: {
          hermes_owns_visual_truth: false,
          opl_owns_publication_gate: false,
          rca_owns_visual_truth: true,
        },
      }),
    },
  });

  assert.equal(exported.ok, true);
  assert.equal(exported.surface_kind, 'product_domain_handler_export');
  assert.equal(exported.handler_id, 'redcube_product_domain_handler.v1');
  assert.equal(exported.request.workspace_root, '/tmp/redcube-domain-handler-workspace');
  assert.equal(exported.request.format, 'json');
  assert.equal(exported.owner_boundary.hermes_owns_visual_truth, false);
  assert.equal(exported.owner_boundary.opl_owns_publication_gate, false);
  assert.equal(exported.owner_boundary.rca_owns_visual_truth, true);

  const dispatched = await executeCli([
    'domain-handler',
    'dispatch',
    '--task',
    taskFile,
    '--format',
    'json',
  ], {
    domainActions: {
      dispatchDomainHandler: async (request) => ({
        ok: true,
        surface_kind: 'product_domain_handler_dispatch',
        request,
        domain_action_adapter_policy: {
          writes_visual_truth: false,
          writes_review_verdict: false,
          writes_publication_gate: false,
        },
      }),
    },
  });

  assert.equal(dispatched.ok, true);
  assert.equal(dispatched.surface_kind, 'product_domain_handler_dispatch');
  assert.equal(dispatched.request.task_file, taskFile);
  assert.equal(dispatched.request.format, 'json');
  assert.equal(dispatched.domain_action_adapter_policy.writes_visual_truth, false);
  assert.equal(dispatched.domain_action_adapter_policy.writes_review_verdict, false);
  assert.equal(dispatched.domain_action_adapter_policy.writes_publication_gate, false);

  const evidenceDispatched = await executeCli([
    'domain-handler',
    'dispatch',
    '--task',
    evidenceTaskFile,
    '--format',
    'json',
  ], {
    domainActions: {
      dispatchDomainHandler: async (request) => ({
        ok: true,
        surface_kind: 'product_domain_handler_dispatch',
        request,
        result_surface: {
          surface_kind: 'no_regression_evidence',
          evidence_ref: 'rca-no-regression:visual-stage:cli-no-regression',
        },
      }),
    },
  });

  assert.equal(evidenceDispatched.ok, true);
  assert.equal(evidenceDispatched.surface_kind, 'product_domain_handler_dispatch');
  assert.equal(evidenceDispatched.request.task_file, evidenceTaskFile);
  assert.equal(evidenceDispatched.result_surface.surface_kind, 'no_regression_evidence');
  assert.equal(evidenceDispatched.result_surface.evidence_ref, 'rca-no-regression:visual-stage:cli-no-regression');
});

test('CLI domain-handler export passes workspace receipt scaleout roots as refs-only read input', async () => {
  const domainActions = {
    exportDomainHandler: async (request) => ({
      ok: true,
      surface_kind: 'product_domain_handler_export',
      request,
    }),
  };

  const result = await executeCli([
    'domain-handler',
    'export',
    '--workspace-root',
    '/tmp/redcube-scaleout-a',
    '--workspace-receipt-scaleout-root',
    '/tmp/redcube-scaleout-b,/tmp/redcube-scaleout-c',
  ], { domainActions });

  assert.equal(result.ok, true);
  assert.equal(result.surface_kind, 'product_domain_handler_export');
  assert.deepEqual(result.request.workspace_receipt_scaleout_roots, [
    '/tmp/redcube-scaleout-b',
    '/tmp/redcube-scaleout-c',
  ]);
  assert.equal(result.request.workspace_receipt_scaleout_claimed, undefined);
  assert.equal(result.request.declares_production_soak_complete, undefined);
});

test('CLI image-ppt proof runs repo-owned lightweight mock runner by default', async () => {
  const outputDir = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-image-ppt-proof-'));
  const proof = await executeCli([
    'image-ppt',
    'proof',
    '--output-dir',
    outputDir,
    '--skip-system-deps',
  ]);

  assert.equal(proof.ok, true);
  assert.equal(proof.surface_kind, 'image_ppt_product_entry_proof');
  assert.equal(proof.command, 'redcube image-ppt proof');
  assert.equal(proof.image_generation_mode, 'mock');
  assert.equal(proof.live_mode_requires_explicit_flag, true);
  assert.equal(proof.mock_mode_calls_api, false);
  assert.match(proof.artifact_index_file, /artifact-index\.json$/);
});

test('CLI review get and mutate proxy review platform actions', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-review-'));

  execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
      'deliverable',
      'create',
      '--workspace-root', workspaceRoot,
      '--overlay', 'ppt_deck',
      '--profile-id', 'lecture_student',
      '--topic-id', 'topic-a',
      '--deliverable-id', 'deck-a',
      '--title', '肠癌 AI 讲课 deck',
      '--goal', '给学生讲清肠癌 AI 的问题、方法与边界',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const getOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
      'review',
      'get',
      '--workspace-root', workspaceRoot,
      '--topic-id', 'topic-a',
      '--deliverable-id', 'deck-a',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  const getParsed = JSON.parse(getOutput);
  assert.equal(getParsed.ok, true);
  assert.equal(getParsed.surface_kind, 'review_state');
  assert.equal(getParsed.state_type, 'canonical');
  assert.equal(getParsed.canonical_source.kind, 'review_state.publish_state');
  assert.equal(getParsed.state.deliverable_id, 'deck-a');
  assert.equal(getParsed.quality_summary?.relative_quality_verdict, null);
  assert.equal(getParsed.quality_summary?.baseline_promotion_state, null);

  const mutateOutput = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
      'review',
      'mutate',
      '--workspace-root', workspaceRoot,
      '--topic-id', 'topic-a',
      '--deliverable-id', 'deck-a',
      '--type', 'bind_baseline',
      '--baseline-deliverable-id', 'deck-v1',
      '--actor', 'agent',
      '--notes', 'bind baseline',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  const mutateParsed = JSON.parse(mutateOutput);
  assert.equal(mutateParsed.ok, true);
  assert.equal(mutateParsed.state.baseline.baseline_deliverable_id, 'deck-v1');
});

test('CLI review projection proxies topic publication projection read path', async () => {
  await withMockCodexRuntimeCli(async () => {
    const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-review-projection-'));

    const createOutput = await execCliAsync(
      cliPath,
      [
        'deliverable',
        'create',
        '--workspace-root', workspaceRoot,
        '--overlay', 'xiaohongshu',
        '--profile-id', 'standard_note',
        '--topic-id', 'topic-a',
        '--deliverable-id', 'note-a',
        '--title', '甲状腺门诊小红书科普',
        '--goal', '为门诊患者生成可发布的科普图文',
      ],
      { cwd: path.resolve('.') },
    );
    assert.equal(createOutput.ok, true);

    for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
      const output = await execCliAsync(
        cliPath,
        [
          'deliverable',
          'run',
          '--workspace-root', workspaceRoot,
          '--overlay', 'xiaohongshu',
          '--topic-id', 'topic-a',
          '--deliverable-id', 'note-a',
          '--route', route,
        ],
        { cwd: path.resolve('.') },
      );
      assert.equal(output.ok, true, route);
    }

    const projection = await execCliAsync(
      cliPath,
      [
        'review',
        'projection',
        '--workspace-root', workspaceRoot,
        '--topic-id', 'topic-a',
      ],
      { cwd: path.resolve('.') },
    );

    assert.equal(projection.ok, true);
    assert.equal(projection.surface_kind, 'publication_projection');
    assert.equal(projection.state_type, 'projection');
    assert.equal(projection.publication.current, 'draft');
    assert.equal(projection.canonical_source.kind, 'review_state.delivery_projection');
  });
});
