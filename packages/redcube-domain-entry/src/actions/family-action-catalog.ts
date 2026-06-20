// @ts-nocheck
import {
  buildFamilyActionCatalogParity,
  normalizeFamilyActionCatalog,
  projectFamilyAction,
} from 'opl-framework-shared/family-action-catalog';

import {
  PRODUCT_INVOKE_COMMAND,
  PRODUCT_MANIFEST_COMMAND,
  PRODUCT_PREFLIGHT_COMMAND,
  DOMAIN_HANDLER_DISPATCH_COMMAND,
  DOMAIN_HANDLER_EXPORT_COMMAND,
  PRODUCT_SESSION_COMMAND,
  PRODUCT_START_COMMAND,
  PRODUCT_STATUS_COMMAND,
} from './get-product-entry-manifest-parts/policy.js';
import {
  listDomainActionAdapterForbiddenWrites,
  listDomainActionAdapterGuardedActionIds,
} from './domain-action-adapter-parts/guarded-action-catalog.js';

type JsonMap = Record<string, any>;

const IMAGE_PPT_PROOF_COMMAND = 'redcube image-ppt proof';
const NATIVE_PPT_PROOF_COMMAND = 'redcube native-ppt proof';
const SERVICE_SAFE_DOMAIN_ENTRY_COMMAND = 'redcube service-safe domain entry';
const RETIRED_REPO_LOCAL_WRAPPER_ACTION_IDS = new Set([
  'get_product_status',
  'get_product_start',
  'get_product_preflight',
  'get_product_entry_session',
  'get_product_entry_manifest',
]);

const MCP_TOOLS = [
  {
    name: 'redcube_workspace',
    selector: 'action',
    description: 'Grouped workspace/topic discovery surface for workspace doctor, topic catalog, and overlay catalog actions.',
  },
  {
    name: 'redcube_sources',
    selector: 'operation',
    description: 'Grouped source intake/research and augmentation surface for canonical source readiness and augmentation orchestration.',
  },
  {
    name: 'redcube_deliverable',
    selector: 'action',
    description: 'Grouped deliverable lifecycle execution surface for create/get/route run and OPL stage-plan handoff across one deliverable boundary.',
  },
  {
    name: 'redcube_review',
    selector: 'action',
    description: 'Grouped deliverable boundary review surface for publication projection, audit, and review mutation actions; runtime watch default wrapper is owned by OPL status/workbench/read-model callers.',
  },
  {
    name: 'redcube_product_entry',
    selector: 'action',
    description: 'RCA product-entry and domain-handler target. Generated product status/session/manifest/workbench wrappers are owned by OPL.',
  },
];

const PROJECTION_METADATA: Record<string, JsonMap> = {
  get_product_status: {
    cli: null,
    mcp: null,
  },
  get_product_start: {
    cli: null,
    mcp: null,
  },
  get_product_preflight: {
    cli: null,
    mcp: null,
  },
  invoke_product_entry: {
    cli: help(
      'redcube product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>] [--task-intent <run_opl_stage_execution_plan|run_deliverable_route>] [--route <stage>] [--user-intent <text>] [--lifecycle-policy <policy>] [--stop-after-stage <stage>]',
      'invokeProductEntry',
      ['workspaceRoot', 'entrySessionId', 'topicId', 'deliverableId'],
      'direct',
    ),
    mcp: surface('redcube_product_entry', 'invoke_product_entry', 'invokeProductEntry'),
  },
  get_product_entry_session: {
    cli: null,
    mcp: null,
  },
  get_product_entry_manifest: {
    cli: null,
    mcp: null,
  },
  export_domain_handler: {
    cli: help(
      'redcube domain-handler export --workspace-root <dir> [--workspace-receipt-scaleout-root <dir>[,<dir>...]] --format json',
      'exportDomainHandler',
      ['workspaceRoot', 'workspaceReceiptScaleoutRoot'],
      'domain_handler_export',
    ),
    mcp: null,
  },
  dispatch_domain_handler: {
    cli: help(
      'redcube domain-handler dispatch --task <task.json> --format json',
      'dispatchDomainHandler',
      ['task'],
      'domain_handler_dispatch',
    ),
    mcp: null,
  },
  run_image_ppt_proof: {
    cli: help(
      'redcube image-ppt proof --output-dir <dir> [--mock-image-generation|--live-image-generation] [--skip-system-deps] [--style-reference-dir <dir>]',
      'repo_owned_image_ppt_proof_runner',
      ['outputDir', 'styleReferenceDir'],
      'image_ppt_proof',
    ),
  },
  run_native_ppt_proof: {
    cli: help(
      'redcube native-ppt proof --workspace-root <dir> --entry-session-id <id> --topic-id <id> --deliverable-id <id> [--route <author_pptx_native|repair_pptx_native>] [--stop-after-stage <stage>]',
      'runNativePptProductEntryProof',
      ['workspaceRoot', 'entrySessionId', 'topicId', 'deliverableId'],
      'native_ppt_proof',
    ),
  },
  invoke_domain_entry: {
    mcp: surface('redcube_product_entry', 'invoke_domain_entry', 'invokeDomainEntry', SERVICE_SAFE_DOMAIN_ENTRY_COMMAND),
  },
};

function help(
  usage: string,
  apiSurface: string,
  boundaryFields: string[],
  shellKey?: string,
): JsonMap {
  return {
    usage,
    api_surface: apiSurface,
    boundary_fields: boundaryFields,
    ...(shellKey ? { shell_key: shellKey } : {}),
  };
}

function surface(toolName: string, actionKey: string, apiSurface: string, command?: string): JsonMap {
  return {
    tool_name: toolName,
    action_key: actionKey,
    api_surface: apiSurface,
    ...(command ? { command } : {}),
  };
}

function action({
  actionId,
  title,
  summary,
  effect,
  command,
  surfaceKind,
  inputSchemaRef,
  outputSchemaRef,
  workspaceLocatorFields = [],
  humanGateIds = [],
  supportedSurfaces,
  authorityBoundary = {},
}: JsonMap): JsonMap {
  return {
    action_id: actionId,
    title,
    summary,
    owner: 'redcube_ai',
    generated_interface_owner: 'one-person-lab',
    domain_handler_owner: 'redcube_ai',
    owner_model: 'opl_generated_descriptor_invokes_rca_domain_handler',
    repo_local_handler_target_only: !RETIRED_REPO_LOCAL_WRAPPER_ACTION_IDS.has(actionId),
    repo_local_default_wrapper_retired: RETIRED_REPO_LOCAL_WRAPPER_ACTION_IDS.has(actionId),
    effect,
    source_command: {
      command,
      surface_kind: surfaceKind,
    },
    input_schema_ref: inputSchemaRef,
    output_schema_ref: outputSchemaRef,
    workspace_locator_fields: workspaceLocatorFields,
    human_gate_ids: humanGateIds,
    supported_surfaces: {
      cli: supportedSurfaces.cli ?? null,
      mcp: supportedSurfaces.mcp ?? null,
      skill: supportedSurfaces.skill ?? null,
      product_entry: supportedSurfaces.product_entry ?? null,
      openai: supportedSurfaces.openai ?? null,
      ai_sdk: supportedSurfaces.ai_sdk ?? null,
    },
    authority_boundary: authorityBoundary,
  };
}

function attachSourceOfWork(catalog: JsonMap | null): JsonMap | null {
  if (!catalog) return catalog;
  return {
    ...catalog,
    actions: (catalog.actions ?? []).map((entry: JsonMap) => ({
      ...entry,
      source_of_work: sourceOfWork(entry.action_id),
    })),
  };
}

function sourceOfWork(actionId: string): JsonMap {
  return {
    source_catalog: 'family_action_catalog',
    source_catalog_ref: 'family_action_catalog:redcube_product_entry_action_catalog',
    source_action_id: actionId,
    stage_catalog_ref: 'family_stage_control_plane',
    derived_surface_policy: 'derive_cli_mcp_openai_ai_sdk_skill_app_status_workbench_from_single_catalog',
    domain_repo_wrapper_policy: 'handler_target_refs_only_adapter_or_tombstone_candidate',
  };
}

const ACTION_CATALOG = attachSourceOfWork(normalizeFamilyActionCatalog({
  surface_kind: 'family_action_catalog',
  version: 'family-action-catalog.v1',
  catalog_id: 'redcube_product_entry_action_catalog',
  target_domain_id: 'redcube_ai',
  owner: 'redcube_ai',
  generated_interface_owner: 'one-person-lab',
  domain_handler_owner: 'redcube_ai',
  owner_model: 'opl_generated_descriptor_catalog_with_rca_domain_handlers',
  authority_boundary: {
    domain_truth_owner: 'redcube_ai',
    opl_role: 'generated_interface_metadata_owner',
    generated_interface_owner: 'one-person-lab',
    repo_local_redcube_cli_role: 'domain_handler_target_or_direct_entry_only',
    repo_local_redcube_mcp_role: 'domain_handler_target_or_direct_protocol_adapter_only',
    domain_handler_role: 'domain_handler_target_or_refs_only_adapter',
    generic_session_shell_owner: 'one-person-lab',
    generic_workbench_owner: 'one-person-lab',
    default_generic_dispatch_owner: 'one-person-lab',
    default_supervision_owner: 'one-person-lab',
    write_policy: 'no_domain_truth_writes',
  },
  actions: [
    action({
      actionId: 'get_product_status',
      title: 'Read RedCube product status',
      summary: '读取 OPL generated product-entry overview/status shell 所需的 RCA refs；RCA 不再发布 repo-local product status 默认 wrapper。',
      effect: 'read_only',
      command: PRODUCT_STATUS_COMMAND,
      surfaceKind: 'product_status',
      inputSchemaRef: 'schema:redcube.product_status.request.v1',
      outputSchemaRef: 'schema:redcube.product_status.response.v1',
      supportedSurfaces: {
        cli: null,
        mcp: null,
        skill: null,
        product_entry: null,
      },
    }),
    action({
      actionId: 'get_product_start',
      title: 'Read RedCube product start surface',
      summary: '读取 OPL generated product-entry start shell 所需的 RCA refs；RCA repo-local public caller 只保留 direct invoke target。',
      effect: 'read_only',
      command: PRODUCT_START_COMMAND,
      surfaceKind: 'product_entry_start',
      inputSchemaRef: 'schema:redcube.product_start.request.v1',
      outputSchemaRef: 'schema:redcube.product_start.response.v1',
      supportedSurfaces: {
        cli: null,
        mcp: null,
        product_entry: null,
      },
    }),
    action({
      actionId: 'get_product_preflight',
      title: 'Read RedCube product preflight',
      summary: '读取 OPL generated preflight shell 所需的 RCA workspace/runtime refs；RCA 不持有通用 preflight wrapper owner。',
      effect: 'read_only',
      command: PRODUCT_PREFLIGHT_COMMAND,
      surfaceKind: 'product_entry_preflight',
      inputSchemaRef: 'schema:redcube.product_preflight.request.v1',
      outputSchemaRef: 'schema:redcube.product_preflight.response.v1',
      supportedSurfaces: {
        cli: null,
        mcp: null,
        product_entry: null,
      },
    }),
    action({
      actionId: 'invoke_product_entry',
      title: 'Invoke RedCube product entry',
      summary: '以 direct RedCube product entry 方式创建或继续同一 deliverable，并下沉到同一个 service-safe domain entry。',
      effect: 'mutating',
      command: PRODUCT_INVOKE_COMMAND,
      surfaceKind: 'product_entry',
      inputSchemaRef: 'schema:redcube.product_entry.invoke.request.v1',
      outputSchemaRef: 'schema:redcube.product_entry.invoke.response.v1',
      workspaceLocatorFields: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      humanGateIds: ['redcube_operator_review_gate'],
      supportedSurfaces: {
        cli: { surface_kind: 'product_entry' },
        mcp: { tool_name: 'redcube_product_entry', action_key: 'invoke_product_entry' },
        skill: { command_contract_id: 'invoke_product_entry', surface_kind: 'product_entry' },
        product_entry: { action_key: 'start_deliverable', surface_kind: 'product_entry' },
      },
    }),
    action({
      actionId: 'get_product_entry_session',
      title: 'Read RedCube product-entry session',
      summary: '读取 OPL generated session shell 所需的 RCA entry-session domain snapshot refs；RCA 不持有 generic session/workbench owner。',
      effect: 'read_only',
      command: PRODUCT_SESSION_COMMAND,
      surfaceKind: 'product_entry_session',
      inputSchemaRef: 'schema:redcube.product_entry.session.request.v1',
      outputSchemaRef: 'schema:redcube.product_entry.session.response.v1',
      workspaceLocatorFields: ['entry_session_id'],
      supportedSurfaces: {
        cli: null,
        mcp: null,
        skill: null,
        product_entry: null,
      },
      authorityBoundary: {
        generic_session_shell_owner: 'one-person-lab',
        domain_snapshot_owner: 'redcube_ai',
        rca_role: 'entry_session_domain_snapshot_refs_only_adapter',
        implements_generic_workbench: false,
      },
    }),
    action({
      actionId: 'get_product_entry_manifest',
      title: 'Read RedCube product-entry manifest',
      summary: '读取 OPL generated manifest shell 所需的 RCA machine-readable descriptor、domain handler target 与 authority refs。',
      effect: 'read_only',
      command: PRODUCT_MANIFEST_COMMAND,
      surfaceKind: 'product_entry_manifest',
      inputSchemaRef: 'schema:redcube.product_entry.manifest.request.v1',
      outputSchemaRef: 'schema:redcube.product_entry.manifest.response.v2',
      supportedSurfaces: {
        cli: null,
        mcp: null,
        product_entry: null,
      },
      authorityBoundary: {
        manifest_owner: 'redcube_ai',
        generated_surface_owner: 'one-person-lab',
        rca_role: 'declarative_visual_pack_and_domain_handler_refs',
      },
    }),
    action({
      actionId: 'export_domain_handler',
      title: 'Export RedCube product domain handler projection',
      summary: '导出 RCA OPL standard domain handler refs-only projection，供 OPL typed family queue / configured family runtime provider 索引；不授予 visual truth、review verdict 或 publication gate 写权。',
      effect: 'read_only',
      command: DOMAIN_HANDLER_EXPORT_COMMAND,
      surfaceKind: 'product_domain_handler_export',
      inputSchemaRef: 'schema:redcube.domain_handler.export.request.v1',
      outputSchemaRef: 'schema:redcube.domain_handler.export.response.v1',
      supportedSurfaces: {
        cli: { surface_kind: 'product_domain_handler_export' },
        mcp: null,
        product_entry: null,
      },
      authorityBoundary: {
        opl_role: 'typed_family_control_plane',
        provider_role: 'stage_attempt_queue_wakeup_transport',
        generated_surface_owner: 'one-person-lab',
        rca_role: 'domain_handler_target_or_refs_only_adapter',
        internal_implementation_ref: 'exportDomainActionAdapter',
        write_policy: 'read_projection_only',
      },
    }),
    action({
      actionId: 'dispatch_domain_handler',
      title: 'Dispatch RedCube product domain handler guarded action',
      summary: '调度 RCA-owned guarded domain handler actions：no-regression evidence、Temporal controlled visual-stage long-soak evidence、domain owner receipt、visual memory writeback、workspace lifecycle receipt、visual transition evaluation、workspace receipt proof、notification receipt；runtime watch、generic supervise/continuation 入口归 OPL status/workbench/runtime read model 与 runner/session shell，不在 RCA handler 默认派发面暴露。',
      effect: 'mutating',
      command: DOMAIN_HANDLER_DISPATCH_COMMAND,
      surfaceKind: 'product_domain_handler_dispatch',
      inputSchemaRef: 'schema:redcube.domain_handler.dispatch.request.v1',
      outputSchemaRef: 'schema:redcube.domain_handler.dispatch.response.v1',
      supportedSurfaces: {
        cli: { surface_kind: 'product_domain_handler_dispatch' },
        mcp: null,
        product_entry: null,
      },
      authorityBoundary: {
        allowed_actions: listDomainActionAdapterGuardedActionIds(),
        forbidden_writes: listDomainActionAdapterForbiddenWrites(),
        default_generic_dispatch_owner: 'one-person-lab',
        default_supervision_owner: 'one-person-lab',
        rca_role: 'guarded_domain_handler_target_only',
        internal_implementation_ref: 'dispatchDomainActionAdapter',
      },
    }),
    action({
      actionId: 'run_image_ppt_proof',
      title: 'Run image-first PPT proof',
      summary: '受控执行 ppt_deck image-first lightweight proof runner；默认 mock，不调用真实图片 API，live 必须显式开启。',
      effect: 'mutating',
      command: IMAGE_PPT_PROOF_COMMAND,
      surfaceKind: 'image_ppt_product_entry_proof',
      inputSchemaRef: 'schema:redcube.image_ppt_proof.request.v1',
      outputSchemaRef: 'schema:redcube.image_ppt_proof.response.v1',
      workspaceLocatorFields: ['entry_session_id', 'topic_id', 'deliverable_id'],
      supportedSurfaces: {
        cli: { surface_kind: 'image_ppt_product_entry_proof' },
        skill: { command_contract_id: 'run_image_ppt_proof', surface_kind: 'image_ppt_product_entry_proof' },
        product_entry: { action_key: 'run_image_ppt_proof', surface_kind: 'image_ppt_product_entry_proof' },
      },
    }),
    action({
      actionId: 'run_native_ppt_proof',
      title: 'Run native PPT proof',
      summary: '受控执行 ppt_deck native PPT proof route；只调用 repo-owned proof runner，并保持 product-entry review/export gates。',
      effect: 'mutating',
      command: NATIVE_PPT_PROOF_COMMAND,
      surfaceKind: 'native_ppt_product_entry_proof',
      inputSchemaRef: 'schema:redcube.native_ppt_proof.request.v1',
      outputSchemaRef: 'schema:redcube.native_ppt_proof.response.v1',
      workspaceLocatorFields: ['entry_session_id', 'topic_id', 'deliverable_id'],
      supportedSurfaces: {
        cli: { surface_kind: 'native_ppt_product_entry_proof' },
        skill: { command_contract_id: 'run_native_ppt_proof', surface_kind: 'native_ppt_product_entry_proof' },
        product_entry: { action_key: 'run_native_ppt_proof', surface_kind: 'native_ppt_product_entry_proof' },
      },
    }),
    action({
      actionId: 'invoke_domain_entry',
      title: 'Invoke service-safe RedCube domain entry',
      summary: 'Invoke the shared service-safe RedCube domain entry underneath direct product entry and OPL-hosted stage runtime callers.',
      effect: 'mutating',
      command: SERVICE_SAFE_DOMAIN_ENTRY_COMMAND,
      surfaceKind: 'domain_entry',
      inputSchemaRef: 'schema:redcube.domain_entry.request.v1',
      outputSchemaRef: 'schema:redcube.domain_entry.response.v1',
      workspaceLocatorFields: ['workspace_root', 'task_intent'],
      supportedSurfaces: {
        mcp: { tool_name: 'redcube_product_entry', action_key: 'invoke_domain_entry', command: SERVICE_SAFE_DOMAIN_ENTRY_COMMAND },
        product_entry: { action_key: 'invoke_domain_entry', surface_kind: 'domain_entry' },
      },
    }),
  ],
  notes: [
    'RCA owns action semantics and domain handlers; OPL owns generated CLI/MCP/Skill/product/status/workbench descriptors derived from this catalog.',
    'Repo-local redcube CLI/MCP remain domain handler targets and direct diagnostic entries, not unified metadata owners.',
  ],
}));

if (!ACTION_CATALOG) {
  throw new Error('Failed to build RedCube family action catalog');
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function surfaceDescriptor(actionEntry: JsonMap, surfaceKind: string): JsonMap | null {
  return actionEntry.supported_surfaces?.[surfaceKind] ?? null;
}

function cliEntry(actionEntry: JsonMap): JsonMap | null {
  const descriptor = surfaceDescriptor(actionEntry, 'cli');
  if (!descriptor) return null;
  const projected = projectFamilyAction(actionEntry).cli;
  const metadata = PROJECTION_METADATA[actionEntry.action_id]?.cli ?? {};
  return {
    ...projected,
    action_ref: actionEntry.action_id,
    usage: metadata.usage,
    api_surface: metadata.api_surface,
    boundary_fields: metadata.boundary_fields ?? [],
    shell_key: metadata.shell_key ?? null,
  };
}

function productEntry(actionEntry: JsonMap): JsonMap | null {
  if (!surfaceDescriptor(actionEntry, 'product_entry')) return null;
  return projectFamilyAction(actionEntry).product_entry;
}

function skillEntry(actionEntry: JsonMap): JsonMap | null {
  const descriptor = surfaceDescriptor(actionEntry, 'skill');
  if (!descriptor) return null;
  const projected = projectFamilyAction(actionEntry).skill;
  const metadata = PROJECTION_METADATA[actionEntry.action_id]?.cli ?? {};
  return {
    ...projected,
    shell_key: metadata.shell_key ?? projected.command_contract_id,
    public_skill_policy: ['run_image_ppt_proof', 'run_native_ppt_proof'].includes(actionEntry.action_id)
      ? 'do_not_register_as_second_public_skill'
      : undefined,
  };
}

function mcpAction(actionEntry: JsonMap): JsonMap | null {
  const descriptor = surfaceDescriptor(actionEntry, 'mcp');
  if (!descriptor) return null;
  const projected = projectFamilyAction(actionEntry).mcp;
  const metadata = PROJECTION_METADATA[actionEntry.action_id]?.mcp ?? {};
  return {
    ...projected,
    action_id: actionEntry.action_id,
    tool_name: descriptor.tool_name,
    action_key: descriptor.action_key,
    api_surface: metadata.api_surface,
  };
}

export function getRedCubeFamilyActionCatalog() {
  return clone(ACTION_CATALOG);
}

export function buildRedCubeActionMetadata() {
  const catalog = getRedCubeFamilyActionCatalog();
  const actions = catalog.actions as JsonMap[];
  const cliCommands = actions.map(cliEntry).filter(Boolean);
  const productEntryActions = actions.map(productEntry).filter(Boolean);
  const skillCommands = actions.map(skillEntry).filter(Boolean);
  const mcpActions = actions.map(mcpAction).filter(Boolean);
  const routeDefinitions = Object.fromEntries(
    MCP_TOOLS.map((tool) => {
      const routes = Object.fromEntries(
        mcpActions
          .filter((entry) => entry.tool_name === tool.name)
          .map((entry) => [entry.action_key, entry.api_surface]),
      );
      return [tool.name, { selector: tool.selector, routes }];
    }),
  );

  return {
    surface_kind: 'redcube_action_metadata',
    generated_interface_owner: 'one-person-lab',
    domain_handler_owner: 'redcube_ai',
    owner_model: 'opl_generated_descriptors_with_rca_domain_handler_targets',
    repo_local_handler_targets: [
      'redcube_cli',
      'redcube_mcp',
      'invokeProductEntry',
      'invokeDomainEntry',
      'domain_handler',
    ],
    family_action_catalog: catalog,
    cli_commands: cliCommands,
    product_entry: productEntryActions,
    skill_commands: skillCommands,
    mcp_tools: clone(MCP_TOOLS).map(({ selector: _selector, ...tool }) => {
      const actionsForTool = mcpActions.filter((entry) => entry.tool_name === tool.name);
      return {
        ...tool,
        action_catalog_projection: {
          catalog_id: catalog.catalog_id,
          target_domain_id: catalog.target_domain_id,
          action_ids: actionsForTool.map((entry) => entry.action_id),
          action_keys: actionsForTool.map((entry) => entry.action_key),
        },
      };
    }),
    mcp_actions: mcpActions,
    mcp_route_definitions: routeDefinitions,
    parity: buildFamilyActionCatalogParity(catalog, null),
  };
}

export function findRedCubeCliCommand(command: string) {
  return buildRedCubeActionMetadata().cli_commands.find((entry) => entry.command === command) ?? null;
}
