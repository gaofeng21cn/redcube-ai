#!/usr/bin/env node

import { realpathSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
  getManagedRun as getGatewayManagedRun,
  invokeDomainEntry,
  invokeFederatedProductEntry,
  invokeProductEntry,
  getProductEntrySession,
  superviseManagedRun as superviseGatewayManagedRun,
  intakeSource,
  researchSource,
  prepareSourceAugmentation,
  prepareSourceAugmentationResult,
  writeSourceAugmentationResult,
  executeSourceAugmentation,
  importLegacyProject,
  listTopics as listTopicsGateway,
  runtimeWatch,
  runDeliverableRoute,
  runManagedDeliverable,
} from '@redcube/gateway';

const DEFAULT_GATEWAY_ACTIONS = {
  auditDeliverable,
  applyReviewMutation,
  createDeliverable,
  doctorWorkspace,
  getDeliverable,
  getOverlayCatalog,
  getPublicationProjection,
  getReviewState,
  getRun: getGatewayRun,
  getManagedRun: getGatewayManagedRun,
  invokeDomainEntry,
  invokeFederatedProductEntry,
  invokeProductEntry,
  getProductEntrySession,
  superviseManagedRun: superviseGatewayManagedRun,
  intakeSource,
  researchSource,
  prepareSourceAugmentation,
  prepareSourceAugmentationResult,
  writeSourceAugmentationResult,
  executeSourceAugmentation,
  importLegacyProject,
  listTopics: listTopicsGateway,
  runtimeWatch,
  runDeliverableRoute,
  runManagedDeliverable,
};

export function parseArgs(argv) {
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
  printJson({
    ok: false,
    error_kind: 'cli_usage_error',
    recommended_action: 'read_help',
    error: message,
  });
  process.exit(code);
}

export function resolveWorkspaceRoot(options, cwd = process.cwd) {
  return options.workspaceRoot || options.rootDir || cwd();
}

function buildCommonFlows(overlayCatalog) {
  return Object.fromEntries(
    overlayCatalog.overlays.map((overlay) => [
      overlay.overlay_id,
      [
        '1. redcube workspace doctor --workspace-root <dir>',
        '2. redcube source research --workspace-root <dir> --topic-id <id> ...',
        `3. redcube deliverable create --workspace-root <dir> --overlay ${overlay.overlay_id} --profile-id ${overlay.default_profile_id || '<profile-id>'} ...`,
        `4. redcube deliverable audit --workspace-root <dir> --overlay ${overlay.overlay_id} --mode draft_new ...`,
        `5. redcube deliverable run --workspace-root <dir> --overlay ${overlay.overlay_id} --route <stage> ...`,
      ],
    ]),
  );
}

function buildOperatorQuickstart() {
  return {
    canonicalRoute: [
      'workspace doctor',
      'source intake / source research',
      'deliverable create',
      'deliverable audit',
      'deliverable run',
    ],
    entryVariants: {
      providedMaterials: [
        'workspace doctor',
        'source intake',
        'deliverable create',
        'deliverable audit',
        'deliverable run',
      ],
      topicOnlyOrThinWorkspace: [
        'workspace doctor',
        'source research',
        'deliverable create',
        'deliverable audit',
        'deliverable run',
      ],
    },
    doctorRole: 'diagnostic_only',
    step1Gate: 'planning_ready',
  };
}


function buildCommandHelp(commandKey) {
  const operatorQuickstart = buildOperatorQuickstart();
  const catalog = {
    'workspace doctor': {
      summary: '诊断 workspace 合同与 canonical 目录，并把 brand-new workspace 引向 Source Readiness bootstrap writers。',
      usage: 'redcube workspace doctor --workspace-root <dir>',
      gateway_action: 'doctorWorkspace',
      boundary_fields: ['workspaceRoot'],
    },
    'source intake': {
      summary: '把 brief / keywords / source files 水合成 shared source truth。',
      usage: 'redcube source intake --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md]',
      gateway_action: 'intakeSource',
      boundary_fields: ['workspaceRoot', 'topicId'],
    },
    'source research': {
      summary: '用一条正式链路把 Step 1 Source Readiness / Deep Research 推进到 planning_ready 或 canonical result staging。',
      usage: 'redcube source research --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md] [--payload-file /abs/result.json]',
      gateway_action: 'researchSource',
      boundary_fields: ['workspaceRoot', 'topicId'],
    },
    'deliverable create': {
      summary: '在 topic 下创建 canonical deliverable 合同与 surface files。',
      usage: 'redcube deliverable create --workspace-root <dir> --overlay <overlay-id> --profile-id <profile-id> --topic-id <id> --deliverable-id <id> --title <text> --goal <text>',
      gateway_action: 'createDeliverable',
      boundary_fields: ['workspaceRoot', 'topicId', 'deliverableId'],
    },
    'deliverable audit': {
      summary: '在进入更高成本 route 前执行 fail-closed audit gate。',
      usage: 'redcube deliverable audit --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --mode <draft_new|optimize_existing> [--baseline-deliverable-id <id>]',
      gateway_action: 'auditDeliverable',
      boundary_fields: ['workspaceRoot', 'topicId', 'deliverableId'],
    },
    'deliverable run': {
      summary: '按 hydrated contract 执行单个 deliverable route。',
      usage: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> [--adapter <host_agent|external_llm>]',
      gateway_action: 'runDeliverableRoute',
      boundary_fields: ['workspaceRoot', 'topicId', 'deliverableId'],
    },
    'review watch': {
      summary: '围绕 workspace/topic/deliverable/run locator 读取 canonical runtime watch surface。',
      usage: 'redcube review watch --workspace-root <dir> --topic-id <id> --deliverable-id <id> --run-id <id>',
      gateway_action: 'runtimeWatch',
      boundary_fields: ['workspaceRoot', 'topicId', 'deliverableId', 'runId'],
    },
    'product invoke': {
      summary: '以 direct RedCube product entry 方式创建或继续同一 deliverable，并下沉到同一个 service-safe domain entry。',
      usage: 'redcube product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>] [--task-intent <run_managed_deliverable|run_deliverable_route>] [--route <stage>] [--user-intent <text>] [--stop-after-stage <stage>]',
      gateway_action: 'invokeProductEntry',
      boundary_fields: ['workspaceRoot', 'entrySessionId', 'topicId', 'deliverableId'],
    },
    'product federate': {
      summary: '以 OPL Gateway federation 方式把 handoff 收口到同一个 downstream product entry。',
      usage: 'redcube product federate --workspace-root <dir> --entry-session-id <id> --target-domain-id redcube_ai --entry-mode opl_gateway --return-surface-kind product_entry --overlay <overlay-id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>] [--task-intent <run_managed_deliverable|run_deliverable_route>]',
      gateway_action: 'invokeFederatedProductEntry',
      boundary_fields: ['workspaceRoot', 'entrySessionId', 'targetDomainId', 'topicId', 'deliverableId'],
    },
    'product session': {
      summary: '读取 product-entry session continuity surface，并回看 latest managed progress / review / projection。',
      usage: 'redcube product session --entry-session-id <id>',
      gateway_action: 'getProductEntrySession',
      boundary_fields: ['entrySessionId'],
    },
  };
  const entry = catalog[commandKey];
  if (!entry) {
    return null;
  }
  return {
    ok: true,
    surface_kind: 'command_help',
    command: commandKey,
    summary: entry.summary,
    usage: entry.usage,
    gateway_action: entry.gateway_action,
    boundary_fields: entry.boundary_fields,
    canonical_operator_route: operatorQuickstart.canonicalRoute,
    operator_quickstart: operatorQuickstart,
  };
}

export function getCliGatewayActions(overrides = {}) {
  return {
    ...DEFAULT_GATEWAY_ACTIONS,
    ...overrides,
  };
}

/**
 * @param {Record<string, unknown>} [gatewayActions]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function buildHelp(gatewayActions = getCliGatewayActions()) {
  const overlayCatalog = await gatewayActions.getOverlayCatalog();

  return {
    ok: true,
    whatIsRedCube: 'RedCube AI 是面向专家与 PIs 的视觉交付运行入口，当前重点支持 PPT deck、小红书图文与单页知识海报。',
    preferredEntry: ['CLI', 'MCP'],
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
        command: 'redcube import legacy-project --project <name> --overlay <overlay-id> --root-dir <dir> --workspace-root <dir>',
      },
      {
        task: '把 brief / keywords / source files 水合成 shared source truth',
        command: 'redcube source intake --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md]',
      },
      {
        task: '用一条正式链路把 Step 1 Source Readiness / Deep Research 推进到可交付状态',
        command: 'redcube source research --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md] [--payload-file /abs/result.json]',
      },
      {
        task: '为材料不足主题生成 Source Augmentation / Deep Research 合同',
        command: 'redcube source augment --workspace-root <dir> --topic-id <id>',
      },
      {
        task: '为 Agent-native Research 路线准备 canonical augmentation result scaffold',
        command: 'redcube source prepare-augmentation-result --workspace-root <dir> --topic-id <id>',
      },
      {
        task: '把外部 / Agent 产出的 augmentation result payload 正式写回 canonical result surface',
        command: 'redcube source write-augmentation-result --workspace-root <dir> --topic-id <id> --payload-file <file>',
      },
      {
        task: '执行 Source Augmentation / Deep Research 补料并回写 canonical source truth',
        command: 'redcube source execute-augmentation --workspace-root <dir> --topic-id <id>',
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
        task: '按声明的 route 执行当前交付阶段',
        command: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> [--adapter <host_agent|external_llm>]',
      },
      {
        task: '托管执行整个交付链路并查看 managed 进度',
        command: 'redcube deliverable execute --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> [--user-intent <text>] [--stop-after-stage <stage>] && redcube managed get --workspace-root <dir> --managed-run-id <id>',
      },
      {
        task: '触发一次 supervisor tick 刷新托管监管面',
        command: 'redcube managed supervise --workspace-root <dir> --managed-run-id <id>',
      },
      {
        task: '读取交付物当前 review 状态',
        command: 'redcube review get --workspace-root <dir> --topic-id <id> --deliverable-id <id>',
      },
      {
        task: '读取 topic 级发布投影',
        command: 'redcube review projection --workspace-root <dir> --topic-id <id>',
      },
      {
        task: '观察一个 run 的当前 review loop 状态',
        command: 'redcube review watch --workspace-root <dir> --topic-id <id> --deliverable-id <id> --run-id <id>',
      },
      {
        task: '通过 direct product entry 创建或继续同一交付 session',
        command: 'redcube product invoke --workspace-root <dir> --entry-session-id <id> --overlay <id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>]',
      },
    ],
    commonFlows: buildCommonFlows(overlayCatalog),
    operatorQuickstart: buildOperatorQuickstart(),
    commandGroups: {
      workspace: ['doctor'],
      topics: ['list'],
      source: ['intake', 'research', 'augment', 'prepare-augmentation-result', 'write-augmentation-result', 'execute-augmentation'],
      import: ['legacy-project'],
      deliverable: ['create', 'get', 'audit', 'execute', 'run'],
      managed: ['get', 'supervise'],
      product: ['invoke', 'federate', 'session'],
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
      importLegacyProject: 'redcube import legacy-project --project <name> --overlay <overlay-id> --root-dir <dir> --workspace-root <dir>',
      sourceIntake: 'redcube source intake --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md]',
      sourceResearch: 'redcube source research --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md] [--payload-file /abs/result.json]',
      sourceAugment: 'redcube source augment --workspace-root <dir> --topic-id <id>',
      sourcePrepareAugmentationResult: 'redcube source prepare-augmentation-result --workspace-root <dir> --topic-id <id>',
      sourceWriteAugmentationResult: 'redcube source write-augmentation-result --workspace-root <dir> --topic-id <id> --payload-file <file>',
      sourceExecuteAugmentation: 'redcube source execute-augmentation --workspace-root <dir> --topic-id <id>',
      deliverableCreate: 'redcube deliverable create --workspace-root <dir> --overlay <overlay-id> --profile-id <profile-id> --topic-id <id> --deliverable-id <id> --title <text> --goal <text>',
      deliverableGet: 'redcube deliverable get --workspace-root <dir> --topic-id <id> --deliverable-id <id>',
      deliverableAudit: 'redcube deliverable audit --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --mode <draft_new|optimize_existing> [--baseline-deliverable-id <id>]',
      deliverableExecute: 'redcube deliverable execute --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> [--user-intent <text>] [--stop-after-stage <stage>] [--adapter <host_agent|external_llm>]',
      deliverableRun: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> [--adapter <host_agent|external_llm>]',
      managedGet: 'redcube managed get --workspace-root <dir> --managed-run-id <id>',
      managedSupervise: 'redcube managed supervise --workspace-root <dir> --managed-run-id <id>',
      productInvoke: 'redcube product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>] [--task-intent <run_managed_deliverable|run_deliverable_route>] [--route <stage>] [--user-intent <text>] [--stop-after-stage <stage>]',
      productFederate: 'redcube product federate --workspace-root <dir> --entry-session-id <id> --target-domain-id redcube_ai --entry-mode opl_gateway --return-surface-kind product_entry --overlay <overlay-id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>] [--task-intent <run_managed_deliverable|run_deliverable_route>]',
      productSession: 'redcube product session --entry-session-id <id>',
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

export async function executeCli(argv, deps = {}) {
  const [command, ...rest] = argv;
  const subcommand = rest[0];
  const options = parseArgs(rest);
  const gateway = getCliGatewayActions(deps.gateway || {});
  const cwd = deps.cwd || process.cwd;
  const loadPrivateProfile = deps.loadPrivateProfileModule || loadPrivateProfileModule;

  if (!command || command === 'help' || command === '--help') {
    return buildHelp(gateway);
  }

  if (options.help === true) {
    const commandHelp = buildCommandHelp([command, subcommand].filter(Boolean).join(' '));
    if (commandHelp) {
      return commandHelp;
    }
  }

  if (command === 'workspace') {
    if (subcommand !== 'doctor') {
      throw new Error('workspace 命令仅支持 doctor');
    }

    return gateway.doctorWorkspace({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
    });
  }

  if (command === 'topics') {
    if (subcommand !== 'list') {
      throw new Error('topics 命令仅支持 list');
    }

    return gateway.listTopics({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
    });
  }

  if (command === 'import') {
    if (subcommand !== 'legacy-project') {
      throw new Error('import 命令仅支持 legacy-project');
    }

    return gateway.importLegacyProject({
      rootDir: options.rootDir || '',
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
      project: options.project || '',
      overlay: options.overlay || '',
    });
  }

  if (command === 'source') {
    if (subcommand === 'intake') {
      return gateway.intakeSource({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        title: options.title || '',
        brief: options.brief || '',
        keywords: options.keywords || '',
        sourceFiles: options.sourceFiles || '',
      });
    }

    if (subcommand === 'research') {
      return gateway.researchSource({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        title: options.title || '',
        brief: options.brief || '',
        keywords: options.keywords || '',
        sourceFiles: options.sourceFiles || '',
        payloadFile: options.payloadFile || '',
      });
    }

    if (subcommand === 'augment') {
      return gateway.prepareSourceAugmentation({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        title: options.title || '',
      });
    }

    if (subcommand === 'prepare-augmentation-result') {
      return gateway.prepareSourceAugmentationResult({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
      });
    }

    if (subcommand === 'write-augmentation-result') {
      return gateway.writeSourceAugmentationResult({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        inputFile: options.inputFile || '',
        payloadFile: options.payloadFile || '',
      });
    }

    if (subcommand === 'execute-augmentation') {
      return gateway.executeSourceAugmentation({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
      });
    }

    throw new Error('source 命令仅支持 intake|research|augment|prepare-augmentation-result|write-augmentation-result|execute-augmentation');
  }

  if (command === 'deliverable') {
    if (subcommand === 'create') {
      return gateway.createDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        overlay: options.overlay || '',
        profileId: options.profileId || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        title: options.title || '',
        goal: options.goal || '',
      });
    }

    if (subcommand === 'get') {
      return gateway.getDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
      });
    }

    if (subcommand === 'audit') {
      return gateway.auditDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        overlay: options.overlay || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        mode: options.mode || 'draft_new',
        baselineDeliverableId: options.baselineDeliverableId || '',
      });
    }

    if (subcommand === 'run') {
      return gateway.runDeliverableRoute({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        overlay: options.overlay || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        route: options.route || '',
        adapter: options.adapter || undefined,
      });
    }

    if (subcommand === 'execute') {
      return gateway.runManagedDeliverable({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        overlay: options.overlay || '',
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        adapter: options.adapter || undefined,
        userIntent: options.userIntent || '',
        stopAfterStage: options.stopAfterStage || '',
        mode: options.mode || 'draft_new',
        baselineDeliverableId: options.baselineDeliverableId || '',
      });
    }

    throw new Error('deliverable 命令仅支持 create|get|audit|execute|run');
  }

  if (command === 'managed') {
    if (subcommand === 'get') {
      return gateway.getManagedRun({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        managedRunId: options.managedRunId || '',
      });
    }

    if (subcommand === 'supervise') {
      return gateway.superviseManagedRun({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        managedRunId: options.managedRunId || '',
      });
    }

    throw new Error('managed 命令仅支持 get|supervise');
  }

  if (command === 'product') {
    if (subcommand === 'invoke') {
      return gateway.invokeProductEntry({
        workspace_locator: {
          workspace_root: resolveWorkspaceRoot(options, cwd),
        },
        entry_session_contract: {
          entry_session_id: options.entrySessionId || '',
        },
        task_intent: options.taskIntent || '',
        delivery_request: {
          deliverable_family: options.overlay || '',
          topic_id: options.topicId || '',
          deliverable_id: options.deliverableId || '',
          profile_id: options.profileId || '',
          title: options.title || '',
          goal: options.goal || '',
          route: options.route || '',
          adapter: options.adapter || '',
          user_intent: options.userIntent || '',
          stop_after_stage: options.stopAfterStage || '',
          mode: options.mode || 'draft_new',
          baseline_deliverable_id: options.baselineDeliverableId || '',
        },
      });
    }

    if (subcommand === 'federate') {
      return gateway.invokeFederatedProductEntry({
        target_domain_id: options.targetDomainId || 'redcube_ai',
        task_intent: options.taskIntent || 'run_managed_deliverable',
        entry_mode: options.entryMode || 'opl_gateway',
        workspace_locator: {
          workspace_root: resolveWorkspaceRoot(options, cwd),
        },
        runtime_session_contract: {
          runtime_owner: 'upstream_hermes_agent',
        },
        return_surface_contract: {
          surface_kind: options.returnSurfaceKind || 'product_entry',
        },
        entry_session_contract: {
          entry_session_id: options.entrySessionId || '',
        },
        delivery_request: {
          deliverable_family: options.overlay || '',
          topic_id: options.topicId || '',
          deliverable_id: options.deliverableId || '',
          profile_id: options.profileId || '',
          title: options.title || '',
          goal: options.goal || '',
          route: options.route || '',
          adapter: options.adapter || '',
          user_intent: options.userIntent || '',
          stop_after_stage: options.stopAfterStage || '',
          mode: options.mode || 'draft_new',
          baseline_deliverable_id: options.baselineDeliverableId || '',
        },
      });
    }

    if (subcommand === 'session') {
      return gateway.getProductEntrySession({
        entry_session_id: options.entrySessionId || '',
      });
    }

    throw new Error('product 命令仅支持 invoke|federate|session');
  }


  if (command === 'review') {
    if (subcommand === 'get') {
      return gateway.getReviewState({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
      topicId: options.topicId || '',
      deliverableId: options.deliverableId || '',
    });
  }

    if (subcommand === 'projection') {
      return gateway.getPublicationProjection({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
      });
    }

    if (subcommand === 'watch') {
      return gateway.runtimeWatch({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
        topicId: options.topicId || '',
        deliverableId: options.deliverableId || '',
        runId: options.runId || '',
      });
    }

    if (subcommand === 'mutate') {
      const issues = String(options.issues || '').trim();
      return gateway.applyReviewMutation({
        workspaceRoot: resolveWorkspaceRoot(options, cwd),
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
    }

    throw new Error('review 命令仅支持 get|projection|watch|mutate');
  }

  if (command === 'runs') {
    if (subcommand !== 'get') {
      throw new Error('runs 命令仅支持 get');
    }

    return gateway.getRun({
      workspaceRoot: resolveWorkspaceRoot(options, cwd),
      runId: options.runId || '',
    });
  }

  if (command === 'profile') {
    if (options.action === 'list') {
      return gateway.getOverlayCatalog();
    }

    if (options.action === 'bootstrap') {
      const { bootstrapPrivateProfile } = await loadPrivateProfile();
      return bootstrapPrivateProfile({
        sourceSystemDir: options.sourceDir || '',
        configHome: options.configHome || '',
        force: options.force === true,
      });
    }

    if (options.action === 'export') {
      const { exportPrivateProfile } = await loadPrivateProfile();
      return exportPrivateProfile({
        configHome: options.configHome || '',
        bundleFile: options.bundle || '',
        force: options.force === true,
      });
    }

    if (options.action === 'install') {
      const { installPrivateProfile } = await loadPrivateProfile();
      return installPrivateProfile({
        configHome: options.configHome || '',
        bundleFile: options.bundle || '',
        force: options.force === true,
      });
    }

    throw new Error('profile 命令需要 --action <list|bootstrap|export|install>');
  }

  throw new Error(`未知命令: ${command}`);
}

export async function runCli(argv, deps = {}) {
  const result = await executeCli(argv, deps);
  const printer = deps.printJson || printJson;
  printer(result);
  return result;
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  return runCli(argv, deps);
}

function isDirectExecution() {
  if (!process.argv[1]) {
    return false;
  }

  const modulePath = fileURLToPath(import.meta.url);

  try {
    return realpathSync(modulePath) === realpathSync(process.argv[1]);
  } catch {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  }
}

if (isDirectExecution()) {
  main().catch((error) => {
    fail(error instanceof Error ? error.message : String(error));
  });
}
