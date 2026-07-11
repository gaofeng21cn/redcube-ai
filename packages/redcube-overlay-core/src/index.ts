export {
  buildDeliverableRecord,
  buildGovernanceSurfaceContract,
  buildSharedSourceTruthContract,
  buildUiUxProMaxHtmlCompanion,
  hydrateDeliverableContract,
  mergeContractLayers,
  REQUIRED_GOVERNANCE_SUMMARIES,
  SHARED_GOVERNANCE_SURFACES,
  validateGovernanceSurfaceContract,
} from './contracts.js';
export { createOverlayRegistry } from './registry.js';
export {
  buildSurfaceArtifactSpecs,
  buildSurfaceBundle,
  listSurfaceArtifactPaths,
  validateBaselinePolicySurface,
  validateDeliveryContractSurface,
  validateDisplayRegistrySurface,
  validateGovernanceSurfaceArtifact,
  validateHydratedDeliverableSurface,
  validateSurfaceArtifact,
  validateSurfaceRequirements,
} from './surface.js';
export type {
  SurfaceArtifactContent,
  SurfaceArtifactSpec,
  SurfaceContract,
  SurfaceRequirement,
  SurfaceValidator,
} from './surface.js';

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
