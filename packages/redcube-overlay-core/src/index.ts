import {
  buildDeliverableRecord as buildDeliverableRecordJs,
  buildGovernanceSurfaceContract as buildGovernanceSurfaceContractJs,
  hydrateDeliverableContract as hydrateDeliverableContractJs,
  mergeContractLayers as mergeContractLayersJs,
  REQUIRED_GOVERNANCE_SUMMARIES as REQUIRED_GOVERNANCE_SUMMARIES_JS,
  SHARED_GOVERNANCE_SURFACES as SHARED_GOVERNANCE_SURFACES_JS,
  validateGovernanceSurfaceContract as validateGovernanceSurfaceContractJs,
} from './contracts.js';
import { createOverlayRegistry as createOverlayRegistryJs } from './registry.js';

import type {
  DeliverableRecord,
  DeliverableRecordInput,
  GovernanceSurfaceContract,
  HydratedDeliverableContract,
  HydrateDeliverableContractRequest,
  JsonObject,
  OverlayDefinition,
  OverlayRegistry,
} from './types.js';

export function buildDeliverableRecord(input: DeliverableRecordInput): DeliverableRecord {
  return buildDeliverableRecordJs(input) as DeliverableRecord;
}

export function buildGovernanceSurfaceContract(contract: JsonObject): GovernanceSurfaceContract {
  return buildGovernanceSurfaceContractJs(contract) as GovernanceSurfaceContract;
}

export function mergeContractLayers(base: JsonObject, override: JsonObject): JsonObject {
  return mergeContractLayersJs(base, override) as JsonObject;
}

export function hydrateDeliverableContract(
  registry: OverlayRegistry,
  request: HydrateDeliverableContractRequest = {},
): HydratedDeliverableContract {
  return hydrateDeliverableContractJs(registry, request) as HydratedDeliverableContract;
}

export function createOverlayRegistry(overlays: Record<string, OverlayDefinition>): OverlayRegistry {
  return createOverlayRegistryJs(overlays) as OverlayRegistry;
}

export function validateGovernanceSurfaceContract(content: JsonObject): boolean {
  return validateGovernanceSurfaceContractJs(content);
}

export const SHARED_GOVERNANCE_SURFACES = SHARED_GOVERNANCE_SURFACES_JS;
export const REQUIRED_GOVERNANCE_SUMMARIES = REQUIRED_GOVERNANCE_SUMMARIES_JS;

export type {
  DeliverableRecord,
  DeliverableRecordInput,
  GovernanceSurfaceContract,
  HydratedDeliverableContract,
  HydrateDeliverableContractRequest,
  JsonObject,
  JsonValue,
  OverlayCatalogEntry,
  OverlayDefinition,
  OverlayProfileDefinition,
  OverlayRegistry,
} from './types.js';
