import {
  buildDeliverableRecord as buildDeliverableRecordJs,
  hydrateDeliverableContract as hydrateDeliverableContractJs,
  mergeContractLayers as mergeContractLayersJs,
} from './contracts.js';
import { createOverlayRegistry as createOverlayRegistryJs } from './registry.js';

import type {
  DeliverableRecord,
  DeliverableRecordInput,
  HydratedDeliverableContract,
  HydrateDeliverableContractRequest,
  JsonObject,
  OverlayDefinition,
  OverlayRegistry,
} from './types.js';

export function buildDeliverableRecord(input: DeliverableRecordInput): DeliverableRecord {
  return buildDeliverableRecordJs(input) as DeliverableRecord;
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

export type {
  DeliverableRecord,
  DeliverableRecordInput,
  HydratedDeliverableContract,
  HydrateDeliverableContractRequest,
  JsonObject,
  JsonValue,
  OverlayCatalogEntry,
  OverlayDefinition,
  OverlayProfileDefinition,
  OverlayRegistry,
} from './types.js';
