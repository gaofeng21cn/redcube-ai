import type { DomainActionMap, JsonMap } from './types.js';

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
  const directCommandCatalog = {
    'workspace doctor': {
      summary: '诊断 workspace 合同与 canonical 目录，并把 brand-new workspace 引向 Source Readiness bootstrap writers。',
      usage: 'redcube workspace doctor --workspace-root <dir>',
      action_ref: 'doctorWorkspace',
      boundary_fields: ['workspaceRoot'],
    },
    'source intake': {
      summary: '把 brief / keywords / source files 水合成 shared source truth。',
      usage: 'redcube source intake --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md] [--operator-files /abs/rules.md,/abs/template.md]',
      action_ref: 'intakeSource',
      boundary_fields: ['workspaceRoot', 'topicId'],
    },
    'source research': {
      summary: '用一条正式链路把 Step 1 Source Readiness / Deep Research 推进到 planning_ready 或 canonical result staging。',
      usage: 'redcube source research --workspace-root <dir> --topic-id <id> [--title <text>] [--brief <text>] [--keywords a,b] [--source-files /abs/a.pdf,/abs/b.md] [--operator-files /abs/rules.md,/abs/template.md] [--payload-file /abs/result.json]',
      action_ref: 'researchSource',
      boundary_fields: ['workspaceRoot', 'topicId'],
    },
    'deliverable create': {
      summary: '在 topic 下创建 canonical deliverable 合同与 surface files。',
      usage: 'redcube deliverable create --workspace-root <dir> --overlay <overlay-id> --profile-id <profile-id> --topic-id <id> --deliverable-id <id> --title <text> --goal <text>',
      action_ref: 'createDeliverable',
      boundary_fields: ['workspaceRoot', 'topicId', 'deliverableId'],
    },
    'deliverable audit': {
      summary: '在进入更高成本 route 前执行 fail-closed audit gate。',
      usage: 'redcube deliverable audit --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --mode <draft_new|optimize_existing> [--baseline-deliverable-id <id>]',
      action_ref: 'auditDeliverable',
      boundary_fields: ['workspaceRoot', 'topicId', 'deliverableId'],
    },
    'deliverable run': {
      summary: '生成按指定 stage 截止的 OPL stage execution plan，由 OPL provider 接管 StageRun。',
      usage: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> [--adapter <opl-executor-ref>]',
      action_ref: 'invokeDomainEntry',
      boundary_fields: ['workspaceRoot', 'topicId', 'deliverableId'],
    },
    'product invoke': {
      summary: '通过 RCA direct domain entry 创建或继续同一视觉交付任务。',
      usage: 'redcube product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>] [--route <stage>] [--stop-after-stage <stage>]',
      action_ref: 'invokeProductEntry',
      boundary_fields: ['workspaceRoot', 'entrySessionId', 'topicId', 'deliverableId'],
    },
    'domain-handler export': {
      summary: '导出 RCA refs-only domain handler target，供 OPL hosted runtime 消费。',
      usage: 'redcube domain-handler export --workspace-root <dir> [--workspace-receipt-scaleout-root <dir>[,<dir>...]] --format json',
      action_ref: 'exportDomainHandler',
      boundary_fields: ['workspaceRoot', 'workspaceReceiptScaleoutRoot'],
    },
    'domain-handler dispatch': {
      summary: '执行 RCA-owned guarded domain handler action，不承担 OPL hosted action 路由。',
      usage: 'redcube domain-handler dispatch --task <task.json> --format json',
      action_ref: 'dispatchDomainHandler',
      boundary_fields: ['task'],
    },
    'image-ppt proof': {
      summary: '执行 RCA repo-owned image-first PPT proof runner。',
      usage: 'redcube image-ppt proof --output-dir <dir> [--mock-image-generation|--live-image-generation] [--skip-system-deps] [--style-reference-dir <dir>]',
      action_ref: 'runImagePptProof',
      boundary_fields: ['outputDir', 'styleReferenceDir'],
    },
    'native-ppt proof': {
      summary: '执行 RCA repo-owned native PPT proof route。',
      usage: 'redcube native-ppt proof --workspace-root <dir> --entry-session-id <id> --topic-id <id> --deliverable-id <id> [--route <author_pptx_native|repair_pptx_native>] [--stop-after-stage <stage>]',
      action_ref: 'runNativePptProductEntryProof',
      boundary_fields: ['workspaceRoot', 'entrySessionId', 'topicId', 'deliverableId'],
    },
    'report performance': {
      summary: '聚合 route/run/review/render/capture telemetry，输出 RedCube performance report surface。',
      usage: 'redcube report performance --workspace-root <dir> [--topic-id <id>] [--deliverable-id <id>]',
      action_ref: 'buildPerformanceReport',
      boundary_fields: ['workspaceRoot', 'topicId', 'deliverableId'],
    },
  };
  const entry = (directCommandCatalog as Record<string, JsonMap>)[commandKey];
  if (!entry) {
    return null;
  }
  return {
    ok: true,
    surface_kind: 'command_help',
    command: commandKey,
    summary: entry.summary,
    usage: entry.usage,
    action_ref: entry.action_ref,
    api_surface: entry.api_surface,
    boundary_fields: entry.boundary_fields,
    action_id: entry.action_id,
    source_metadata: 'redcube_direct_cli_catalog',
    canonical_operator_route: operatorQuickstart.canonicalRoute,
    operator_quickstart: operatorQuickstart,
  };
}

/**
 * @param {Record<string, unknown>} [domainActions]
 * @returns {Promise<Record<string, unknown>>}
 */
export async function buildHelp(domainActions: DomainActionMap): Promise<JsonMap> {
  const overlayCatalog = await domainActions.getOverlayCatalog();

  return {
    ok: true,
    whatIsRedCube: 'RedCube AI 是面向专家与 PIs 的视觉交付运行入口，当前重点支持 PPT deck、小红书图文与单页知识海报。',
    preferredEntry: ['OPL generated descriptors', 'RCA direct domain entry'],
    generated_interface_owner: 'one-person-lab',
    domain_handler_owner: 'redcube_ai',
    repo_local_redcube_cli_role: 'domain_handler_target_or_direct_domain_entry_only',
    repo_local_redcube_mcp_role: 'domain_handler_target_or_direct_protocol_adapter_only',
    launcher_boundary: {
      redcube_cli_is_unified_metadata_owner: false,
      redcube_mcp_is_unified_metadata_owner: false,
      cli_mcp_skill_product_status_workbench_metadata_owner: 'one-person-lab',
      domain_action_handler_owner: 'redcube_ai',
    },
    discovery: {
      profileList: 'redcube profile --action list',
    },
    availableOverlays: overlayCatalog.overlays,
    commonTasks: [
      {
        task: '用 RCA npm alias 读取 direct help',
        command: 'npm run rca -- help',
      },
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
        task: '按声明的 route 生成 OPL StageRun 执行计划',
        command: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> [--adapter <opl-executor-ref>]',
      },
      {
        task: '生成 OPL stage execution plan 并交给 OPL provider 执行',
        command: 'redcube deliverable execute --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> [--user-intent <text>] [--stop-after-stage <stage>]',
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
        task: '汇总 workspace / deliverable 的性能与 token telemetry',
        command: 'redcube report performance --workspace-root <dir> [--topic-id <id>] [--deliverable-id <id>]',
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
      product: ['invoke'],
      'domain-handler': ['export', 'dispatch'],
      'native-ppt': ['proof'],
      'image-ppt': ['proof'],
      review: ['get', 'projection', 'mutate'],
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
      rcaNpmAlias: 'npm run rca -- help',
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
      deliverableExecute: 'redcube deliverable execute --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> [--user-intent <text>] [--stop-after-stage <stage>] [--adapter <opl-executor-ref>]',
      deliverableRun: 'redcube deliverable run --workspace-root <dir> --overlay <id> --topic-id <id> --deliverable-id <id> --route <stage> [--adapter <opl-executor-ref>]',
      productInvoke: 'redcube product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>] [--task-intent <run_opl_stage_execution_plan|run_deliverable_route>] [--route <stage>] [--user-intent <text>] [--lifecycle-policy <policy>] [--stop-after-stage <stage>] [--constraints-json <json>] [--constraints-file <json>] [--native-sample-slide-count <n>]',
      domainHandlerExport: 'redcube domain-handler export --workspace-root <dir> [--workspace-receipt-scaleout-root <dir>[,<dir>...]] --format json',
      domainHandlerDispatch: 'redcube domain-handler dispatch --task <task.json> --format json',
      nativePptProof: 'redcube native-ppt proof --workspace-root <dir> --entry-session-id <id> --topic-id <id> --deliverable-id <id> [--route <author_pptx_native|repair_pptx_native>] [--native-sample-slide-count <n>]',
      imagePptProof: 'redcube image-ppt proof --output-dir <dir> [--mock-image-generation|--live-image-generation] [--skip-system-deps] [--style-reference-dir <dir>]',
      profileList: 'redcube profile --action list',
      reviewGet: 'redcube review get --workspace-root <dir> --topic-id <id> --deliverable-id <id>',
      reviewProjection: 'redcube review projection --workspace-root <dir> --topic-id <id>',
      reviewMutate: 'redcube review mutate --workspace-root <dir> --topic-id <id> --deliverable-id <id> --type <request_changes|bind_baseline|approve_publish|promote_publish|promote_baseline> [--issues a,b] [--rerun-from-stage <stage>] [--baseline-deliverable-id <id>] [--notes <text>] [--actor <human|agent>] [--promoted-reference-id <id>]',
      reportPerformance: 'redcube report performance --workspace-root <dir> [--topic-id <id>] [--deliverable-id <id>]',
      profile: 'redcube profile --action <list|bootstrap|export|install> [--source-dir <dir>] [--bundle <file>] [--config-home <dir>] [--force]',
    },
  };
}
