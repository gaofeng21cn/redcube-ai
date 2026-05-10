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
} from '../../apps/redcube-cli/dist/cli.js';

const execFileAsync = promisify(execFile);
const gatewayResolve = createRequire(path.resolve('packages/redcube-gateway/package.json'));

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
  const gatewayPackagePath = path.join(consumerNodeModulesDir, 'gateway');
  const gatewayNodeModulesDir = path.join(gatewayPackagePath, 'node_modules', '@redcube');
  const runtimeProtocolPackagePath = path.join(gatewayNodeModulesDir, 'runtime-protocol');

  mkdirSync(cliDir, { recursive: true });
  mkdirSync(consumerNodeModulesDir, { recursive: true });

  const gatewaySourcePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-gateway/package.json'), 'utf-8'),
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
        '@redcube/gateway': gatewaySourcePackageJson.version,
      },
    }, null, 2),
    'utf-8',
  );

  copyPackageIntoInstall(
    path.resolve('packages/redcube-gateway'),
    gatewayPackagePath,
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-protocol'),
    runtimeProtocolPackagePath,
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime'),
    path.join(gatewayNodeModulesDir, 'runtime'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-config'),
    path.join(gatewayNodeModulesDir, 'redcube-config'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-governance'),
    path.join(gatewayNodeModulesDir, 'governance'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-reference-os'),
    path.join(gatewayNodeModulesDir, 'reference-os'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-pack-ppt'),
    path.join(gatewayNodeModulesDir, 'pack-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-pack-xiaohongshu'),
    path.join(gatewayNodeModulesDir, 'pack-xiaohongshu'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-pack-poster-onepager'),
    path.join(gatewayNodeModulesDir, 'pack-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-ppt'),
    path.join(gatewayNodeModulesDir, 'runtime-family-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-ppt'),
    path.join(gatewayPackagePath, 'node_modules', '@redcube', 'runtime-family-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-xiaohongshu'),
    path.join(gatewayNodeModulesDir, 'runtime-family-xiaohongshu'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-poster-onepager'),
    path.join(gatewayNodeModulesDir, 'runtime-family-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-poster-onepager'),
    path.join(gatewayPackagePath, 'node_modules', '@redcube', 'runtime-family-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-registry'),
    path.join(gatewayNodeModulesDir, 'runtime-family-registry'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-core'),
    path.join(gatewayNodeModulesDir, 'overlay-core'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-codex-cli-client'),
    path.join(gatewayNodeModulesDir, 'codex-cli-client'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-codex-cli-client'),
    path.join(gatewayNodeModulesDir, 'runtime', 'node_modules', '@redcube', 'codex-cli-client'),
  );
  copyPackageIntoInstall(
    path.resolve('prompts'),
    path.join(gatewayPackagePath, 'node_modules', 'prompts'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime/scripts'),
    path.join(gatewayPackagePath, 'node_modules', '@redcube', 'redcube-runtime', 'scripts'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-registry'),
    path.join(gatewayNodeModulesDir, 'overlay-registry'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-ppt'),
    path.join(gatewayNodeModulesDir, 'overlay-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-xiaohongshu'),
    path.join(gatewayNodeModulesDir, 'overlay-xiaohongshu'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-poster-onepager'),
    path.join(gatewayNodeModulesDir, 'overlay-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('contracts'),
    path.join(installRoot, 'node_modules', 'contracts'),
  );
  copyPackageIntoInstall(
    path.resolve('contracts'),
    path.join(gatewayPackagePath, 'node_modules', 'contracts'),
  );
  const oplGatewaySharedDist = gatewayResolve.resolve('opl-gateway-shared/family-orchestration');
  const oplGatewaySharedPackageRoot = path.resolve(path.dirname(oplGatewaySharedDist), '..');
  copyPackageIntoInstall(
    oplGatewaySharedPackageRoot,
    path.join(gatewayPackagePath, 'node_modules', 'opl-gateway-shared'),
  );

  return {
    cliPath: path.join(cliDir, 'cli.js'),
    gatewayPackagePath,
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

async function withMockHermesUpstreamCli(testFn) {
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

test('CLI deliverable execute, managed get, and managed supervise proxy the managed execution control plane', async () => {
  await withMockHermesUpstreamCli(async () => {
    const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-managed-'));

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
    assert.equal(executeParsed.surface_kind, 'managed_run');
    assert.equal(executeParsed.summary.status, 'stopped_after_stage');

    const managedParsed = await execCliAsync(
      cliPath,
      [
        'managed',
        'get',
        '--workspace-root',
        workspaceRoot,
        '--managed-run-id',
        executeParsed.summary.managed_run_id,
      ],
      { cwd: path.resolve('.') },
    );
    assert.equal(managedParsed.ok, true);
    assert.equal(managedParsed.surface_kind, 'managed_run_record');
    assert.equal(managedParsed.summary.managed_run_id, executeParsed.summary.managed_run_id);
    assert.equal(managedParsed.runtime_supervision.health_status, 'paused');

    const supervisedParsed = await execCliAsync(
      cliPath,
      [
        'managed',
        'supervise',
        '--workspace-root',
        workspaceRoot,
        '--managed-run-id',
        executeParsed.summary.managed_run_id,
      ],
      { cwd: path.resolve('.') },
    );
    assert.equal(supervisedParsed.ok, true);
    assert.equal(supervisedParsed.surface_kind, 'managed_supervision');
    assert.equal(supervisedParsed.summary.managed_run_id, executeParsed.summary.managed_run_id);
  });
});

test('CLI product status, product invoke, product federate, and product session proxy the product-entry service surface', async () => {
  await withMockHermesUpstreamCli(async () => {
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

    const statusParsed = await execCliAsync(
      cliPath,
      [
        'product',
        'status',
        '--workspace-root',
        workspaceRoot,
      ],
      {
        cwd: installRoot,
        env: {
          ...process.env,
          REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
        },
      },
    );
    assert.equal(statusParsed.ok, true);
    assert.equal(statusParsed.surface_kind, 'product_status');
    assert.equal(statusParsed.entry_status_surface.command, 'redcube product status');
    assert.equal(statusParsed.product_entry_manifest.entry_status_surface.command, 'redcube product status');
    assert.equal(statusParsed.family_orchestration.action_graph_ref.ref, '/family_orchestration/action_graph');
    assert.equal(statusParsed.family_orchestration.action_graph.graph_id, 'redcube_product_entry_overview_graph');
    assert.equal(statusParsed.family_orchestration.human_gates[0].gate_id, 'redcube_operator_review_gate');
    assert.equal(statusParsed.family_orchestration.resume_contract.surface_kind, 'product_entry_session');
    assert.equal(statusParsed.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(statusParsed.runtime_loop_closure.source_linkage.current_source, 'product_entry_overview');
    assert.equal(statusParsed.product_entry_readiness.surface_kind, 'product_entry_readiness');
    assert.equal(statusParsed.product_entry_readiness.verdict, 'service_surface_ready_not_managed_product');
    assert.equal(statusParsed.product_entry_readiness.usable_now, true);
    assert.equal(statusParsed.product_entry_readiness.recommended_loop_command, 'redcube product invoke');
    assert.equal(statusParsed.product_entry_preflight.surface_kind, 'product_entry_preflight');
    assert.equal(statusParsed.product_entry_preflight.ready_to_try_now, true);
    assert.equal(statusParsed.native_ppt_operator_ux.surface_kind, 'native_ppt_operator_ux');
    assert.equal(statusParsed.native_ppt_operator_ux.proof_runner.helper_command, 'redcube native-ppt proof');
    assert.equal(
      statusParsed.product_entry_preflight.recommended_check_command,
      `redcube workspace doctor --workspace-root ${workspaceRoot}`,
    );

    const preflightParsed = await execCliAsync(
      cliPath,
      [
        'product',
        'preflight',
        '--workspace-root',
        workspaceRoot,
      ],
      {
        cwd: installRoot,
        env: {
          ...process.env,
          REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
        },
      },
    );
    assert.equal(preflightParsed.ok, true);
    assert.equal(preflightParsed.surface_kind, 'product_entry_preflight');
    assert.equal(preflightParsed.workspace_locator.workspace_root, workspaceRoot);
    assert.equal(preflightParsed.ready_to_try_now, true);
    assert.equal(preflightParsed.checks.length, 4);
    assert.equal(preflightParsed.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(preflightParsed.runtime_loop_closure.source_linkage.current_source, 'preflight');

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
    assert.equal(
      directParsed.summary.resume_command,
      directParsed.runtime_loop_closure.control_policy.continue_action.command,
    );
    assert.equal(
      directParsed.summary.session_locator_field,
      directParsed.family_orchestration.resume_contract.session_locator_field,
    );
    assert.equal(
      directParsed.summary.checkpoint_locator_field,
      directParsed.family_orchestration.resume_contract.checkpoint_locator_field,
    );

    const federatedParsed = await execCliAsync(
      cliPath,
      [
        'product',
        'federate',
        '--workspace-root',
        workspaceRoot,
        '--entry-session-id',
        'session-fed',
        '--target-domain-id',
        'redcube_ai',
        '--task-intent',
        'run_managed_deliverable',
        '--entry-mode',
        'opl_gateway',
        '--return-surface-kind',
        'product_entry',
        '--overlay',
        'ppt_deck',
        '--topic-id',
        'topic-a',
        '--deliverable-id',
        'deck-fed',
        '--profile-id',
        'lecture_student',
        '--title',
        '甲状腺门诊科普 deck federated',
        '--goal',
        '验证 OPL federation',
        '--user-intent',
        '先给我主线故事',
        '--stop-after-stage',
        'storyline',
      ],
      {
        cwd: installRoot,
        env: {
          ...process.env,
          REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
        },
      },
    );
    assert.equal(federatedParsed.ok, true);
    assert.equal(federatedParsed.surface_kind, 'federated_product_entry');
    assert.equal(federatedParsed.product_entry_surface.entry_session.entry_session_id, 'session-fed');
    assert.equal(federatedParsed.family_orchestration.action_graph_ref.ref, '/family_orchestration/action_graph');
    assert.equal(federatedParsed.family_orchestration.action_graph.edges.length, 4);
    assert.equal(federatedParsed.family_orchestration.human_gates[0].gate_id, 'redcube_operator_review_gate');
    assert.equal(federatedParsed.family_orchestration.resume_contract.surface_kind, 'product_entry_session');
    assert.equal(federatedParsed.summary.latest_handle, federatedParsed.summary.target_handle);
    assert.deepEqual(federatedParsed.entry_session, federatedParsed.product_entry_surface.entry_session);
    assert.deepEqual(federatedParsed.delivery_identity, federatedParsed.product_entry_surface.delivery_identity);
    assert.deepEqual(federatedParsed.continuation_snapshot, federatedParsed.product_entry_surface.continuation_snapshot);
    assert.deepEqual(federatedParsed.review_state, federatedParsed.product_entry_surface.review_state);
    assert.deepEqual(federatedParsed.publication_projection, federatedParsed.product_entry_surface.publication_projection);
    assert.equal(
      federatedParsed.summary.approval_required,
      federatedParsed.runtime_loop_closure.control_policy.approval_required,
    );
    assert.equal(federatedParsed.summary.gate_status, federatedParsed.runtime_loop_closure.control_policy.gate_status);
    assert.equal(
      federatedParsed.summary.resume_command,
      federatedParsed.runtime_loop_closure.control_policy.continue_action.command,
    );
    assert.equal(
      federatedParsed.summary.session_locator_field,
      federatedParsed.family_orchestration.resume_contract.session_locator_field,
    );
    assert.equal(
      federatedParsed.summary.checkpoint_locator_field,
      federatedParsed.family_orchestration.resume_contract.checkpoint_locator_field,
    );
    assert.deepEqual(federatedParsed.session_continuity, federatedParsed.product_entry_surface.session_continuity);
    assert.deepEqual(federatedParsed.progress_projection, federatedParsed.product_entry_surface.progress_projection);
    assert.deepEqual(federatedParsed.artifact_inventory, federatedParsed.product_entry_surface.artifact_inventory);

    const sessionParsed = await execCliAsync(
      cliPath,
      [
        'product',
        'session',
        '--entry-session-id',
        'session-a',
      ],
      {
        cwd: installRoot,
        env: {
          ...process.env,
          REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
        },
      },
    );
    assert.equal(sessionParsed.ok, true);
    assert.equal(sessionParsed.surface_kind, 'product_entry_session');
    assert.equal(sessionParsed.entry_session.entry_session_id, 'session-a');
    assert.equal(sessionParsed.family_orchestration.action_graph_ref.ref, '/family_orchestration/action_graph');
    assert.equal(sessionParsed.family_orchestration.action_graph.exit_nodes[0], 'step:inspect_current_progress');
    assert.equal(sessionParsed.family_orchestration.human_gates[0].gate_id, 'redcube_operator_review_gate');
    assert.equal(sessionParsed.family_orchestration.resume_contract.session_locator_field, 'entry_session.entry_session_id');
    assert.equal(sessionParsed.summary.target_handle, sessionParsed.summary.latest_handle);
    assert.equal(sessionParsed.summary.approval_required, sessionParsed.runtime_loop_closure.control_policy.approval_required);
    assert.equal(sessionParsed.summary.gate_status, sessionParsed.runtime_loop_closure.control_policy.gate_status);
    assert.equal(
      sessionParsed.summary.resume_command,
      sessionParsed.runtime_loop_closure.control_policy.continue_action.command,
    );
    assert.equal(
      sessionParsed.summary.session_locator_field,
      sessionParsed.family_orchestration.resume_contract.session_locator_field,
    );
    assert.equal(
      sessionParsed.summary.checkpoint_locator_field,
      sessionParsed.family_orchestration.resume_contract.checkpoint_locator_field,
    );

    const manifestParsed = await execCliAsync(
      cliPath,
      [
        'product',
        'manifest',
        '--workspace-root',
        workspaceRoot,
      ],
      {
        cwd: installRoot,
        env: {
          ...process.env,
          REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
        },
      },
    );
    assert.equal(manifestParsed.ok, true);
    assert.equal(manifestParsed.surface_kind, 'product_entry_manifest');
    assert.equal(manifestParsed.manifest_kind, 'redcube_product_entry_manifest');
    assert.equal(manifestParsed.manifest_version, 2);
    assert.equal(manifestParsed.workspace_locator.workspace_root, workspaceRoot);
    assert.equal(manifestParsed.entry_status_surface.command, 'redcube product status');
    assert.equal(manifestParsed.product_entry_shell.direct.command, 'redcube product invoke');
    assert.equal(manifestParsed.family_orchestration.action_graph_ref.ref, '/family_orchestration/action_graph');
    assert.equal(manifestParsed.family_orchestration.action_graph.graph_id, 'redcube_product_entry_overview_graph');
    assert.equal(manifestParsed.family_orchestration.human_gates[0].gate_id, 'redcube_operator_review_gate');
    assert.equal(
      manifestParsed.family_orchestration.resume_contract.session_locator_field,
      'entry_session_contract.entry_session_id',
    );
    assert.equal(manifestParsed.product_entry_readiness.surface_kind, 'product_entry_readiness');
    assert.equal(manifestParsed.product_entry_readiness.good_to_use_now, false);
    assert.equal(manifestParsed.product_entry_readiness.recommended_start_command, 'redcube product status');
    assert.equal(manifestParsed.product_entry_start.surface_kind, 'product_entry_start');
    assert.equal(manifestParsed.product_entry_start.recommended_mode_id, 'open_status');
    assert.equal(manifestParsed.product_entry_start.modes[1].mode_id, 'start_direct_session');
    assert.equal(manifestParsed.product_entry_start.modes[2].mode_id, 'opl_bridge_handoff');
    assert.equal(manifestParsed.product_entry_start.modes[3].mode_id, 'resume_session');
    assert.equal(manifestParsed.product_entry_preflight.surface_kind, 'product_entry_preflight');
    assert.equal(manifestParsed.product_entry_preflight.ready_to_try_now, true);
    assert.equal(manifestParsed.product_entry_preflight.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(manifestParsed.native_ppt_operator_ux.surface_kind, 'native_ppt_operator_ux');
    assert.equal(manifestParsed.operator_loop_actions.run_native_ppt_proof.command, 'redcube native-ppt proof');

    const startParsed = await execCliAsync(
      cliPath,
      [
        'product',
        'start',
        '--workspace-root',
        workspaceRoot,
      ],
      {
        cwd: path.resolve('.'),
        env: {
          ...process.env,
          REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
        },
      },
    );
    assert.equal(startParsed.ok, true);
    assert.equal(startParsed.surface_kind, 'product_entry_start');
    assert.equal(startParsed.recommended_mode_id, 'open_status');
    assert.equal(startParsed.modes[0].command, `redcube product status --workspace-root ${workspaceRoot}`);
    assert.equal(startParsed.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
    assert.equal(startParsed.runtime_loop_closure.source_linkage.current_source, 'start');
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
  ], {
    gateway: {
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
});

test('CLI product sidecar export and dispatch proxy guarded RCA-owned actions', async () => {
  const taskFile = path.join(mkdtempSync(path.join(os.tmpdir(), 'redcube-sidecar-task-')), 'task.json');
  writeFileSync(
    taskFile,
    JSON.stringify({
      action: 'notification_receipt',
      notification_id: 'notice-1',
    }),
    'utf-8',
  );

  const exported = await executeCli([
    'product',
    'sidecar',
    'export',
    '--workspace-root',
    '/tmp/redcube-sidecar-workspace',
    '--format',
    'json',
  ], {
    gateway: {
      exportProductSidecar: async (request) => ({
        ok: true,
        surface_kind: 'product_sidecar_export',
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
  assert.equal(exported.surface_kind, 'product_sidecar_export');
  assert.equal(exported.request.workspace_root, '/tmp/redcube-sidecar-workspace');
  assert.equal(exported.request.format, 'json');
  assert.equal(exported.owner_boundary.hermes_owns_visual_truth, false);
  assert.equal(exported.owner_boundary.opl_owns_publication_gate, false);
  assert.equal(exported.owner_boundary.rca_owns_visual_truth, true);

  const dispatched = await executeCli([
    'product',
    'sidecar',
    'dispatch',
    '--task',
    taskFile,
    '--format',
    'json',
  ], {
    gateway: {
      dispatchProductSidecar: async (request) => ({
        ok: true,
        surface_kind: 'product_sidecar_dispatch',
        request,
        sidecar_policy: {
          writes_visual_truth: false,
          writes_review_verdict: false,
          writes_publication_gate: false,
        },
      }),
    },
  });

  assert.equal(dispatched.ok, true);
  assert.equal(dispatched.surface_kind, 'product_sidecar_dispatch');
  assert.equal(dispatched.request.task_file, taskFile);
  assert.equal(dispatched.request.format, 'json');
  assert.equal(dispatched.sidecar_policy.writes_visual_truth, false);
  assert.equal(dispatched.sidecar_policy.writes_review_verdict, false);
  assert.equal(dispatched.sidecar_policy.writes_publication_gate, false);
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
  await withMockHermesUpstreamCli(async () => {
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
    assert.equal(projection.publication.current, 'approval_pending');
    assert.equal(projection.canonical_source.kind, 'review_state.delivery_projection');
  });
});
