// @ts-nocheck
import {
  buildFamilyActionCatalogParity,
  normalizeFamilyActionCatalog,
  projectFamilyAction,
} from 'opl-framework-shared/family-action-catalog';

import {
  PRODUCT_INVOKE_COMMAND,
  PRODUCT_MANIFEST_COMMAND,
  PRODUCT_SESSION_COMMAND,
  PRODUCT_START_COMMAND,
  PRODUCT_STATUS_COMMAND,
} from './get-product-entry-manifest-parts/policy.js';

type JsonMap = Record<string, any>;

const PRODUCT_PREFLIGHT_COMMAND = 'redcube product preflight';
const PRODUCT_SIDECAR_EXPORT_COMMAND = 'redcube product sidecar export';
const PRODUCT_SIDECAR_DISPATCH_COMMAND = 'redcube product sidecar dispatch';
const IMAGE_PPT_PROOF_COMMAND = 'redcube image-ppt proof';
const NATIVE_PPT_PROOF_COMMAND = 'redcube native-ppt proof';
const SERVICE_SAFE_DOMAIN_ENTRY_COMMAND = 'redcube service-safe domain entry';

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
    description: 'Grouped deliverable lifecycle execution surface for create/get/run/managed route actions across one deliverable boundary.',
  },
  {
    name: 'redcube_review',
    selector: 'action',
    description: 'Grouped deliverable boundary review surface for publication projection, audit, review mutation, and runtime watch actions.',
  },
  {
    name: 'redcube_product_entry',
    selector: 'action',
    description: 'Grouped product-entry surface for status, start, preflight, direct, session, manifest, sidecar, and domain-entry actions. OPL-hosted stage runtime handoff is exposed through framework-side contracts, not a public CLI/MCP action.',
  },
];

const PROJECTION_METADATA: Record<string, JsonMap> = {
  get_product_status: {
    cli: help('redcube product status --workspace-root <dir>', 'getProductStatus', ['workspaceRoot'], 'status'),
    mcp: surface('redcube_product_entry', 'get_product_status', 'getProductStatus'),
  },
  get_product_start: {
    cli: help('redcube product start --workspace-root <dir>', 'getProductStart', ['workspaceRoot']),
    mcp: surface('redcube_product_entry', 'get_product_start', 'getProductStart'),
  },
  get_product_preflight: {
    cli: help('redcube product preflight --workspace-root <dir>', 'getProductPreflight', ['workspaceRoot']),
    mcp: surface('redcube_product_entry', 'get_product_preflight', 'getProductPreflight'),
  },
  invoke_product_entry: {
    cli: help(
      'redcube product invoke --workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>] [--task-intent <run_managed_deliverable|run_deliverable_route>] [--route <stage>] [--user-intent <text>] [--lifecycle-policy <policy>] [--stop-after-stage <stage>]',
      'invokeProductEntry',
      ['workspaceRoot', 'entrySessionId', 'topicId', 'deliverableId'],
      'direct',
    ),
    mcp: surface('redcube_product_entry', 'invoke_product_entry', 'invokeProductEntry'),
  },
  get_product_entry_session: {
    cli: help('redcube product session --entry-session-id <id>', 'getProductEntrySession', ['entrySessionId'], 'session'),
    mcp: surface('redcube_product_entry', 'get_product_entry_session', 'getProductEntrySession'),
  },
  get_product_entry_manifest: {
    cli: help('redcube product manifest --workspace-root <dir>', 'getProductEntryManifest', ['workspaceRoot']),
    mcp: surface('redcube_product_entry', 'get_product_entry_manifest', 'getProductEntryManifest'),
  },
  export_product_sidecar: {
    cli: help(
      'redcube product sidecar export --workspace-root <dir> --format json',
      'exportProductSidecar',
      ['workspaceRoot'],
      'sidecar_export',
    ),
    mcp: surface('redcube_product_entry', 'export_product_sidecar', 'exportProductSidecar'),
  },
  dispatch_product_sidecar: {
    cli: help(
      'redcube product sidecar dispatch --task <task.json> --format json',
      'dispatchProductSidecar',
      ['task'],
      'sidecar_dispatch',
    ),
    mcp: surface('redcube_product_entry', 'dispatch_product_sidecar', 'dispatchProductSidecar'),
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

const ACTION_CATALOG = normalizeFamilyActionCatalog({
  surface_kind: 'family_action_catalog',
  version: 'family-action-catalog.v1',
  catalog_id: 'redcube_product_entry_action_catalog',
  target_domain_id: 'redcube_ai',
  owner: 'redcube_ai',
  authority_boundary: {
    domain_truth_owner: 'redcube_ai',
    opl_role: 'projection_consumer_only',
    write_policy: 'no_domain_truth_writes',
  },
  actions: [
    action({
      actionId: 'get_product_status',
      title: 'Read RedCube product status',
      summary: '读取 RedCube agent-facing product-entry overview；`status` 是当前 product overview 命令，用于查看 direct / session 入口、当前主线状态和 OPL-hosted stage runtime handoff 合同。',
      effect: 'read_only',
      command: PRODUCT_STATUS_COMMAND,
      surfaceKind: 'product_status',
      inputSchemaRef: 'schema:redcube.product_status.request.v1',
      outputSchemaRef: 'schema:redcube.product_status.response.v1',
      supportedSurfaces: {
        cli: { surface_kind: 'product_status' },
        mcp: { tool_name: 'redcube_product_entry', action_key: 'get_product_status' },
        skill: { command_contract_id: 'get_product_status', surface_kind: 'product_status' },
        product_entry: { action_key: 'get_product_status', surface_kind: 'product_status' },
      },
    }),
    action({
      actionId: 'get_product_start',
      title: 'Read RedCube product start surface',
      summary: '读取统一的 product-entry start surface，直接查看 overview / direct / OPL-hosted handoff / resume 四类启动方式。',
      effect: 'read_only',
      command: PRODUCT_START_COMMAND,
      surfaceKind: 'product_entry_start',
      inputSchemaRef: 'schema:redcube.product_start.request.v1',
      outputSchemaRef: 'schema:redcube.product_start.response.v1',
      supportedSurfaces: {
        cli: { surface_kind: 'product_entry_start' },
        mcp: { tool_name: 'redcube_product_entry', action_key: 'get_product_start' },
        product_entry: { action_key: 'get_product_start', surface_kind: 'product_entry_start' },
      },
    }),
    action({
      actionId: 'get_product_preflight',
      title: 'Read RedCube product preflight',
      summary: '读取当前 direct product-entry overview contract 的开机前真实自检面。',
      effect: 'read_only',
      command: PRODUCT_PREFLIGHT_COMMAND,
      surfaceKind: 'product_entry_preflight',
      inputSchemaRef: 'schema:redcube.product_preflight.request.v1',
      outputSchemaRef: 'schema:redcube.product_preflight.response.v1',
      supportedSurfaces: {
        cli: { surface_kind: 'product_entry_preflight' },
        mcp: { tool_name: 'redcube_product_entry', action_key: 'get_product_preflight' },
        product_entry: { action_key: 'get_product_preflight', surface_kind: 'product_entry_preflight' },
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
      summary: '读取 product-entry session continuity surface，并回看 latest managed progress / review / projection。',
      effect: 'read_only',
      command: PRODUCT_SESSION_COMMAND,
      surfaceKind: 'product_entry_session',
      inputSchemaRef: 'schema:redcube.product_entry.session.request.v1',
      outputSchemaRef: 'schema:redcube.product_entry.session.response.v1',
      workspaceLocatorFields: ['entry_session_id'],
      supportedSurfaces: {
        cli: { surface_kind: 'product_entry_session' },
        mcp: { tool_name: 'redcube_product_entry', action_key: 'get_product_entry_session' },
        skill: { command_contract_id: 'get_product_entry_session', surface_kind: 'product_entry_session' },
        product_entry: { action_key: 'continue_session', surface_kind: 'product_entry_session' },
      },
    }),
    action({
      actionId: 'get_product_entry_manifest',
      title: 'Read RedCube product-entry manifest',
      summary: '读取当前 direct product-entry shell 的 machine-readable manifest，并查看 direct / OPL-hosted handoff / session 三个入口面。',
      effect: 'read_only',
      command: PRODUCT_MANIFEST_COMMAND,
      surfaceKind: 'product_entry_manifest',
      inputSchemaRef: 'schema:redcube.product_entry.manifest.request.v1',
      outputSchemaRef: 'schema:redcube.product_entry.manifest.response.v2',
      supportedSurfaces: {
        cli: { surface_kind: 'product_entry_manifest' },
        mcp: { tool_name: 'redcube_product_entry', action_key: 'get_product_entry_manifest' },
        product_entry: { action_key: 'get_product_entry_manifest', surface_kind: 'product_entry_manifest' },
      },
    }),
    action({
      actionId: 'export_product_sidecar',
      title: 'Export RedCube product sidecar adapter',
      summary: '导出 RCA product sidecar adapter，供 OPL typed family queue / configured family runtime provider 索引；不授予 visual truth、review verdict 或 publication gate 写权。',
      effect: 'read_only',
      command: PRODUCT_SIDECAR_EXPORT_COMMAND,
      surfaceKind: 'product_sidecar_export',
      inputSchemaRef: 'schema:redcube.product_sidecar.export.request.v1',
      outputSchemaRef: 'schema:redcube.product_sidecar.export.response.v1',
      supportedSurfaces: {
        cli: { surface_kind: 'product_sidecar_export' },
        mcp: { tool_name: 'redcube_product_entry', action_key: 'export_product_sidecar' },
        product_entry: { action_key: 'export_product_sidecar', surface_kind: 'product_sidecar_export' },
      },
      authorityBoundary: {
        opl_role: 'typed_family_control_plane',
        provider_role: 'stage_attempt_queue_wakeup_transport',
        write_policy: 'read_projection_only',
      },
    }),
    action({
      actionId: 'dispatch_product_sidecar',
      title: 'Dispatch RedCube product sidecar guarded action',
      summary: '调度 RCA-owned guarded actions：runtime watch、supervise managed run、product-entry continuation、no-regression evidence、domain owner receipt、visual memory writeback、workspace lifecycle receipt、notification receipt；禁止写 visual truth、review verdict 或 publication gate。',
      effect: 'mutating',
      command: PRODUCT_SIDECAR_DISPATCH_COMMAND,
      surfaceKind: 'product_sidecar_dispatch',
      inputSchemaRef: 'schema:redcube.product_sidecar.dispatch.request.v1',
      outputSchemaRef: 'schema:redcube.product_sidecar.dispatch.response.v1',
      supportedSurfaces: {
        cli: { surface_kind: 'product_sidecar_dispatch' },
        mcp: { tool_name: 'redcube_product_entry', action_key: 'dispatch_product_sidecar' },
        product_entry: { action_key: 'dispatch_product_sidecar', surface_kind: 'product_sidecar_dispatch' },
      },
      authorityBoundary: {
        allowed_actions: [
          'runtime_watch',
          'supervise_managed_run',
          'product_entry_continuation',
          'emit_no_regression_evidence',
          'emit_domain_owner_receipt',
          'apply_visual_memory_writeback',
          'apply_visual_workspace_lifecycle',
          'notification_receipt',
        ],
        forbidden_writes: [
          'visual_truth',
          'review_verdict',
          'publication_gate',
          'canonical_artifacts',
        ],
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
    'RCA owns this action catalog as a projection surface; OPL consumes it without writing RedCube domain truth.',
    'CLI help, MCP tool routing metadata, skill command contracts, and product-entry operator actions derive from this catalog.',
  ],
});

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
