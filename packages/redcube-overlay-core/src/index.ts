export {
  buildDeliverableRecord,
  buildGovernanceSurfaceContract,
  hydrateDeliverableContract,
  mergeContractLayers,
  REQUIRED_GOVERNANCE_SUMMARIES,
  SHARED_GOVERNANCE_SURFACES,
  validateGovernanceSurfaceContract,
} from './contracts.js';
export { createOverlayRegistry } from './registry.js';

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
