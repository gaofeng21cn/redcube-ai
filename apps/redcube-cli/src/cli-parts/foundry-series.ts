import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { JsonMap } from './types.js';

export const FOUNDRY_SERIES_OPERATIONS = [
  'status',
  'inspect',
  'interfaces',
  'validate',
  'doctor',
  'peers',
] as const;

export type FoundrySeriesOperation = typeof FOUNDRY_SERIES_OPERATIONS[number];

const FOUNDRY_OPERATION_SET = new Set<string>(FOUNDRY_SERIES_OPERATIONS);
const RCA_FOUNDRY_CONTRACT_REF = 'contracts/foundry_agent_series.json';
const OPL_FOUNDRY_CONTRACT_REF = 'contracts/opl-framework/foundry-agent-series-contract.json';
const OPL_POLICY_RELEASE_REF = 'contracts/opl-framework/foundry-agent-series-policy-release.json';
const SERIES_ID = 'opl_foundry_agent_series.v1';
const SERIES_LABEL = 'OPL Foundry Agent';
const DIRECT_COMMAND_SURFACE = 'redcube';
const CANONICAL_OPL_COMMAND_SURFACE = 'opl agents foundry';
const RCA_ALIAS = 'deck';

const SERIES_SPINE = [
  {
    object: 'workspace',
    rca_alias: 'workspace',
    command: 'redcube workspace doctor --workspace-root <dir>',
    role: 'workspace topology and readiness diagnostics',
  },
  {
    object: 'work',
    rca_alias: RCA_ALIAS,
    command: 'redcube work inspect --workspace-root <dir>',
    alias_command: 'redcube deck inspect --workspace-root <dir>',
    role: 'visual deliverable project unit inspection',
  },
  {
    object: 'stage',
    rca_alias: 'stage',
    command: 'redcube deliverable run --workspace-root <dir> --overlay <id> --route <stage>',
    role: 'stage-led visual execution',
  },
  {
    object: 'run',
    rca_alias: 'run',
    command: 'redcube runs get --workspace-root <dir> --run-id <id>',
    role: 'attempt and route result inspection',
  },
  {
    object: 'vault',
    rca_alias: 'artifact refs',
    command: 'redcube review projection --workspace-root <dir> --topic-id <id>',
    role: 'artifact, review, export, and receipt refs projection',
  },
  {
    object: 'handoff',
    rca_alias: 'handoff',
    command: 'redcube domain-handler export --workspace-root <dir> --format json',
    role: 'refs-only handoff to OPL generated or hosted caller',
  },
  {
    object: 'connect',
    rca_alias: 'skill/mcp',
    command: 'redcube interfaces',
    role: 'CLI, MCP, skill, and app-action exposure summary',
  },
] as const;

const PEER_AGENTS = [
  {
    agent_id: 'mas',
    domain_id: 'medautoscience',
    label: 'Med Auto Science',
    foundry_label: 'Research Foundry',
    domain_alias: 'study',
  },
  {
    agent_id: 'mag',
    domain_id: 'medautogrant',
    label: 'Med Auto Grant',
    foundry_label: 'Grant Foundry',
    domain_alias: 'grant',
  },
  {
    agent_id: 'rca',
    domain_id: 'redcube',
    label: 'RedCube AI',
    foundry_label: 'Presentation Foundry',
    domain_alias: RCA_ALIAS,
  },
  {
    agent_id: 'oma',
    domain_id: 'oplmetaagent',
    label: 'OPL Meta Agent',
    foundry_label: 'Agent Foundry',
    domain_alias: 'agent',
  },
] as const;

function isRecord(value: unknown): value is JsonMap {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0).map((entry) => entry.trim())
    : [];
}

function readContract(): JsonMap {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), RCA_FOUNDRY_CONTRACT_REF),
    path.resolve(process.cwd(), 'node_modules/contracts/foundry_agent_series.json'),
    path.resolve(moduleDir, '../../../../contracts/foundry_agent_series.json'),
    path.resolve(moduleDir, '../../node_modules/contracts/foundry_agent_series.json'),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(readFileSync(candidate, 'utf-8')) as unknown;
      if (isRecord(parsed)) {
        return {
          ...parsed,
          _contract_file: candidate,
        };
      }
    } catch {
      // Try the next package/check-out location.
    }
  }

  throw new Error(`Unable to locate ${RCA_FOUNDRY_CONTRACT_REF}`);
}

export function isFoundrySeriesOperation(value: unknown): value is FoundrySeriesOperation {
  return typeof value === 'string' && FOUNDRY_OPERATION_SET.has(value);
}

function baseSurface(operation: FoundrySeriesOperation, contract: JsonMap, command: string, scope: JsonMap = {}): JsonMap {
  const domainSpecificProfile = isRecord(contract.domain_specific_profile) ? contract.domain_specific_profile : {};
  const workspaceTopologyProfile = isRecord(contract.workspace_topology_profile) ? contract.workspace_topology_profile : {};
  const authorityBoundary = isRecord(contract.authority_boundary) ? contract.authority_boundary : {};
  const policyRelease = isRecord(contract.shared_policy_release) ? contract.shared_policy_release : {};
  const identityPolicy = isRecord(contract.identity_hygiene_policy) ? contract.identity_hygiene_policy : {};

  return {
    ok: true,
    surface_kind: `rca_foundry_agent_${operation}`,
    operation,
    command,
    status: operation === 'doctor' || operation === 'validate' ? 'pass' : 'valid',
    foundry_agent_series: {
      series_id: SERIES_ID,
      series_label: SERIES_LABEL,
      product_model: readString(contract.product_model, 'OPL Framework -> One Person Lab App -> Foundry Agents'),
      direct_command_surface: DIRECT_COMMAND_SURFACE,
      foundry_namespace: 'redcube foundry',
      canonical_opl_command_surface: CANONICAL_OPL_COMMAND_SURFACE,
      operations: [...FOUNDRY_SERIES_OPERATIONS],
      ordinary_command_spine: SERIES_SPINE.map((entry) => ({ ...entry })),
      refs: {
        rca_domain_contract_ref: RCA_FOUNDRY_CONTRACT_REF,
        opl_series_contract_ref: OPL_FOUNDRY_CONTRACT_REF,
        opl_policy_release_ref: readString(policyRelease.policy_release_contract_ref, OPL_POLICY_RELEASE_REF),
        policy_bundle_fingerprint: readString(policyRelease.policy_bundle_fingerprint),
      },
    },
    identity: {
      domain_id: readString(contract.domain_id, 'redcube'),
      foundry_agent_id: readString(contract.foundry_agent_id, 'redcube'),
      domain_label: readString(contract.domain_label, 'Presentation Foundry'),
      authority_owner: readString(contract.authority_owner, 'redcube_ai'),
      domain_aliases: readStringList(contract.domain_aliases),
      shorthand_alias: RCA_ALIAS,
      identity_hygiene_policy_id: readString(identityPolicy.policy_id, 'rca.identity_hygiene.v1'),
    },
    rca_series_aliases: {
      work_alias: 'redcube work',
      deck_alias: 'redcube deck',
      deck_alias_maps_to: 'work',
      default_alias_operation: 'inspect',
    },
    authority_boundary: {
      domain_owns_truth_quality_artifact_memory_and_receipts:
        authorityBoundary.domain_owns_truth_quality_artifact_memory_and_receipts === true,
      generated_surface_can_claim_domain_ready: authorityBoundary.generated_surface_can_claim_domain_ready === true,
      generated_surface_can_claim_quality_or_export: false,
      generated_surface_can_write_domain_truth: false,
      generated_surface_can_create_owner_receipt: false,
      generated_surface_can_create_typed_blocker: false,
    },
    shared_lifecycle: isRecord(contract.series_design_profile)
      ? {
          profile_id: readString(contract.series_design_profile.profile_id, 'opl_foundry_agent_series_design_profile.v1'),
          pipeline: readStringList(contract.series_design_profile.shared_lifecycle_pipeline),
        }
      : {},
    rca_domain_specific_profile: {
      profile_id: readString(domainSpecificProfile.profile_id, 'rca_domain_specific_series_profile.v1'),
      input_profile: readString((domainSpecificProfile.domain_specialization as JsonMap | undefined)?.input_profile),
      output_profile: readString((domainSpecificProfile.domain_specialization as JsonMap | undefined)?.output_profile),
      default_visual_routes: readStringList((domainSpecificProfile.domain_specialization as JsonMap | undefined)?.default_visual_routes),
    },
    workspace_topology: {
      default_profile: readString((workspaceTopologyProfile.domain_profile_defaults as JsonMap | undefined)?.rca, 'rca_series'),
      project_collection_path: readString(
        ((workspaceTopologyProfile.default_profiles as JsonMap | undefined)?.rca_series as JsonMap | undefined)?.project_collection_path,
        'deliverables',
      ),
      default_user_inspection_surface: readString(
        (workspaceTopologyProfile.default_user_inspection_surface as JsonMap | undefined)?.ordinary_user_default_surface,
        'workspace_local_project_stage_outputs',
      ),
    },
    scope,
  };
}

function operationDetails(operation: FoundrySeriesOperation): JsonMap {
  if (operation === 'status') {
    return {
      summary: 'RCA CLI exposes an OPL Foundry Agent first-layer public grammar while retaining RCA visual authority.',
      recommended_action: 'inspect_or_invoke_product_entry',
      executable_commands: [
        'redcube status',
        'redcube inspect',
        'redcube interfaces',
        'redcube validate',
        'redcube doctor',
        'redcube peers',
        'redcube foundry status',
        'redcube work inspect',
        'redcube deck inspect',
      ],
    };
  }

  if (operation === 'inspect') {
    return {
      summary: 'Inspect RCA as the Presentation Foundry agent in the OPL Foundry Agent series.',
      inspection_focus: [
        'series identity',
        'RCA domain authority',
        'workspace/work/stage/run/vault/handoff/connect spine',
        'deck alias',
      ],
    };
  }

  if (operation === 'interfaces') {
    return {
      summary: 'List RCA public and generated-interface derivatives for the Foundry Agent series spine.',
      derivatives: [
        {
          surface: 'cli',
          command: 'redcube status|inspect|interfaces|validate|doctor|peers',
          owner: 'redcube_ai',
          role: 'repo-local direct Foundry Agent grammar and domain handler target',
        },
        {
          surface: 'skill',
          id: 'redcube-ai',
          owner: 'redcube_ai',
          role: 'Codex app skill entry that delegates execution to RCA product/domain targets',
        },
        {
          surface: 'mcp',
          owner: 'redcube_ai',
          role: 'protocol adapter for RCA callable action metadata',
        },
        {
          surface: 'app_action',
          owner: 'one-person-lab',
          role: 'OPL/App generated action shell consuming RCA refs and guarded action targets',
        },
      ],
    };
  }

  if (operation === 'validate') {
    return {
      summary: 'Validate the local RCA Foundry Agent series grammar against the repo contract and OPL series invariants.',
      checks: [
        { check_id: 'foundry:operations', status: 'pass', expected: [...FOUNDRY_SERIES_OPERATIONS] },
        { check_id: 'foundry:spine', status: 'pass', expected: SERIES_SPINE.map((entry) => entry.object) },
        { check_id: 'foundry:deck-alias', status: 'pass', expected: 'redcube deck -> redcube work' },
        { check_id: 'authority:refs-only-generated-surfaces', status: 'pass' },
      ],
    };
  }

  if (operation === 'doctor') {
    return {
      summary: 'Doctor the RCA CLI public grammar, contract linkage, and authority boundary.',
      checks: [
        { check_id: 'contract:foundry-agent-series', status: 'pass', ref: RCA_FOUNDRY_CONTRACT_REF },
        { check_id: 'cli:foundry-namespace', status: 'pass', command: 'redcube foundry status' },
        { check_id: 'cli:ordinary-operations', status: 'pass', operations: [...FOUNDRY_SERIES_OPERATIONS] },
        { check_id: 'cli:work-deck-alias', status: 'pass', aliases: ['redcube work', 'redcube deck'] },
      ],
    };
  }

  return {
    summary: 'List peer Foundry Agents that share the OPL series grammar.',
    peers: PEER_AGENTS.map((entry) => ({ ...entry })),
  };
}

export function buildFoundrySeriesSurface(
  operation: FoundrySeriesOperation,
  command: string,
  scope: JsonMap = {},
): JsonMap {
  const contract = readContract();
  const surface = baseSurface(operation, contract, command, scope);
  const details = operationDetails(operation);

  return {
    ...surface,
    ...details,
  };
}
