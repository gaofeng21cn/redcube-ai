import {
  buildDomainEntryCommandCatalog,
  buildFamilyDomainEntryContract,
  buildFamilyGatewayInteractionContract,
  buildSharedHandoff,
  buildSharedHandoffReturnSurface,
} from 'opl-gateway-shared/family-entry-contracts';

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
  entry_command: 'redcube product frontdesk',
  manifest_command: 'redcube product manifest',
};

export function buildRedCubeDomainEntryContract({
  productManifestCommand,
  productFrontdeskCommand,
  productStartCommand,
  productInvokeCommand,
  productFederateCommand,
  productSessionCommand,
  serviceSafeDomainEntryContractRef,
  productEntryContractRef,
  federatedProductEntryContractRef,
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
      command: productFrontdeskCommand,
      required_fields: ['workspace_root'],
      extra_payload: {
        gateway_action: 'getProductFrontdesk',
        target_surface_kind: 'product_frontdesk',
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
      command: productFederateCommand,
      required_fields: [
        'workspace_root',
        'entry_session_id',
        'target_domain_id',
        'entry_mode',
        'return_surface_kind',
        'overlay',
        'topic_id',
        'deliverable_id',
      ],
      optional_fields: ['profile_id', 'title', 'goal', 'task_intent', 'route', 'user_intent', 'stop_after_stage'],
      extra_payload: {
        gateway_action: 'invokeFederatedProductEntry',
        target_surface_kind: 'federated_product_entry',
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
    supported_entry_modes: ['direct', 'opl_gateway', 'session'],
    supported_commands: commandCatalog.supported_commands,
    command_contracts: commandCatalog.command_contracts,
    extra_payload: {
      service_safe_contract_ref: serviceSafeDomainEntryContractRef,
      direct_product_entry_contract_ref: productEntryContractRef,
      federated_product_entry_contract_ref: federatedProductEntryContractRef,
      managed_session_contract_ref: managedProductEntryContractRef,
      domain_agent_entry_spec: RCA_DOMAIN_AGENT_ENTRY_SPEC_V1,
    },
  });
}

export function buildRedCubeGatewayInteractionContract({
  productFrontdeskCommand,
  productManifestCommand,
  federatedProductEntryContractRef,
}) {
  return buildFamilyGatewayInteractionContract({
    shared_downstream_entry: REDCUBE_DOMAIN_ENTRY_ADAPTER,
    extra_shared_handoff_envelope: [
      'entry_session_contract',
      'delivery_request',
    ],
    extra_payload: {
      direct_frontdesk_command: productFrontdeskCommand,
      manifest_command: productManifestCommand,
      federated_contract_ref: federatedProductEntryContractRef,
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
