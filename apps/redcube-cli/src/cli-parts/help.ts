import type { GatewayActionMap, JsonMap } from './types.js';
import { buildRedCubeActionMetadata } from '@redcube/gateway';

function buildCommonFlows(overlayCatalog: { overlays: JsonMap[] }): JsonMap {
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

export function buildCommandHelp(commandKey: string): JsonMap | null {
  const operatorQuickstart = buildOperatorQuickstart();
  const command = `redcube ${commandKey}`;
  const actionCommand = buildRedCubeActionMetadata().cli_commands
    .filter((entry): entry is JsonMap => Boolean(entry))
    .find((entry) => entry.command === command);
  const catalog = {
    'workspace doctor': {
      summary: '诊断 workspace 合同与 canonical 目录，并把 brand-new workspace 引向 Source Readiness bootstrap writers。',
      usage: 'redcube workspace doctor --workspace-root <dir>',
      gateway_action: 'doctorWorkspace',
      boundary_fields: ['workspaceRoot'],
    },
    'source intake': {
      summary: '把 brief / keywords / source files 水合成 shared source truth。',
      usage: 'redcube source intake --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md] [--operator-files /abs/rules.md,/abs/template.md]',
      gateway_action: 'intakeSource',
      boundary_fields: ['workspaceRoot', 'topicId'],
    },
    'source research': {
      summary: '用一条正式链路把 Step 1 Source Readiness / Deep Research 推进到 planning_ready 或 canonical result staging。',
      usage: 'redcube source research --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md] [--operator-files /abs/rules.md,/abs/template.md] [--payload-file /abs/result.json]',
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
      usage: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> [--adapter <codex_cli|hermes_agent>]',
      gateway_action: 'runDeliverableRoute',
      boundary_fields: ['workspaceRoot', 'topicId', 'deliverableId'],
    },
    'review watch': {
      summary: '围绕 workspace/topic/deliverable/run locator 读取 canonical runtime watch surface。',
      usage: 'redcube review watch --workspace-root <dir> --topic-id <id> --deliverable-id <id> --run-id <id>',
      gateway_action: 'runtimeWatch',
      boundary_fields: ['workspaceRoot', 'topicId', 'deliverableId', 'runId'],
    },
    'report performance': {
      summary: '聚合 route/run/review/render/capture telemetry，输出 RedCube performance report surface。',
      usage: 'redcube report performance --workspace-root <dir> [--topic-id <id>] [--deliverable-id <id>]',
      gateway_action: 'buildPerformanceReport',
      boundary_fields: ['workspaceRoot', 'topicId', 'deliverableId'],
    },
    'product invoke': {
      summary: '以 direct RedCube product entry 方式创建或继续同一 deliverable，并下沉到同一个 service-safe domain entry。',
      usage: 'redcube product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>] [--task-intent <run_managed_deliverable|run_deliverable_route>] [--route <stage>] [--user-intent <text>] [--lifecycle-policy <policy>] [--stop-after-stage <stage>]',
      gateway_action: 'invokeProductEntry',
      boundary_fields: ['workspaceRoot', 'entrySessionId', 'topicId', 'deliverableId'],
    },
    'product federate': {
      summary: '通过 internal OPL bridge 把 handoff 收口到同一个 downstream product entry；这条命令保留给外层 shell / compatibility bridge。',
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
    'product status': {
      summary: '读取 RedCube agent-facing product-entry overview；`status` 是兼容命令键，用于查看 direct / session 入口、当前主线状态和 internal OPL bridge 合同。',
      usage: 'redcube product status --workspace-root <dir>',
      gateway_action: 'getProductStatus',
      boundary_fields: ['workspaceRoot'],
    },
    'product start': {
      summary: '读取统一的 product-entry start surface，直接查看 overview / direct / internal OPL bridge / resume 四类启动方式。',
      usage: 'redcube product start --workspace-root <dir>',
      gateway_action: 'getProductStart',
      boundary_fields: ['workspaceRoot'],
    },
    'product preflight': {
      summary: '读取当前 direct product-entry overview contract 的开机前真实自检面。',
      usage: 'redcube product preflight --workspace-root <dir>',
      gateway_action: 'getProductPreflight',
      boundary_fields: ['workspaceRoot'],
    },
    'product manifest': {
      summary: '读取当前 direct product-entry shell 的 machine-readable manifest，并查看 direct / internal OPL bridge / session 三个入口面。',
      usage: 'redcube product manifest --workspace-root <dir>',
      gateway_action: 'getProductEntryManifest',
      boundary_fields: ['workspaceRoot'],
    },
    'product sidecar': {
      summary: '导出或调度 RCA product sidecar adapter；Hermes/OPL 只承担在线 substrate/control-plane，RCA 继续持有 visual truth、review 与 artifact authority。',
      usage: 'redcube product sidecar export --workspace-root <dir> --format json | redcube product sidecar dispatch --task <task.json> --format json',
      gateway_action: 'exportProductSidecar|dispatchProductSidecar',
      boundary_fields: ['workspaceRoot', 'task'],
    },
    'native-ppt proof': {
      summary: '受控执行 ppt_deck native PPT proof route；只调用 repo-owned proof runner，并保持 product-entry review/export gates。',
      usage: 'redcube native-ppt proof --workspace-root <dir> --entry-session-id <id> --topic-id <id> --deliverable-id <id> [--route <author_pptx_native|repair_pptx_native>] [--stop-after-stage <stage>]',
      gateway_action: 'runNativePptProductEntryProof',
      boundary_fields: ['workspaceRoot', 'entrySessionId', 'topicId', 'deliverableId'],
    },
    'image-ppt proof': {
      summary: '受控执行 ppt_deck image-first lightweight proof runner；默认 mock，不调用真实图片 API，live 必须显式开启。',
      usage: 'redcube image-ppt proof --output-dir <dir> [--mock-image-generation|--live-image-generation] [--skip-system-deps] [--style-reference-dir <dir>]',
      gateway_action: 'repo_owned_image_ppt_proof_runner',
      boundary_fields: ['outputDir', 'styleReferenceDir'],
    },
  };
  const entry = actionCommand || (catalog as Record<string, JsonMap>)[commandKey];
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
    action_id: entry.action_id,
    source_metadata: actionCommand ? 'redcube_family_action_catalog' : 'cli_help_catalog',
    canonical_operator_route: operatorQuickstart.canonicalRoute,
    operator_quickstart: operatorQuickstart,
  };
}

/**
 * @param {Record<string, unknown>} [gatewayActions]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function buildHelp(gatewayActions: GatewayActionMap): Promise<JsonMap> {
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
        task: '把 brief / keywords / source files 水合成 shared source truth',
        command: 'redcube source intake --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md] [--operator-files /abs/rules.md,/abs/template.md]',
      },
      {
        task: '用一条正式链路把 Step 1 Source Readiness / Deep Research 推进到可交付状态',
        command: 'redcube source research --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md] [--operator-files /abs/rules.md,/abs/template.md] [--payload-file /abs/result.json]',
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
        command: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> [--adapter <codex_cli|hermes_agent>]',
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
        task: '汇总 workspace / deliverable 的性能与 token telemetry',
        command: 'redcube report performance --workspace-root <dir> [--topic-id <id>] [--deliverable-id <id>]',
      },
      {
        task: '先读取 RedCube product-entry overview，查看当前 product-entry 入口和继续方式',
        command: 'redcube product status --workspace-root <dir>',
      },
      {
        task: '读取统一的 product-entry start surface，决定 overview / direct / internal OPL bridge / resume 从哪条入口启动',
        command: 'redcube product start --workspace-root <dir>',
      },
      {
        task: '先做一次 product-entry 开机前自检，确认 workspace 与 runtime-state 已 ready',
        command: 'redcube product preflight --workspace-root <dir>',
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
      deliverable: ['create', 'get', 'audit', 'execute', 'run'],
      managed: ['get', 'supervise'],
      product: ['status', 'start', 'preflight', 'invoke', 'session', 'manifest', 'sidecar'],
      'native-ppt': ['proof'],
      'image-ppt': ['proof'],
      runs: ['get'],
      review: ['get', 'projection', 'watch', 'mutate'],
      report: ['performance'],
      profile: ['list', 'bootstrap', 'export', 'install'],
    },
    whereToReadNext: {
      humanQuickstart: 'human_doc:human_quickstart',
      deliverableExamples: 'human_doc:deliverable_examples',
      runtimeArchitecture: 'human_doc:runtime_architecture',
      runtimePolicy: 'human_doc:policies_runtime_operating_model',
      contractPolicy: 'human_doc:policies_deliverable_contract_model',
      privateProfileSetup: 'human_doc:private_profile_setup',
    },
    usage: {
      workspaceDoctor: 'redcube workspace doctor --workspace-root <dir>',
      topicsList: 'redcube topics list --workspace-root <dir>',
      sourceIntake: 'redcube source intake --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md] [--operator-files /abs/rules.md,/abs/template.md]',
      sourceResearch: 'redcube source research --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md] [--operator-files /abs/rules.md,/abs/template.md] [--payload-file /abs/result.json]',
      sourceAugment: 'redcube source augment --workspace-root <dir> --topic-id <id>',
      sourcePrepareAugmentationResult: 'redcube source prepare-augmentation-result --workspace-root <dir> --topic-id <id>',
      sourceWriteAugmentationResult: 'redcube source write-augmentation-result --workspace-root <dir> --topic-id <id> --payload-file <file>',
      sourceExecuteAugmentation: 'redcube source execute-augmentation --workspace-root <dir> --topic-id <id>',
      deliverableCreate: 'redcube deliverable create --workspace-root <dir> --overlay <overlay-id> --profile-id <profile-id> --topic-id <id> --deliverable-id <id> --title <text> --goal <text>',
      deliverableGet: 'redcube deliverable get --workspace-root <dir> --topic-id <id> --deliverable-id <id>',
      deliverableAudit: 'redcube deliverable audit --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --mode <draft_new|optimize_existing> [--baseline-deliverable-id <id>]',
      deliverableExecute: 'redcube deliverable execute --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> [--user-intent <text>] [--stop-after-stage <stage>] [--adapter <codex_cli|hermes_agent>]',
      deliverableRun: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> [--adapter <codex_cli|hermes_agent>]',
      managedGet: 'redcube managed get --workspace-root <dir> --managed-run-id <id>',
      managedSupervise: 'redcube managed supervise --workspace-root <dir> --managed-run-id <id>',
      productStatus: 'redcube product status --workspace-root <dir>',
      productStart: 'redcube product start --workspace-root <dir>',
      productPreflight: 'redcube product preflight --workspace-root <dir>',
      productInvoke: 'redcube product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>] [--task-intent <run_managed_deliverable|run_deliverable_route>] [--route <stage>] [--user-intent <text>] [--lifecycle-policy <policy>] [--stop-after-stage <stage>]',
      productSession: 'redcube product session --entry-session-id <id>',
      productManifest: 'redcube product manifest --workspace-root <dir>',
      productSidecarExport: 'redcube product sidecar export --workspace-root <dir> --format json',
      productSidecarDispatch: 'redcube product sidecar dispatch --task <task.json> --format json',
      nativePptProof: 'redcube native-ppt proof --workspace-root <dir> --entry-session-id <id> --topic-id <id> --deliverable-id <id> [--route <author_pptx_native|repair_pptx_native>]',
      imagePptProof: 'redcube image-ppt proof --output-dir <dir> [--mock-image-generation|--live-image-generation] [--skip-system-deps] [--style-reference-dir <dir>]',
      runsGet: 'redcube runs get --workspace-root <dir> --run-id <id>',
      profileList: 'redcube profile --action list',
      reviewGet: 'redcube review get --workspace-root <dir> --topic-id <id> --deliverable-id <id>',
      reviewProjection: 'redcube review projection --workspace-root <dir> --topic-id <id>',
      reviewWatch: 'redcube review watch --workspace-root <dir> --topic-id <id> --deliverable-id <id> --run-id <id>',
      reviewMutate: 'redcube review mutate --workspace-root <dir> --topic-id <id> --deliverable-id <id> --type <request_changes|bind_baseline|approve_publish|promote_publish|promote_baseline> [--issues a,b] [--rerun-from-stage <stage>] [--baseline-deliverable-id <id>] [--notes <text>] [--actor <human|agent>] [--promoted-reference-id <id>]',
      reportPerformance: 'redcube report performance --workspace-root <dir> [--topic-id <id>] [--deliverable-id <id>]',
      profile: 'redcube profile --action <list|bootstrap|export|install> [--source-dir <dir>] [--bundle <file>] [--config-home <dir>] [--force]',
    },
  };
}
