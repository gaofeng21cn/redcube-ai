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

const execFileAsync = promisify(execFile);
const domainEntryResolve = createRequire(path.resolve('packages/redcube-domain-entry/package.json'));

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
    path.resolve('packages/redcube-reference-os'),
    path.join(domainEntryNodeModulesDir, 'reference-os'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-pack-ppt'),
    path.join(domainEntryNodeModulesDir, 'pack-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-pack-xiaohongshu'),
    path.join(domainEntryNodeModulesDir, 'pack-xiaohongshu'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-pack-poster-onepager'),
    path.join(domainEntryNodeModulesDir, 'pack-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-ppt'),
    path.join(domainEntryNodeModulesDir, 'runtime-family-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-ppt'),
    path.join(domainEntryPackagePath, 'node_modules', '@redcube', 'runtime-family-ppt'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-xiaohongshu'),
    path.join(domainEntryNodeModulesDir, 'runtime-family-xiaohongshu'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-poster-onepager'),
    path.join(domainEntryNodeModulesDir, 'runtime-family-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-poster-onepager'),
    path.join(domainEntryPackagePath, 'node_modules', '@redcube', 'runtime-family-poster-onepager'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-runtime-family-registry'),
    path.join(domainEntryNodeModulesDir, 'runtime-family-registry'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-core'),
    path.join(domainEntryNodeModulesDir, 'overlay-core'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-codex-cli-client'),
    path.join(domainEntryNodeModulesDir, 'codex-cli-client'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-codex-cli-client'),
    path.join(domainEntryNodeModulesDir, 'runtime', 'node_modules', '@redcube', 'codex-cli-client'),
  );
  copyPackageIntoInstall(
    path.resolve('prompts'),
    path.join(domainEntryPackagePath, 'node_modules', 'prompts'),
  );
  copyPackageIntoInstall(
    path.resolve('packages/redcube-overlay-registry'),
    path.join(domainEntryNodeModulesDir, 'overlay-registry'),
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

test('CLI workspace doctor proxies domain entry doctorWorkspace', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-'));
  writeFileSync(path.join(workspaceRoot, 'redcube.workspace.json'), JSON.stringify({ overlay: 'xiaohongshu' }), 'utf-8');

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'workspace', 'doctor', '--workspace-root', workspaceRoot],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'workspace_doctor');
  assert.equal(parsed.recommended_action, 'continue');
  assert.equal(parsed.summary.workspace_file_exists, true);
  assert.equal(parsed.workspaceFileExists, true);
});

test('CLI workspace doctor works from isolated install without monorepo sibling source packages', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-isolated-'));
  writeFileSync(
    path.join(workspaceRoot, 'redcube.workspace.json'),
    JSON.stringify({ overlay: 'xiaohongshu' }),
    'utf-8',
  );

  const output = execFileSync(
    'node',
    [cliPath, 'workspace', 'doctor', '--workspace-root', workspaceRoot],
    { encoding: 'utf-8', cwd: installRoot },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'workspace_doctor');
  assert.equal(parsed.recommended_action, 'continue');
  assert.equal(parsed.workspaceRoot, workspaceRoot);
  assert.equal(parsed.workspaceFileExists, true);
});

test('CLI isolated install returns CLI JSON for unknown commands', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();

  const parsed = execCliExpectFailure(
    cliPath,
    ['foo'],
    { cwd: installRoot },
  );

  assert.deepEqual(parsed, {
    ok: false,
    error_kind: 'cli_usage_error',
    recommended_action: 'read_help',
    error: '未知命令: foo',
  });
});

test('CLI product invalid subcommand keeps the OPL-hosted stage runtime handoff out of public usage hints', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();

  const parsed = execCliExpectFailure(
    cliPath,
    ['product', 'bad-subcommand'],
    { cwd: installRoot },
  );

  assert.equal(parsed.ok, false);
  assert.equal(parsed.error_kind, 'cli_usage_error');
  assert.match(parsed.error, /仅保留 invoke domain handler target/);
  assert.match(parsed.error, /generated\/default wrapper 由 OPL 持有/);
  assert.equal(parsed.error.includes('federate'), false);
});

test('CLI help exposes task-oriented onboarding surface', () => {
  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'help'],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.match(parsed.whatIsRedCube, /PPT deck/);
  assert.match(parsed.whatIsRedCube, /小红书图文/);
  assert.match(parsed.whatIsRedCube, /单页知识海报/);
  assert.equal(parsed.usage.deliverableCreate.includes('<ppt_deck|xiaohongshu>'), false);
  assert.equal(parsed.discovery.profileList, 'redcube profile --action list');
  assert.deepEqual(
    parsed.availableOverlays.map((overlay) => overlay.overlay_id),
    ['ppt_deck', 'xiaohongshu', 'poster_onepager'],
  );
  assert.equal(Array.isArray(parsed.commonTasks), true);
  assert.equal(parsed.commonTasks.length >= 4, true);
  assert.equal(parsed.commonTasks.some((item) => item.command === 'npm run rca -- foundry status --json'), true);
  assert.equal(parsed.commonTasks.some((item) => item.command === 'redcube status'), true);
  assert.equal(parsed.commonTasks.some((item) => item.command === 'redcube deck inspect'), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('review get')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('review projection')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('review watch')), false);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('source research')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('deliverable run')), true);
  assert.equal(parsed.commonTasks.some((item) => item.command.includes('product invoke')), true);
  assert.deepEqual(parsed.commonFlows.ppt_deck, [
    '1. redcube workspace doctor --workspace-root <dir>',
    '2. redcube source research --workspace-root <dir> --topic-id <id> ...',
    '3. redcube deliverable create --workspace-root <dir> --overlay ppt_deck --profile-id lecture_student ...',
    '4. redcube deliverable audit --workspace-root <dir> --overlay ppt_deck --mode draft_new ...',
    '5. redcube deliverable run --workspace-root <dir> --overlay ppt_deck --route <stage> ...',
  ]);
  assert.equal(parsed.commandGroups.source.includes('research'), true);
  assert.equal(parsed.commandGroups.deliverable.includes('create'), true);
  assert.deepEqual(parsed.commandGroups.foundry, ['status', 'inspect', 'interfaces', 'validate', 'doctor', 'peers']);
  assert.deepEqual(parsed.commandGroups.work, ['status', 'inspect', 'interfaces', 'validate', 'doctor', 'peers']);
  assert.deepEqual(parsed.commandGroups.deck, ['status', 'inspect', 'interfaces', 'validate', 'doctor', 'peers']);
  assert.equal(parsed.commandGroups.managed, undefined);
  assert.equal(parsed.commandGroups.product.includes('invoke'), true);
  assert.equal(parsed.commandGroups.product.includes('session'), false);
  assert.equal(parsed.commandGroups.review.includes('projection'), true);
  assert.equal(parsed.whereToReadNext.humanQuickstart, 'human_doc:human_quickstart');
  assert.equal(parsed.whereToReadNext.deliverableExamples, 'human_doc:deliverable_examples');
  assert.equal(parsed.whereToReadNext.runtimeArchitecture, 'human_doc:runtime_architecture');
  assert.equal(
    Object.values(parsed.whereToReadNext).every((surface) => typeof surface === 'string' && surface.startsWith('human_doc:')),
    true,
  );
  assert.equal(typeof parsed.usage.deliverableCreate, 'string');
  assert.equal(parsed.usage.rcaNpmAlias, 'npm run rca -- foundry status --json');
  assert.equal(typeof parsed.usage.sourceResearch, 'string');
  assert.match(parsed.usage.reviewMutate, /promote_baseline/);
});

test('CLI exposes OPL Foundry Agent series first-layer grammar and work/deck alias', () => {
  const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');
  const cases = [
    {
      args: ['status'],
      operation: 'status',
      command: 'redcube status',
      surfaceKind: 'rca_foundry_agent_status',
    },
    {
      args: ['foundry', 'status'],
      operation: 'status',
      command: 'redcube foundry status',
      surfaceKind: 'rca_foundry_agent_status',
    },
    {
      args: ['interfaces'],
      operation: 'interfaces',
      command: 'redcube interfaces',
      surfaceKind: 'rca_foundry_agent_interfaces',
    },
    {
      args: ['validate'],
      operation: 'validate',
      command: 'redcube validate',
      surfaceKind: 'rca_foundry_agent_validate',
    },
    {
      args: ['doctor'],
      operation: 'doctor',
      command: 'redcube doctor',
      surfaceKind: 'rca_foundry_agent_doctor',
    },
    {
      args: ['peers'],
      operation: 'peers',
      command: 'redcube peers',
      surfaceKind: 'rca_foundry_agent_peers',
    },
    {
      args: ['work'],
      operation: 'inspect',
      command: 'redcube work inspect',
      surfaceKind: 'rca_foundry_agent_inspect',
      scopeAlias: 'work',
    },
    {
      args: ['deck', 'inspect'],
      operation: 'inspect',
      command: 'redcube deck inspect',
      surfaceKind: 'rca_foundry_agent_inspect',
      scopeAlias: 'deck',
    },
  ];

  for (const item of cases) {
    const output = execFileSync('node', [cliPath, ...item.args], {
      encoding: 'utf-8',
      cwd: path.resolve('.'),
    });
    const parsed = JSON.parse(output);
    assert.equal(parsed.ok, true, item.command);
    assert.equal(parsed.surface_kind, item.surfaceKind, item.command);
    assert.equal(parsed.operation, item.operation, item.command);
    assert.equal(parsed.command, item.command, item.command);
    assert.equal(parsed.foundry_agent_series.series_label, 'OPL Foundry Agent', item.command);
    assert.equal(parsed.foundry_agent_series.direct_command_surface, 'redcube', item.command);
    assert.equal(parsed.foundry_agent_series.repo_native_script_alias, 'rca', item.command);
    assert.equal(parsed.foundry_agent_series.canonical_opl_command_surface, 'opl agents foundry', item.command);
    assert.deepEqual(
      parsed.foundry_agent_series.operations,
      ['status', 'inspect', 'interfaces', 'validate', 'doctor', 'peers'],
      item.command,
    );
    assert.deepEqual(
      parsed.foundry_agent_series.ordinary_command_spine.map((entry) => entry.object),
      ['workspace', 'work', 'stage', 'run', 'vault', 'handoff', 'connect'],
      item.command,
    );
    assert.equal(parsed.identity.domain_id, 'redcube', item.command);
    assert.equal(parsed.identity.authority_owner, 'redcube_ai', item.command);
    assert.equal(parsed.rca_series_aliases.npm_script_alias, 'npm run rca --', item.command);
    assert.equal(parsed.rca_series_aliases.npm_script_alias_maps_to, 'npm run redcube --', item.command);
    assert.equal(parsed.rca_series_aliases.deck_alias_maps_to, 'work', item.command);
    assert.equal(parsed.authority_boundary.generated_surface_can_write_domain_truth, false, item.command);
    assert.equal(parsed.authority_boundary.generated_surface_can_create_owner_receipt, false, item.command);
    if (item.scopeAlias) {
      assert.equal(parsed.scope.object, 'work', item.command);
      assert.equal(parsed.scope.alias, item.scopeAlias, item.command);
    }
  }
});

test('CLI Foundry commands accept --json as --format json alias', () => {
  const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');

  for (const operation of ['status', 'interfaces', 'validate', 'doctor', 'inspect', 'peers']) {
    const output = execFileSync('node', [cliPath, 'foundry', operation, '--json'], {
      encoding: 'utf-8',
      cwd: path.resolve('.'),
    });
    const parsed = JSON.parse(output);

    assert.equal(parsed.ok, true, operation);
    assert.equal(parsed.operation, operation, operation);
    assert.equal(parsed.scope.namespace, 'foundry', operation);
    assert.equal(parsed.scope.output_format, 'json', operation);
    assert.equal(parsed.scope.json_alias, '--json', operation);
  }

  const redcubeValidate = JSON.parse(execFileSync('node', [cliPath, 'validate', '--json'], {
    encoding: 'utf-8',
    cwd: path.resolve('.'),
  }));
  assert.equal(redcubeValidate.scope.output_format, 'json');
  assert.equal(redcubeValidate.scope.json_alias, '--json');
});

test('RCA npm script aliases the existing RedCube CLI', () => {
  const help = JSON.parse(execFileSync('npm', ['run', '--silent', 'rca', '--', '--help'], {
    encoding: 'utf-8',
    cwd: path.resolve('.'),
  }));
  assert.equal(help.ok, true);
  assert.equal(help.usage.rcaNpmAlias, 'npm run rca -- foundry status --json');

  const status = JSON.parse(execFileSync('npm', ['run', '--silent', 'rca', '--', 'foundry', 'status', '--json'], {
    encoding: 'utf-8',
    cwd: path.resolve('.'),
  }));
  assert.equal(status.ok, true);
  assert.equal(status.command, 'redcube foundry status');
  assert.equal(status.scope.output_format, 'json');
  assert.equal(status.foundry_agent_series.direct_command_surface, 'redcube');
  assert.equal(status.foundry_agent_series.repo_native_script_alias, 'rca');
});

test('CLI Foundry series grammar works from isolated install', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();

  const output = execFileSync(
    'node',
    [cliPath, 'deck', 'doctor'],
    { encoding: 'utf-8', cwd: installRoot },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'rca_foundry_agent_doctor');
  assert.equal(parsed.command, 'redcube deck doctor');
  assert.equal(parsed.scope.object, 'work');
  assert.equal(parsed.scope.alias, 'deck');
  assert.equal(parsed.foundry_agent_series.refs.rca_domain_contract_ref, 'contracts/foundry_agent_series.json');
  assert.equal(parsed.checks.some((entry) => entry.check_id === 'cli:work-deck-alias' && entry.status === 'pass'), true);
});


test('CLI subcommand --help returns machine-readable command help without executing the route', () => {
  const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');
  const expectedRoute = [
    'workspace doctor',
    'source intake / source research',
    'deliverable create',
    'deliverable audit',
    'deliverable run',
  ];
  const cases = [
    {
      args: ['status', '--help'],
      command: 'status',
      actionRef: 'buildFoundrySeriesSurface',
      usageIncludes: 'redcube status',
    },
    {
      args: ['foundry', 'interfaces', '--help'],
      command: 'foundry interfaces',
      actionRef: 'buildFoundrySeriesSurface',
      usageIncludes: 'redcube foundry interfaces',
    },
    {
      args: ['deck', 'inspect', '--help'],
      command: 'deck inspect',
      actionRef: 'buildFoundrySeriesSurface',
      usageIncludes: 'redcube deck inspect',
    },
    {
      args: ['workspace', 'doctor', '--help'],
      command: 'workspace doctor',
      actionRef: 'doctorWorkspace',
      usageIncludes: '--workspace-root <dir>',
    },
    {
      args: ['source', 'intake', '--help'],
      command: 'source intake',
      actionRef: 'intakeSource',
      usageIncludes: '--topic-id <id>',
    },
    {
      args: ['source', 'research', '--help'],
      command: 'source research',
      actionRef: 'researchSource',
      usageIncludes: '--payload-file /abs/result.json',
    },
    {
      args: ['deliverable', 'create', '--help'],
      command: 'deliverable create',
      actionRef: 'createDeliverable',
      usageIncludes: '--deliverable-id <id>',
    },
    {
      args: ['deliverable', 'audit', '--help'],
      command: 'deliverable audit',
      actionRef: 'auditDeliverable',
      usageIncludes: '--mode <draft_new|optimize_existing>',
    },
    {
      args: ['deliverable', 'run', '--help'],
      command: 'deliverable run',
      actionRef: 'invokeDomainEntry',
      usageIncludes: '--route <stage>',
    },
  ];

  for (const item of cases) {
    const output = execFileSync('node', [cliPath, ...item.args], {
      encoding: 'utf-8',
      cwd: path.resolve('.'),
    });
    const parsed = JSON.parse(output);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.surface_kind, 'command_help');
    assert.equal(parsed.command, item.command);
    assert.equal(parsed.action_ref, item.actionRef);
    assert.equal(parsed.usage.includes(item.usageIncludes), true);
    if (item.actionRef === 'buildFoundrySeriesSurface') {
      assert.equal(parsed.boundary_fields.includes('foundry_agent_series') || parsed.boundary_fields.includes('scope'), true);
    } else {
      assert.deepEqual(parsed.canonical_operator_route, expectedRoute);
    }
  }

  const retiredWatchHelp = execCliExpectFailure(cliPath, ['review', 'watch', '--help']);
  assert.equal(retiredWatchHelp.ok, false);
  assert.equal(retiredWatchHelp.error_kind, 'cli_usage_error');
  assert.match(retiredWatchHelp.error, /runtimeWatch default wrapper 由 OPL status\/workbench\/read-model caller 持有/);
});

test('CLI profile list exposes registry-driven overlay catalog from isolated install', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();

  const output = execFileSync(
    'node',
    [cliPath, 'profile', '--action', 'list'],
    { encoding: 'utf-8', cwd: installRoot },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'overlay_catalog');
  assert.equal(parsed.recommended_action, 'create_deliverable');
  assert.equal(parsed.summary.total_overlays, 3);
  assert.deepEqual(
    parsed.overlays.map((overlay) => overlay.overlay_id),
    ['ppt_deck', 'xiaohongshu', 'poster_onepager'],
  );
  assert.deepEqual(
    parsed.overlays.find((overlay) => overlay.overlay_id === 'ppt_deck')?.profiles,
    ['lecture_student', 'lecture_peer', 'executive_briefing', 'defense_deck'],
  );
  assert.deepEqual(
    parsed.overlays.find((overlay) => overlay.overlay_id === 'poster_onepager')?.profiles,
    ['knowledge_poster'],
  );
});

test('CLI isolated install fixture keeps package realpaths inside temp install and consumer only depends on domain entry', () => {
  const {
    domainEntryPackagePath,
    installRoot,
    runtimeProtocolPackagePath,
  } = createIsolatedCliInstall();
  const packageJson = JSON.parse(
    readFileSync(path.join(installRoot, 'package.json'), 'utf-8'),
  );
  const installRootRealpath = realpathSync(installRoot);
  const domainEntrySourcePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-domain-entry/package.json'), 'utf-8'),
  );

  assert.deepEqual(packageJson.dependencies, {
    '@redcube/domain-entry': domainEntrySourcePackageJson.version,
  });
  assert.equal(realpathSync(domainEntryPackagePath).startsWith(installRootRealpath), true);
  assert.equal(realpathSync(runtimeProtocolPackagePath).startsWith(installRootRealpath), true);
});

test('CLI topics list proxies domain entry listTopics', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-'));
  const topicDir = path.join(workspaceRoot, 'topics', 'topic-a');
  mkdirSync(topicDir, { recursive: true });
  writeFileSync(path.join(topicDir, 'topic.json'), JSON.stringify({
    topic_id: 'topic-a',
    status: 'draft',
    overlay: 'xiaohongshu',
  }), 'utf-8');

  const output = execFileSync(
    'node',
    [path.resolve('apps/redcube-cli/dist/cli.js'), 'topics', 'list', '--workspace-root', workspaceRoot],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'topic_catalog');
  assert.equal(parsed.recommended_action, 'continue');
  assert.equal(parsed.summary.total_topics, 1);
  assert.equal(parsed.total, 1);
  assert.equal(parsed.topics[0].topic_id, 'topic-a');
});

test('CLI deliverable create proxies domain entry createDeliverable', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-deliverable-'));

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
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
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.deliverable.overlay, 'ppt_deck');
  assert.equal(parsed.deliverable.profile_id, 'lecture_student');
  assert.equal(parsed.deliverable.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
});

test('CLI deliverable get returns operator-facing deliverable record surface', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-deliverable-get-'));

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
      '--title', '甲状腺门诊科普 deck',
      '--goal', '为本科生讲授甲状腺基础知识',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );

  const output = execFileSync(
    'node',
    [
      path.resolve('apps/redcube-cli/dist/cli.js'),
      'deliverable',
      'get',
      '--workspace-root', workspaceRoot,
      '--topic-id', 'topic-a',
      '--deliverable-id', 'deck-a',
    ],
    { encoding: 'utf-8', cwd: path.resolve('.') },
  );
  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.surface_kind, 'deliverable_record');
  assert.equal(parsed.recommended_action, 'audit_deliverable');
  assert.equal(parsed.summary.deliverable_id, 'deck-a');
});

test('CLI deliverable create works from isolated install without monorepo sibling source packages', () => {
  const { cliPath, installRoot } = createIsolatedCliInstall();
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-deliverable-isolated-'));

  const output = execFileSync(
    'node',
    [
      cliPath,
      'deliverable',
      'create',
      '--workspace-root',
      workspaceRoot,
      '--overlay',
      'xiaohongshu',
      '--profile-id',
      'standard_note',
      '--topic-id',
      'topic-a',
      '--deliverable-id',
      'note-a',
      '--title',
      '甲状腺门诊小红书科普',
      '--goal',
      '为门诊患者生成可发布的科普图文',
    ],
    { encoding: 'utf-8', cwd: installRoot },
  );

  const parsed = JSON.parse(output);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.deliverable.overlay, 'xiaohongshu');
  assert.equal(parsed.deliverable.profile_id, 'standard_note');
});

test('CLI deliverable run returns an OPL StageRun plan from isolated install', async () => {
  await withMockCodexRuntimeCli(async () => {
    const { cliPath, installRoot } = createIsolatedCliInstall();
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-deliverable-isolated-run-'));

    const createOutput = await execCliAsync(
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
      { cwd: installRoot },
    );
    assert.equal(createOutput.ok, true);

    const parsed = await execCliAsync(
      cliPath,
      [
        'deliverable',
        'run',
        '--workspace-root',
        workspaceRoot,
        '--overlay',
        'ppt_deck',
        '--topic-id',
        'topic-a',
        '--deliverable-id',
        'deck-a',
        '--route',
        'storyline',
      ],
      { cwd: installRoot },
    );

    assert.equal(parsed.ok, true);
    assert.equal(parsed.surface_kind, 'domain_entry');
    assert.equal(parsed.task_intent, 'run_opl_stage_execution_plan');
    assert.equal(parsed.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(parsed.result_surface.owner, 'one-person-lab');
    assert.equal(parsed.result_surface.delivery_identity.route, 'storyline');
    assert.equal(parsed.result_surface.control_policy.requested_stop_after_stage, 'storyline');
    assert.equal(parsed.result_surface.execution_model.repo_local_stage_runner_active_caller, false);
  });
});

test('CLI deliverable run defaults to StageRun owner-chain instead of local route-run records', async () => {
  await withMockCodexRuntimeCli(async () => {
    const cliPath = path.resolve('apps/redcube-cli/dist/cli.js');
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-cli-v2-run-'));

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
        'lecture_peer',
        '--topic-id',
        'topic-a',
        '--deliverable-id',
        'deck-a',
        '--title',
        '同行讲解 deck',
        '--goal',
        '向小同行解释问题、方法、证据与边界',
      ],
      { cwd: path.resolve('.') },
    );

    const runParsed = await execCliAsync(
      cliPath,
      [
        'deliverable',
        'run',
        '--workspace-root',
        workspaceRoot,
        '--overlay',
        'ppt_deck',
        '--topic-id',
        'topic-a',
        '--deliverable-id',
        'deck-a',
        '--route',
        'storyline',
      ],
      { cwd: path.resolve('.') },
    );
    assert.equal(runParsed.ok, true);
    assert.equal(runParsed.surface_kind, 'domain_entry');
    assert.equal(runParsed.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(runParsed.result_surface.delivery_identity.route, 'storyline');
    assert.equal(runParsed.result_surface.control_policy.requested_stop_after_stage, 'storyline');
    assert.equal(runParsed.result_surface.execution_model.repo_local_stage_runner_active_caller, false);

    const secondRunParsed = await execCliAsync(
      cliPath,
      [
        'deliverable',
        'run',
        '--workspace-root',
        workspaceRoot,
        '--overlay',
        'ppt_deck',
        '--topic-id',
        'topic-a',
        '--deliverable-id',
        'deck-a',
        '--route',
        'detailed_outline',
      ],
      { cwd: path.resolve('.') },
    );
    assert.equal(secondRunParsed.ok, true);
    assert.equal(secondRunParsed.surface_kind, 'domain_entry');
    assert.equal(secondRunParsed.result_surface.surface_kind, 'opl_stage_execution_plan');
    assert.equal(secondRunParsed.result_surface.delivery_identity.route, 'detailed_outline');
    assert.equal(secondRunParsed.result_surface.control_policy.requested_stop_after_stage, 'detailed_outline');
    assert.equal(secondRunParsed.result_surface.execution_model.repo_local_stage_runner_active_caller, false);
    assert.equal(secondRunParsed.result_surface.attempt_ledger_owner, 'one-person-lab');
  });
});
