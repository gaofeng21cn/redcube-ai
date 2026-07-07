import type { CodexRuntimeTopology } from './types.js';

const CODEX_RUNTIME_TOPOLOGY = Object.freeze({
  schema_version: 1,
  executor_backend: 'codex_cli',
  execution_shape: 'structured_call',
  runtime_substrate_owner: 'Codex CLI',
  runtime_substrate_surface: 'codex_cli_runtime',
  generic_executor_adapter_owner: 'one-person-lab',
  domain_authority_owner: 'redcube_ai',
  rca_runtime_role: 'codex_concrete_executor_receipt_refs_not_generic_runtime_owner',
  rca_owns_generic_runtime: false,
  rca_owns_generic_executor_adapter: false,
  rca_owns_generic_attempt_ledger: false,
  deployment_host: 'codex_local_operator_host',
  deployment_host_status: 'active_primary',
  domain_entry_protocol_role: 'visual_deliverable_domain_entry_protocol_boundary',
  domain_harness_os: 'RedCube Domain Harness OS',
  family_pack_boundary: 'family_profile_pack_harness_execution',
  product_mode: 'auto_only',
  default_formal_entry: 'CLI',
  supported_protocol_layer: ['MCP'],
  internal_controller_surface: 'controller',
  controller_repo_verified: false,
} satisfies CodexRuntimeTopology);

export function buildCodexRuntimeTopology(): CodexRuntimeTopology {
  return {
    ...CODEX_RUNTIME_TOPOLOGY,
    supported_protocol_layer: [...CODEX_RUNTIME_TOPOLOGY.supported_protocol_layer],
  };
}
