import {
  getDefaultOverlayCatalog as getDefaultOverlayCatalogJs,
  getDefaultOverlayRegistry as getDefaultOverlayRegistryJs,
} from './index.js';

import type {
  DefaultOverlayCatalogSurface,
  OverlayRegistry,
} from './types.js';

export function getDefaultOverlayRegistry(): OverlayRegistry {
  return getDefaultOverlayRegistryJs() as OverlayRegistry;
}

export function getDefaultOverlayCatalog(): DefaultOverlayCatalogSurface {
  return getDefaultOverlayCatalogJs() as DefaultOverlayCatalogSurface;
}

export type {
  DefaultOverlayCatalogSurface,
  DefaultOverlayModuleSpec,
} from './types.js';
