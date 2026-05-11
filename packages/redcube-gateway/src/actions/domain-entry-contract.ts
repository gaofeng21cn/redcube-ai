// @ts-nocheck
import {
  buildDomainEntryCommandCatalog,
  buildFamilyDomainEntryContract,
  buildFamilyUserInteractionContract,
  buildSharedHandoff,
  buildSharedHandoffReturnSurface,
} from 'opl-framework-shared/family-entry-contracts';

export const REDCUBE_DOMAIN_ENTRY_ADAPTER = 'RedCubeDomainEntry';
export const PRODUCT_ENTRY_KIND = 'redcube_product_entry';
export const RCA_DOMAIN_AGENT_ENTRY_SPEC_V1 = {
  surface_kind: 'domain_agent_entry_spec',
  agent_id: 'rca',
  title: 'RedCube Agent Entry (RCA)',
  description: (
    'RCA domain agent entry spec for RedCube visual deliverable loops, '
    + 'with Codex as the default concrete executor.'
  ),
  default_engine: 'codex',
  workspace_requirement: 'required',
  locator_schema: {
    required_fields: ['workspace_root'],
    optional_fields: ['entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
  },
  codex_entry_strategy: 'domain_agent_entry',
  artifact_conventions: 'deck_and_visual_delivery',
  progress_conventions: 'deliverable_build_narration',
  entry_command: 'redcube product status',
  manifest_command: 'redcube product manifest',
};

export function buildRedCubeDomainEntryContract({
  productManifestCommand,
  productStatusCommand,
  productStartCommand,
  productInvokeCommand,
  productSessionCommand,
  serviceSafeDomainEntryContractRef,
  productEntryContractRef,
  oplHostedProductEntryContractRef,
  managedProductEntryContractRef,
}) {
  const commandCatalog = buildDomainEntryCommandCatalog([
    {
      command: productManifestCommand,
      required_fields: ['workspace_root'],
      extra_payload: {
        gateway_action: 'getProductEntryManifest',
        target_surface_kind: 'product_entry_manifest',
      },
    },
    {
      command: productStatusCommand,
      required_fields: ['workspace_root'],
      extra_payload: {
        gateway_action: 'getProductStatus',
        target_surface_kind: 'product_status',
      },
    },
    {
      command: productStartCommand,
      required_fields: ['workspace_root'],
      extra_payload: {
        gateway_action: 'getProductStart',
        target_surface_kind: 'product_entry_start',
      },
    },
    {
      command: productInvokeCommand,
      required_fields: ['workspace_root', 'entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
      optional_fields: ['profile_id', 'title', 'goal', 'task_intent', 'route', 'user_intent', 'stop_after_stage'],
      extra_payload: {
        gateway_action: 'invokeProductEntry',
        target_surface_kind: 'product_entry',
      },
    },
    {
      command: productSessionCommand,
      required_fields: ['entry_session_id'],
      extra_payload: {
        gateway_action: 'getProductEntrySession',
        target_surface_kind: 'product_entry_session',
      },
    },
  ]);

  return buildFamilyDomainEntryContract({
    entry_adapter: REDCUBE_DOMAIN_ENTRY_ADAPTER,
    service_safe_surface_kind: 'domain_entry',
    product_entry_builder_command: productManifestCommand,
    product_entry_kind: PRODUCT_ENTRY_KIND,
    supported_entry_modes: ['direct', 'opl_hosted', 'session'],
    supported_commands: commandCatalog.supported_commands,
    command_contracts: commandCatalog.command_contracts,
    extra_payload: {
      service_safe_contract_ref: serviceSafeDomainEntryContractRef,
      direct_product_entry_contract_ref: productEntryContractRef,
      opl_hosted_product_entry_contract_ref: oplHostedProductEntryContractRef,
      managed_session_contract_ref: managedProductEntryContractRef,
      opl_hosted_handoff_ref: oplHostedProductEntryContractRef,
      domain_agent_entry_spec: RCA_DOMAIN_AGENT_ENTRY_SPEC_V1,
    },
  });
}

export function buildRedCubeUserInteractionContract({
  productStatusCommand,
  productManifestCommand,
  oplHostedProductEntryContractRef,
}) {
  return buildFamilyUserInteractionContract({
    entry_owner: 'redcube_agent_entry_shell',
    user_interaction_mode: 'agent_facing_product_entry_overview',
    shared_downstream_entry: REDCUBE_DOMAIN_ENTRY_ADAPTER,
    extra_shared_handoff_envelope: [
      'entry_session_contract',
      'delivery_request',
    ],
    extra_payload: {
      entry_status_command: productStatusCommand,
      manifest_command: productManifestCommand,
      opl_hosted_contract_ref: oplHostedProductEntryContractRef,
    },
  });
}

export function buildRedCubeSharedHandoff({
  targetDomainId = 'redcube_ai',
  returnSurfaceKind = 'product_entry',
  extraPayload,
} = {}) {
  return buildSharedHandoff({
    opl_return_surface: buildSharedHandoffReturnSurface({
      surface_kind: returnSurfaceKind,
      target_domain_id: targetDomainId,
      extra_payload: extraPayload,
    }),
  });
}
