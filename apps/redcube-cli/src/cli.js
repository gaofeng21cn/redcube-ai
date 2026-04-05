#!/usr/bin/env node

import {
  auditDeliverable,
  applyReviewMutation,
  createDeliverable,
  doctorWorkspace,
  getDeliverable,
  getOverlayCatalog,
  getPublicationProjection,
  getReviewState,
  getRun as getGatewayRun,
  intakeSource,
  importLegacyProject,
  listTopics as listTopicsGateway,
  runtimeWatch,
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

function buildCommonFlows(overlayCatalog) {
  return Object.fromEntries(
    overlayCatalog.overlays.map((overlay) => [
      overlay.overlay_id,
      [
        `1. redcube deliverable create --overlay ${overlay.overlay_id} --profile-id ${overlay.default_profile_id || '<profile-id>'} ...`,
        `2. redcube deliverable audit --overlay ${overlay.overlay_id} --mode draft_new ...`,
        `3. redcube deliverable run --overlay ${overlay.overlay_id} --route storyline ...`,
      ],
    ]),
  );
}

async function buildHelp() {
  const overlayCatalog = await getOverlayCatalog();

  return {
    ok: true,
    whatIsRedCube: 'RedCube AI 是面向专家与 PIs 的视觉交付运行入口，当前重点支持 PPT deck 与小红书图文。',
    preferredEntry: ['MCP', 'CLI'],
    discovery: {
      profileList: 'redcube profile --action list',
    },
    availableOverlays: overlayCatalog.overlays,
    commonTasks: [
      {
        task: '检查工作区是否可用',
        command: 'redcube workspace doctor --workspace-root <dir>',
      },
      {
        task: '查看当前已有主题',
        command: 'redcube topics list --workspace-root <dir>',
      },
      {
        task: '从旧 projects 目录单向迁入 canonical workspace',
        command: 'redcube import legacy-project --project <name> --root-dir <dir> --workspace-root <dir>',
      },
      {
        task: '把 brief / keywords / source files 水合成 shared source truth',
        command: 'redcube source intake --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md]',
      },
      {
        task: '创建一个新的视觉交付物',
        command: 'redcube deliverable create --workspace-root <dir> --overlay <overlay-id> --profile-id <profile-id> --topic-id <id> --deliverable-id <id> --title <text> --goal <text>',
      },
      {
        task: '审计交付物是否达到进入下一阶段的条件',
        command: 'redcube deliverable audit --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --mode <draft_new|optimize_existing>',
      },
      {
        task: '运行某个正式阶段并查看 run 状态',
        command: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> && redcube runs get --workspace-root <dir> --run-id <id>',
      },
    ],
    commonFlows: buildCommonFlows(overlayCatalog),
    commandGroups: {
      workspace: ['doctor'],
      topics: ['list'],
      source: ['intake'],
      import: ['legacy-project'],
      deliverable: ['create', 'get', 'audit', 'run'],
      runs: ['get'],
      review: ['get', 'projection', 'watch', 'mutate'],
      profile: ['list', 'bootstrap', 'export', 'install'],
    },
    whereToReadNext: {
      humanQuickstart: 'docs/human_quickstart.md',
      deliverableExamples: 'docs/deliverable_examples.md',
      runtimeArchitecture: 'docs/runtime_architecture.md',
      runtimePolicy: 'docs/policies/runtime_operating_model.md',
      contractPolicy: 'docs/policies/deliverable_contract_model.md',
      privateProfileSetup: 'docs/private-profile-setup.md',
    },
    usage: {
      workspaceDoctor: 'redcube workspace doctor --workspace-root <dir>',
      topicsList: 'redcube topics list --workspace-root <dir>',
      importLegacyProject: 'redcube import legacy-project --project <name> --root-dir <dir> --workspace-root <dir>',
      sourceIntake: 'redcube source intake --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md]',
      deliverableCreate: 'redcube deliverable create --workspace-root <dir> --overlay <overlay-id> --profile-id <profile-id> --topic-id <id> --deliverable-id <id> --title <text> --goal <text>',
      deliverableGet: 'redcube deliverable get --workspace-root <dir> --topic-id <id> --deliverable-id <id>',
      deliverableAudit: 'redcube deliverable audit --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --mode <draft_new|optimize_existing> [--baseline-deliverable-id <id>]',
      deliverableRun: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> [--adapter <host_agent|external_llm>]',
      runsGet: 'redcube runs get --workspace-root <dir> --run-id <id>',
      profileList: 'redcube profile --action list',
      reviewGet: 'redcube review get --workspace-root <dir> --topic-id <id> --deliverable-id <id>',
      reviewProjection: 'redcube review projection --workspace-root <dir> --topic-id <id>',
      reviewWatch: 'redcube review watch --workspace-root <dir> --topic-id <id> --deliverable-id <id> --run-id <id>',
      reviewMutate: 'redcube review mutate --workspace-root <dir> --topic-id <id> --deliverable-id <id> --type <request_changes|bind_baseline|approve_publish|promote_publish|promote_baseline> [--issues a,b] [--rerun-from-stage <stage>] [--baseline-deliverable-id <id>] [--notes <text>] [--actor <human|agent>] [--promoted-reference-id <id>]',
      profile: 'redcube profile --action <list|bootstrap|export|install> [--source-dir <dir>] [--bundle <file>] [--config-home <dir>] [--force]',
    },
  };
}

let privateProfileModulePromise;

async function loadPrivateProfileModule() {
  if (!privateProfileModulePromise) {
    privateProfileModulePromise = import('../../../packages/redcube-config/src/private-profile.js');
  }

  return privateProfileModulePromise;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const subcommand = rest[0];
  const options = parseArgs(rest);

  if (!command || command === 'help' || command === '--help') {
    printJson(await buildHelp());
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

  if (command === 'import') {
    if (subcommand !== 'legacy-project') {
      fail('import 命令仅支持 legacy-project');
    }

    const result = await importLegacyProject({
      rootDir: options.rootDir || '',
      workspaceRoot: resolveWorkspaceRoot(options),
      project: options.project || '',
    });
    printJson(result);
    return;
  }

  if (command === 'source') {
    if (subcommand !== 'intake') {
      fail('source 命令仅支持 intake');
    }

    const result = await intakeSource({
      workspaceRoot: resolveWorkspaceRoot(options),
      topicId: options.topicId || '',
      title: options.title || '',
      brief: options.brief || '',
      keywords: options.keywords || '',
      sourceFiles: options.sourceFiles || '',
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


  if (command === 'review') {
    if (subcommand === 'get') {
      const result = await getReviewState({
        workspaceRoot: resolveWorkspaceRoot(options),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
      });
      printJson(result);
      return;
    }

    if (subcommand === 'projection') {
      const result = await getPublicationProjection({
        workspaceRoot: resolveWorkspaceRoot(options),
        topicId: options.topicId || '',
      });
      printJson(result);
      return;
    }

    if (subcommand === 'watch') {
      const runState = await getGatewayRun({
        workspaceRoot: resolveWorkspaceRoot(options),
        runId: options.runId || '',
      });
      const result = await runtimeWatch({
        workspaceRoot: resolveWorkspaceRoot(options),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        run: runState.run || {},
      });
      printJson(result);
      return;
    }

    if (subcommand === 'mutate') {
      const issues = String(options.issues || '').trim();
      const result = await applyReviewMutation({
        workspaceRoot: resolveWorkspaceRoot(options),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        mutation: {
          type: options.type || '',
          actor: options.actor || 'agent',
          review_stage: options.reviewStage || '',
          rerun_from_stage: options.rerunFromStage || '',
          issues: issues ? issues.split(',').map((item) => item.trim()).filter(Boolean) : [],
          baseline_deliverable_id: options.baselineDeliverableId || '',
          notes: options.notes || '',
        },
      });
      printJson(result);
      return;
    }

    fail('review 命令仅支持 get|projection|watch|mutate');
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

  if (command === 'profile') {
    if (options.action === 'list') {
      printJson(await getOverlayCatalog());
      return;
    }

    if (options.action === 'bootstrap') {
      const { bootstrapPrivateProfile } = await loadPrivateProfileModule();
      const result = bootstrapPrivateProfile({
        sourceSystemDir: options.sourceDir || '',
        configHome: options.configHome || '',
        force: options.force === true,
      });
      printJson(result);
      return;
    }

    if (options.action === 'export') {
      const { exportPrivateProfile } = await loadPrivateProfileModule();
      const result = exportPrivateProfile({
        configHome: options.configHome || '',
        bundleFile: options.bundle || '',
        force: options.force === true,
      });
      printJson(result);
      return;
    }

    if (options.action === 'install') {
      const { installPrivateProfile } = await loadPrivateProfileModule();
      const result = installPrivateProfile({
        configHome: options.configHome || '',
        bundleFile: options.bundle || '',
        force: options.force === true,
      });
      printJson(result);
      return;
    }

    fail('profile 命令需要 --action <list|bootstrap|export|install>');
  }

  fail(`未知命令: ${command}`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
