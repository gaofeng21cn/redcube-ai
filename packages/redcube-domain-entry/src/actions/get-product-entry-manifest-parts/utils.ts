// @ts-nocheck
import {
  readJson,
  requireField,
} from '../action-utils.js';
export { safeText } from '../action-utils.js';

const CURRENT_PROGRAM_CONTRACT_URL = new URL(
  '../../../../../contracts/runtime-program/current-program.json',
  import.meta.url,
);

export function normalizeWorkspaceRoot(request) {
  return requireField(
    'workspace_root',
    request?.workspace_root || request?.workspaceRoot || request?.workspace_locator?.workspace_root,
  );
}

export function readCurrentProgramContract() {
  return readJson(CURRENT_PROGRAM_CONTRACT_URL);
}

export function buildSkillCommandContracts(actionMetadata) {
  return actionMetadata.skill_commands.map((contract) => {
    const result = {
      action_id: contract.action_id,
      command_contract_id: contract.command_contract_id,
      command: contract.command,
      shell_key: contract.shell_key,
      target_surface_kind: contract.surface_kind,
      required_fields: contract.required_fields,
      effect: contract.effect,
      summary: contract.summary,
    };
    if (contract.public_skill_policy) {
      result.public_skill_policy = contract.public_skill_policy;
    }
    return result;
  });
}

export function buildActionMetadataProjection(actionMetadata) {
  return {
    surface_kind: 'redcube_action_metadata_projection',
    product_entry: actionMetadata.product_entry,
    cli_commands: actionMetadata.cli_commands,
    mcp_tools: actionMetadata.mcp_tools,
    mcp_actions: actionMetadata.mcp_actions,
    skill_commands: actionMetadata.skill_commands,
    generated_interface_owner: actionMetadata.generated_interface_owner,
    domain_handler_owner: actionMetadata.domain_handler_owner,
    owner_model: actionMetadata.owner_model,
    repo_local_handler_targets: actionMetadata.repo_local_handler_targets,
  };
}
