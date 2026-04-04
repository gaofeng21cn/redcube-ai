#!/usr/bin/env node

import {
  auditDeliverable,
  createDeliverable,
  doctorWorkspace,
  getDeliverable,
  getRun as getGatewayRun,
  listTopics as listTopicsGateway,
  runDeliverableRoute,
} from '@redcube/gateway';

function parseArgs(argv) {
  const options = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[i + 1];

    if (!next || next.startsWith('--')) {
      options[toCamel(key)] = true;
      continue;
    }

    options[toCamel(key)] = next;
    i += 1;
  }

  return options;
}

function toCamel(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function printJson(data) {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

function fail(message, code = 1) {
  printJson({ ok: false, error: message });
  process.exit(code);
}

function resolveWorkspaceRoot(options) {
  return options.workspaceRoot || options.rootDir || process.cwd();
}

let legacyConfigModulePromise;
let privateProfileModulePromise;
let legacyAgentModulePromise;

async function loadLegacyConfigModule() {
  if (!legacyConfigModulePromise) {
    legacyConfigModulePromise = import('../../../packages/redcube-config/src/index.js');
  }

  return legacyConfigModulePromise;
}

async function loadPrivateProfileModule() {
  if (!privateProfileModulePromise) {
    privateProfileModulePromise = import('../../../packages/redcube-config/src/private-profile.js');
  }

  return privateProfileModulePromise;
}

async function loadLegacyAgentModule() {
  if (!legacyAgentModulePromise) {
    legacyAgentModulePromise = import('../../../packages/redcube-agent/src/index.js');
  }

  return legacyAgentModulePromise;
}

function wrapLegacyRuntimeError(command, error) {
  const wrapped = new Error(`legacy runtime 不可用，无法执行命令: ${command}`);
  wrapped.cause = error;
  return wrapped;
}

async function requireLegacyModule(loadModule, command) {
  try {
    return await loadModule();
  } catch (error) {
    throw wrapLegacyRuntimeError(command, error);
  }
}

async function resolveLegacyRootDir(options, command) {
  const { loadRuntimeConfig } = await requireLegacyModule(
    loadLegacyConfigModule,
    command,
  );
  const runtimeConfig = loadRuntimeConfig({
    env: process.env,
    explicit: {
      rootDir: options.rootDir || '',
    },
  });

  return runtimeConfig.rootDir;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const subcommand = rest[0];
  const options = parseArgs(rest);

  if (!command || command === 'help' || command === '--help') {
    printJson({
      usage: {
        run: 'redcube run --project <name> --mode <full|plan|html> --tasks <1,2> --fix-pages <1,2> --auto-fix --root-dir <dir>',
        eval: 'redcube eval --project <name> --auto-fix --root-dir <dir>',
        publish: 'redcube publish --project <name> | --all --root-dir <dir>',
        doctor: 'redcube doctor --project <name> --root-dir <dir>',
        create: 'redcube create --project <name> --root-dir <dir>',
        toc: 'redcube toc --project <name> --note-mode <auto|series|single> --root-dir <dir>',
        storyline: 'redcube storyline --project <name> --prompt-file <file.md> --root-dir <dir>',
        list: 'redcube list --root-dir <dir>',
        status: 'redcube status --run-id <id> --root-dir <dir>',
        artifacts: 'redcube artifacts --project <name> --task-folder <folder> --root-dir <dir>',
        retry: 'redcube retry --project <name> --task-folder <folder> --step <plan|html|full> --root-dir <dir>',
        profile: 'redcube profile --action <bootstrap|export|install> [--source-dir <dir>] [--bundle <file>] [--config-home <dir>] [--force]',
        workspaceDoctor: 'redcube workspace doctor --workspace-root <dir>',
        topicsList: 'redcube topics list --workspace-root <dir>',
        deliverableCreate: 'redcube deliverable create --workspace-root <dir> --overlay <id> --profile-id <id> --topic-id <id> --deliverable-id <id> --title <text> --goal <text>',
        deliverableGet: 'redcube deliverable get --workspace-root <dir> --topic-id <id> --deliverable-id <id>',
        deliverableAudit: 'redcube deliverable audit --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --mode <draft_new|optimize_existing> [--baseline-deliverable-id <id>]',
        deliverableRun: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> [--adapter <host_agent|external_llm>]',
        runsGet: 'redcube runs get --workspace-root <dir> --run-id <id>',
      },
    });
    return;
  }

  if (command === 'workspace') {
    if (subcommand !== 'doctor') {
      fail('workspace 命令仅支持 doctor');
    }

    const result = await doctorWorkspace({
      workspaceRoot: resolveWorkspaceRoot(options),
    });
    printJson(result);
    return;
  }

  if (command === 'topics') {
    if (subcommand !== 'list') {
      fail('topics 命令仅支持 list');
    }

    const result = await listTopicsGateway({
      workspaceRoot: resolveWorkspaceRoot(options),
    });
    printJson(result);
    return;
  }

  if (command === 'deliverable') {
    if (subcommand === 'create') {
      const result = await createDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options),
        overlay: options.overlay || '',
        profileId: options.profileId || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        title: options.title || '',
        goal: options.goal || '',
      });
      printJson(result);
      return;
    }

    if (subcommand === 'get') {
      const result = await getDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
      });
      printJson(result);
      return;
    }

    if (subcommand === 'audit') {
      const result = await auditDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options),
        overlay: options.overlay || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        mode: options.mode || 'draft_new',
        baselineDeliverableId: options.baselineDeliverableId || '',
      });
      printJson(result);
      return;
    }

    if (subcommand === 'run') {
      const result = await runDeliverableRoute({
        workspaceRoot: resolveWorkspaceRoot(options),
        overlay: options.overlay || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        route: options.route || '',
        adapter: options.adapter || undefined,
      });
      printJson(result);
      return;
    }

    fail('deliverable 命令仅支持 create|get|audit|run');
  }

  if (command === 'runs') {
    if (subcommand !== 'get') {
      fail('runs 命令仅支持 get');
    }

    const result = await getGatewayRun({
      workspaceRoot: resolveWorkspaceRoot(options),
      runId: options.runId || '',
    });
    printJson(result);
    return;
  }

  if (command === 'run') {
    if (!options.project) fail('run 命令需要 --project');
    const rootDir = await resolveLegacyRootDir(options, command);
    const { runWorkflow } = await requireLegacyModule(loadLegacyAgentModule, command);

    const result = await runWorkflow(
      {
        project: options.project,
        mode: options.mode || 'full',
        tasks: options.tasks || '',
        fixPages: options.fixPages || '',
        autoFix: options.autoFix !== false && options.noAutoFix !== true,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'eval') {
    if (!options.project) fail('eval 命令需要 --project');
    const rootDir = await resolveLegacyRootDir(options, command);
    const { evaluateWorkflow } = await requireLegacyModule(loadLegacyAgentModule, command);

    const result = await evaluateWorkflow(
      {
        project: options.project,
        tasks: options.tasks || '',
        autoFix: options.autoFix === true,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'publish') {
    if (!options.project && !options.all) {
      fail('publish 命令需要 --project 或 --all');
    }
    const rootDir = await resolveLegacyRootDir(options, command);
    const { publishProject } = await requireLegacyModule(loadLegacyAgentModule, command);

    const result = await publishProject(
      {
        project: options.project,
        all: options.all === true,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'doctor') {
    if (!options.project) fail('doctor 命令需要 --project');
    const rootDir = await resolveLegacyRootDir(options, command);
    const { doctorProject } = await requireLegacyModule(loadLegacyAgentModule, command);

    const result = await doctorProject(
      {
        project: options.project,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'create') {
    if (!options.project) fail('create 命令需要 --project');
    const rootDir = await resolveLegacyRootDir(options, command);
    const { createProject } = await requireLegacyModule(loadLegacyAgentModule, command);
    const result = await createProject(
      {
        project: options.project,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'toc') {
    if (!options.project) fail('toc 命令需要 --project');
    const rootDir = await resolveLegacyRootDir(options, command);
    const { generateSeriesToc } = await requireLegacyModule(loadLegacyAgentModule, command);
    const result = await generateSeriesToc(
      {
        project: options.project,
        noteMode: options.noteMode || 'auto',
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'storyline') {
    if (!options.project) fail('storyline 命令需要 --project');
    const rootDir = await resolveLegacyRootDir(options, command);
    const { generateStoryline } = await requireLegacyModule(loadLegacyAgentModule, command);
    const result = await generateStoryline(
      {
        project: options.project,
        promptFile: options.promptFile || '',
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'list') {
    const rootDir = await resolveLegacyRootDir(options, command);
    const { listProjects } = await requireLegacyModule(loadLegacyAgentModule, command);
    const result = await listProjects({}, { rootDir });
    printJson(result);
    return;
  }

  if (command === 'status') {
    const rootDir = await resolveLegacyRootDir(options, command);
    const { getRunStatus } = await requireLegacyModule(loadLegacyAgentModule, command);
    const result = await getRunStatus(
      {
        runId: options.runId || '',
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'artifacts') {
    if (!options.project || !options.taskFolder) {
      fail('artifacts 命令需要 --project 和 --task-folder');
    }
    const rootDir = await resolveLegacyRootDir(options, command);
    const { getTaskArtifacts } = await requireLegacyModule(loadLegacyAgentModule, command);

    const result = await getTaskArtifacts(
      {
        project: options.project,
        taskFolder: options.taskFolder,
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'retry') {
    if (!options.project || !options.taskFolder) {
      fail('retry 命令需要 --project 和 --task-folder');
    }
    const rootDir = await resolveLegacyRootDir(options, command);
    const { retryTaskStep } = await requireLegacyModule(loadLegacyAgentModule, command);

    const result = await retryTaskStep(
      {
        project: options.project,
        taskFolder: options.taskFolder,
        step: options.step || 'full',
      },
      { rootDir },
    );
    printJson(result);
    return;
  }

  if (command === 'profile') {
    if (options.action === 'bootstrap') {
      const { bootstrapPrivateProfile } = await requireLegacyModule(
        loadPrivateProfileModule,
        'profile bootstrap',
      );
      const result = bootstrapPrivateProfile({
        sourceSystemDir: options.sourceDir || '',
        configHome: options.configHome || '',
        force: options.force === true,
      });
      printJson(result);
      return;
    }

    if (options.action === 'export') {
      const { exportPrivateProfile } = await requireLegacyModule(
        loadPrivateProfileModule,
        'profile export',
      );
      const result = exportPrivateProfile({
        configHome: options.configHome || '',
        bundleFile: options.bundle || '',
        force: options.force === true,
      });
      printJson(result);
      return;
    }

    if (options.action === 'install') {
      const { installPrivateProfile } = await requireLegacyModule(
        loadPrivateProfileModule,
        'profile install',
      );
      const result = installPrivateProfile({
        configHome: options.configHome || '',
        bundleFile: options.bundle || '',
        force: options.force === true,
      });
      printJson(result);
      return;
    }

    fail('profile 命令需要 --action <bootstrap|export|install>');
  }

  fail(`未知命令: ${command}`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
