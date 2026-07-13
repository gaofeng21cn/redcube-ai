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

function clone<T>(value: T): T {
  return structuredClone(value);
}

function surfaceDescriptor(actionEntry: JsonMap, surfaceKind: string): JsonMap | null {
  return actionEntry.supported_surfaces?.[surfaceKind] ?? null;
}

function cliEntry(actionEntry: JsonMap, projection: JsonMap): JsonMap | null {
  if (!surfaceDescriptor(actionEntry, 'cli')) return null;
  return {
    ...projection.cli,
    action_ref: actionEntry.action_id,
  };
}

function productEntry(actionEntry: JsonMap, projection: JsonMap): JsonMap | null {
  return surfaceDescriptor(actionEntry, 'product_entry')
    ? projection.product_entry
    : null;
}

function skillEntry(actionEntry: JsonMap, projection: JsonMap): JsonMap | null {
  if (!surfaceDescriptor(actionEntry, 'skill')) return null;
  return {
    ...projection.skill,
    public_skill_policy: ['run_image_ppt_proof', 'run_native_ppt_proof'].includes(actionEntry.action_id)
      ? 'do_not_register_as_second_public_skill'
      : undefined,
  };
}

function mcpAction(actionEntry: JsonMap, projection: JsonMap): JsonMap | null {
  const descriptor = surfaceDescriptor(actionEntry, 'mcp');
  if (!descriptor) return null;
  return {
    ...projection.mcp,
    action_id: actionEntry.action_id,
    tool_name: descriptor.tool_name,
    action_key: descriptor.action_key ?? actionEntry.action_id,
  };
}

export function getRedCubeFamilyActionCatalog() {
  return clone(ACTION_CATALOG);
}

export function buildRedCubeActionMetadata(workspacePath: string) {
  const catalog = getRedCubeFamilyActionCatalog();
  const actions = catalog.actions as JsonMap[];
  const projections = new Map(actions.map((action) => [
    action.action_id,
    projectFamilyAction(action, catalog.target_domain_id, workspacePath),
  ]));
  const projectionFor = (action: JsonMap) => projections.get(action.action_id) as JsonMap;
  const cliCommands = actions.map((action) => cliEntry(action, projectionFor(action))).filter(Boolean);
  const productEntryActions = actions
    .map((action) => productEntry(action, projectionFor(action)))
    .filter(Boolean);
  const skillCommands = actions.map((action) => skillEntry(action, projectionFor(action))).filter(Boolean);
  const mcpActions = actions.map((action) => mcpAction(action, projectionFor(action))).filter(Boolean);
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
          .map((entry) => [entry.action_key, entry.command]),
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
    parity: buildFamilyActionCatalogParity(catalog, workspacePath, null),
  };
}

export function findRedCubeCliCommand(command: string, workspacePath: string) {
  return buildRedCubeActionMetadata(workspacePath).cli_commands
    .find((entry) => entry.command === command) ?? null;
}
