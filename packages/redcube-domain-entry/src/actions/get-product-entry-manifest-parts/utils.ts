import { fileURLToPath } from 'node:url';

import {
  requireField,
} from '../action-utils.js';
import { readJson } from '../json-file.js';
export { safeText } from '../action-utils.js';

type SourcePartRef = {
  json_pointer: string;
  ref: string;
};

type CurrentProgramIndex = {
  canonical_truth_model?: unknown;
  source_part_refs?: SourcePartRef[];
};

type JsonContainer = Record<string, unknown> | unknown[];

type WorkspaceRootRequest = Record<string, unknown> & {
  workspace_root?: unknown;
  workspaceRoot?: unknown;
  workspace_locator?: {
    workspace_root?: unknown;
  };
};

type SkillCommandMetadata = Record<string, unknown> & {
  public_skill_policy?: unknown;
};

const CURRENT_PROGRAM_CONTRACT_URL = new URL(
  '../../../../../contracts/runtime-program/current-program.index.json',
  import.meta.url,
);
const REPO_ROOT_URL = new URL('../../../../../', import.meta.url);

function repoPathUrl(ref: string): URL {
  return new URL(ref, REPO_ROOT_URL);
}

function pointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

function childSegmentMap(sourcePartRefs: SourcePartRef[]): Map<string, Set<string>> {
  const children = new Map();
  for (const sourcePartRef of sourcePartRefs) {
    const segments = sourcePartRef.json_pointer.slice(1).split('/').filter(Boolean);
    for (let index = 0; index < segments.length; index += 1) {
      const parent = `/${segments.slice(0, index).join('/')}`.replace(/\/$/, '') || '';
      if (!children.has(parent)) children.set(parent, new Set());
      children.get(parent).add(segments[index]);
    }
  }
  return children;
}

function buildContainer(pointer: string, children: Map<string, Set<string>>): JsonContainer {
  const childSegments = children.get(pointer);
  return childSegments && [...childSegments].every((segment) => /^\d+$/.test(segment)) ? [] : {};
}

function setContainerValue(container: JsonContainer, segment: string, value: unknown): void {
  (container as Record<string, unknown>)[segment] = value;
}

function getContainerValue(container: JsonContainer, segment: string): unknown {
  return (container as Record<string, unknown>)[segment];
}

function setJsonPointerValue(
  document: JsonContainer,
  pointer: string,
  value: unknown,
  children: Map<string, Set<string>>,
): void {
  const segments = pointer.slice(1).split('/').filter(Boolean).map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
  let cursor = document;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const childPointer = `/${segments.slice(0, index + 1).map(pointerSegment).join('/')}`;
    const isLast = index === segments.length - 1;
    if (isLast) {
      setContainerValue(cursor, segment, value);
      return;
    }
    if (getContainerValue(cursor, segment) === undefined) {
      setContainerValue(cursor, segment, buildContainer(childPointer, children));
    }
    cursor = getContainerValue(cursor, segment) as JsonContainer;
  }
}

export function normalizeWorkspaceRoot(request: WorkspaceRootRequest = {}): string {
  return requireField(
    'workspace_root',
    request?.workspace_root || request?.workspaceRoot || request?.workspace_locator?.workspace_root,
  );
}

export function readCurrentProgramContract(): Record<string, unknown> {
  const index = readJson<CurrentProgramIndex>(fileURLToPath(CURRENT_PROGRAM_CONTRACT_URL));
  if (index.canonical_truth_model !== 'current_program_parts_are_canonical_sources') {
    throw new Error('current-program index must point to canonical source parts');
  }
  const sourcePartRefs = index.source_part_refs || [];
  const children = childSegmentMap(sourcePartRefs);
  const currentProgram: Record<string, unknown> = {};
  for (const sourcePartRef of sourcePartRefs) {
    setJsonPointerValue(
      currentProgram,
      sourcePartRef.json_pointer,
      readJson(fileURLToPath(repoPathUrl(sourcePartRef.ref))),
      children,
    );
  }
  return currentProgram;
}

export function buildSkillCommandContracts(
  actionMetadata: { skill_commands: SkillCommandMetadata[] },
): Array<Record<string, unknown>> {
  return actionMetadata.skill_commands.map((contract) => {
    const result: Record<string, unknown> = {
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

export function buildActionMetadataProjection(actionMetadata: Record<string, unknown>): Record<string, unknown> {
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
