// @ts-nocheck
import {
  buildFamilyActionCatalogParity,
  normalizeFamilyActionCatalog,
  projectFamilyAction,
} from 'opl-framework/family-action-catalog';

import { readJson } from './json-file.js';

type JsonMap = Record<string, any>;

export const FAMILY_ACTION_CATALOG_CONTRACT_REF = 'contracts/action_catalog.json';

const ACTION_CATALOG_URL = new URL(
  '../../../../contracts/action_catalog.json',
  import.meta.url,
);
const ACTION_CATALOG = readJson<JsonMap>(ACTION_CATALOG_URL);

if (!normalizeFamilyActionCatalog(ACTION_CATALOG)) {
  throw new Error(`Invalid RedCube action catalog: ${FAMILY_ACTION_CATALOG_CONTRACT_REF}`);
}

const CLI_METADATA: Record<string, JsonMap> = {
  invoke_product_entry: {
    usage_suffix: '--workspace-root <dir> --entry-session-id <id> --overlay <overlay-id> --topic-id <id> --deliverable-id <id> [--profile-id <profile-id>] [--title <text>] [--goal <text>] [--task-intent <run_opl_stage_execution_plan|run_deliverable_route>] [--route <stage>] [--user-intent <text>] [--lifecycle-policy <policy>] [--stop-after-stage <stage>]',
    api_surface: 'invokeProductEntry',
    boundary_fields: ['workspaceRoot', 'entrySessionId', 'topicId', 'deliverableId'],
    shell_key: 'direct',
  },
  export_domain_handler: {
    usage_suffix: '--workspace-root <dir> [--workspace-receipt-scaleout-root <dir>[,<dir>...]] --format json',
    api_surface: 'exportDomainHandler',
    boundary_fields: ['workspaceRoot', 'workspaceReceiptScaleoutRoot'],
    shell_key: 'domain_handler_export',
  },
  dispatch_domain_handler: {
    usage_suffix: '--task <task.json> --format json',
    api_surface: 'dispatchDomainHandler',
    boundary_fields: ['task'],
    shell_key: 'domain_handler_dispatch',
  },
  run_image_ppt_proof: {
    usage_suffix: '--output-dir <dir> [--mock-image-generation|--live-image-generation] [--skip-system-deps] [--style-reference-dir <dir>]',
    api_surface: 'repo_owned_image_ppt_proof_runner',
    boundary_fields: ['outputDir', 'styleReferenceDir'],
    shell_key: 'image_ppt_proof',
  },
  run_native_ppt_proof: {
    usage_suffix: '--workspace-root <dir> --entry-session-id <id> --topic-id <id> --deliverable-id <id> [--route <author_pptx_native|repair_pptx_native>] [--stop-after-stage <stage>]',
    api_surface: 'runNativePptProductEntryProof',
    boundary_fields: ['workspaceRoot', 'entrySessionId', 'topicId', 'deliverableId'],
    shell_key: 'native_ppt_proof',
  },
};

const MCP_API_SURFACES: Record<string, string> = {
  invoke_product_entry: 'invokeProductEntry',
  invoke_domain_entry: 'invokeDomainEntry',
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function surfaceDescriptor(actionEntry: JsonMap, surfaceKind: string): JsonMap | null {
  return actionEntry.supported_surfaces?.[surfaceKind] ?? null;
}

function cliEntry(actionEntry: JsonMap): JsonMap | null {
  if (!surfaceDescriptor(actionEntry, 'cli')) return null;
  const projected = projectFamilyAction(actionEntry).cli;
  const metadata = CLI_METADATA[actionEntry.action_id] ?? {};
  return {
    ...projected,
    action_ref: actionEntry.action_id,
    usage: metadata.usage_suffix ? `${projected.command} ${metadata.usage_suffix}` : projected.command,
    api_surface: metadata.api_surface,
    boundary_fields: metadata.boundary_fields ?? [],
    shell_key: metadata.shell_key ?? null,
  };
}

function productEntry(actionEntry: JsonMap): JsonMap | null {
  return surfaceDescriptor(actionEntry, 'product_entry')
    ? projectFamilyAction(actionEntry).product_entry
    : null;
}

function skillEntry(actionEntry: JsonMap): JsonMap | null {
  if (!surfaceDescriptor(actionEntry, 'skill')) return null;
  const projected = projectFamilyAction(actionEntry).skill;
  return {
    ...projected,
    shell_key: CLI_METADATA[actionEntry.action_id]?.shell_key ?? projected.command_contract_id,
    public_skill_policy: ['run_image_ppt_proof', 'run_native_ppt_proof'].includes(actionEntry.action_id)
      ? 'do_not_register_as_second_public_skill'
      : undefined,
  };
}

function mcpAction(actionEntry: JsonMap): JsonMap | null {
  const descriptor = surfaceDescriptor(actionEntry, 'mcp');
  if (!descriptor) return null;
  return {
    ...projectFamilyAction(actionEntry).mcp,
    action_id: actionEntry.action_id,
    tool_name: descriptor.tool_name,
    action_key: descriptor.action_key,
    api_surface: MCP_API_SURFACES[actionEntry.action_id],
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
  const mcpTools = [...new Map(
    mcpActions.map((entry) => [entry.tool_name, {
      name: entry.tool_name,
      description: 'RCA product-entry and service-safe domain handler target.',
    }]),
  ).values()].map((tool) => {
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
  });
  const routeDefinitions = Object.fromEntries(mcpTools.map((tool) => [
    tool.name,
    {
      selector: 'action',
      routes: Object.fromEntries(
        mcpActions
          .filter((entry) => entry.tool_name === tool.name)
          .map((entry) => [entry.action_key, entry.api_surface]),
      ),
    },
  ]));

  return {
    surface_kind: 'redcube_action_metadata',
    generated_interface_owner: 'one-person-lab',
    domain_handler_owner: 'redcube_ai',
    owner_model: 'opl_generated_descriptors_with_rca_domain_handler_targets',
    repo_local_handler_targets: [
      'redcube_cli',
      'invokeProductEntry',
      'invokeDomainEntry',
      'domain_handler',
    ],
    family_action_catalog: catalog,
    cli_commands: cliCommands,
    product_entry: productEntryActions,
    skill_commands: skillCommands,
    mcp_tools: mcpTools,
    mcp_actions: mcpActions,
    mcp_route_definitions: routeDefinitions,
    parity: buildFamilyActionCatalogParity(catalog, null),
  };
}

export function findRedCubeCliCommand(command: string) {
  return buildRedCubeActionMetadata().cli_commands.find((entry) => entry.command === command) ?? null;
}
