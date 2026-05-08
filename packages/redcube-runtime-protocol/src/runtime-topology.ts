import type { CodexRuntimeTopology } from './types.js';

const CODEX_RUNTIME_TOPOLOGY = Object.freeze({
  schema_version: 1,
  executor_backend: 'codex_cli',
  execution_shape: 'structured_call',
  runtime_substrate_owner: 'Codex CLI',
  runtime_substrate_surface: 'codex_cli_runtime',
  deployment_host: 'codex_local_operator_host',
  deployment_host_status: 'active_primary',
  gateway_role: 'visual_deliverable_domain_gateway',
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
