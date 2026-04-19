import {
  buildDomainEntryCommandContract,
  buildFamilyDomainEntryContract,
  buildGatewayInteractionContract,
  buildSharedHandoff,
  buildSharedHandoffReturnSurface,
} from 'opl-gateway-shared/family-entry-contracts';

export const REDCUBE_DOMAIN_ENTRY_ADAPTER = 'RedCubeDomainEntry';
export const PRODUCT_ENTRY_KIND = 'redcube_product_entry';

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
  return buildFamilyDomainEntryContract({
    entry_adapter: REDCUBE_DOMAIN_ENTRY_ADAPTER,
    service_safe_surface_kind: 'domain_entry',
    product_entry_builder_command: productManifestCommand,
    product_entry_kind: PRODUCT_ENTRY_KIND,
    supported_entry_modes: ['direct', 'opl_gateway', 'session'],
    supported_commands: [
      productManifestCommand,
      productFrontdeskCommand,
      productStartCommand,
      productInvokeCommand,
      productFederateCommand,
      productSessionCommand,
    ],
    command_contracts: [
      buildDomainEntryCommandContract({
        command: productManifestCommand,
        required_fields: ['workspace_root'],
        extra_payload: {
          gateway_action: 'getProductEntryManifest',
          target_surface_kind: 'product_entry_manifest',
        },
      }),
      buildDomainEntryCommandContract({
        command: productFrontdeskCommand,
        required_fields: ['workspace_root'],
        extra_payload: {
          gateway_action: 'getProductFrontdesk',
          target_surface_kind: 'product_frontdesk',
        },
      }),
      buildDomainEntryCommandContract({
        command: productStartCommand,
        required_fields: ['workspace_root'],
        extra_payload: {
          gateway_action: 'getProductStart',
          target_surface_kind: 'product_entry_start',
        },
      }),
      buildDomainEntryCommandContract({
        command: productInvokeCommand,
        required_fields: ['workspace_root', 'entry_session_id', 'overlay', 'topic_id', 'deliverable_id'],
        optional_fields: ['profile_id', 'title', 'goal', 'task_intent', 'route', 'user_intent', 'stop_after_stage'],
        extra_payload: {
          gateway_action: 'invokeProductEntry',
          target_surface_kind: 'product_entry',
        },
      }),
      buildDomainEntryCommandContract({
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
      }),
      buildDomainEntryCommandContract({
        command: productSessionCommand,
        required_fields: ['entry_session_id'],
        extra_payload: {
          gateway_action: 'getProductEntrySession',
          target_surface_kind: 'product_entry_session',
        },
      }),
    ],
    extra_payload: {
      service_safe_contract_ref: serviceSafeDomainEntryContractRef,
      direct_product_entry_contract_ref: productEntryContractRef,
      federated_product_entry_contract_ref: federatedProductEntryContractRef,
      managed_session_contract_ref: managedProductEntryContractRef,
    },
  });
}

export function buildRedCubeGatewayInteractionContract({
  productFrontdeskCommand,
  productManifestCommand,
  federatedProductEntryContractRef,
}) {
  return buildGatewayInteractionContract({
    frontdoor_owner: 'opl_gateway_or_domain_gui',
    user_interaction_mode: 'natural_language_frontdoor',
    user_commands_required: false,
    command_surfaces_for_agent_consumption_only: true,
    shared_downstream_entry: REDCUBE_DOMAIN_ENTRY_ADAPTER,
    shared_handoff_envelope: [
      'target_domain_id',
      'task_intent',
      'entry_mode',
      'workspace_locator',
      'runtime_session_contract',
      'return_surface_contract',
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
